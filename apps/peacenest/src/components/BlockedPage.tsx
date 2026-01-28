import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface BlockedPageProps {
  reason?: string;
  onGoBack?: () => void;
}

/**
 * Blocked page replacement - shown when entire page is blocked
 * or when adapter is broken and fallback mode is active.
 */
export function BlockedPage({ reason, onGoBack }: BlockedPageProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>🚫</Text>
        <Text style={styles.title}>Page Blocked</Text>
        <Text style={styles.message}>
          {reason || 'This page has been blocked for your wellbeing.'}
        </Text>
        {onGoBack && (
          <TouchableOpacity style={styles.button} onPress={onGoBack}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 32,
    maxWidth: 300,
  },
  icon: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  message: {
    color: '#a4b0be',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: 24,
    backgroundColor: '#4a69bd',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
