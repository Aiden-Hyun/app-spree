import { supabase } from "../supabase";
import { Comment } from "../types";

interface CreateCommentData {
  postId: string;
  content: string;
  parentCommentId?: string;
}

export const commentService = {
  async createComment(data: CreateCommentData) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Not authenticated");

    const { data: comment, error } = await supabase
      .from("comments")
      .insert({
        ...data,
        user_id: user.user.id,
        upvotes: 0,
        downvotes: 0,
        is_deleted: false,
      })
      .select()
      .single();

    if (error) throw error;
    return comment;
  },

  async fetchComments(postId: string) {
    const { data, error } = await supabase
      .from("comments")
      .select(
        `
        *,
        users!comments_user_id_fkey (username),
        votes!left (vote_type)
      `
      )
      .eq("post_id", postId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Transform the data to match our Comment type
    const comments: Comment[] = data.map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      author: item.users?.username || "unknown",
      postId: item.post_id,
      parentCommentId: item.parent_comment_id,
      content: item.content,
      upvotes: item.upvotes,
      downvotes: item.downvotes,
      isDeleted: item.is_deleted,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      userVote: item.votes?.[0]?.vote_type || null,
    }));

    // Build comment tree
    return this.buildCommentTree(comments);
  },

  buildCommentTree(comments: Comment[]): Comment[] {
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // First pass: create a map of all comments
    comments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build the tree structure
    comments.forEach((comment) => {
      const mappedComment = commentMap.get(comment.id)!;
      if (comment.parentCommentId) {
        const parent = commentMap.get(comment.parentCommentId);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(mappedComment);
        }
      } else {
        rootComments.push(mappedComment);
      }
    });

    return rootComments;
  },

  async deleteComment(commentId: string) {
    const { error } = await supabase
      .from("comments")
      .update({ is_deleted: true, content: "[deleted]" })
      .eq("id", commentId);

    if (error) throw error;
  },

  async editComment(commentId: string, content: string) {
    const { data, error } = await supabase
      .from("comments")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", commentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
