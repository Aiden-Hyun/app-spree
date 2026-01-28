import { FilterAction, CandidateRole } from '../adapters/types';

/**
 * Two-Tier Cache Service
 * 
 * L1: In-memory cache (fast, client-side)
 * L2: Backend/Firestore cache (persistent, cross-session)
 * 
 * Cache key format: sha256(text + role + policyVersion)
 */

interface CacheEntry {
  action: FilterAction;
  confidence: number;
  matchedLabel?: string;
  timestamp: number;
  role: CandidateRole;
}

interface CacheConfig {
  /** L1 cache TTL in milliseconds */
  l1TtlMs: number;
  /** Maximum L1 cache size */
  l1MaxSize: number;
}

const DEFAULT_CONFIG: CacheConfig = {
  l1TtlMs: 5 * 60 * 1000, // 5 minutes
  l1MaxSize: 1000,
};

class L1Cache {
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private hitCount = 0;
  private missCount = 0;

  constructor(config: CacheConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  /**
   * Get a cached entry by text hash
   */
  get(textHash: string): CacheEntry | null {
    const entry = this.cache.get(textHash);
    
    if (!entry) {
      this.missCount++;
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > this.config.l1TtlMs) {
      this.cache.delete(textHash);
      this.missCount++;
      return null;
    }

    this.hitCount++;
    return entry;
  }

  /**
   * Set a cache entry
   */
  set(textHash: string, entry: Omit<CacheEntry, 'timestamp'>): void {
    // Evict oldest entries if at capacity
    if (this.cache.size >= this.config.l1MaxSize) {
      this.evictOldest();
    }

    this.cache.set(textHash, {
      ...entry,
      timestamp: Date.now(),
    });
  }

  /**
   * Set multiple entries at once
   */
  setMany(entries: Array<{ textHash: string; entry: Omit<CacheEntry, 'timestamp'> }>): void {
    entries.forEach(({ textHash, entry }) => this.set(textHash, entry));
  }

  /**
   * Evict the oldest 10% of entries
   */
  private evictOldest(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toRemove = Math.max(1, Math.floor(entries.length * 0.1));
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Clear expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const expired: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.config.l1TtlMs) {
        expired.push(key);
      }
    });

    expired.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    hitCount: number;
    missCount: number;
    hitRate: number;
  } {
    const total = this.hitCount + this.missCount;
    return {
      size: this.cache.size,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: total > 0 ? this.hitCount / total : 0,
    };
  }

  /**
   * Check if a key exists (without counting as hit/miss)
   */
  has(textHash: string): boolean {
    const entry = this.cache.get(textHash);
    if (!entry) return false;
    if (Date.now() - entry.timestamp > this.config.l1TtlMs) {
      this.cache.delete(textHash);
      return false;
    }
    return true;
  }
}

// Export singleton instance
export const l1Cache = new L1Cache();

/**
 * Generate a simple hash for cache keys
 * Note: For production, use a proper SHA-256 implementation
 */
export function generateCacheKey(text: string, role: string, policyVersion: string): string {
  const str = text + role + policyVersion;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Batch lookup for L1 cache
 * Returns found entries and list of missing hashes
 */
export function batchL1Lookup(
  textHashes: string[]
): {
  found: Map<string, CacheEntry>;
  missing: string[];
} {
  const found = new Map<string, CacheEntry>();
  const missing: string[] = [];

  textHashes.forEach(hash => {
    const entry = l1Cache.get(hash);
    if (entry) {
      found.set(hash, entry);
    } else {
      missing.push(hash);
    }
  });

  return { found, missing };
}

// Cleanup interval - run every minute
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    l1Cache.cleanup();
  }, 60 * 1000);
}
