import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_STEPS = [
  {
    id: 1,
    title: "Welcome to WakeNWin",
    description: "Transform your mornings with engaging wake-up challenges",
    icon: "alarm",
    color: "#f39c12",
  },
  {
    id: 2,
    title: "Choose Your Challenge",
    description:
      "From math problems to photo missions, find what works for you",
    icon: "trophy",
    color: "#e74c3c",
  },
  {
    id: 3,
    title: "Track Your Progress",
    description:
      "Build streaks, earn achievements, and become a morning person",
    icon: "stats-chart",
    color: "#3498db",
  },
  {
    id: 4,
    title: "Enable Notifications",
    description: "We need permission to wake you up with alarms",
    icon: "notifications",
    color: "#27ae60",
    action: "requestNotifications",
  },
];

export default function OnboardingScreen() {
  const { steps } = useLocalSearchParams();
  const stepIndex = steps ? parseInt(steps[0]) - 1 : 0;
  const currentStep = ONBOARDING_STEPS[stepIndex] || ONBOARDING_STEPS[0];

  const handleNext = async () => {
    if (currentStep.action === "requestNotifications") {
      await Notifications.requestPermissionsAsync();
    }

    if (stepIndex < ONBOARDING_STEPS.length - 1) {
      router.push(`/onboarding/${stepIndex + 2}`);
    } else {
      // Complete onboarding
      await AsyncStorage.setItem("hasSeenOnboarding", "true");
      router.replace("/login");
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem("hasSeenOnboarding", "true");
    router.replace("/login");
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: currentStep.color }]}
    >
      <View style={styles.content}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        <View style={styles.iconContainer}>
          <Ionicons name={currentStep.icon as any} size={120} color="#fff" />
        </View>

        <Text style={styles.title}>{currentStep.title}</Text>
        <Text style={styles.description}>{currentStep.description}</Text>

        <View style={styles.dotsContainer}>
          {ONBOARDING_STEPS.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, index === stepIndex && styles.activeDot]}
            />
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextButtonText}>
          {stepIndex === ONBOARDING_STEPS.length - 1 ? "Get Started" : "Next"}
        </Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  skipButton: {
    position: "absolute",
    top: 20,
    right: 20,
  },
  skipText: {
    color: "#fff",
    fontSize: 16,
    opacity: 0.8,
  },
  iconContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    opacity: 0.9,
    lineHeight: 24,
    marginBottom: 40,
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  activeDot: {
    backgroundColor: "#fff",
    width: 24,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    marginHorizontal: 40,
    marginBottom: 40,
    gap: 8,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
