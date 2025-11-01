import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { CommentCard } from "./CommentCard";
import { useComments } from "../../hooks/useComments";
import { useAuth } from "../../contexts/AuthContext";

interface CommentThreadProps {
  postId: string;
}

export function CommentThread({ postId }: CommentThreadProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    comments,
    loading,
    error,
    handleVote,
    createComment,
    deleteComment,
    editComment,
  } = useComments(postId);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      setIsSubmitting(true);
      await createComment(newComment.trim());
      setNewComment("");
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to post comment"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (parentCommentId: string, content: string) => {
    try {
      await createComment(content, parentCommentId);
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to post reply"
      );
    }
  };

  const handleDelete = async (commentId: string) => {
    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteComment(commentId);
            } catch (err) {
              Alert.alert(
                "Error",
                err instanceof Error ? err.message : "Failed to delete comment"
              );
            }
          },
        },
      ]
    );
  };

  const handleEdit = async (commentId: string, content: string) => {
    try {
      await editComment(commentId, content);
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to edit comment"
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#ff4500" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load comments</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {user && (
        <View style={styles.newCommentContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            value={newComment}
            onChangeText={setNewComment}
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!newComment.trim() || isSubmitting) &&
                styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitComment}
            disabled={!newComment.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Comment</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {comments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No comments yet</Text>
          <Text style={styles.emptySubtext}>Be the first to comment!</Text>
        </View>
      ) : (
        <View style={styles.commentsList}>
          {comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              onVote={handleVote}
              onReply={handleReply}
              onDelete={handleDelete}
              onEdit={handleEdit}
              currentUserId={user?.id}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  errorContainer: {
    padding: 20,
    alignItems: "center",
  },
  errorText: {
    fontSize: 14,
    color: "#666",
  },
  newCommentContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  commentInput: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: "#ff4500",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: "flex-end",
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
  },
  commentsList: {
    paddingBottom: 20,
  },
});
