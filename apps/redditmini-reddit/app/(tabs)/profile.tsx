import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useAuth } from "../../src/contexts/AuthContext";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

function ProfileScreen() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = React.useState<
    "posts" | "comments" | "about"
  >("posts");

  // Mock user data - TODO: fetch from database
  const userData = {
    username: user?.email?.split("@")[0] || "user",
    karma: 1,
    postKarma: 1,
    commentKarma: 0,
    cakeDay: new Date().toLocaleDateString(),
    bio: "",
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person-circle" size={80} color="#ff4500" />
          </View>
          <Text style={styles.username}>u/{userData.username}</Text>
          <View style={styles.karmaContainer}>
            <View style={styles.karmaItem}>
              <Text style={styles.karmaValue}>{userData.karma}</Text>
              <Text style={styles.karmaLabel}>Karma</Text>
            </View>
            <View style={styles.karmaDivider} />
            <View style={styles.karmaItem}>
              <Text style={styles.karmaValue}>{userData.cakeDay}</Text>
              <Text style={styles.karmaLabel}>Cake Day</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push("/settings")}
          >
            <Ionicons name="cog" size={20} color="#1a1a1b" />
            <Text style={styles.editButtonText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "posts" && styles.tabActive]}
          onPress={() => setActiveTab("posts")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "posts" && styles.tabTextActive,
            ]}
          >
            Posts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "comments" && styles.tabActive]}
          onPress={() => setActiveTab("comments")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "comments" && styles.tabTextActive,
            ]}
          >
            Comments
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "about" && styles.tabActive]}
          onPress={() => setActiveTab("about")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "about" && styles.tabTextActive,
            ]}
          >
            About
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === "posts" && (
          <View style={styles.placeholder}>
            <Ionicons name="document-text-outline" size={48} color="#ccc" />
            <Text style={styles.placeholderText}>No posts yet</Text>
          </View>
        )}

        {activeTab === "comments" && (
          <View style={styles.placeholder}>
            <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
            <Text style={styles.placeholderText}>No comments yet</Text>
          </View>
        )}

        {activeTab === "about" && (
          <View style={styles.aboutSection}>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userData.postKarma}</Text>
                <Text style={styles.statLabel}>Post Karma</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userData.commentKarma}</Text>
                <Text style={styles.statLabel}>Comment Karma</Text>
              </View>
            </View>

            <View style={styles.bioSection}>
              <Text style={styles.bioLabel}>Bio</Text>
              <Text style={styles.bioText}>{userData.bio || "No bio yet"}</Text>
            </View>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#fff",
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  profileInfo: {
    alignItems: "center",
  },
  avatar: {
    marginBottom: 12,
  },
  username: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1b",
    marginBottom: 16,
  },
  karmaContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  karmaItem: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  karmaValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1b",
  },
  karmaLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  karmaDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#e0e0e0",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    gap: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1a1a1b",
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#ff4500",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  tabTextActive: {
    color: "#ff4500",
  },
  content: {
    flex: 1,
    minHeight: 300,
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  placeholderText: {
    fontSize: 16,
    color: "#999",
    marginTop: 12,
  },
  aboutSection: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  statItem: {
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    flex: 0.45,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ff4500",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  bioSection: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  bioLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  bioText: {
    fontSize: 16,
    color: "#1a1a1b",
    lineHeight: 22,
  },
  logoutButton: {
    backgroundColor: "#e74c3c",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default function Profile() {
  return (
    <ProtectedRoute>
      <ProfileScreen />
    </ProtectedRoute>
  );
}


