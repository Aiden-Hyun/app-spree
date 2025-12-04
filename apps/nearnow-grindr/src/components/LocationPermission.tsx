import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import {
  requestLocationPermission,
  requestBackgroundLocationPermission,
} from "../utils/permissions";

interface LocationPermissionProps {
  onPermissionGranted: () => void;
}

export function LocationPermission({
  onPermissionGranted,
}: LocationPermissionProps) {
  const [requesting, setRequesting] = React.useState(false);

  const handleRequestPermission = async () => {
    setRequesting(true);
    try {
      const foregroundGranted = await requestLocationPermission();
      if (foregroundGranted) {
        const backgroundGranted = await requestBackgroundLocationPermission();
        if (backgroundGranted || foregroundGranted) {
          onPermissionGranted();
        }
      }
    } catch (error) {
      console.error("Error requesting location permission:", error);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📍</Text>
        </View>

        <Text style={styles.title}>Enable Location Services</Text>
        <Text style={styles.description}>
          NearNow uses your location to show you people nearby. Your exact
          location is never shared with other users.
        </Text>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>👥</Text>
            <Text style={styles.featureText}>Discover people around you</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🔒</Text>
            <Text style={styles.featureText}>Your privacy is protected</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📏</Text>
            <Text style={styles.featureText}>See approximate distances</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, requesting && styles.buttonDisabled]}
          onPress={handleRequestPermission}
          disabled={requesting}
        >
          <Text style={styles.buttonText}>
            {requesting ? "Requesting..." : "Enable Location"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          You can change this anytime in your device settings
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    maxWidth: 400,
    width: "100%",
    alignItems: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e84393",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d3436",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#636e72",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  features: {
    width: "100%",
    marginBottom: 32,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: "#2d3436",
    flex: 1,
  },
  button: {
    backgroundColor: "#e84393",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  disclaimer: {
    fontSize: 14,
    color: "#95a5a6",
    textAlign: "center",
  },
});


