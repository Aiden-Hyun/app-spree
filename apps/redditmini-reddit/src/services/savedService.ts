import { supabase } from "../supabase";
import { SavedItem, Post, Comment } from "../types";

export const savedService = {
  async savePost(postId: string) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("saved_items")
      .insert({
        user_id: user.user.id,
        post_id: postId,
      })
      .select()
      .single();

    if (error && error.code !== "23505") {
      // Ignore duplicate save errors
      throw error;
    }

    return data;
  },

  async unsavePost(postId: string) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("saved_items")
      .delete()
      .eq("user_id", user.user.id)
      .eq("post_id", postId);

    if (error) throw error;
  },

  async saveComment(commentId: string) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("saved_items")
      .insert({
        user_id: user.user.id,
        comment_id: commentId,
      })
      .select()
      .single();

    if (error && error.code !== "23505") {
      // Ignore duplicate save errors
      throw error;
    }

    return data;
  },

  async unsaveComment(commentId: string) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("saved_items")
      .delete()
      .eq("user_id", user.user.id)
      .eq("comment_id", commentId);

    if (error) throw error;
  },

  async fetchSavedItems(filter: "all" | "posts" | "comments" = "all") {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Not authenticated");

    let query = supabase
      .from("saved_items")
      .select(
        `
        *,
        post:posts!saved_items_post_id_fkey (
          *,
          users!posts_user_id_fkey (username),
          subreddits!posts_subreddit_id_fkey (name, display_name)
        ),
        comment:comments!saved_items_comment_id_fkey (
          *,
          users!comments_user_id_fkey (username),
          posts!comments_post_id_fkey (title)
        )
      `
      )
      .eq("user_id", user.user.id)
      .order("saved_at", { ascending: false });

    if (filter === "posts") {
      query = query.not("post_id", "is", null);
    } else if (filter === "comments") {
      query = query.not("comment_id", "is", null);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Transform the data
    const savedItems: SavedItem[] = data.map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      postId: item.post_id,
      commentId: item.comment_id,
      savedAt: item.saved_at,
      post: item.post
        ? {
            ...item.post,
            author: item.post.users?.username || "unknown",
            subreddit: item.post.subreddits?.name || "unknown",
            isSaved: true,
          }
        : undefined,
      comment: item.comment
        ? {
            ...item.comment,
            author: item.comment.users?.username || "unknown",
            postTitle: item.comment.posts?.title || "Unknown Post",
          }
        : undefined,
    }));

    return savedItems;
  },

  async isPostSaved(postId: string): Promise<boolean> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return false;

    const { data, error } = await supabase
      .from("saved_items")
      .select("id")
      .eq("user_id", user.user.id)
      .eq("post_id", postId)
      .single();

    return !!data && !error;
  },

  async isCommentSaved(commentId: string): Promise<boolean> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return false;

    const { data, error } = await supabase
      .from("saved_items")
      .select("id")
      .eq("user_id", user.user.id)
      .eq("comment_id", commentId)
      .single();

    return !!data && !error;
  },
};


