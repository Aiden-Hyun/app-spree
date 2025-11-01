import React from "react";
import {
  FlatList,
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { PostCard } from "./PostCard";

interface Post {
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
}

interface PostListProps {
  posts: Post[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onLoadMore: () => void;
  onVote: (postId: string, voteType: "upvote" | "downvote") => void;
  onSave?: (postId: string) => void;
  hasMore?: boolean;
  emptyMessage?: string;
}

export function PostList({
  posts,
  loading,
  refreshing,
  onRefresh,
  onLoadMore,
  onVote,
  onSave,
  hasMore = true,
  emptyMessage = "No posts found",
}: PostListProps) {
  const renderPost = ({ item }: { item: Post }) => (
    <PostCard {...item} onVote={onVote} onSave={onSave} />
  );

  const renderFooter = () => {
    if (!hasMore) return null;

    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#ff4500" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  };

  return (
    <FlatList
      data={posts}
      renderItem={renderPost}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#ff4500"
        />
      }
      onEndReached={hasMore ? onLoadMore : undefined}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={posts.length === 0 ? styles.emptyList : undefined}
    />
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
  emptyList: {
    flexGrow: 1,
  },
});
