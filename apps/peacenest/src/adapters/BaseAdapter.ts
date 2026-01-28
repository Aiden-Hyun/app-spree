import {
  SiteAdapter,
  SiteIdentifier,
  PageSurface,
  Candidate,
  SurfaceSelectors,
  AdapterHealthReport,
} from './types';

/**
 * BaseAdapter - Abstract base class for site adapters
 * 
 * Provides common functionality for health monitoring and candidate discovery.
 * Concrete adapters should extend this and implement site-specific selectors.
 */
export abstract class BaseAdapter implements SiteAdapter {
  abstract readonly site: SiteIdentifier;
  abstract readonly selectorVersion: string;

  /** URL patterns this adapter handles */
  protected abstract urlPatterns: RegExp[];

  /** Selector configurations by surface */
  protected abstract surfaceSelectors: Partial<Record<PageSurface, SurfaceSelectors>>;

  /** Track health metrics */
  protected lastHealthReport: AdapterHealthReport | null = null;
  protected consecutiveFailures: Record<string, number> = {};

  matches(url: string): boolean {
    return this.urlPatterns.some(pattern => pattern.test(url));
  }

  abstract detectSurface(url: string): PageSurface;

  getSelectorsForSurface(surface: PageSurface): SurfaceSelectors | null {
    return this.surfaceSelectors[surface] || null;
  }

  extractTextFromNode(node: Element): string {
    if (!node) return '';
    return (node.textContent || '').trim().slice(0, 500);
  }

  abstract getContainerForNode(node: Element, surface: PageSurface): Element | null;

  /**
   * Discover candidates on the current page.
   * Note: This method is designed for browser context.
   * For React Native, see the inline adapter in contentScript.ts
   */
  discoverCandidates(surface: PageSurface): Candidate[] {
    // This is a reference implementation
    // Actual discovery happens in the injected content script
    console.warn('discoverCandidates called outside browser context');
    return [];
  }

  getHealthMetrics(): AdapterHealthReport {
    // This is a reference implementation
    // Actual health checks happen in the injected content script
    return {
      site: this.site,
      surface: 'unknown',
      candidatesFound: 0,
      selectorsWorking: false,
      timestamp: Date.now(),
      error: 'Health check called outside browser context',
    };
  }

  abstract getPreFilterCSS(): string;

  /**
   * Record a failure for a surface (for fallback logic)
   */
  recordFailure(surface: PageSurface): void {
    const key = `${this.site}-${surface}`;
    this.consecutiveFailures[key] = (this.consecutiveFailures[key] || 0) + 1;
  }

  /**
   * Reset failure count for a surface
   */
  resetFailures(surface: PageSurface): void {
    const key = `${this.site}-${surface}`;
    this.consecutiveFailures[key] = 0;
  }

  /**
   * Check if fallback should be triggered for a surface
   */
  shouldTriggerFallback(surface: PageSurface, threshold: number = 3): boolean {
    const key = `${this.site}-${surface}`;
    return (this.consecutiveFailures[key] || 0) >= threshold;
  }

  /**
   * Generate a simple hash for cache keying
   */
  protected hashText(text: string, role: string, policyVersion: string): string {
    const str = text + role + policyVersion;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}
