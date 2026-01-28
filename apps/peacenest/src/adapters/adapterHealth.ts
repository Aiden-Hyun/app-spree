import { AdapterHealthReport, PageSurface, SiteIdentifier } from './types';

/**
 * Adapter Health Monitor
 * 
 * Tracks adapter health metrics and triggers fallback mode
 * when selectors appear to be broken.
 */

interface HealthHistory {
  reports: AdapterHealthReport[];
  lastSuccess: number;
  consecutiveFailures: number;
}

// Configuration
const CONFIG = {
  /** Number of consecutive failures before triggering fallback */
  FAILURE_THRESHOLD: 3,
  /** Maximum age of health history to keep (ms) */
  HISTORY_TTL: 5 * 60 * 1000, // 5 minutes
  /** Minimum candidates expected per surface */
  MIN_CANDIDATES: {
    home: 3,
    search: 2,
    watch: 1,
    comments: 0, // Comments may legitimately be empty
    article: 1,
    unknown: 0,
  } as Record<PageSurface, number>,
};

class AdapterHealthMonitor {
  private history: Map<string, HealthHistory> = new Map();
  private fallbackCallbacks: ((site: SiteIdentifier, surface: PageSurface) => void)[] = [];

  /**
   * Record a health report from an adapter
   */
  recordReport(report: AdapterHealthReport): void {
    const key = `${report.site}-${report.surface}`;
    
    let entry = this.history.get(key);
    if (!entry) {
      entry = {
        reports: [],
        lastSuccess: 0,
        consecutiveFailures: 0,
      };
      this.history.set(key, entry);
    }

    // Add report to history
    entry.reports.push(report);

    // Trim old reports
    const cutoff = Date.now() - CONFIG.HISTORY_TTL;
    entry.reports = entry.reports.filter(r => r.timestamp > cutoff);

    // Evaluate health
    const isHealthy = this.evaluateHealth(report);
    
    if (isHealthy) {
      entry.lastSuccess = report.timestamp;
      entry.consecutiveFailures = 0;
    } else {
      entry.consecutiveFailures++;
      
      // Trigger fallback if threshold exceeded
      if (entry.consecutiveFailures >= CONFIG.FAILURE_THRESHOLD) {
        this.triggerFallback(report.site, report.surface as PageSurface);
      }
    }
  }

  /**
   * Evaluate if a health report indicates a healthy adapter
   */
  private evaluateHealth(report: AdapterHealthReport): boolean {
    // Explicit selector failure
    if (!report.selectorsWorking) {
      return false;
    }

    // Check minimum candidates for surface
    const minRequired = CONFIG.MIN_CANDIDATES[report.surface as PageSurface] ?? 0;
    if (report.candidatesFound < minRequired) {
      return false;
    }

    // Check for errors
    if (report.error) {
      return false;
    }

    return true;
  }

  /**
   * Trigger fallback mode for a site/surface
   */
  private triggerFallback(site: SiteIdentifier, surface: PageSurface): void {
    console.warn(`Adapter fallback triggered for ${site}/${surface}`);
    this.fallbackCallbacks.forEach(cb => cb(site, surface));
  }

  /**
   * Register a callback for fallback events
   */
  onFallback(callback: (site: SiteIdentifier, surface: PageSurface) => void): () => void {
    this.fallbackCallbacks.push(callback);
    return () => {
      const index = this.fallbackCallbacks.indexOf(callback);
      if (index >= 0) this.fallbackCallbacks.splice(index, 1);
    };
  }

  /**
   * Check if a site/surface is currently healthy
   */
  isHealthy(site: SiteIdentifier, surface: PageSurface): boolean {
    const key = `${site}-${surface}`;
    const entry = this.history.get(key);
    
    if (!entry) return true; // Assume healthy if no data
    
    return entry.consecutiveFailures < CONFIG.FAILURE_THRESHOLD;
  }

  /**
   * Get current health status for a site/surface
   */
  getStatus(site: SiteIdentifier, surface: PageSurface): {
    healthy: boolean;
    consecutiveFailures: number;
    lastSuccess: number | null;
    recentReports: AdapterHealthReport[];
  } {
    const key = `${site}-${surface}`;
    const entry = this.history.get(key);
    
    if (!entry) {
      return {
        healthy: true,
        consecutiveFailures: 0,
        lastSuccess: null,
        recentReports: [],
      };
    }

    return {
      healthy: entry.consecutiveFailures < CONFIG.FAILURE_THRESHOLD,
      consecutiveFailures: entry.consecutiveFailures,
      lastSuccess: entry.lastSuccess || null,
      recentReports: entry.reports.slice(-5),
    };
  }

  /**
   * Reset health tracking for a site/surface
   */
  reset(site: SiteIdentifier, surface: PageSurface): void {
    const key = `${site}-${surface}`;
    this.history.delete(key);
  }

  /**
   * Clear all health history
   */
  clearAll(): void {
    this.history.clear();
  }
}

// Export singleton instance
export const adapterHealthMonitor = new AdapterHealthMonitor();

/**
 * Fallback actions for each surface when adapter is broken
 */
export const FALLBACK_STRATEGIES: Record<PageSurface, {
  action: 'hide_section' | 'block_page' | 'allow_all';
  sectionSelector?: string;
  message?: string;
}> = {
  home: {
    action: 'hide_section',
    sectionSelector: 'ytd-rich-grid-renderer, ytd-two-column-browse-results-renderer',
    message: 'Feed hidden while content filtering is unavailable',
  },
  search: {
    action: 'hide_section',
    sectionSelector: 'ytd-section-list-renderer, ytd-search',
    message: 'Search results hidden while content filtering is unavailable',
  },
  watch: {
    action: 'hide_section',
    sectionSelector: '#related, ytd-watch-next-secondary-results-renderer',
    message: 'Recommendations hidden while content filtering is unavailable',
  },
  comments: {
    action: 'hide_section',
    sectionSelector: '#comments, ytd-comments',
    message: 'Comments hidden while content filtering is unavailable',
  },
  article: {
    action: 'block_page',
    message: 'This page cannot be displayed while content filtering is unavailable',
  },
  unknown: {
    action: 'allow_all',
  },
};
