import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../../src/contexts/AuthContext";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { PostCard } from "../../src/components/posts/PostCard";
import { useSaved } from "../../src/hooks/useSaved";
import { Ionicons } from "@expo/vector-icons";
import { SavedItem } from "../../src/types";

function SavedScreen() {
  const { user } = useAuth();
  const [filter, setFilter] = React.useState<"all" | "posts" | "comments">(
    "all"
  );

  const {
    savedItems,
    loading,
    refreshing,
    refresh,
    handleVoteOnPost,
    handleUnsavePost,
    handleUnsaveComment,
  } = useSaved(filter);

  const renderSavedItem = ({ item }: { item: SavedItem }) => {
    if (item.post) {
      return (
        <PostCard
          {...item.post}
          onVote={handleVoteOnPost}
          onSave={handleUnsavePost}
        />
      );
    } else if (item.comment) {
      // For now, just show a placeholder for comments
      return (
        <View style={styles.commentItem}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentAuthor}>u/{item.comment.author}</Text>
            <Text style={styles.commentPost}>
              on "{item.comment.postTitle}"
            </Text>
          </View>
          <Text style={styles.commentContent} numberOfLines={3}>
            {item.comment.content}
          </Text>
          <TouchableOpacity
            style={styles.unsaveButton}
            onPress={() => handleUnsaveComment(item.comment!.id)}
          >
            <Ionicons name="bookmark" size={16} color="#ff4500" />
            <Text style={styles.unsaveText}>Unsave</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved</Text>
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === "all" && styles.filterButtonActive,
            ]}
            onPress={() => setFilter("all")}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === "all" && styles.filterButtonTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === "posts" && styles.filterButtonActive,
            ]}
            onPress={() => setFilter("posts")}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === "posts" && styles.filterButtonTextActive,
              ]}
            >
              Posts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === "comments" && styles.filterButtonActive,
            ]}
            onPress={() => setFilter("comments")}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === "comments" && styles.filterButtonTextActive,
              ]}
            >
              Comments
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff4500" />
        </View>
      ) : savedItems.length === 0 ? (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor="#ff4500"
            />
          }
        >
          <View style={styles.placeholder}>
            <Ionicons name="bookmark-outline" size={48} color="#ccc" />
            <Text style={styles.placeholderText}>No saved items</Text>
            <Text style={styles.placeholderSubtext}>
              Posts and comments you save will appear here
            </Text>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={savedItems}
          renderItem={renderSavedItem}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={refresh}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  filterButtons: {
    flexDirection: "row",
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  filterButtonActive: {
    backgroundColor: "#ffe4dc",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  filterButtonTextActive: {
    color: "#ff4500",
  },
  content: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingVertical: 8,
  },
  commentItem: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1a1a1b",
  },
  commentPost: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  commentContent: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
    marginBottom: 8,
  },
  unsaveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
  },
  unsaveText: {
    fontSize: 12,
    color: "#ff4500",
    fontWeight: "500",
  },
});

export default function Saved() {
  return (
    <ProtectedRoute>
      <SavedScreen />
    </ProtectedRoute>
  );
}
