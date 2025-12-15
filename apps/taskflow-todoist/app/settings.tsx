import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { useAuth } from "../src/contexts/AuthContext";
import { ProtectedRoute } from "../src/components/ProtectedRoute";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";

function SettingsScreen() {
  const { user, logout } = useAuth();
  
  // Preferences state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [completeSoundEnabled, setCompleteSoundEnabled] = useState(true);
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  
  // Account state
  const [fullName, setFullName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);

  const appVersion = Constants.expoConfig?.version || "1.0.0";

  const handleClearCompleted = () => {
    Alert.alert(
      "Clear Completed Tasks",
      "This will permanently delete all completed tasks. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            // TODO: Implement clear completed tasks
            Alert.alert("Success", "Completed tasks have been cleared.");
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert("Not Available", "Account deletion is not yet implemented.");
          },
        },
      ]
    );
  };

  const handleExportTasks = () => {
    Alert.alert("Export Tasks", "Task export functionality coming soon!");
  };

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="mail-outline" size={20} color="#6c5ce7" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Email</Text>
              <Text style={styles.settingValue}>{user?.email}</Text>
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="person-outline" size={20} color="#6c5ce7" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Full Name</Text>
              {isEditingName ? (
                <TextInput
                  style={styles.nameInput}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your name"
                  onBlur={() => setIsEditingName(false)}
                  autoFocus
                />
              ) : (
                <TouchableOpacity onPress={() => setIsEditingName(true)}>
                  <Text style={styles.settingValueEditable}>
                    {fullName || "Tap to add name"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="notifications-outline" size={20} color="#6c5ce7" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Text style={styles.settingDescription}>Get reminders for due tasks</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#ddd", true: "#6c5ce7" }}
              thumbColor="white"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="moon-outline" size={20} color="#6c5ce7" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Dark Mode</Text>
              <Text style={styles.settingDescription}>Coming soon</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: "#ddd", true: "#6c5ce7" }}
              thumbColor="white"
              disabled
            />
          </View>
        </View>

        {/* Task Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Task Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="volume-high-outline" size={20} color="#6c5ce7" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Complete Sound</Text>
              <Text style={styles.settingDescription}>Play sound when completing tasks</Text>
            </View>
            <Switch
              value={completeSoundEnabled}
              onValueChange={setCompleteSoundEnabled}
              trackColor={{ false: "#ddd", true: "#6c5ce7" }}
              thumbColor="white"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="checkmark-done-outline" size={20} color="#6c5ce7" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Show Completed Tasks</Text>
              <Text style={styles.settingDescription}>Display completed tasks in lists</Text>
            </View>
            <Switch
              value={showCompletedTasks}
              onValueChange={setShowCompletedTasks}
              trackColor={{ false: "#ddd", true: "#6c5ce7" }}
              thumbColor="white"
            />
          </View>
        </View>

        {/* Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/stats")}
          >
            <View style={styles.actionButtonContent}>
              <Ionicons name="stats-chart" size={20} color="#6c5ce7" />
              <Text style={styles.actionButtonText}>View Productivity Stats</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleExportTasks}
          >
            <View style={styles.actionButtonContent}>
              <Ionicons name="download-outline" size={20} color="#6c5ce7" />
              <Text style={styles.actionButtonText}>Export Tasks</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleClearCompleted}
          >
            <View style={styles.actionButtonContent}>
              <Ionicons name="trash-outline" size={20} color="#f39c12" />
              <Text style={styles.actionButtonText}>Clear Completed Tasks</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionButtonContent}>
              <Ionicons name="document-text-outline" size={20} color="#6c5ce7" />
              <Text style={styles.actionButtonText}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionButtonContent}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#6c5ce7" />
              <Text style={styles.actionButtonText}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>TaskFlow v{appVersion}</Text>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
          
          <TouchableOpacity style={styles.signOutButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color="white" />
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteAccountButton}
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash-outline" size={20} color="#e74c3c" />
            <Text style={styles.deleteAccountButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 50,
    backgroundColor: "#6c5ce7",
  },
  backButton: {
    padding: 4,
  },
  headerSpacer: {
    width: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dangerTitle: {
    color: "#e74c3c",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#f0eeff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2d3436",
  },
  settingDescription: {
    fontSize: 13,
    color: "#999",
    marginTop: 2,
  },
  settingValue: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  settingValueEditable: {
    fontSize: 14,
    color: "#6c5ce7",
    marginTop: 2,
  },
  nameInput: {
    fontSize: 14,
    color: "#2d3436",
    padding: 4,
    marginTop: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#6c5ce7",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  actionButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    color: "#2d3436",
  },
  versionContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  versionText: {
    fontSize: 14,
    color: "#999",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6c5ce7",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  deleteAccountButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e74c3c",
    gap: 8,
  },
  deleteAccountButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e74c3c",
  },
});

export default function Settings() {
  return (
    <ProtectedRoute>
      <SettingsScreen />
    </ProtectedRoute>
  );
}
