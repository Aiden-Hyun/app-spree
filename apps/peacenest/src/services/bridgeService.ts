import { BridgeMessage, BridgeMessageType, CandidatesPayload, ActionsPayload, ClassificationResult } from '../adapters/types';

/**
 * Bridge Service
 * 
 * Handles communication between React Native and the WebView.
 * Provides type-safe message parsing and action serialization.
 */

/**
 * Parse a message received from the WebView
 */
export function parseWebViewMessage(data: string): BridgeMessage | null {
  try {
    const message = JSON.parse(data) as BridgeMessage;
    
    // Validate required fields
    if (!message.type || !message.payload || !message.timestamp) {
      console.warn('Invalid bridge message format:', message);
      return null;
    }

    // Validate message type
    const validTypes: BridgeMessageType[] = [
      'CANDIDATES_DISCOVERED',
      'APPLY_ACTIONS',
      'HEALTH_REPORT',
      'ADAPTER_ERROR',
      'PAGE_NAVIGATED',
    ];

    if (!validTypes.includes(message.type)) {
      console.warn('Unknown bridge message type:', message.type);
      return null;
    }

    return message;
  } catch (error) {
    console.error('Failed to parse WebView message:', error);
    return null;
  }
}

/**
 * Serialize actions for injection into WebView
 */
export function serializeActions(results: ClassificationResult[]): string {
  return `
    (function() {
      const actions = ${JSON.stringify(results)};
      if (typeof window.applyFilterActions === 'function') {
        window.applyFilterActions(actions);
      } else {
        console.error('applyFilterActions not defined');
      }
    })();
    true;
  `;
}

/**
 * Generate JavaScript to inject for triggering a health check
 */
export function generateHealthCheckScript(): string {
  return `
    (function() {
      if (typeof window.runHealthCheck === 'function') {
        window.runHealthCheck();
      }
    })();
    true;
  `;
}

/**
 * Generate JavaScript to force a rescan of candidates
 */
export function generateRescanScript(): string {
  return `
    (function() {
      if (typeof window.scanForCandidates === 'function') {
        window.scanForCandidates();
      }
    })();
    true;
  `;
}

/**
 * Generate JavaScript to show all hidden elements (disable filtering)
 */
export function generateShowAllScript(): string {
  return `
    (function() {
      document.querySelectorAll('[style*="opacity: 0"]').forEach(function(el) {
        el.style.opacity = '1';
      });
      document.querySelectorAll('[style*="display: none"]').forEach(function(el) {
        el.style.display = '';
      });
    })();
    true;
  `;
}

/**
 * Generate JavaScript to hide a specific section (fallback mode)
 */
export function generateHideSectionScript(selector: string, message: string): string {
  return `
    (function() {
      const section = document.querySelector('${selector}');
      if (section) {
        section.innerHTML = '<div style="padding: 40px; text-align: center; background: #1a1a2e; color: #a4b0be; border-radius: 8px;"><div style="font-size: 32px; margin-bottom: 16px;">🛡️</div><div>${message}</div></div>';
      }
    })();
    true;
  `;
}

/**
 * Validate candidates payload
 */
export function validateCandidatesPayload(payload: unknown): payload is CandidatesPayload {
  if (typeof payload !== 'object' || payload === null) return false;
  
  const p = payload as Record<string, unknown>;
  
  if (!Array.isArray(p.candidates)) return false;
  if (typeof p.surface !== 'string') return false;
  if (typeof p.url !== 'string') return false;
  
  // Validate each candidate has required fields
  return p.candidates.every((c: unknown) => {
    if (typeof c !== 'object' || c === null) return false;
    const candidate = c as Record<string, unknown>;
    return (
      typeof candidate.id === 'string' &&
      typeof candidate.text === 'string' &&
      typeof candidate.role === 'string' &&
      typeof candidate.containerSelector === 'string'
    );
  });
}

/**
 * Debounce function for batch processing
 */
export function createDebouncer<T>(
  handler: (items: T[]) => void,
  delayMs: number
): {
  add: (item: T) => void;
  flush: () => void;
  clear: () => void;
} {
  let pending: T[] = [];
  let timer: NodeJS.Timeout | null = null;

  const flush = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (pending.length > 0) {
      const items = [...pending];
      pending = [];
      handler(items);
    }
  };

  const add = (item: T) => {
    pending.push(item);
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, delayMs);
  };

  const clear = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    pending = [];
  };

  return { add, flush, clear };
}
