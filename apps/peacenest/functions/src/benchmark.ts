/**
 * Benchmark Runner
 *
 * Evaluates classification accuracy against a test dataset.
 * Input: JSONL file with { text, role, expectedAction }
 * Output: Accuracy metrics and error analysis
 *
 * Run locally with: npx ts-node src/benchmark.ts <path-to-jsonl>
 */

import * as fs from "fs";
import * as readline from "readline";
import { applyPolicy, FilterAction, getPolicyVersion } from "./policy";

interface TestCase {
  text: string;
  role: string;
  expectedAction: FilterAction;
  categories?: string[];
}

interface BenchmarkResult {
  total: number;
  correct: number;
  accuracy: number;
  byCategory: Record<
    string,
    {
      total: number;
      correct: number;
      accuracy: number;
    }
  >;
  falsePositives: TestCase[];
  falseNegatives: TestCase[];
  latencyMs: {
    avg: number;
    p50: number;
    p95: number;
  };
}

// Configuration
const HF_TOKEN = process.env.HF_TOKEN || "";
const ZEROSHOT_MODEL = "facebook/bart-large-mnli";
const TOXICITY_MODEL = "unitary/unbiased-toxic-roberta";

// HuggingFace API (updated to new router endpoint)
const HF_API_URL = "https://router.huggingface.co/hf-inference/models";

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

// Default categories for testing
const DEFAULT_CATEGORIES = [
  "politics and political debate, elections, government, geopolitics",
  "societal bad news and doom news, crisis, fear-inducing news",
  "violence and casualties, killing, assault, war casualties",
  "neutral everyday content, hobbies, food, ASMR, lifestyle",
  "comedy and stand-up, crowd work, playful roasting",
];

/**
 * Run benchmark on a JSONL test file
 */
export async function runBenchmark(
  testFilePath: string,
  categories: string[] = DEFAULT_CATEGORIES,
): Promise<BenchmarkResult> {
  const testCases = await loadTestCases(testFilePath);

  const result: BenchmarkResult = {
    total: testCases.length,
    correct: 0,
    accuracy: 0,
    byCategory: {},
    falsePositives: [],
    falseNegatives: [],
    latencyMs: { avg: 0, p50: 0, p95: 0 },
  };

  const latencies: number[] = [];

  console.log(`Running benchmark with ${testCases.length} test cases...`);
  console.log(`Policy version: ${getPolicyVersion()}`);
  console.log("");

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const startTime = Date.now();

    try {
      let labels: string[];
      let scores: number[];

      if (testCase.role === "comment") {
        const toxicity = await callHuggingFaceAPI(TOXICITY_MODEL, {
          inputs: testCase.text,
        });
        const results = Array.isArray(toxicity) ? toxicity[0] : toxicity;
        labels = results.map((t: any) => t.label);
        scores = results.map((t: any) => t.score);
      } else {
        const zeroshot = await callHuggingFaceAPI(ZEROSHOT_MODEL, {
          inputs: testCase.text,
          parameters: {
            candidate_labels: testCase.categories || categories,
            multi_label: true,
          },
        });

        labels = zeroshot.labels || [];
        scores = zeroshot.scores || [];
      }

      const latency = Date.now() - startTime;
      latencies.push(latency);

      const policyResult = applyPolicy(
        labels,
        scores,
        testCase.role,
        testCase.categories || categories,
      );

      const isCorrect = policyResult.action === testCase.expectedAction;

      if (isCorrect) {
        result.correct++;
      } else {
        // Track errors
        if (
          policyResult.action !== "ALLOW" &&
          testCase.expectedAction === "ALLOW"
        ) {
          result.falsePositives.push(testCase);
        } else if (
          policyResult.action === "ALLOW" &&
          testCase.expectedAction !== "ALLOW"
        ) {
          result.falseNegatives.push(testCase);
        }
      }

      // Track by category
      const category = labels[0] || "unknown";
      if (!result.byCategory[category]) {
        result.byCategory[category] = { total: 0, correct: 0, accuracy: 0 };
      }
      result.byCategory[category].total++;
      if (isCorrect) result.byCategory[category].correct++;

      // Progress
      if ((i + 1) % 10 === 0) {
        console.log(`Processed ${i + 1}/${testCases.length}`);
      }
    } catch (error) {
      console.error(`Error processing test case ${i}:`, error);
    }
  }

  // Calculate final metrics
  result.accuracy = result.total > 0 ? result.correct / result.total : 0;

  Object.keys(result.byCategory).forEach((cat) => {
    const catResult = result.byCategory[cat];
    catResult.accuracy =
      catResult.total > 0 ? catResult.correct / catResult.total : 0;
  });

  // Calculate latency percentiles
  latencies.sort((a, b) => a - b);
  result.latencyMs = {
    avg: latencies.reduce((sum, l) => sum + l, 0) / latencies.length,
    p50: latencies[Math.floor(latencies.length * 0.5)] || 0,
    p95: latencies[Math.floor(latencies.length * 0.95)] || 0,
  };

  return result;
}

/**
 * Load test cases from JSONL file
 */
async function loadTestCases(filePath: string): Promise<TestCase[]> {
  const testCases: TestCase[] = [];

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (line.trim()) {
      try {
        const testCase = JSON.parse(line) as TestCase;
        testCases.push(testCase);
      } catch (error) {
        console.warn("Failed to parse line:", line);
      }
    }
  }

  return testCases;
}

/**
 * Print benchmark results
 */
export function printResults(result: BenchmarkResult): void {
  console.log("\n========================================");
  console.log("BENCHMARK RESULTS");
  console.log("========================================\n");

  console.log(`Total: ${result.total}`);
  console.log(`Correct: ${result.correct}`);
  console.log(`Accuracy: ${(result.accuracy * 100).toFixed(2)}%`);
  console.log("");

  console.log("By Category:");
  Object.entries(result.byCategory)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([cat, stats]) => {
      console.log(
        `  ${cat}: ${(stats.accuracy * 100).toFixed(1)}% (${stats.correct}/${stats.total})`,
      );
    });
  console.log("");

  console.log(`False Positives: ${result.falsePositives.length}`);
  result.falsePositives.slice(0, 3).forEach((fp) => {
    console.log(
      `  - "${fp.text.slice(0, 50)}..." (expected: ${fp.expectedAction})`,
    );
  });
  console.log("");

  console.log(`False Negatives: ${result.falseNegatives.length}`);
  result.falseNegatives.slice(0, 3).forEach((fn) => {
    console.log(
      `  - "${fn.text.slice(0, 50)}..." (expected: ${fn.expectedAction})`,
    );
  });
  console.log("");

  console.log("Latency:");
  console.log(`  Average: ${result.latencyMs.avg.toFixed(0)}ms`);
  console.log(`  P50: ${result.latencyMs.p50}ms`);
  console.log(`  P95: ${result.latencyMs.p95}ms`);
}

// CLI entry point
if (require.main === module) {
  const testFile = process.argv[2];

  if (!testFile) {
    console.log("Usage: npx ts-node src/benchmark.ts <path-to-jsonl>");
    console.log("");
    console.log(
      'JSONL format: {"text": "...", "role": "title|comment", "expectedAction": "ALLOW|REMOVE|REWRITE"}',
    );
    process.exit(1);
  }

  if (!HF_TOKEN) {
    console.error("Error: HF_TOKEN environment variable required");
    process.exit(1);
  }

  runBenchmark(testFile)
    .then((result) => {
      printResults(result);
    })
    .catch((error) => {
      console.error("Benchmark failed:", error);
      process.exit(1);
    });
}
