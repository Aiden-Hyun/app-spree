import { Stack } from "expo-router";
import { AuthProvider } from "../src/contexts/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen
          name="login"
          options={{ headerShown: true, title: "Login" }}
        />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="listing/[id]"
          options={{ headerShown: true, title: "Listing Details" }}
        />
        <Stack.Screen
          name="category/[id]"
          options={{ headerShown: true, title: "Category" }}
        />
        <Stack.Screen
          name="chat/[id]"
          options={{ headerShown: true, title: "Chat" }}
        />
        <Stack.Screen
          name="user/[id]"
          options={{ headerShown: true, title: "User Profile" }}
        />
        <Stack.Screen
          name="settings"
          options={{ headerShown: true, title: "Settings" }}
        />
        <Stack.Screen
          name="favorites"
          options={{ headerShown: true, title: "Favorites" }}
        />
      </Stack>
    </AuthProvider>
  );
}
