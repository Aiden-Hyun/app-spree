import { useState, useEffect, useCallback } from "react";
import { savedService } from "../services/savedService";
import { voteService } from "../services/voteService";
import { SavedItem, Post } from "../types";

export function useSaved(filter: "all" | "posts" | "comments" = "all") {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSavedItems = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const items = await savedService.fetchSavedItems(filter);
        setSavedItems(items);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch saved items"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filter]
  );

  const handleVoteOnPost = useCallback(
    async (postId: string, voteType: "upvote" | "downvote") => {
      try {
        // Optimistic update
        setSavedItems((prevItems) =>
          prevItems.map((item) => {
            if (item.post && item.post.id === postId) {
              const post = item.post;
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

              return {
                ...item,
                post: {
                  ...post,
                  upvotes: newUpvotes,
                  downvotes: newDownvotes,
                  userVote: newUserVote,
                },
              };
            }
            return item;
          })
        );

        // Make API call
        await voteService.voteOnPost(postId, voteType);
      } catch (err) {
        // Revert on error
        fetchSavedItems(true);
        throw err;
      }
    },
    [fetchSavedItems]
  );

  const handleUnsavePost = useCallback(
    async (postId: string) => {
      try {
        // Optimistic update
        setSavedItems((prevItems) =>
          prevItems.filter((item) => item.postId !== postId)
        );

        // Make API call
        await savedService.unsavePost(postId);
      } catch (err) {
        // Revert on error
        fetchSavedItems(true);
        throw err;
      }
    },
    [fetchSavedItems]
  );

  const handleUnsaveComment = useCallback(
    async (commentId: string) => {
      try {
        // Optimistic update
        setSavedItems((prevItems) =>
          prevItems.filter((item) => item.commentId !== commentId)
        );

        // Make API call
        await savedService.unsaveComment(commentId);
      } catch (err) {
        // Revert on error
        fetchSavedItems(true);
        throw err;
      }
    },
    [fetchSavedItems]
  );

  const refresh = useCallback(() => {
    fetchSavedItems(true);
  }, [fetchSavedItems]);

  useEffect(() => {
    fetchSavedItems();
  }, [filter]);

  return {
    savedItems,
    loading,
    refreshing,
    error,
    refresh,
    handleVoteOnPost,
    handleUnsavePost,
    handleUnsaveComment,
  };
}


