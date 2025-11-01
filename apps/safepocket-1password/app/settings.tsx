import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../src/contexts/AuthContext";
import { ProtectedRoute } from "../src/components/ProtectedRoute";
import { useBiometrics } from "../src/hooks/useBiometrics";
import { useAutoLock } from "../src/hooks/useAutoLock";
import { validateAutoLockTimeout } from "../src/utils/validators";

function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const {
    isAvailable: biometricAvailable,
    isEnabled: biometricEnabled,
    enableBiometric,
    disableBiometric,
    biometryTypeName,
  } = useBiometrics();
  const { getAutoLockTimeout, setAutoLockTimeout } = useAutoLock();

  const [autoLockMinutes, setAutoLockMinutes] = useState("15");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const timeout = await getAutoLockTimeout();
    setAutoLockMinutes(timeout.toString());
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      const success = await enableBiometric();
      if (!success) {
        Alert.alert(
          "Failed to Enable",
          `Could not enable ${biometryTypeName} authentication`
        );
      }
    } else {
      await disableBiometric();
    }
  };

  const handleAutoLockChange = async () => {
    const minutes = parseInt(autoLockMinutes, 10);
    const error = validateAutoLockTimeout(minutes);

    if (error) {
      Alert.alert("Invalid Timeout", error);
      return;
    }

    await setAutoLockTimeout(minutes);
    Alert.alert("Updated", "Auto-lock timeout has been updated");
  };

  const handleChangeMasterPassword = () => {
    Alert.alert(
      "Change Master Password",
      "This feature is coming soon. You'll be able to change your master password while keeping all your data encrypted.",
      [{ text: "OK" }]
    );
  };

  const handleExportVault = () => {
    Alert.alert(
      "Export Vault",
      "Export your encrypted vault data for backup. Coming soon!",
      [{ text: "OK" }]
    );
  };

  const handleSecurityDashboard = () => {
    router.push("/security");
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/");
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all stored passwords. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirm Deletion",
              "Are you absolutely sure? All your data will be lost forever.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete Forever",
                  style: "destructive",
                  onPress: () => {
                    // Implement account deletion
                    Alert.alert(
                      "Account Deleted",
                      "Your account has been deleted."
                    );
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>

        {biometricAvailable && (
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{biometryTypeName}</Text>
              <Text style={styles.settingDescription}>
                Use {biometryTypeName} to unlock your vault
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
            />
          </View>
        )}

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Two-Factor Authentication</Text>
            <Text style={styles.settingDescription}>
              Add an extra layer of security
            </Text>
          </View>
          <Switch
            value={twoFactorEnabled}
            onValueChange={(value) => {
              if (value) {
                Alert.alert(
                  "Coming Soon",
                  "Two-factor authentication will be available soon!"
                );
                setTwoFactorEnabled(false);
              }
            }}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Auto-lock Timeout</Text>
            <Text style={styles.settingDescription}>
              Lock vault after inactivity (minutes)
            </Text>
          </View>
          <View style={styles.autoLockControl}>
            <TextInput
              style={styles.autoLockInput}
              value={autoLockMinutes}
              onChangeText={setAutoLockMinutes}
              keyboardType="numeric"
              onEndEditing={handleAutoLockChange}
            />
            <Text style={styles.autoLockUnit}>min</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleChangeMasterPassword}
        >
          <Text style={styles.buttonText}>Change Master Password</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSecurityDashboard}
        >
          <Text style={styles.buttonText}>Security Dashboard</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>

        <TouchableOpacity style={styles.button} onPress={handleExportVault}>
          <Text style={styles.buttonText}>Export Vault</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={handleDeleteAccount}
        >
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  section: {
    backgroundColor: "white",
    marginTop: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#636e72",
    marginBottom: 16,
    paddingHorizontal: 20,
    textTransform: "uppercase",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  label: {
    fontSize: 16,
    color: "#2d3436",
  },
  value: {
    fontSize: 16,
    color: "#636e72",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: "#2d3436",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: "#636e72",
  },
  autoLockControl: {
    flexDirection: "row",
    alignItems: "center",
  },
  autoLockInput: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 60,
    textAlign: "center",
    fontSize: 16,
  },
  autoLockUnit: {
    marginLeft: 8,
    fontSize: 16,
    color: "#636e72",
  },
  button: {
    marginHorizontal: 20,
    marginVertical: 8,
    backgroundColor: "#2d3436",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#e74c3c",
  },
  logoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#e74c3c",
  },
  deleteButtonText: {
    color: "#e74c3c",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default function Settings() {
  return (
    <ProtectedRoute>
      <SettingsScreen />
    </ProtectedRoute>
  );
}
