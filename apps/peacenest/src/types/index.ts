/**
 * Shared TypeScript types for PeaceNest
 */

// Re-export adapter types for convenience
export * from '../adapters/types';

/** Filter settings stored in user preferences */
export interface FilterSettings {
  /** Master toggle for filtering */
  enabled: boolean;
  
  /** Enabled category labels for zero-shot classification */
  enabledCategories: string[];
  
  /** Confidence threshold (0-1) for triggering filter action */
  confidenceThreshold: number;
  
  /** Default action when confidence is above threshold */
  defaultAction: 'REMOVE' | 'REWRITE';
  
  /** Policy version for cache keying */
  policyVersion: string;
}

/** Default filter settings */
export const DEFAULT_FILTER_SETTINGS: FilterSettings = {
  enabled: true,
  enabledCategories: [
    'politics and political debate, elections, government, geopolitics',
    'societal bad news and doom news, crisis, fear-inducing news',
    'violence and casualties, killing, assault, war casualties',
  ],
  confidenceThreshold: 0.7,
  defaultAction: 'REMOVE',
  policyVersion: '2025-01-v1',
};

/** Filter statistics for metrics */
export interface FilterStats {
  /** Total candidates processed */
  totalProcessed: number;
  /** Candidates removed */
  removed: number;
  /** Candidates rewritten */
  rewritten: number;
  /** Candidates allowed */
  allowed: number;
  /** Cache hits (L1) */
  l1CacheHits: number;
  /** Cache hits (L2/backend) */
  l2CacheHits: number;
  /** Average classification latency in ms */
  avgLatencyMs: number;
  /** Session start time */
  sessionStart: number;
}

/** Initial filter stats */
export const INITIAL_FILTER_STATS: FilterStats = {
  totalProcessed: 0,
  removed: 0,
  rewritten: 0,
  allowed: 0,
  l1CacheHits: 0,
  l2CacheHits: 0,
  avgLatencyMs: 0,
  sessionStart: Date.now(),
};

/** Backend classify request */
export interface ClassifyRequest {
  candidates: {
    id: string;
    textHash: string;
    text: string;
    role: string;
  }[];
  policyVersion: string;
  categories: string[];
}

/** Backend classify response */
export interface ClassifyResponse {
  results: {
    id: string;
    action: string;
    confidence: number;
    matchedLabel?: string;
  }[];
  cacheHits: number;
  latencyMs: number;
}

/** Fallback mode configuration */
export interface FallbackConfig {
  /** Whether fallback mode is active */
  active: boolean;
  /** Reason for fallback */
  reason: 'timeout' | 'error' | 'adapter_broken' | null;
  /** Surfaces affected */
  affectedSurfaces: string[];
}

/** App state for filter context */
export interface FilterState {
  settings: FilterSettings;
  stats: FilterStats;
  fallback: FallbackConfig;
  /** Current adapter health reports */
  adapterHealth: Record<string, import('../adapters/types').AdapterHealthReport>;
  /** Whether initial filter pass is complete */
  initialFilterComplete: boolean;
}
