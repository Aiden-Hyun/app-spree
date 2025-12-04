import { Stack } from "expo-router";

export default function PasswordLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="new"
        options={{
          title: "Add Password",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Password Details",
        }}
      />
    </Stack>
  );
}


