import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../src/contexts/AuthContext";

export default function Index() {
  const { user, loading, hasMasterPassword, isVaultUnlocked } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2d3436" />
        <Text style={styles.loadingText}>Loading SafePocket...</Text>
      </View>
    );
  }

  // Not logged in
  if (!user) {
    return <Redirect href="/login" />;
  }

  // Logged in but no master password set
  if (!hasMasterPassword) {
    return <Redirect href="/(auth)/master-password" />;
  }

  // Has master password but vault is locked
  if (!isVaultUnlocked) {
    return <Redirect href="/(auth)/master-password" />;
  }

  // Everything is ready
  return <Redirect href="/home" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#636e72",
  },
});
