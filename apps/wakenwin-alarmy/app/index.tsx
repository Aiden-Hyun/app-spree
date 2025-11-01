import { Redirect } from "expo-router";
import { useAuth } from "../src/contexts/AuthContext";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  const { user, loading } = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(
    null
  );

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const seen = await AsyncStorage.getItem("hasSeenOnboarding");
      setHasSeenOnboarding(seen === "true");
    } catch (error) {
      setHasSeenOnboarding(false);
    }
  };

  if (loading || hasSeenOnboarding === null) {
    return null; // Could add loading spinner here
  }

  // Show onboarding for first-time users
  if (!hasSeenOnboarding && !user) {
    return <Redirect href="/onboarding/1" />;
  }

  return user ? <Redirect href="/(tabs)/alarms" /> : <Redirect href="/login" />;
}
