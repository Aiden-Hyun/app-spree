import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../src/contexts/AuthContext";
import { useProfile } from "../src/hooks/useProfile";
import { ProtectedRoute } from "../src/components/ProtectedRoute";

function HomeScreen() {
  const { user } = useAuth();
  const { profile, loading, hasCompletedOnboarding } = useProfile();

  useEffect(() => {
    if (!loading) {
      if (!hasCompletedOnboarding) {
        // Redirect to onboarding if profile is incomplete
        router.replace("/onboarding/welcome");
      } else {
        // Redirect to main tab navigation
        router.replace("/(tabs)/discover");
      }
    }
  }, [loading, hasCompletedOnboarding]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#e84393" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
});

export default function Home() {
  return (
    <ProtectedRoute>
      <HomeScreen />
    </ProtectedRoute>
  );
}
