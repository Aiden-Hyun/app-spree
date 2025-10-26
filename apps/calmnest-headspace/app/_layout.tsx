import { Stack } from 'expo-router';
import { AuthProvider } from '../src/contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Login' }} />
        <Stack.Screen name="meditation/[id]" options={{ title: 'Meditation' }} />
        <Stack.Screen name="breathing" options={{ title: 'Breathing Exercise' }} />
        <Stack.Screen name="stats" options={{ title: 'Statistics' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </AuthProvider>
  );
}
