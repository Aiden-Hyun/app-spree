import { Candidate, ClassificationResult, FilterAction, CandidateRole } from '../adapters/types';
import { FilterSettings } from '../types';
import { l1Cache, generateCacheKey, batchL1Lookup } from './cacheService';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../firebase';

/**
 * Classification Service
 * 
 * Handles batching, caching, and API calls for content classification.
 * Uses L1 (memory) cache for fast lookups and L2 (Firestore via Cloud Functions)
 * for persistent caching.
 */

// Firebase Functions instance
const functions = getFunctions(app);
const classifyFunction = httpsCallable<ClassifyRequest, ClassifyResponse>(functions, 'classify');

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

// Metrics tracking
let totalRequests = 0;
let totalLatencyMs = 0;
let l2CacheHits = 0;

/**
 * Classify a batch of candidates
 * 
 * 1. Check L1 cache for each candidate
 * 2. Send cache misses to backend
 * 3. Update L1 cache with results
 * 4. Return combined results
 */
export async function classifyBatch(
  candidates: Candidate[],
  settings: FilterSettings
): Promise<ClassificationResult[]> {
  if (!settings.enabled || candidates.length === 0) {
    return candidates.map(c => ({
      id: c.id,
      action: 'ALLOW' as FilterAction,
      confidence: 1,
    }));
  }

  const startTime = Date.now();
  const results: ClassificationResult[] = [];
  const toClassify: Candidate[] = [];

  // Step 1: Check L1 cache
  candidates.forEach(candidate => {
    const cacheKey = candidate.textHash || generateCacheKey(
      candidate.text,
      candidate.role,
      settings.policyVersion
    );
    
    const cached = l1Cache.get(cacheKey);
    if (cached) {
      results.push({
        id: candidate.id,
        action: cached.action,
        confidence: cached.confidence,
        matchedLabel: cached.matchedLabel,
      });
    } else {
      toClassify.push({
        ...candidate,
        textHash: cacheKey,
      });
    }
  });

  // Step 2: If all cached, return early
  if (toClassify.length === 0) {
    return results;
  }

  // Step 3: Call backend for cache misses
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/abd8d170-6f53-45be-bd37-3634e6180c4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'classificationService.ts:classifyBatch',message:'Calling Firebase classify function',data:{candidateCount:toClassify.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    const response = await classifyFunction({
      candidates: toClassify.map(c => ({
        id: c.id,
        textHash: c.textHash,
        text: c.text,
        role: c.role,
      })),
      policyVersion: settings.policyVersion,
      categories: settings.enabledCategories,
    });

    const data = response.data;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/abd8d170-6f53-45be-bd37-3634e6180c4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'classificationService.ts:classifyBatch:response',message:'Firebase classify returned',data:{resultCount:data.results?.length,cacheHits:data.cacheHits,latencyMs:data.latencyMs},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    l2CacheHits += data.cacheHits;

    // Step 4: Process results and update L1 cache
    data.results.forEach(result => {
      const action = result.action as FilterAction;
      const candidate = toClassify.find(c => c.id === result.id);
      
      if (candidate) {
        // Update L1 cache
        l1Cache.set(candidate.textHash, {
          action,
          confidence: result.confidence,
          matchedLabel: result.matchedLabel,
          role: candidate.role as CandidateRole,
        });
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/abd8d170-6f53-45be-bd37-3634e6180c4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'classificationService.ts:result',message:'Classification result',data:{id:result.id,action,confidence:result.confidence,matchedLabel:result.matchedLabel},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      results.push({
        id: result.id,
        action,
        confidence: result.confidence,
        matchedLabel: result.matchedLabel,
      });
    });

    // Track metrics
    const latency = Date.now() - startTime;
    totalRequests++;
    totalLatencyMs += latency;

  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/abd8d170-6f53-45be-bd37-3634e6180c4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'classificationService.ts:classifyBatch:error',message:'Classification failed',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    console.error('Classification API error:', error);
    
    // Return fallback actions for failed classifications
    toClassify.forEach(candidate => {
      results.push({
        id: candidate.id,
        action: getFallbackAction(candidate.role),
        confidence: 0,
      });
    });
  }

  return results;
}

/**
 * Get fallback action based on content role
 */
function getFallbackAction(role: CandidateRole): FilterAction {
  switch (role) {
    case 'title':
    case 'comment':
      return 'REMOVE'; // Safety-first for high-risk content
    case 'description':
    case 'paragraph':
      return 'REWRITE'; // Preserve layout for body content
    default:
      return 'REMOVE';
  }
}

/**
 * Get classification service metrics
 */
export function getClassificationMetrics(): {
  totalRequests: number;
  avgLatencyMs: number;
  l1CacheStats: ReturnType<typeof l1Cache.getStats>;
  l2CacheHits: number;
} {
  return {
    totalRequests,
    avgLatencyMs: totalRequests > 0 ? totalLatencyMs / totalRequests : 0,
    l1CacheStats: l1Cache.getStats(),
    l2CacheHits,
  };
}

/**
 * Reset metrics (useful for testing)
 */
export function resetMetrics(): void {
  totalRequests = 0;
  totalLatencyMs = 0;
  l2CacheHits = 0;
}

/**
 * Clear all caches
 */
export function clearCaches(): void {
  l1Cache.clear();
}

/**
 * Apply policy rules to determine action
 * This is a client-side backup when backend is unavailable
 */
export function applyLocalPolicy(
  text: string,
  role: CandidateRole,
  categories: string[]
): FilterAction {
  // Simple keyword matching as fallback
  // In production, this would be more sophisticated
  const lowerText = text.toLowerCase();
  
  const triggerKeywords = [
    'politics', 'election', 'government', 'war', 'violence',
    'death', 'killed', 'crisis', 'disaster', 'tragedy',
  ];

  const hasTrigger = triggerKeywords.some(kw => lowerText.includes(kw));
  
  if (hasTrigger) {
    return role === 'paragraph' ? 'REWRITE' : 'REMOVE';
  }

  return 'ALLOW';
}
