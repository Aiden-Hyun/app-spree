import { Stack } from 'expo-router';

export default function MusicLayout() {
  return (
    <Stack>
      <Stack.Screen name="white-noise" options={{ headerShown: false }} />
      <Stack.Screen name="nature-sounds" options={{ headerShown: false }} />
      <Stack.Screen name="music" options={{ headerShown: false }} />
      <Stack.Screen name="asmr" options={{ headerShown: false }} />
    </Stack>
  );
}

