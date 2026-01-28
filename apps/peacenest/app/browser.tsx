import { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { WebViewBrowser } from '../src/components/WebViewBrowser';
import { FilterOverlay } from '../src/components/FilterOverlay';
import { useFilter } from '../src/contexts/FilterContext';

const DEFAULT_URL = 'https://m.youtube.com';

export default function BrowserScreen() {
  const router = useRouter();
  const { state } = useFilter();
  const [url, setUrl] = useState(DEFAULT_URL);
  const [inputUrl, setInputUrl] = useState(DEFAULT_URL);
  const [isLoading, setIsLoading] = useState(true);
  // Only show overlay on very first load
  const [showOverlay, setShowOverlay] = useState(true);
  const hasCompletedFirstLoad = useRef(false);

  const handleNavigate = useCallback(() => {
    let targetUrl = inputUrl.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }
    // Only show overlay if navigating to a different domain
    const currentDomain = new URL(url).hostname;
    const newDomain = new URL(targetUrl).hostname;
    if (currentDomain !== newDomain) {
      setShowOverlay(true);
      hasCompletedFirstLoad.current = false;
    }
    setUrl(targetUrl);
  }, [inputUrl, url]);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    // Don't show overlay on subsequent loads after first complete
  }, []);

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleFilterComplete = useCallback(() => {
    setShowOverlay(false);
    hasCompletedFirstLoad.current = true;
  }, []);

  const handleUrlChange = useCallback((newUrl: string) => {
    setInputUrl(newUrl);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* URL Bar */}
      <View style={styles.urlBar}>
        <TextInput
          style={styles.urlInput}
          value={inputUrl}
          onChangeText={setInputUrl}
          onSubmitEditing={handleNavigate}
          placeholder="Enter URL..."
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
        />
        <TouchableOpacity style={styles.goButton} onPress={handleNavigate}>
          <Text style={styles.goButtonText}>Go</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.settingsButton} 
          onPress={() => router.push('/settings')}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* WebView Container */}
      <View style={styles.webviewContainer}>
        <WebViewBrowser
          url={url}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onFilterComplete={handleFilterComplete}
          onUrlChange={handleUrlChange}
        />
        
        {/* Flash Prevention Overlay */}
        {showOverlay && state.settings.enabled && (
          <FilterOverlay 
            isLoading={isLoading}
            message={isLoading ? 'Loading...' : 'Filtering content...'}
          />
        )}
      </View>

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          {state.settings.enabled ? '🛡️ Protected' : '⚠️ Unprotected'}
        </Text>
        <Text style={styles.statsText}>
          Filtered: {state.stats.removed + state.stats.rewritten}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  urlBar: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#16213e',
    alignItems: 'center',
    gap: 8,
  },
  urlInput: {
    flex: 1,
    backgroundColor: '#0f0f23',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
  },
  goButton: {
    backgroundColor: '#4a69bd',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  goButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 20,
  },
  webviewContainer: {
    flex: 1,
    position: 'relative',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: '#16213e',
  },
  statusText: {
    color: '#7bed9f',
    fontSize: 12,
  },
  statsText: {
    color: '#a4b0be',
    fontSize: 12,
  },
});
