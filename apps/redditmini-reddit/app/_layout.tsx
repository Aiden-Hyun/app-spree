import { Stack } from "expo-router";
import { AuthProvider } from "../src/contexts/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: "Login" }} />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
        <Stack.Screen name="home" options={{ headerShown: false }} />
        <Stack.Screen name="post/[id]" options={{ title: "Post" }} />
        <Stack.Screen name="subreddit/[id]" options={{ title: "Subreddit" }} />
        <Stack.Screen name="user/[id]" options={{ title: "User" }} />
        <Stack.Screen name="search" options={{ title: "Search" }} />
      </Stack>
    </AuthProvider>
  );
}
