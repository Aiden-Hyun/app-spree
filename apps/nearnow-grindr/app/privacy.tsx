import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { ProtectedRoute } from "../src/components/ProtectedRoute";
import { useAuth } from "../src/contexts/AuthContext";
import { useProfile } from "../src/hooks/useProfile";
import { supabase } from "../src/supabase";
import { router } from "expo-router";

interface BlockedUser {
  id: string;
  blocked_user: {
    id: string;
    full_name?: string;
    email: string;
  };
}

function PrivacyScreen() {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [showDistance, setShowDistance] = useState(true);
  const [showAge, setShowAge] = useState(true);
  const [showOnline, setShowOnline] = useState(true);
  const [incognitoMode, setIncognitoMode] = useState(false);
  const [allowScreenshots, setAllowScreenshots] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState<
    "everyone" | "matches" | "no_one"
  >("everyone");

  useEffect(() => {
    if (user) {
      fetchBlockedUsers();
      fetchPrivacySettings();
    }
  }, [user]);

  const fetchBlockedUsers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("blocked_users")
        .select(
          `
          id,
          blocked_user:blocked_id (
            id,
            full_name,
            email
          )
        `
        )
        .eq("blocker_id", user.id);

      if (error) throw error;
      setBlockedUsers(data || []);
    } catch (error) {
      console.error("Error fetching blocked users:", error);
    }
  };

  const fetchPrivacySettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("users")
        .select("preferences")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data?.preferences) {
        setShowDistance(data.preferences.show_distance ?? true);
        setShowAge(data.preferences.show_age ?? true);
        setShowOnline(data.preferences.show_online ?? true);
        setIncognitoMode(data.preferences.incognito_mode ?? false);
        setAllowScreenshots(data.preferences.allow_screenshots ?? true);
        setProfileVisibility(data.preferences.profile_visibility ?? "everyone");
      }
    } catch (error) {
      console.error("Error fetching privacy settings:", error);
    }
  };

  const updatePrivacySettings = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({
          preferences: {
            show_distance: showDistance,
            show_age: showAge,
            show_online: showOnline,
            incognito_mode: incognitoMode,
            allow_screenshots: allowScreenshots,
            profile_visibility: profileVisibility,
          },
        })
        .eq("id", user.id);

      if (error) throw error;
      Alert.alert("Success", "Privacy settings updated");
    } catch (error) {
      Alert.alert("Error", "Failed to update privacy settings");
    }
  };

  const unblockUser = async (blockedId: string) => {
    try {
      const { error } = await supabase
        .from("blocked_users")
        .delete()
        .eq("blocker_id", user?.id)
        .eq("blocked_id", blockedId);

      if (error) throw error;

      setBlockedUsers(
        blockedUsers.filter((b) => b.blocked_user.id !== blockedId)
      );
      Alert.alert("Success", "User unblocked");
    } catch (error) {
      Alert.alert("Error", "Failed to unblock user");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Visibility</Text>

        <TouchableOpacity
          style={[
            styles.visibilityOption,
            profileVisibility === "everyone" && styles.visibilityOptionActive,
          ]}
          onPress={() => setProfileVisibility("everyone")}
        >
          <Text style={styles.visibilityTitle}>Everyone</Text>
          <Text style={styles.visibilityDescription}>
            Your profile is visible to all users
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.visibilityOption,
            profileVisibility === "matches" && styles.visibilityOptionActive,
          ]}
          onPress={() => setProfileVisibility("matches")}
        >
          <Text style={styles.visibilityTitle}>Matches Only</Text>
          <Text style={styles.visibilityDescription}>
            Only people you've matched with can see your profile
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.visibilityOption,
            profileVisibility === "no_one" && styles.visibilityOptionActive,
          ]}
          onPress={() => setProfileVisibility("no_one")}
        >
          <Text style={styles.visibilityTitle}>Hidden</Text>
          <Text style={styles.visibilityDescription}>
            Your profile is hidden from everyone
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy Settings</Text>

        <View style={styles.switchItem}>
          <View style={styles.switchLabel}>
            <Text style={styles.switchTitle}>Show Distance</Text>
            <Text style={styles.switchDescription}>
              Others can see how far away you are
            </Text>
          </View>
          <Switch
            value={showDistance}
            onValueChange={setShowDistance}
            trackColor={{ false: "#ddd", true: "#e84393" }}
            thumbColor={showDistance ? "white" : "#f4f3f4"}
          />
        </View>

        <View style={styles.switchItem}>
          <View style={styles.switchLabel}>
            <Text style={styles.switchTitle}>Show Age</Text>
            <Text style={styles.switchDescription}>
              Display your age on your profile
            </Text>
          </View>
          <Switch
            value={showAge}
            onValueChange={setShowAge}
            trackColor={{ false: "#ddd", true: "#e84393" }}
            thumbColor={showAge ? "white" : "#f4f3f4"}
          />
        </View>

        <View style={styles.switchItem}>
          <View style={styles.switchLabel}>
            <Text style={styles.switchTitle}>Show Online Status</Text>
            <Text style={styles.switchDescription}>
              Let others see when you're online
            </Text>
          </View>
          <Switch
            value={showOnline}
            onValueChange={setShowOnline}
            trackColor={{ false: "#ddd", true: "#e84393" }}
            thumbColor={showOnline ? "white" : "#f4f3f4"}
          />
        </View>

        <View style={styles.switchItem}>
          <View style={styles.switchLabel}>
            <Text style={styles.switchTitle}>Incognito Mode</Text>
            <Text style={styles.switchDescription}>
              Browse profiles without being seen
            </Text>
          </View>
          <Switch
            value={incognitoMode}
            onValueChange={setIncognitoMode}
            trackColor={{ false: "#ddd", true: "#e84393" }}
            thumbColor={incognitoMode ? "white" : "#f4f3f4"}
          />
        </View>

        <View style={styles.switchItem}>
          <View style={styles.switchLabel}>
            <Text style={styles.switchTitle}>Allow Screenshots</Text>
            <Text style={styles.switchDescription}>
              Others can take screenshots of your chats
            </Text>
          </View>
          <Switch
            value={allowScreenshots}
            onValueChange={setAllowScreenshots}
            trackColor={{ false: "#ddd", true: "#e84393" }}
            thumbColor={allowScreenshots ? "white" : "#f4f3f4"}
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={updatePrivacySettings}
      >
        <Text style={styles.saveButtonText}>Save Privacy Settings</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Blocked Users</Text>

        {blockedUsers.length === 0 ? (
          <Text style={styles.emptyText}>No blocked users</Text>
        ) : (
          blockedUsers.map((blocked) => (
            <View key={blocked.id} style={styles.blockedUser}>
              <View style={styles.blockedUserInfo}>
                <Text style={styles.blockedUserName}>
                  {blocked.blocked_user.full_name || blocked.blocked_user.email}
                </Text>
                <Text style={styles.blockedUserEmail}>
                  {blocked.blocked_user.email}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => unblockUser(blocked.blocked_user.id)}
                style={styles.unblockButton}
              >
                <Text style={styles.unblockButtonText}>Unblock</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data & Privacy</Text>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Download My Data</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Privacy Policy</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Terms of Service</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, styles.deleteItem]}
          onPress={() =>
            Alert.alert("Delete Account", "This action cannot be undone")
          }
        >
          <Text style={[styles.menuText, styles.deleteText]}>
            Delete My Account
          </Text>
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
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#95a5a6",
    textTransform: "uppercase",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  visibilityOption: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  visibilityOptionActive: {
    backgroundColor: "#f8f9fa",
    borderLeftWidth: 3,
    borderLeftColor: "#e84393",
  },
  visibilityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 4,
  },
  visibilityDescription: {
    fontSize: 14,
    color: "#636e72",
  },
  switchItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  switchLabel: {
    flex: 1,
    marginRight: 16,
  },
  switchTitle: {
    fontSize: 16,
    color: "#2d3436",
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 13,
    color: "#636e72",
  },
  saveButton: {
    backgroundColor: "#e84393",
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  blockedUser: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  blockedUserInfo: {
    flex: 1,
  },
  blockedUserName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2d3436",
    marginBottom: 2,
  },
  blockedUserEmail: {
    fontSize: 14,
    color: "#636e72",
  },
  unblockButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#e84393",
    borderRadius: 8,
  },
  unblockButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyText: {
    fontSize: 16,
    color: "#95a5a6",
    textAlign: "center",
    paddingVertical: 32,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  menuText: {
    fontSize: 16,
    color: "#2d3436",
  },
  chevron: {
    fontSize: 20,
    color: "#b2bec3",
  },
  deleteItem: {
    marginTop: 8,
    borderTopWidth: 8,
    borderTopColor: "#f8f9fa",
  },
  deleteText: {
    color: "#e74c3c",
  },
});

export default function Privacy() {
  return (
    <ProtectedRoute>
      <PrivacyScreen />
    </ProtectedRoute>
  );
}


