import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "../src/contexts/AuthContext";
import { ToastProvider } from "../src/contexts/ToastContext";
import { Toast } from "../src/components/Toast";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <AuthProvider>
        <ToastProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="home" options={{ title: "TaskFlow" }} />
        <Stack.Screen name="login" options={{ title: "Login" }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
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
          <Toast />
        </ToastProvider>
    </AuthProvider>
    </GestureHandlerRootView>
  );
}
