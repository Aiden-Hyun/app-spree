import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useAuth } from "../../src/contexts/AuthContext";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { PostList } from "../../src/components/posts/PostList";
import { usePosts } from "../../src/hooks/usePosts";
import { Ionicons } from "@expo/vector-icons";

function FeedScreen() {
  const { user } = useAuth();
  const [sortBy, setSortBy] = React.useState<"hot" | "new" | "top">("hot");

  const {
    posts,
    loading,
    refreshing,
    hasMore,
    refresh,
    loadMore,
    handleVote,
    handleSave,
  } = usePosts({ sortBy });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Popular</Text>
        <View style={styles.sortButtons}>
          <TouchableOpacity
            style={[
              styles.sortButton,
              sortBy === "hot" && styles.sortButtonActive,
            ]}
            onPress={() => setSortBy("hot")}
          >
            <Ionicons
              name="flame"
              size={16}
              color={sortBy === "hot" ? "#ff4500" : "#666"}
            />
            <Text
              style={[
                styles.sortButtonText,
                sortBy === "hot" && styles.sortButtonTextActive,
              ]}
            >
              Hot
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sortButton,
              sortBy === "new" && styles.sortButtonActive,
            ]}
            onPress={() => setSortBy("new")}
          >
            <Ionicons
              name="sparkles"
              size={16}
              color={sortBy === "new" ? "#ff4500" : "#666"}
            />
            <Text
              style={[
                styles.sortButtonText,
                sortBy === "new" && styles.sortButtonTextActive,
              ]}
            >
              New
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sortButton,
              sortBy === "top" && styles.sortButtonActive,
            ]}
            onPress={() => setSortBy("top")}
          >
            <Ionicons
              name="trending-up"
              size={16}
              color={sortBy === "top" ? "#ff4500" : "#666"}
            />
            <Text
              style={[
                styles.sortButtonText,
                sortBy === "top" && styles.sortButtonTextActive,
              ]}
            >
              Top
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <PostList
        posts={posts}
        loading={loading}
        refreshing={refreshing}
        onRefresh={refresh}
        onLoadMore={loadMore}
        onVote={handleVote}
        onSave={handleSave}
        hasMore={hasMore}
        emptyMessage="No posts yet. Be the first to post!"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#1a1a1b",
  },
  sortButtons: {
    flexDirection: "row",
    gap: 12,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    gap: 4,
  },
  sortButtonActive: {
    backgroundColor: "#ffe4dc",
  },
  sortButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  sortButtonTextActive: {
    color: "#ff4500",
  },
});

export default function Feed() {
  return (
    <ProtectedRoute>
      <FeedScreen />
    </ProtectedRoute>
  );
}
