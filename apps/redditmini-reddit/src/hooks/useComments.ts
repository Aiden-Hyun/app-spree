import { useState, useEffect, useCallback } from "react";
import { commentService } from "../services/commentService";
import { voteService } from "../services/voteService";
import { Comment } from "../types";
import { useAuth } from "../contexts/AuthContext";

export function useComments(postId: string) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await commentService.fetchComments(postId);
      setComments(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch comments");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const handleVote = useCallback(
    async (commentId: string, voteType: "upvote" | "downvote") => {
      try {
        // Optimistic update
        const updateCommentVote = (comment: Comment): Comment => {
          if (comment.id !== commentId) {
            return {
              ...comment,
              replies: comment.replies?.map(updateCommentVote),
            };
          }

          const currentVote = comment.userVote;
          let newUpvotes = comment.upvotes;
          let newDownvotes = comment.downvotes;
          let newUserVote: typeof comment.userVote = voteType;

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
            ...comment,
            upvotes: newUpvotes,
            downvotes: newDownvotes,
            userVote: newUserVote,
            replies: comment.replies?.map(updateCommentVote),
          };
        };

        setComments((prevComments) => prevComments.map(updateCommentVote));

        // Make API call
        await voteService.voteOnComment(commentId, voteType);
      } catch (err) {
        // Revert on error
        fetchComments();
        throw err;
      }
    },
    [fetchComments]
  );

  const createComment = useCallback(
    async (content: string, parentCommentId?: string) => {
      if (!user) throw new Error("Must be logged in to comment");

      try {
        const newComment = await commentService.createComment({
          postId,
          content,
          parentCommentId,
        });

        // Refresh comments to get the properly nested structure
        await fetchComments();
        return newComment;
      } catch (err) {
        throw err;
      }
    },
    [postId, user, fetchComments]
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      try {
        await commentService.deleteComment(commentId);
        // Refresh comments
        await fetchComments();
      } catch (err) {
        throw err;
      }
    },
    [fetchComments]
  );

  const editComment = useCallback(
    async (commentId: string, content: string) => {
      try {
        await commentService.editComment(commentId, content);
        // Update local state
        const updateCommentContent = (comment: Comment): Comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              content,
              updatedAt: new Date().toISOString(),
            };
          }
          return {
            ...comment,
            replies: comment.replies?.map(updateCommentContent),
          };
        };

        setComments((prevComments) => prevComments.map(updateCommentContent));
      } catch (err) {
        throw err;
      }
    },
    []
  );

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return {
    comments,
    loading,
    error,
    refresh: fetchComments,
    handleVote,
    createComment,
    deleteComment,
    editComment,
  };
}


