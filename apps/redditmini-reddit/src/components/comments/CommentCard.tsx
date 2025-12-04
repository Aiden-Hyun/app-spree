import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { VoteButtons } from "../common/VoteButtons";
import { router } from "expo-router";
import { Comment } from "../../types";

interface CommentCardProps {
  comment: Comment;
  onVote: (commentId: string, voteType: "upvote" | "downvote") => void;
  onReply: (commentId: string, content: string) => void;
  onDelete?: (commentId: string) => void;
  onEdit?: (commentId: string, content: string) => void;
  currentUserId?: string;
  depth?: number;
}

export function CommentCard({
  comment,
  onVote,
  onReply,
  onDelete,
  onEdit,
  currentUserId,
  depth = 0,
}: CommentCardProps) {
  const [isReplying, setIsReplying] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [replyContent, setReplyContent] = React.useState("");
  const [editContent, setEditContent] = React.useState(comment.content);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const isAuthor = currentUserId === comment.userId;
  const maxDepth = 5; // Limit nesting depth for UI clarity

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

  const handleReply = () => {
    if (replyContent.trim()) {
      onReply(comment.id, replyContent.trim());
      setReplyContent("");
      setIsReplying(false);
    }
  };

  const handleEdit = () => {
    if (editContent.trim() && onEdit) {
      onEdit(comment.id, editContent.trim());
      setIsEditing(false);
    }
  };

  const handleAuthorPress = () => {
    router.push(`/user/${comment.author}`);
  };

  return (
    <View style={[styles.container, { marginLeft: depth * 16 }]}>
      <View style={styles.commentContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleAuthorPress}>
            <Text style={styles.author}>u/{comment.author}</Text>
          </TouchableOpacity>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.time}>{formatTime(comment.createdAt)}</Text>
          {comment.updatedAt !== comment.createdAt && (
            <>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.edited}>edited</Text>
            </>
          )}
        </View>

        {!isCollapsed && (
          <>
            {isEditing ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.editInput}
                  value={editContent}
                  onChangeText={setEditContent}
                  multiline
                  autoFocus
                />
                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={handleEdit}
                  >
                    <Text style={styles.editButtonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setIsEditing(false);
                      setEditContent(comment.content);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={styles.content}>{comment.content}</Text>
            )}

            <View style={styles.footer}>
              <VoteButtons
                upvotes={comment.upvotes}
                downvotes={comment.downvotes}
                userVote={comment.userVote}
                onUpvote={() => onVote(comment.id, "upvote")}
                onDownvote={() => onVote(comment.id, "downvote")}
                horizontal
              />

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setIsReplying(!isReplying)}
              >
                <Ionicons name="chatbubble-outline" size={16} color="#666" />
                <Text style={styles.actionText}>Reply</Text>
              </TouchableOpacity>

              {isAuthor && (
                <>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setIsEditing(true)}
                  >
                    <Ionicons name="create-outline" size={16} color="#666" />
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>

                  {onDelete && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => onDelete(comment.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#666" />
                      <Text style={styles.actionText}>Delete</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>

            {isReplying && (
              <View style={styles.replyContainer}>
                <TextInput
                  style={styles.replyInput}
                  placeholder="Write a reply..."
                  value={replyContent}
                  onChangeText={setReplyContent}
                  multiline
                  autoFocus
                />
                <View style={styles.replyActions}>
                  <TouchableOpacity
                    style={styles.replyButton}
                    onPress={handleReply}
                  >
                    <Text style={styles.replyButtonText}>Reply</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setIsReplying(false);
                      setReplyContent("");
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <TouchableOpacity
            style={styles.collapseButton}
            onPress={() => setIsCollapsed(!isCollapsed)}
          >
            <Ionicons
              name={isCollapsed ? "chevron-forward" : "chevron-down"}
              size={16}
              color="#666"
            />
            <Text style={styles.collapseText}>
              {isCollapsed
                ? `${comment.replies.length} ${
                    comment.replies.length === 1 ? "reply" : "replies"
                  }`
                : "Collapse"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {!isCollapsed &&
        comment.replies &&
        comment.replies.map((reply) => (
          <CommentCard
            key={reply.id}
            comment={reply}
            onVote={onVote}
            onReply={onReply}
            onDelete={onDelete}
            onEdit={onEdit}
            currentUserId={currentUserId}
            depth={depth < maxDepth ? depth + 1 : depth}
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  commentContent: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  author: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1a1a1b",
  },
  time: {
    fontSize: 12,
    color: "#666",
  },
  edited: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  dot: {
    marginHorizontal: 4,
    color: "#666",
    fontSize: 12,
  },
  content: {
    fontSize: 14,
    color: "#1a1a1b",
    lineHeight: 20,
    marginBottom: 8,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  replyContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 12,
  },
  replyInput: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: "top",
  },
  replyActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  replyButton: {
    backgroundColor: "#ff4500",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  replyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 14,
  },
  editContainer: {
    marginBottom: 8,
  },
  editInput: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: "top",
  },
  editActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  editButton: {
    backgroundColor: "#ff4500",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  collapseButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    paddingVertical: 4,
  },
  collapseText: {
    fontSize: 12,
    color: "#666",
  },
});


