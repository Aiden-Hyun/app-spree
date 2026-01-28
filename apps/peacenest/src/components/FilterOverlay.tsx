import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface FilterOverlayProps {
  isLoading: boolean;
  message?: string;
}

/**
 * Flash prevention overlay - covers WebView during initial filter pass
 * to prevent user from seeing triggering content before it's removed.
 */
export function FilterOverlay({ isLoading, message }: FilterOverlayProps) {
  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        <Text style={styles.icon}>🛡️</Text>
        <ActivityIndicator size="large" color="#4a69bd" style={styles.spinner} />
        <Text style={styles.message}>{message || 'Preparing safe view...'}</Text>
        {!isLoading && (
          <Text style={styles.subMessage}>Filtering content...</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  content: {
    alignItems: 'center',
    padding: 32,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  spinner: {
    marginBottom: 16,
  },
  message: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  subMessage: {
    color: '#a4b0be',
    fontSize: 12,
    marginTop: 8,
  },
});
