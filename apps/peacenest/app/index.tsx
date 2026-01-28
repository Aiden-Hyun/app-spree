import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to browser after a brief splash
    const timer = setTimeout(() => {
      router.replace('/browser');
    }, 1000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🕊️</Text>
      <Text style={styles.title}>PeaceNest</Text>
      <Text style={styles.subtitle}>Your peaceful browsing space</Text>
      <ActivityIndicator size="small" color="#4a69bd" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#a4b0be',
  },
  loader: {
    marginTop: 24,
  },
});
