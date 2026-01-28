import { useRef, useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useFilter } from '../contexts/FilterContext';
import { BlockedPage } from './BlockedPage';
import { getContentScript } from '../injection/contentScript';
import { classifyBatch } from '../services/classificationService';
import { 
  BridgeMessage, 
  CandidatesPayload, 
  Candidate,
  ClassificationResult,
  FilterAction,
} from '../adapters/types';

interface WebViewBrowserProps {
  url: string;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onFilterComplete?: () => void;
  onUrlChange?: (url: string) => void;
}

// Timeout for classification requests (ms)
// Set to 60s to accommodate cold starts + HuggingFace API latency
const CLASSIFICATION_TIMEOUT = 60000;

// Fallback actions when backend is unavailable
const FALLBACK_ACTIONS: Record<string, FilterAction> = {
  title: 'REMOVE',
  comment: 'REMOVE',
  description: 'REWRITE',
  paragraph: 'REWRITE',
};

export function WebViewBrowser({
  url,
  onLoadStart,
  onLoadEnd,
  onFilterComplete,
  onUrlChange,
}: WebViewBrowserProps) {
  const webViewRef = useRef<WebView>(null);
  const { state, recordClassification, setAdapterHealth, setFallback, setInitialFilterComplete } = useFilter();
  const pendingBatches = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const isFirstLoad = useRef(true);

  // Generate the content script with current settings
  const contentScript = getContentScript({
    policyVersion: state.settings.policyVersion,
    enabled: state.settings.enabled,
  });

  // Handle messages from injected script
  const handleMessage = useCallback(async (event: WebViewMessageEvent) => {
    try {
      const message: BridgeMessage = JSON.parse(event.nativeEvent.data);

      switch (message.type) {
        case 'CANDIDATES_DISCOVERED': {
          const payload = message.payload as CandidatesPayload;
          await handleCandidates(payload.candidates, payload.surface);
          break;
        }

        case 'HEALTH_REPORT': {
          const health = message.payload as import('../adapters/types').AdapterHealthReport;
          setAdapterHealth(health);
          
          // If no candidates found on first load, mark filter complete (nothing to filter)
          if (health.candidatesFound === 0 && isFirstLoad.current) {
            isFirstLoad.current = false;
            setInitialFilterComplete(true);
            onFilterComplete?.();
          }
          
          // Check for adapter breakage
          if (!health.selectorsWorking) {
            console.warn('Adapter health check failed:', health);
          }
          break;
        }

        case 'PAGE_NAVIGATED': {
          const { url: newUrl } = message.payload as { url: string };
          onUrlChange?.(newUrl);
          break;
        }

        case 'ADAPTER_ERROR': {
          const { error, surface } = message.payload as { error: string; surface: string };
          console.error('Adapter error:', error);
          setFallback(true, 'adapter_broken', [surface]);
          break;
        }
      }
    } catch (error) {
      console.error('Failed to parse WebView message:', error);
    }
  }, [setAdapterHealth, setFallback, onUrlChange]);

  // Process candidate batch
  const handleCandidates = async (candidates: Candidate[], surface: string) => {
    if (!state.settings.enabled || candidates.length === 0) {
      // If filtering disabled, mark complete immediately
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        setInitialFilterComplete(true);
        onFilterComplete?.();
      }
      return;
    }

    const batchId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    
    try {
      // Set timeout for fallback
      const timeoutPromise = new Promise<ClassificationResult[]>((_, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Classification timeout'));
        }, CLASSIFICATION_TIMEOUT);
        pendingBatches.current.set(batchId, timeout);
      });

      // Race between classification and timeout
      const results = await Promise.race([
        classifyBatch(candidates, state.settings),
        timeoutPromise,
      ]);

      // Clear timeout
      const timeout = pendingBatches.current.get(batchId);
      if (timeout) {
        clearTimeout(timeout);
        pendingBatches.current.delete(batchId);
      }

      // Apply actions in WebView
      applyActions(results);
      
      // Record stats
      recordClassification(results);

    } catch (error) {
      console.error('Classification failed, applying fallback:', error);
      
      // Apply fallback actions
      const fallbackResults: ClassificationResult[] = candidates.map(candidate => ({
        id: candidate.id,
        action: FALLBACK_ACTIONS[candidate.role] || 'REMOVE',
        confidence: 0,
      }));
      
      applyActions(fallbackResults);
      setFallback(true, 'timeout', [surface]);
    }

    // Mark first filter pass complete
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      setInitialFilterComplete(true);
      onFilterComplete?.();
    }
  };

  // Inject JavaScript to apply filter actions
  const applyActions = (results: ClassificationResult[]) => {
    if (!webViewRef.current || results.length === 0) return;

    const script = `
      (function() {
        const actions = ${JSON.stringify(results)};
        if (typeof window.applyFilterActions === 'function') {
          window.applyFilterActions(actions);
        }
      })();
      true;
    `;

    webViewRef.current.injectJavaScript(script);
  };

  // Reset first load flag when URL changes
  useEffect(() => {
    isFirstLoad.current = true;
  }, [url]);

  // Cleanup pending timeouts on unmount
  useEffect(() => {
    return () => {
      pendingBatches.current.forEach(timeout => clearTimeout(timeout));
      pendingBatches.current.clear();
    };
  }, []);

  // Show blocked page if in fallback mode with critical error
  if (state.fallback.active && state.fallback.reason === 'adapter_broken') {
    return (
      <BlockedPage 
        reason="Content filtering is temporarily unavailable. Please try again later."
        onGoBack={() => setFallback(false, null, [])}
      />
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webview}
        onLoadStart={onLoadStart}
        onLoadEnd={onLoadEnd}
        onMessage={handleMessage}
        injectedJavaScript={contentScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        // Security settings
        allowsBackForwardNavigationGestures={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        // Performance
        cacheEnabled={true}
        incognito={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});
