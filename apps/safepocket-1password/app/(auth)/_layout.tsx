import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="login"
        options={{
          title: "Login",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: "Sign Up",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="master-password"
        options={{
          title: "Master Password",
          headerShown: true,
          headerBackVisible: false,
        }}
      />
    </Stack>
  );
}
