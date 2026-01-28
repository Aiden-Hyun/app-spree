/**
 * Adapter Types - Core contracts for the filtering system
 * 
 * CRITICAL: Each candidate ID must bind to the removable container node,
 * not the text span. This prevents leaving empty shells when filtering.
 */

/** Content role determines classification routing */
export type CandidateRole = 'title' | 'comment' | 'description' | 'paragraph';

/** Actions with no reveal path */
export type FilterAction = 'ALLOW' | 'REMOVE' | 'REWRITE' | 'BLOCK_PAGE';

/** Supported site identifiers */
export type SiteIdentifier = 'youtube' | 'twitter' | 'news' | 'unknown';

/** Page surface for metrics and routing */
export type PageSurface = 'home' | 'search' | 'watch' | 'comments' | 'article' | 'unknown';

/**
 * Candidate represents a content block to be classified.
 * The containerSelector is CRITICAL - it must point to the full removable container,
 * not just the text element.
 */
export interface Candidate {
  /** Unique ID for this candidate (UUID or DOM path) */
  id: string;

  /** Text extracted from child node for classification */
  text: string;

  /** Hash of text for cache keying: sha256(text + role + policyVersion) */
  textHash: string;

  /** Role determines which model/thresholds apply */
  role: CandidateRole;

  /** Site identifier for adapter routing */
  site: SiteIdentifier;

  /** Page surface for metrics */
  surface: PageSurface;

  /**
   * CRITICAL: Reference to the container node to remove/rewrite.
   * This is NOT the text span - it's the entire card/comment/block.
   * Stored as CSS selector path for serialization.
   */
  containerSelector: string;
}

/** Classification result for a single candidate */
export interface ClassificationResult {
  id: string;
  action: FilterAction;
  confidence: number;
  /** Matched category label if available */
  matchedLabel?: string;
}

/** Health metrics emitted by adapters */
export interface AdapterHealthReport {
  site: SiteIdentifier;
  surface: PageSurface;
  candidatesFound: number;
  selectorsWorking: boolean;
  timestamp: number;
  /** Error message if selectors failed */
  error?: string;
}

/** Selector configuration for a specific surface */
export interface SurfaceSelectors {
  /** Selector for content items (cards, comments, etc.) */
  item: string;
  /** Selector for text to extract within item */
  text: string;
  /** Function to find the removable container from a text node */
  getContainer: (el: Element) => Element | null;
  /** Role to assign to candidates from this surface */
  role: CandidateRole;
}

/** Site adapter interface - must be implemented for each supported site */
export interface SiteAdapter {
  /** Unique identifier for this adapter */
  readonly site: SiteIdentifier;

  /** Selector version for cache invalidation */
  readonly selectorVersion: string;

  /** Check if this adapter handles the given URL */
  matches(url: string): boolean;

  /** Detect the current page surface */
  detectSurface(url: string): PageSurface;

  /** Extract text from a DOM node (title, comment body, etc.) */
  extractTextFromNode(node: Element): string;

  /** Find the removable container for a given text node */
  getContainerForNode(node: Element, surface: PageSurface): Element | null;

  /** Get all candidate nodes on current page */
  discoverCandidates(surface: PageSurface): Candidate[];

  /** Get selectors for a specific surface */
  getSelectorsForSurface(surface: PageSurface): SurfaceSelectors | null;

  /** Health check: returns expected candidate counts by surface */
  getHealthMetrics(): AdapterHealthReport;

  /** Get CSS to inject for hiding elements pre-filter (flash prevention) */
  getPreFilterCSS(): string;
}

/** Message types for WebView bridge communication */
export type BridgeMessageType = 
  | 'CANDIDATES_DISCOVERED'
  | 'APPLY_ACTIONS'
  | 'HEALTH_REPORT'
  | 'ADAPTER_ERROR'
  | 'PAGE_NAVIGATED';

/** Base bridge message structure */
export interface BridgeMessage<T = unknown> {
  type: BridgeMessageType;
  payload: T;
  timestamp: number;
}

/** Candidates discovered message payload */
export interface CandidatesPayload {
  candidates: Candidate[];
  surface: PageSurface;
  url: string;
}

/** Apply actions message payload */
export interface ActionsPayload {
  actions: ClassificationResult[];
}

/** REWRITE placeholder configuration */
export interface RewriteConfig {
  /** Placeholder text to show */
  text: string;
  /** CSS class to apply */
  className: string;
  /** Whether to preserve original dimensions */
  preserveDimensions: boolean;
}

/** Default rewrite configuration */
export const DEFAULT_REWRITE_CONFIG: RewriteConfig = {
  text: 'Content filtered',
  className: 'peacenest-filtered',
  preserveDimensions: true,
};
