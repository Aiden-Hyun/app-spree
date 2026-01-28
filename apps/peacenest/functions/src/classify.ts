/**
 * Classification Cloud Function
 *
 * Receives batches of text candidates, classifies them using Hugging Face models,
 * and returns filter actions. Uses Firestore for L2 caching.
 *
 * Privacy: Never stores raw text. Only stores hashes, actions, and metadata.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { applyPolicy } from "./policy";

// Types
interface ClassifyRequest {
  candidates: {
    id: string;
    textHash: string;
    text: string;
    role: string;
  }[];
  policyVersion: string;
  categories: string[];
}

interface ClassifyResponse {
  results: {
    id: string;
    action: string;
    confidence: number;
    matchedLabel?: string;
    fromCache?: boolean;
  }[];
  cacheHits: number;
  latencyMs: number;
}

interface CacheEntry {
  textHash: string;
  action: string;
  confidence: number;
  matchedLabel?: string;
  role: string;
  policyVersion: string;
  createdAt: admin.firestore.Timestamp;
  hitCount: number;
}

// Configuration - use environment variable (set in .env or Firebase secrets)
const HF_TOKEN = process.env.HF_TOKEN || "";
const CACHE_COLLECTION = "classification_cache";

// Models
const TOXICITY_MODEL = "unitary/unbiased-toxic-roberta";
const ZEROSHOT_MODEL = "facebook/bart-large-mnli";

// HuggingFace Inference API base URL (updated to new router endpoint)
const HF_API_URL = "https://router.huggingface.co/hf-inference/models";

// Direct API call to HuggingFace (bypasses library issues)
async function callHuggingFaceAPI(model: string, payload: any): Promise<any> {
  const response = await fetch(`${HF_API_URL}/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HuggingFace API error: ${response.status} - ${error}`);
  }

  return response.json();
}

// Firestore reference
const db = admin.firestore();

/**
 * Main classification endpoint
 */
