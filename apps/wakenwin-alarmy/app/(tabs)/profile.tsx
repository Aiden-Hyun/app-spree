import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { useAuth } from "../../src/contexts/AuthContext";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { supabase } from "../../src/supabase";

interface UserProfile {
  full_name?: string;
  preferences?: {
    default_challenge?: string;
    snooze_limit?: number;
    volume_gradual?: boolean;
  };
}

function ProfileScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({});
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("full_name, preferences")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      if (data) {
        setProfile(data);
        setFullName(data.full_name || "");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const updateProfile = async () => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ full_name: fullName })
        .eq("id", user?.id);

      if (error) throw error;

      setProfile((prev) => ({ ...prev, full_name: fullName }));
      setEditing(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const settingsOptions = [
    {
      icon: "notifications",
      title: "Notifications",
      subtitle: "Manage alarm and reminder notifications",
      onPress: () => router.push("/settings"),
    },
    {
      icon: "moon",
      title: "Sleep Goals",
      subtitle: "Set your ideal sleep schedule",
      onPress: () => {},
    },
    {
      icon: "volume-high",
      title: "Sound Settings",
      subtitle: "Alarm sounds and volume",
      onPress: () => {},
    },
    {
      icon: "shield-checkmark",
      title: "Privacy",
      subtitle: "Manage your data and privacy",
      onPress: () => {},
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={80} color="#f39c12" />
        </View>

        {editing ? (
          <View style={styles.editForm}>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your name"
              autoFocus
            />
            <View style={styles.editButtons}>
              <TouchableOpacity
                style={[styles.editButton, styles.cancelButton]}
                onPress={() => {
                  setEditing(false);
                  setFullName(profile.full_name || "");
                }}
              >
                <Text style={styles.editButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editButton, styles.saveButton]}
                onPress={updateProfile}
              >
                <Text style={styles.editButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.userName}>
              {profile.full_name || "Set your name"}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={() => setEditing(true)}
            >
              <Ionicons name="pencil" size={16} color="#f39c12" />
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.statsOverview}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {profile.preferences?.snooze_limit || 3}
          </Text>
          <Text style={styles.statLabel}>Snooze Limit</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {profile.preferences?.default_challenge || "Basic"}
          </Text>
          <Text style={styles.statLabel}>Default Challenge</Text>
        </View>
      </View>

      <View style={styles.settingsSection}>
        {settingsOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.settingItem}
            onPress={option.onPress}
          >
            <View style={styles.settingIcon}>
              <Ionicons name={option.icon as any} size={24} color="#f39c12" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{option.title}</Text>
              <Text style={styles.settingSubtitle}>{option.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out" size={20} color="#e74c3c" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  profileSection: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  avatarContainer: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 12,
  },
  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  editProfileText: {
    color: "#f39c12",
    fontSize: 14,
    fontWeight: "600",
  },
  editForm: {
    width: "100%",
    paddingHorizontal: 20,
  },
  input: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 12,
  },
  editButtons: {
    flexDirection: "row",
    gap: 12,
  },
  editButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#ecf0f1",
  },
  saveButton: {
    backgroundColor: "#f39c12",
  },
  editButtonText: {
    fontWeight: "600",
    color: "#2c3e50",
  },
  statsOverview: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: "#fff",
    marginTop: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f39c12",
  },
  statLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 4,
  },
  settingsSection: {
    marginTop: 12,
    backgroundColor: "#fff",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff5e6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
  },
  settingSubtitle: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    margin: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e74c3c",
    gap: 8,
  },
  logoutText: {
    color: "#e74c3c",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  version: {
    fontSize: 12,
    color: "#95a5a6",
  },
});

export default function Profile() {
  return (
    <ProtectedRoute>
      <ProfileScreen />
    </ProtectedRoute>
  );
}


