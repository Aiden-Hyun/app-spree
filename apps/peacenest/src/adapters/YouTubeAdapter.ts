import { BaseAdapter } from './BaseAdapter';
import { PageSurface, SurfaceSelectors, CandidateRole } from './types';

/**
 * YouTubeAdapter - Handles YouTube-specific DOM selectors
 * 
 * This adapter supports:
 * - Home feed (desktop & mobile)
 * - Search results
 * - Watch page recommendations
 * - Comments
 * 
 * IMPORTANT: YouTube frequently changes its DOM structure.
 * Update selectorVersion when modifying selectors.
 */
export class YouTubeAdapter extends BaseAdapter {
  readonly site = 'youtube' as const;
  readonly selectorVersion = '2025-01-v1';

  protected urlPatterns = [
    /youtube\.com/i,
    /youtu\.be/i,
    /m\.youtube\.com/i,
  ];

  /**
   * Selector configurations for each YouTube surface.
   * Each surface has:
   * - item: Selector for the content container (video card, comment, etc.)
   * - text: Selector for the text element within the container
   * - getContainer: Function to find the removable container from any node
   * - role: Classification role for this content type
   */
  protected surfaceSelectors: Partial<Record<PageSurface, SurfaceSelectors>> = {
    home: {
      item: [
        // Desktop
        'ytd-rich-item-renderer',
        'ytd-video-renderer',
        'ytd-grid-video-renderer',
        // Mobile
        'ytm-rich-item-renderer',
        'ytm-video-with-context-renderer',
        'ytm-compact-video-renderer',
      ].join(', '),
      text: [
        '#video-title',
        '.media-item-headline',
        '.compact-media-item-headline',
        'h3.title',
      ].join(', '),
      getContainer: (el: Element) => el.closest(
        'ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ' +
        'ytm-rich-item-renderer, ytm-video-with-context-renderer, ytm-compact-video-renderer'
      ),
      role: 'title' as CandidateRole,
    },

    search: {
      item: [
        'ytd-video-renderer',
        'ytd-channel-renderer',
        'ytd-playlist-renderer',
        'ytm-compact-video-renderer',
        'ytm-video-with-context-renderer',
      ].join(', '),
      text: [
        '#video-title',
        '#channel-title',
        '.media-item-headline',
      ].join(', '),
      getContainer: (el: Element) => el.closest(
        'ytd-video-renderer, ytd-channel-renderer, ytd-playlist-renderer, ' +
        'ytm-compact-video-renderer, ytm-video-with-context-renderer'
      ),
      role: 'title' as CandidateRole,
    },

    watch: {
      item: [
        // Desktop sidebar
        'ytd-compact-video-renderer',
        'ytd-playlist-panel-video-renderer',
        // Mobile
        'ytm-compact-video-renderer',
        'ytm-video-with-context-renderer',
      ].join(', '),
      text: [
        '#video-title',
        '.media-item-headline',
      ].join(', '),
      getContainer: (el: Element) => el.closest(
        'ytd-compact-video-renderer, ytd-playlist-panel-video-renderer, ' +
        'ytm-compact-video-renderer, ytm-video-with-context-renderer'
      ),
      role: 'title' as CandidateRole,
    },

    comments: {
      item: [
        'ytd-comment-thread-renderer',
        'ytd-comment-renderer',
        'ytm-comment-thread-renderer',
        'ytm-comment-renderer',
      ].join(', '),
      text: [
        '#content-text',
        '.comment-text',
        'yt-formatted-string#content-text',
      ].join(', '),
      getContainer: (el: Element) => el.closest(
        'ytd-comment-thread-renderer, ytm-comment-thread-renderer'
      ),
      role: 'comment' as CandidateRole,
    },
  };

  detectSurface(url: string): PageSurface {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('/watch') || urlLower.includes('/shorts')) {
      return 'watch';
    }
    if (urlLower.includes('/results') || urlLower.includes('/search')) {
      return 'search';
    }
    if (urlLower.includes('/channel') || urlLower.includes('/c/') || urlLower.includes('/@')) {
      return 'home'; // Channel pages use home-like cards
    }
    
    return 'home';
  }

  getContainerForNode(node: Element, surface: PageSurface): Element | null {
    const selectors = this.surfaceSelectors[surface];
    if (!selectors) return null;
    return selectors.getContainer(node);
  }

  /**
   * CSS to inject for hiding elements before filtering.
   * This prevents content flash by initially hiding all filterable items.
   */
  getPreFilterCSS(): string {
    const allItemSelectors = Object.values(this.surfaceSelectors)
      .filter((s): s is SurfaceSelectors => s !== undefined)
      .map(s => s.item)
      .join(', ');

    return `
      ${allItemSelectors} {
        opacity: 0;
        transition: opacity 0.15s ease-in;
      }
      ${allItemSelectors}.peacenest-visible {
        opacity: 1;
      }
      .peacenest-filtered {
        opacity: 1 !important;
        background: #f0f0f0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #666;
        font-size: 14px;
        border-radius: 8px;
      }
    `;
  }

  /**
   * Get selectors for the comments section specifically.
   * Used for collapsing entire comments when adapter breaks.
   */
  getCommentsSectionSelector(): string {
    return [
      'ytd-comments',
      '#comments',
      'ytm-comments-entry-point-section-renderer',
    ].join(', ');
  }

  /**
   * Get selectors for the recommendation sidebar.
   * Used for hiding recommendations when adapter breaks.
   */
  getRecommendationsSectionSelector(): string {
    return [
      'ytd-watch-next-secondary-results-renderer',
      '#related',
      'ytm-watch-next-secondary-results-renderer',
    ].join(', ');
  }
}

// Export singleton instance
export const youtubeAdapter = new YouTubeAdapter();
