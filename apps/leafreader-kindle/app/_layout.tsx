import { Stack } from "expo-router";
import { AuthProvider } from "../src/contexts/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: "Login" }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="import" options={{ title: "Import Book" }} />
        <Stack.Screen name="book/[id]" options={{ title: "Book Details" }} />
        <Stack.Screen name="reader/[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="collection/[id]"
          options={{ title: "Collection" }}
        />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
      </Stack>
    </AuthProvider>
  );
}
