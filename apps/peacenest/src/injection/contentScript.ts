/**
 * Content Script - Injected into WebView for DOM manipulation
 *
 * This script:
 * 1. Discovers candidate content blocks using site adapters
 * 2. Posts candidates to React Native for classification
 * 3. Applies filter actions (REMOVE, REWRITE) to the DOM
 * 4. Uses MutationObserver to catch dynamically loaded content
 */

interface ContentScriptConfig {
  policyVersion: string;
  enabled: boolean;
}

export function getContentScript(config: ContentScriptConfig): string {
  return `
(function() {
  'use strict';

  // Prevent double-injection
  if (window.__peacenestInjected) return;
  window.__peacenestInjected = true;

  const CONFIG = {
    policyVersion: '${config.policyVersion}',
    enabled: ${config.enabled},
    batchSize: 32,
    debounceMs: 150,
    healthCheckIntervalMs: 30000,
  };

  // Candidate tracking
  const processedIds = new Set();
  const pendingCandidates = [];
  let debounceTimer = null;

  // ========================================
  // YouTube Adapter (inline for injection)
  // ========================================
  const YouTubeAdapter = {
    site: 'youtube',
    selectorVersion: '2025-01-v1',

    matches: function(url) {
      return url.includes('youtube.com') || url.includes('youtu.be');
    },

    detectSurface: function(url) {
      if (url.includes('/watch')) return 'watch';
      if (url.includes('/results') || url.includes('/search')) return 'search';
      if (url.includes('/shorts')) return 'watch';
      return 'home';
    },

    selectors: {
      home: {
        item: 'ytd-rich-item-renderer, ytd-video-renderer, ytm-rich-item-renderer, ytm-video-with-context-renderer',
        text: '#video-title, .media-item-headline, .compact-media-item-headline',
        role: 'title',
      },
      search: {
        item: 'ytd-video-renderer, ytm-compact-video-renderer, ytm-video-with-context-renderer',
        text: '#video-title, .media-item-headline',
        role: 'title',
      },
      watch: {
        item: 'ytd-compact-video-renderer, ytm-compact-video-renderer, ytm-video-with-context-renderer',
        text: '#video-title, .media-item-headline',
        role: 'title',
      },
      comments: {
        item: 'ytd-comment-thread-renderer, ytm-comment-thread-renderer',
        text: '#content-text, .comment-text',
        role: 'comment',
      },
    },

    getContainerForNode: function(node, surface) {
      const selectors = this.selectors[surface] || this.selectors.home;
      return node.closest(selectors.item);
    },

    extractTextFromNode: function(node) {
      if (!node) return '';
      return (node.textContent || '').trim().slice(0, 500);
    },

    discoverCandidates: function(surface) {
      const selectors = this.selectors[surface] || this.selectors.home;
      const candidates = [];
      
      try {
        const items = document.querySelectorAll(selectors.item);
        
        items.forEach((item, index) => {
          const textNode = item.querySelector(selectors.text);
          if (!textNode) return;
          
          const text = this.extractTextFromNode(textNode);
          if (!text || text.length < 3) return;
          
          // Generate unique ID based on content and position
          const id = 'yt-' + surface + '-' + index + '-' + hashCode(text);
          
          if (processedIds.has(id)) return;
          
          // Generate CSS path for container
          const containerSelector = getCSSPath(item);
          
          candidates.push({
            id: id,
            text: text,
            textHash: hashCode(text + selectors.role + CONFIG.policyVersion),
            role: selectors.role,
            site: 'youtube',
            surface: surface,
            containerSelector: containerSelector,
          });
        });
      } catch (error) {
        postMessage('ADAPTER_ERROR', { error: error.message, surface: surface });
      }
      
      return candidates;
    },

    getHealthMetrics: function() {
      const surface = this.detectSurface(window.location.href);
      const selectors = this.selectors[surface] || this.selectors.home;
      const items = document.querySelectorAll(selectors.item);
      
      return {
        site: 'youtube',
        surface: surface,
        candidatesFound: items.length,
        selectorsWorking: items.length > 0 || document.readyState !== 'complete',
        timestamp: Date.now(),
      };
    },

    getPreFilterCSS: function() {
      return Object.values(this.selectors)
        .map(s => s.item)
        .join(', ') + ' { opacity: 0; transition: opacity 0.2s; }';
    },
  };

  // ========================================
  // Utility Functions
  // ========================================
  
  function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  function getCSSPath(element) {
    if (!element) return '';
    const path = [];
    while (element && element.nodeType === Node.ELEMENT_NODE) {
      let selector = element.nodeName.toLowerCase();
      if (element.id) {
        selector += '#' + element.id;
        path.unshift(selector);
        break;
      } else {
        let sibling = element;
        let nth = 1;
        while (sibling.previousElementSibling) {
          sibling = sibling.previousElementSibling;
          if (sibling.nodeName.toLowerCase() === selector.split(':')[0]) nth++;
        }
        if (nth > 1) selector += ':nth-of-type(' + nth + ')';
      }
      path.unshift(selector);
      element = element.parentNode;
    }
    return path.join(' > ');
  }

  function postMessage(type, payload) {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: type,
        payload: payload,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Failed to post message:', error);
    }
  }

  // ========================================
  // DOM Manipulation
  // ========================================

  function removeElement(selector) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        element.innerHTML = '<div style="padding: 12px; display: flex; align-items: center; justify-content: center; background: #2d2d44; color: #a4b0be; font-size: 12px; border-radius: 8px; gap: 8px;"><span>🛡️</span><span>Content removed</span></div>';
        element.style.opacity = '1';
        return true;
      }
    } catch (error) {
      console.error('Failed to remove element:', error);
    }
    return false;
  }

  function rewriteElement(selector) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        const height = element.offsetHeight;
        element.innerHTML = '<div style="height: ' + height + 'px; display: flex; align-items: center; justify-content: center; background: #f0f0f0; color: #666; font-size: 14px; border-radius: 8px;">Content filtered</div>';
        element.style.opacity = '1';
        return true;
      }
    } catch (error) {
      console.error('Failed to rewrite element:', error);
    }
    return false;
  }

  function showElement(selector) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        element.style.opacity = '1';
        return true;
      }
    } catch (error) {}
    return false;
  }

  // Global function for React Native to call
  window.applyFilterActions = function(actions) {
    if (!Array.isArray(actions)) return;
    
    actions.forEach(function(result) {
      // Find the candidate's container selector
      const candidate = Array.from(processedIds).find(function(id) {
        return id === result.id;
      });
      
      // Look up container from pending or already processed
      const containerSelector = window.__candidateContainers && window.__candidateContainers[result.id];
      
      if (!containerSelector) {
        console.warn('Container not found for:', result.id);
        return;
      }
      
      switch (result.action) {
        case 'REMOVE':
          removeElement(containerSelector);
          break;
        case 'REWRITE':
          rewriteElement(containerSelector);
          break;
        case 'ALLOW':
          showElement(containerSelector);
          break;
        case 'BLOCK_PAGE':
          document.body.innerHTML = '<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #1a1a2e; color: white;"><div style="font-size: 64px; margin-bottom: 16px;">🚫</div><div style="font-size: 24px; font-weight: bold;">Page Blocked</div><div style="color: #a4b0be; margin-top: 8px;">This page has been blocked for your wellbeing.</div></div>';
          break;
      }
    });
  };

  // ========================================
  // Candidate Discovery & Batching
  // ========================================

  window.__candidateContainers = {};

  function scanForCandidates() {
    if (!CONFIG.enabled) return;
    
    const adapter = YouTubeAdapter;
    if (!adapter.matches(window.location.href)) return;
    
    const surface = adapter.detectSurface(window.location.href);
    const candidates = adapter.discoverCandidates(surface);
    
    if (candidates.length === 0) return;
    
    // Store container selectors for action application
    candidates.forEach(function(c) {
      window.__candidateContainers[c.id] = c.containerSelector;
      processedIds.add(c.id);
    });
    
    // Add to pending batch
    pendingCandidates.push(...candidates);
    
    // Debounce batch sending
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function() {
      if (pendingCandidates.length > 0) {
        // Send in batches
        while (pendingCandidates.length > 0) {
          const batch = pendingCandidates.splice(0, CONFIG.batchSize);
          postMessage('CANDIDATES_DISCOVERED', {
            candidates: batch,
            surface: surface,
            url: window.location.href,
          });
        }
      }
    }, CONFIG.debounceMs);
  }

  // ========================================
  // MutationObserver for Dynamic Content
  // ========================================

  const observer = new MutationObserver(function(mutations) {
    let hasNewNodes = false;
    
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes.length > 0) {
        hasNewNodes = true;
      }
    });
    
    if (hasNewNodes) {
      scanForCandidates();
    }
  });

  function startObserver() {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // ========================================
  // Health Check
  // ========================================

  function runHealthCheck() {
    const adapter = YouTubeAdapter;
    if (!adapter.matches(window.location.href)) return;
    
    const health = adapter.getHealthMetrics();
    postMessage('HEALTH_REPORT', health);
  }

  // ========================================
  // Navigation Detection
  // ========================================

  let lastUrl = window.location.href;
  
  function checkNavigation() {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      processedIds.clear();
      window.__candidateContainers = {};
      postMessage('PAGE_NAVIGATED', { url: lastUrl });
      
      // Rescan after navigation
      setTimeout(scanForCandidates, 500);
    }
  }

  // ========================================
  // Initialization
  // ========================================

  function init() {
    // Initial scan
    scanForCandidates();
    
    // Start observer
    if (document.body) {
      startObserver();
    } else {
      document.addEventListener('DOMContentLoaded', startObserver);
    }
    
    // Health checks
    setInterval(runHealthCheck, CONFIG.healthCheckIntervalMs);
    
    // Navigation polling (for SPAs)
    setInterval(checkNavigation, 500);
    
    // Listen for popstate
    window.addEventListener('popstate', function() {
      setTimeout(checkNavigation, 100);
    });
  }

  // Start when ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
true;
`;
}
