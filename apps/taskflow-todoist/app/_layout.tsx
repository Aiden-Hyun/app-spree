import { Stack } from "expo-router";
import { AuthProvider } from "../src/contexts/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="home" options={{ title: "TaskFlow" }} />
        <Stack.Screen name="login" options={{ title: "Login" }} />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
        <Stack.Screen
          name="quick-add"
          options={{
            presentation: "modal",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="stats"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="task/[id]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="project/[id]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="search"
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="create-project"
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
      </Stack>
    </AuthProvider>
  );
}
