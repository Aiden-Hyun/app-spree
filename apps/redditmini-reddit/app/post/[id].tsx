import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { VoteButtons } from "../../src/components/common/VoteButtons";
import { Ionicons } from "@expo/vector-icons";
import { postService } from "../../src/services/postService";
import { voteService } from "../../src/services/voteService";
import { Post } from "../../src/types";
import { CommentThread } from "../../src/components/comments/CommentThread";

function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [post, setPost] = React.useState<Post | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const data = await postService.getPost(id);
      setPost(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load post");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (voteType: "upvote" | "downvote") => {
    if (!post) return;

    try {
      // Optimistic update
      const currentVote = post.userVote;
      let newUpvotes = post.upvotes;
      let newDownvotes = post.downvotes;
      let newUserVote: typeof post.userVote = voteType;

      // Remove previous vote
      if (currentVote === "upvote") {
        newUpvotes--;
      } else if (currentVote === "downvote") {
        newDownvotes--;
      }

      // Add new vote or remove if same
      if (currentVote === voteType) {
        newUserVote = null;
      } else if (voteType === "upvote") {
        newUpvotes++;
      } else {
        newDownvotes++;
      }

      setPost({
        ...post,
        upvotes: newUpvotes,
        downvotes: newDownvotes,
        userVote: newUserVote,
      });

      await voteService.voteOnPost(id, voteType);
    } catch (err) {
      // Revert on error
      fetchPost();
    }
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff4500" />
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || "Post not found"}</Text>
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
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.push(`/subreddit/${post.subredditId}`)}
          >
            <Text style={styles.subreddit}>r/{post.subreddit}</Text>
          </TouchableOpacity>
          <Text style={styles.dot}>•</Text>
          <TouchableOpacity onPress={() => router.push(`/user/${post.author}`)}>
            <Text style={styles.author}>u/{post.author}</Text>
          </TouchableOpacity>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.time}>{formatTime(post.createdAt)}</Text>
        </View>

        <Text style={styles.title}>{post.title}</Text>

        {post.postType === "text" && post.content && (
          <Text style={styles.textContent}>{post.content}</Text>
        )}

        <View style={styles.footer}>
          <VoteButtons
            upvotes={post.upvotes}
            downvotes={post.downvotes}
            userVote={post.userVote}
            onUpvote={() => handleVote("upvote")}
            onDownvote={() => handleVote("downvote")}
            horizontal
          />

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={18} color="#666" />
            <Text style={styles.actionText}>{post.commentCount} Comments</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" size={18} color="#666" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons
              name={post.isSaved ? "bookmark" : "bookmark-outline"}
              size={18}
              color={post.isSaved ? "#ff4500" : "#666"}
            />
            <Text style={[styles.actionText, post.isSaved && styles.savedText]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.commentsSection}>
        <Text style={styles.commentsTitle}>Comments</Text>
        <CommentThread postId={id} />
      </View>
    </ScrollView>
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
  content: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  subreddit: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1b",
  },
  author: {
    fontSize: 14,
    color: "#666",
  },
  time: {
    fontSize: 14,
    color: "#666",
  },
  dot: {
    marginHorizontal: 4,
    color: "#666",
    fontSize: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1b",
    marginBottom: 12,
    lineHeight: 26,
  },
  textContent: {
    fontSize: 16,
    color: "#444",
    lineHeight: 24,
    marginBottom: 16,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  savedText: {
    color: "#ff4500",
  },
  commentsSection: {
    backgroundColor: "#fff",
    padding: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1b",
    marginBottom: 16,
  },
  commentPlaceholder: {
    padding: 40,
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 14,
    color: "#999",
  },
});

export default function PostDetail() {
  return (
    <ProtectedRoute>
      <PostDetailScreen />
    </ProtectedRoute>
  );
}
