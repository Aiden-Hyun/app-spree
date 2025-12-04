import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { router } from "expo-router";

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>NearNow</Text>
        <Text style={styles.tagline}>Connect with people nearby</Text>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Text style={styles.featureEmoji}>📍</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Location-Based</Text>
              <Text style={styles.featureText}>
                Discover people in your area
              </Text>
            </View>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureEmoji}>💬</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Real-Time Chat</Text>
              <Text style={styles.featureText}>
                Message your matches instantly
              </Text>
            </View>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureEmoji}>🔒</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Privacy First</Text>
              <Text style={styles.featureText}>
                Control who sees your profile
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/onboarding/permissions")}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e84393",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    maxWidth: 400,
    width: "100%",
    alignItems: "center",
  },
  logo: {
    fontSize: 48,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 48,
  },
  features: {
    width: "100%",
    marginBottom: 48,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 16,
    borderRadius: 12,
  },
  featureEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    marginBottom: 4,
  },
  featureText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  button: {
    backgroundColor: "white",
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: {
    color: "#e84393",
    fontSize: 18,
    fontWeight: "600",
  },
  disclaimer: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    paddingHorizontal: 32,
  },
});


