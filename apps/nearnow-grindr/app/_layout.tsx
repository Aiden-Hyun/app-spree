import { Stack } from "expo-router";
import { AuthProvider } from "../src/contexts/AuthContext";
import { OnlinePresenceProvider } from "../src/components/OnlinePresenceProvider";

export default function RootLayout() {
  return (
    <AuthProvider>
      <OnlinePresenceProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="home" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ title: "Login" }} />
          <Stack.Screen name="settings" options={{ title: "Settings" }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="chat/[id]" options={{ title: "Chat" }} />
          <Stack.Screen name="user/[id]" options={{ title: "Profile" }} />
          <Stack.Screen
            name="edit-profile"
            options={{ title: "Edit Profile" }}
          />
          <Stack.Screen name="privacy" options={{ title: "Privacy" }} />
          <Stack.Screen name="help" options={{ title: "Help & Support" }} />
        </Stack>
      </OnlinePresenceProvider>
    </AuthProvider>
  );
}