export const classify = functions
  .runWith({
    timeoutSeconds: 60,
    memory: "256MB",
    // minInstances removed to reduce costs (will have cold starts)
  })
  .https.onCall(
    async (data: ClassifyRequest, context): Promise<ClassifyResponse> => {
      const startTime = Date.now();
      const results: ClassifyResponse["results"] = [];
      let cacheHits = 0;

      // Validate request
      if (!data.candidates || !Array.isArray(data.candidates)) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "candidates array required",
        );
      }

      if (!data.policyVersion) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "policyVersion required",
        );
      }

      const { candidates, policyVersion, categories } = data;

      console.log(`[Classify] Received ${candidates.length} candidates, policy: ${policyVersion}`);

      // Step 1: Check L2 cache (Firestore)
      const cacheKeys = candidates.map((c) => c.textHash);
      const cachedEntries = await batchGetCache(cacheKeys, policyVersion);

      const toClassify: typeof candidates = [];
      const hashToCandidate = new Map(candidates.map((c) => [c.textHash, c]));

      candidates.forEach((candidate) => {
        const cached = cachedEntries.get(candidate.textHash);
        if (cached && cached.policyVersion === policyVersion) {
          console.log(`[Cache Hit] hash ${candidate.textHash.slice(0, 8)}... → ${cached.action}`);
          results.push({
            id: candidate.id,
            action: cached.action,
            confidence: cached.confidence,
            matchedLabel: cached.matchedLabel,
            fromCache: true,
          });
          cacheHits++;

          // Increment hit count (fire and forget)
          incrementCacheHit(candidate.textHash).catch(() => {});
        } else {
          toClassify.push(candidate);
        }
      });

      // Step 2: Classify cache misses
      if (toClassify.length > 0) {
        const classifications = await classifyCandidates(
          toClassify,
          categories,
        );

        for (const classification of classifications) {
          const candidate = hashToCandidate.get(classification.textHash);
          if (!candidate) continue;

          // Apply policy to get action
          const policyResult = applyPolicy(
            classification.labels,
            classification.scores,
            candidate.role,
            categories,
          );

          // Log the classification decision
          const textPreview = candidate.text.slice(0, 60).replace(/\n/g, ' ');
          console.log(`[Classify] "${textPreview}..." → ${policyResult.action} (${(policyResult.confidence * 100).toFixed(1)}%${policyResult.matchedLabel ? `, label: ${policyResult.matchedLabel.slice(0, 30)}` : ''})`);

          results.push({
            id: candidate.id,
            action: policyResult.action,
            confidence: policyResult.confidence,
            matchedLabel: policyResult.matchedLabel,
            fromCache: false,
          });

          // Store in cache (fire and forget, privacy-safe)
          storeCacheEntry({
            textHash: candidate.textHash,
            action: policyResult.action,
            confidence: policyResult.confidence,
            matchedLabel: policyResult.matchedLabel,
            role: candidate.role,
            policyVersion,
            createdAt: admin.firestore.Timestamp.now(),
            hitCount: 0,
          }).catch(() => {});
        }
      }

      // Log summary
      const actionCounts = results.reduce((acc, r) => {
        acc[r.action] = (acc[r.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log(`[Classify] Complete: ${results.length} results, ${cacheHits} cache hits, ${Date.now() - startTime}ms`);
      console.log(`[Classify] Actions: ${JSON.stringify(actionCounts)}`);

      return {
        results,
        cacheHits,
        latencyMs: Date.now() - startTime,
      };
    },
  );

/**
 * Classify candidates using Hugging Face models
 */
async function classifyCandidates(
  candidates: ClassifyRequest["candidates"],
  categories: string[],
): Promise<
  Array<{
    textHash: string;
    labels: string[];
    scores: number[];
  }>
> {
  const results: Array<{
    textHash: string;
    labels: string[];
    scores: number[];
  }> = [];

  // Process in parallel with rate limiting
  const batchSize = 5;
  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(async (candidate) => {
        try {
          if (candidate.role === "comment") {
            // Use toxicity model for comments
            const toxicity = await callHuggingFaceAPI(TOXICITY_MODEL, {
              inputs: candidate.text,
            });

            // Handle array response
            const results = Array.isArray(toxicity) ? toxicity[0] : toxicity;
            return {
              textHash: candidate.textHash,
              labels: results.map((t: any) => t.label),
              scores: results.map((t: any) => t.score),
            };
          } else {
            // Use zero-shot for titles/content
            const zeroshot = await callHuggingFaceAPI(ZEROSHOT_MODEL, {
              inputs: candidate.text,
              parameters: {
                candidate_labels: categories,
                multi_label: true,
              },
            });

            // #region agent log - Debug HuggingFace response
            console.log(`[HF:RAW] Raw zeroshot response keys: ${Object.keys(zeroshot || {})}`);
            console.log(`[HF:RAW] Full response: ${JSON.stringify(zeroshot).slice(0, 500)}`);
            console.log(`[HF:RAW] Is array: ${Array.isArray(zeroshot)}`);
            // #endregion

            // Handle response format - API returns array of {label, score} objects
            let labels: string[];
            let scores: number[];
            
            if (Array.isArray(zeroshot)) {
              // New format: [{label, score}, ...]
              labels = zeroshot.map((item: any) => item.label);
              scores = zeroshot.map((item: any) => item.score);
              // #region agent log - Post-fix verification
              console.log(`[HF:FIX] Parsed from array - labels: ${JSON.stringify(labels)}`);
              console.log(`[HF:FIX] Parsed from array - scores: ${JSON.stringify(scores)}`);
              // #endregion
            } else if (zeroshot.labels && zeroshot.scores) {
              // Old format: {labels: [], scores: []}
              labels = zeroshot.labels;
              scores = zeroshot.scores;
            } else {
              // Fallback
              console.log(`[HF:ERROR] Unknown response format, using fallback`);
              labels = categories;
              scores = categories.map(() => 0);
            }

            return {
              textHash: candidate.textHash,
              labels,
              scores,
            };
          }
        } catch (error) {
          console.error(
            `Classification failed for ${candidate.textHash}:`,
            error,
          );
          return {
            textHash: candidate.textHash,
            labels: ["error"],
            scores: [0],
          };
        }
      }),
    );

    results.push(...batchResults);
  }

  return results;
}

/**
 * Batch get cache entries from Firestore
 */
async function batchGetCache(
  textHashes: string[],
  policyVersion: string,
): Promise<Map<string, CacheEntry>> {
  const result = new Map<string, CacheEntry>();

  if (textHashes.length === 0) return result;

  // Firestore batch get (max 10 per batch)
  const batches: string[][] = [];
  for (let i = 0; i < textHashes.length; i += 10) {
    batches.push(textHashes.slice(i, i + 10));
  }

  await Promise.all(
    batches.map(async (batch) => {
      const refs = batch.map((hash) =>
        db.collection(CACHE_COLLECTION).doc(`${hash}_${policyVersion}`),
      );

      const docs = await db.getAll(...refs);

      docs.forEach((doc) => {
        if (doc.exists) {
          const data = doc.data() as CacheEntry;
          result.set(data.textHash, data);
        }
      });
    }),
  );

  return result;
}

/**
 * Store a cache entry in Firestore (privacy-safe: no raw text)
 */
async function storeCacheEntry(entry: CacheEntry): Promise<void> {
  const docId = `${entry.textHash}_${entry.policyVersion}`;
  await db.collection(CACHE_COLLECTION).doc(docId).set(entry);
}

/**
 * Increment cache hit count
 */
async function incrementCacheHit(textHash: string): Promise<void> {
  // Find the most recent entry for this hash
  const snapshot = await db
    .collection(CACHE_COLLECTION)
    .where("textHash", "==", textHash)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  if (!snapshot.empty) {
    await snapshot.docs[0].ref.update({
      hitCount: admin.firestore.FieldValue.increment(1),
    });
  }
}
