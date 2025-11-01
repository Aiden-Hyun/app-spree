import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { PostList } from "../../src/components/posts/PostList";
import { usePosts } from "../../src/hooks/usePosts";
import { Ionicons } from "@expo/vector-icons";
import { userService } from "../../src/services/userService";

interface UserProfile {
  id: string;
  username: string;
  fullName?: string;
  bio?: string;
  karma: number;
  cakeDay: string;
}

function UserProfileScreen() {
  const { id: username } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(
    null
  );
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<
    "posts" | "comments" | "about"
  >("posts");

  const isOwnProfile = currentUser?.email?.split("@")[0] === username;

  // For now, we'll use mock data since we don't have a complete user profile system
  React.useEffect(() => {
    fetchUserProfile();
  }, [username]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const profile = await userService.getUserProfileByUsername(
        username || ""
      );

      // Update karma
      const karma = await userService.updateUserKarma(profile.id);

      setUserProfile({
        id: profile.id,
        username: profile.username,
        fullName: profile.fullName,
        bio: profile.bio,
        karma: karma,
        cakeDay: new Date(profile.cakeDay).toLocaleDateString(),
      });
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const {
    posts,
    loading: postsLoading,
    refreshing,
    hasMore,
    refresh,
    loadMore,
    handleVote,
    handleSave,
  } = usePosts({ userId: userProfile?.id });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff4500" />
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>User not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.profileInfo}>
            <View style={styles.avatar}>
              <Ionicons name="person-circle" size={80} color="#ff4500" />
            </View>
            <Text style={styles.username}>u/{userProfile.username}</Text>
            <View style={styles.karmaContainer}>
              <View style={styles.karmaItem}>
                <Text style={styles.karmaValue}>{userProfile.karma}</Text>
                <Text style={styles.karmaLabel}>Karma</Text>
              </View>
              <View style={styles.karmaDivider} />
              <View style={styles.karmaItem}>
                <Text style={styles.karmaValue}>{userProfile.cakeDay}</Text>
                <Text style={styles.karmaLabel}>Cake Day</Text>
              </View>
            </View>
          </View>

          {isOwnProfile && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => router.push("/settings")}
              >
                <Ionicons name="cog" size={20} color="#1a1a1b" />
                <Text style={styles.editButtonText}>Settings</Text>
              </TouchableOpacity>
            </View>
          )}
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
      </ScrollView>

      <View style={styles.content}>
        {activeTab === "posts" && (
          <PostList
            posts={posts}
            loading={postsLoading}
            refreshing={refreshing}
            onRefresh={refresh}
            onLoadMore={loadMore}
            onVote={handleVote}
            onSave={handleSave}
            hasMore={hasMore}
            emptyMessage={`u/${userProfile.username} hasn't posted yet`}
          />
        )}

        {activeTab === "comments" && (
          <View style={styles.placeholder}>
            <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
            <Text style={styles.placeholderText}>No comments yet</Text>
          </View>
        )}

        {activeTab === "about" && (
          <View style={styles.aboutSection}>
            <View style={styles.bioSection}>
              <Text style={styles.bioLabel}>Bio</Text>
              <Text style={styles.bioText}>
                {userProfile.bio || "No bio yet"}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: "#ff4500",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
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
  bioSection: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
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
});

export default function UserProfile() {
  return (
    <ProtectedRoute>
      <UserProfileScreen />
    </ProtectedRoute>
  );
}
