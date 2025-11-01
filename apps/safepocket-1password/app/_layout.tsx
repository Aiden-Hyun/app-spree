import { Stack } from "expo-router";
import { AuthProvider } from "../src/contexts/AuthContext";
import { VaultProvider } from "../src/contexts/VaultContext";
import { SecurityProvider } from "../src/contexts/SecurityContext";
import { useAutoLock } from "../src/hooks/useAutoLock";
import { useEffect } from "react";

function AutoLockWrapper({ children }: { children: React.ReactNode }) {
  // Initialize auto-lock functionality
  useAutoLock();
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <VaultProvider>
        <SecurityProvider>
          <AutoLockWrapper>
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="home" options={{ title: "SafePocket" }} />
              <Stack.Screen name="login" options={{ title: "Login" }} />
              <Stack.Screen name="settings" options={{ title: "Settings" }} />
              <Stack.Screen
                name="security"
                options={{ title: "Security Dashboard" }}
              />
              <Stack.Screen name="password" options={{ headerShown: false }} />
            </Stack>
          </AutoLockWrapper>
        </SecurityProvider>
      </VaultProvider>
    </AuthProvider>
  );
}
