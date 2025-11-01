import { useState, useEffect, useCallback } from "react";
import { postService } from "../services/postService";
import { voteService } from "../services/voteService";
import { savedService } from "../services/savedService";
import { Post } from "../types";

interface UsePostsOptions {
  subredditId?: string;
  userId?: string;
  sortBy?: "hot" | "new" | "top";
}

export function usePosts(options: UsePostsOptions = {}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
          setOffset(0);
        } else {
          setLoading(true);
        }

        const newPosts = await postService.fetchPosts({
          ...options,
          offset: isRefresh ? 0 : offset,
          limit: 20,
        });

        if (isRefresh) {
          setPosts(newPosts);
          setOffset(20);
          setHasMore(newPosts.length === 20);
        } else {
          setPosts((prev) => [...prev, ...newPosts]);
          setOffset((prev) => prev + 20);
          setHasMore(newPosts.length === 20);
        }

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch posts");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [options, offset]
  );

  const handleVote = useCallback(
    async (postId: string, voteType: "upvote" | "downvote") => {
      try {
        // Optimistic update
        setPosts((prevPosts) =>
          prevPosts.map((post) => {
            if (post.id !== postId) return post;

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
              ...post,
              upvotes: newUpvotes,
              downvotes: newDownvotes,
              userVote: newUserVote,
            };
          })
        );

        // Make API call
        await voteService.voteOnPost(postId, voteType);
      } catch (err) {
        // Revert on error
        fetchPosts(true);
        throw err;
      }
    },
    [fetchPosts]
  );

  const handleSave = useCallback(
    async (postId: string) => {
      try {
        // Find the current save state
        const post = posts.find((p) => p.id === postId);
        if (!post) return;

        // Optimistic update
        setPosts((prevPosts) =>
          prevPosts.map((p) =>
            p.id === postId ? { ...p, isSaved: !p.isSaved } : p
          )
        );

        // Make API call
        if (post.isSaved) {
          await savedService.unsavePost(postId);
        } else {
          await savedService.savePost(postId);
        }
      } catch (err) {
        // Revert on error
        setPosts((prevPosts) =>
          prevPosts.map((p) =>
            p.id === postId ? { ...p, isSaved: !p.isSaved } : p
          )
        );
        throw err;
      }
    },
    [posts]
  );

  const refresh = useCallback(() => {
    fetchPosts(true);
  }, [fetchPosts]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchPosts(false);
    }
  }, [loading, hasMore, fetchPosts]);

  useEffect(() => {
    fetchPosts(true);
  }, [options.subredditId, options.userId, options.sortBy]);

  return {
    posts,
    loading,
    refreshing,
    hasMore,
    error,
    refresh,
    loadMore,
    handleVote,
    handleSave,
  };
}
