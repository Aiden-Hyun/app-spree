import { Stack } from "expo-router";
import { AuthProvider } from "../src/contexts/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen
          name="editor"
          options={{
            headerShown: true,
            title: "Editor",
            presentation: "modal",
            headerStyle: {
              backgroundColor: "#00b894",
            },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: true,
            title: "Settings",
            headerStyle: {
              backgroundColor: "#00b894",
            },
            headerTintColor: "#fff",
          }}
        />
      </Stack>
    </AuthProvider>
  );
}
