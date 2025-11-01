import { Stack } from "expo-router";
import { AuthProvider } from "../src/contexts/AuthContext";
import { useNotifications } from "../src/hooks/useNotifications";
import { useEffect } from "react";

function AppContent() {
  useNotifications();

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
      <Stack.Screen name="alarm/create" options={{ title: "Create Alarm" }} />
      <Stack.Screen name="alarm/[id]" options={{ title: "Edit Alarm" }} />
      <Stack.Screen
        name="challenge/basic"
        options={{
          title: "Basic Challenge",
          headerShown: false,
          presentation: "fullScreenModal",
        }}
      />
      <Stack.Screen
        name="challenge/math"
        options={{
          title: "Math Challenge",
          headerShown: false,
          presentation: "fullScreenModal",
        }}
      />
      <Stack.Screen
        name="challenge/shake"
        options={{
          title: "Shake Challenge",
          headerShown: false,
          presentation: "fullScreenModal",
        }}
      />
      <Stack.Screen
        name="challenge/photo"
        options={{
          title: "Photo Challenge",
          headerShown: false,
          presentation: "fullScreenModal",
        }}
      />
      <Stack.Screen
        name="challenge/memory"
        options={{
          title: "Memory Challenge",
          headerShown: false,
          presentation: "fullScreenModal",
        }}
      />
      <Stack.Screen
        name="challenge/typing"
        options={{
          title: "Typing Challenge",
          headerShown: false,
          presentation: "fullScreenModal",
        }}
      />
      <Stack.Screen
        name="onboarding/[...steps]"
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
