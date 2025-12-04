import React from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useVault } from "../../src/contexts/VaultContext";
import { PasswordForm } from "../../src/components/PasswordForm";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";

function NewPasswordScreen() {
  const router = useRouter();
  const { addPassword, categories } = useVault();

  const handleSubmit = async (data: Parameters<typeof addPassword>[0]) => {
    await addPassword(data);
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <PasswordForm
        categories={categories}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitButtonText="Add Password"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
});

export default function NewPassword() {
  return (
    <ProtectedRoute>
      <NewPasswordScreen />
    </ProtectedRoute>
  );
}


