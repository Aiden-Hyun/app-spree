import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { requestAllPermissions } from "../../src/utils/permissions";

interface Permission {
  id: string;
  title: string;
  description: string;
  emoji: string;
  granted: boolean;
}

export default function PermissionsScreen() {
  const [permissions, setPermissions] = useState<Permission[]>([
    {
      id: "location",
      title: "Location Services",
      description: "Find people nearby and show your distance",
      emoji: "📍",
      granted: false,
    },
    {
      id: "camera",
      title: "Camera",
      description: "Take photos for your profile",
      emoji: "📸",
      granted: false,
    },
    {
      id: "photos",
      title: "Photo Library",
      description: "Upload photos from your gallery",
      emoji: "🖼️",
      granted: false,
    },
    {
      id: "notifications",
      title: "Notifications",
      description: "Get notified about messages and matches",
      emoji: "🔔",
      granted: false,
    },
  ]);
  const [requesting, setRequesting] = useState(false);

  const handleRequestPermissions = async () => {
    setRequesting(true);
    try {
      const results = await requestAllPermissions();

      setPermissions((prev) => [
        { ...prev[0], granted: results.location && results.backgroundLocation },
        { ...prev[1], granted: results.camera },
        { ...prev[2], granted: results.mediaLibrary },
        { ...prev[3], granted: results.notifications },
      ]);

      // If at least location is granted, we can proceed
      if (results.location) {
        setTimeout(() => {
          router.push("/onboarding/profile-setup");
        }, 500);
      }
    } catch (error) {
      console.error("Error requesting permissions:", error);
    } finally {
      setRequesting(false);
    }
  };

  const canSkip = permissions[0].granted; // At least location is required

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text style={styles.title}>App Permissions</Text>
        <Text style={styles.subtitle}>
          NearNow needs a few permissions to work properly
        </Text>
      </View>

      <View style={styles.permissions}>
        {permissions.map((permission) => (
          <View key={permission.id} style={styles.permission}>
            <View style={styles.permissionIcon}>
              <Text style={styles.emoji}>{permission.emoji}</Text>
            </View>
            <View style={styles.permissionContent}>
              <Text style={styles.permissionTitle}>{permission.title}</Text>
              <Text style={styles.permissionDescription}>
                {permission.description}
              </Text>
            </View>
            {permission.granted && <Text style={styles.checkmark}>✓</Text>}
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.primaryButton,
            requesting && styles.buttonDisabled,
          ]}
          onPress={handleRequestPermissions}
          disabled={requesting}
        >
          <Text style={styles.primaryButtonText}>
            {requesting ? "Requesting..." : "Grant Permissions"}
          </Text>
        </TouchableOpacity>

        {canSkip && (
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => router.push("/onboarding/profile-setup")}
          >
            <Text style={styles.secondaryButtonText}>Continue</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.note}>
        You can always change these permissions in your device settings
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  contentContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginTop: 40,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2d3436",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#636e72",
  },
  permissions: {
    marginBottom: 32,
  },
  permission: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  permissionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  emoji: {
    fontSize: 24,
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    color: "#636e72",
  },
  checkmark: {
    fontSize: 20,
    color: "#00b894",
    fontWeight: "bold",
  },
  actions: {
    marginTop: "auto",
    marginBottom: 16,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#e84393",
  },
  secondaryButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e84393",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: "#e84393",
    fontSize: 18,
    fontWeight: "600",
  },
  note: {
    fontSize: 14,
    color: "#95a5a6",
    textAlign: "center",
  },
});


