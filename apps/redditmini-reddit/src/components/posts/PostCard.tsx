import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { VoteButtons } from "../common/VoteButtons";
import { router } from "expo-router";

interface PostCardProps {
  id: string;
  title: string;
  content?: string;
  author: string;
  subreddit: string;
  subredditId: string;
  postType: "text" | "image" | "link";
  imageUrl?: string;
  linkUrl?: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  createdAt: string;
  userVote?: "upvote" | "downvote" | null;
  isSaved?: boolean;
  onVote: (postId: string, voteType: "upvote" | "downvote") => void;
  onSave?: (postId: string) => void;
}

export function PostCard({
  id,
  title,
  content,
  author,
  subreddit,
  subredditId,
  postType,
  imageUrl,
  linkUrl,
  upvotes,
  downvotes,
  commentCount,
  createdAt,
  userVote,
  isSaved = false,
  onVote,
  onSave,
}: PostCardProps) {
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

  const handlePostPress = () => {
    router.push(`/post/${id}`);
  };

  const handleSubredditPress = () => {
    router.push(`/subreddit/${subredditId}`);
  };

  const handleAuthorPress = () => {
    router.push(`/user/${author}`);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePostPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSubredditPress}>
            <Text style={styles.subreddit}>r/{subreddit}</Text>
          </TouchableOpacity>
          <Text style={styles.dot}>•</Text>
          <TouchableOpacity onPress={handleAuthorPress}>
            <Text style={styles.author}>u/{author}</Text>
          </TouchableOpacity>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.time}>{formatTime(createdAt)}</Text>
        </View>

        <Text style={styles.title} numberOfLines={3}>
          {title}
        </Text>

        {postType === "text" && content && (
          <Text style={styles.textContent} numberOfLines={4}>
            {content}
          </Text>
        )}

        {postType === "image" && imageUrl && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUrl }} style={styles.image} />
          </View>
        )}

        {postType === "link" && linkUrl && (
          <View style={styles.linkContainer}>
            <Ionicons name="link" size={16} color="#666" />
            <Text style={styles.linkText} numberOfLines={1}>
              {linkUrl}
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <VoteButtons
            upvotes={upvotes}
            downvotes={downvotes}
            userVote={userVote}
            onUpvote={() => onVote(id, "upvote")}
            onDownvote={() => onVote(id, "downvote")}
            horizontal
          />

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handlePostPress}
          >
            <Ionicons name="chatbubble-outline" size={18} color="#666" />
            <Text style={styles.actionText}>{commentCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" size={18} color="#666" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>

          {onSave && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onSave(id)}
            >
              <Ionicons
                name={isSaved ? "bookmark" : "bookmark-outline"}
                size={18}
                color={isSaved ? "#ff4500" : "#666"}
              />
              <Text style={[styles.actionText, isSaved && styles.savedText]}>
                Save
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  content: {
    padding: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  subreddit: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1a1a1b",
  },
  author: {
    fontSize: 12,
    color: "#666",
  },
  time: {
    fontSize: 12,
    color: "#666",
  },
  dot: {
    marginHorizontal: 4,
    color: "#666",
    fontSize: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1b",
    marginBottom: 8,
    lineHeight: 20,
  },
  textContent: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
    marginBottom: 12,
  },
  imageContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  linkContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    color: "#0079d3",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
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
  savedText: {
    color: "#ff4500",
  },
});
