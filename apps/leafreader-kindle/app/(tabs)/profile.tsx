import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/contexts/AuthContext";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { useRouter } from "expo-router";

function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [readingGoal, setReadingGoal] = useState("30");
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoSync, setAutoSync] = useState(true);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </Text>
          </View>
        </View>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.memberSince}>
          Member since {new Date().getFullYear()}
        </Text>
      </View>

      {/* Reading Goals */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reading Goals</Text>
        <View style={styles.card}>
          <View style={styles.goalItem}>
            <Text style={styles.goalLabel}>Daily Reading Goal (minutes)</Text>
            <TextInput
              style={styles.goalInput}
              value={readingGoal}
              onChangeText={setReadingGoal}
              keyboardType="numeric"
              placeholder="30"
            />
          </View>
        </View>
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reading Preferences</Text>
        <View style={styles.card}>
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceLabel}>Dark Mode</Text>
              <Text style={styles.preferenceDescription}>
                Use dark theme for reading
              </Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: "#ddd", true: "#2d3436" }}
              thumbColor="white"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceLabel}>Reading Reminders</Text>
              <Text style={styles.preferenceDescription}>
                Get daily reading notifications
              </Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: "#ddd", true: "#2d3436" }}
              thumbColor="white"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceLabel}>Auto Sync</Text>
              <Text style={styles.preferenceDescription}>
                Sync progress across devices
              </Text>
            </View>
            <Switch
              value={autoSync}
              onValueChange={setAutoSync}
              trackColor={{ false: "#ddd", true: "#2d3436" }}
              thumbColor="white"
            />
          </View>
        </View>
      </View>

      {/* Data Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.actionItem}>
            <Ionicons name="download-outline" size={24} color="#2d3436" />
            <Text style={styles.actionText}>Export Library</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionItem}>
            <Ionicons name="cloud-upload-outline" size={24} color="#2d3436" />
            <Text style={styles.actionText}>Backup to Cloud</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionItem}>
            <Ionicons name="trash-outline" size={24} color="#e74c3c" />
            <Text style={[styles.actionText, { color: "#e74c3c" }]}>
              Clear Cache
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.actionItem}>
            <Ionicons
              name="shield-checkmark-outline"
              size={24}
              color="#2d3436"
            />
            <Text style={styles.actionText}>Privacy Policy</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionItem}>
            <Ionicons name="document-text-outline" size={24} color="#2d3436" />
            <Text style={styles.actionText}>Terms of Service</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.actionItem}>
            <Ionicons
              name="information-circle-outline"
              size={24}
              color="#2d3436"
            />
            <Text style={styles.actionText}>Version 1.0.0</Text>
          </View>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    alignItems: "center",
    padding: 30,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#2d3436",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
  email: {
    fontSize: 18,
    color: "#2d3436",
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    color: "#666",
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  goalItem: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalLabel: {
    fontSize: 16,
    color: "#2d3436",
    flex: 1,
  },
  goalInput: {
    width: 60,
    padding: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 16,
  },
  preferenceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  preferenceInfo: {
    flex: 1,
    marginRight: 16,
  },
  preferenceLabel: {
    fontSize: 16,
    color: "#2d3436",
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 14,
    color: "#666",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 16,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  actionText: {
    fontSize: 16,
    color: "#2d3436",
    marginLeft: 16,
  },
  logoutButton: {
    margin: 20,
    backgroundColor: "#e74c3c",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  logoutText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 20,
  },
});

export default function Profile() {
  return (
    <ProtectedRoute>
      <ProfileScreen />
    </ProtectedRoute>
  );
}
