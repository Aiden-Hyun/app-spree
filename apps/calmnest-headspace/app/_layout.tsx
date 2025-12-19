import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthProvider } from '../src/contexts/AuthContext';
import { useFonts } from '../src/hooks/useFonts';
import { theme } from '../src/theme';

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingEmoji}>🌿</Text>
      <Text style={styles.loadingText}>CalmNest</Text>
      <ActivityIndicator 
        size="small" 
        color={theme.colors.primary} 
        style={styles.loadingSpinner}
      />
    </View>
  );
}

export default function RootLayout() {
  const { fontsLoaded, fontError } = useFonts();

  // Log font errors for debugging
  useEffect(() => {
    if (fontError) {
      console.error('Font loading error:', fontError);
    }
  }, [fontError]);

  // Show loading screen while fonts are loading
  if (!fontsLoaded && !fontError) {
    return <LoadingScreen />;
  }

  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.text,
          headerTitleStyle: {
            fontFamily: 'DMSans-SemiBold',
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: theme.colors.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="login" 
          options={{ 
            title: 'Welcome',
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="meditation/[id]" 
          options={{ 
            title: '',
            headerTransparent: true,
          }} 
        />
        <Stack.Screen 
          name="breathing" 
          options={{ 
            title: 'Breathe',
            presentation: 'modal',
          }} 
        />
        <Stack.Screen 
          name="stats" 
          options={{ 
            title: 'Your Journey',
          }} 
        />
        <Stack.Screen 
          name="settings" 
          options={{ 
            title: 'Settings',
          }} 
        />
      </Stack>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 28,
    fontWeight: '600',
    color: theme.colors.primary,
    letterSpacing: -0.5,
  },
  loadingSpinner: {
    marginTop: 24,
  },
});
