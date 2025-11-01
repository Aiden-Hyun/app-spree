import { Stack } from "expo-router";
import { AuthProvider } from "../src/contexts/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="language-select"
          options={{
            headerShown: true,
            title: "Select Language",
            headerStyle: { backgroundColor: "#00b894" },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen
          name="lesson/[id]"
          options={{
            headerShown: true,
            title: "Lesson",
            headerStyle: { backgroundColor: "#00b894" },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen
          name="vocabulary/[id]"
          options={{
            headerShown: true,
            title: "Practice",
            headerStyle: { backgroundColor: "#00b894" },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: true,
            title: "Settings",
            headerStyle: { backgroundColor: "#00b894" },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen
          name="stats"
          options={{
            headerShown: true,
            title: "Statistics",
            headerStyle: { backgroundColor: "#00b894" },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen
          name="achievements"
          options={{
            headerShown: true,
            title: "Achievements",
            headerStyle: { backgroundColor: "#00b894" },
            headerTintColor: "#fff",
          }}
        />
      </Stack>
    </AuthProvider>
  );
}
