import { supabase } from "../supabase";
import { Post } from "../types";

interface CreatePostData {
  title: string;
  content?: string;
  subredditId: string;
  postType: "text" | "image" | "link";
  url?: string;
  imageUrl?: string;
}

interface FetchPostsOptions {
  subredditId?: string;
  userId?: string;
  sortBy?: "hot" | "new" | "top";
  limit?: number;
  offset?: number;
}

export const postService = {
  async createPost(data: CreatePostData) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Not authenticated");

    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        ...data,
        user_id: user.user.id,
        upvotes: 0,
        downvotes: 0,
        comment_count: 0,
        is_stickied: false,
        is_locked: false,
      })
      .select()
      .single();

    if (error) throw error;
    return post;
  },

  async fetchPosts({
    subredditId,
    userId,
    sortBy = "hot",
    limit = 20,
    offset = 0,
  }: FetchPostsOptions = {}) {
    let query = supabase
      .from("posts")
      .select(
        `
        *,
        users!posts_user_id_fkey (username),
        subreddits!posts_subreddit_id_fkey (name, display_name),
        votes!left (vote_type),
        saved_items!left (id)
      `
      )
      .range(offset, offset + limit - 1);

    // Apply filters
    if (subredditId) {
      query = query.eq("subreddit_id", subredditId);
    }
    if (userId) {
      query = query.eq("user_id", userId);
    }

    // Apply sorting
    switch (sortBy) {
      case "new":
        query = query.order("created_at", { ascending: false });
        break;
      case "top":
        query = query.order("upvotes", { ascending: false });
        break;
      case "hot":
      default:
        // Hot sorting: combination of votes and recency
        // For now, just order by upvotes and created_at
        query = query
          .order("upvotes", { ascending: false })
          .order("created_at", { ascending: false });
        break;
    }

    const { data, error } = await query;
    if (error) throw error;

    // Transform the data to match our Post type
    const posts: Post[] = data.map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      author: item.users?.username || "unknown",
      subredditId: item.subreddit_id,
      subreddit: item.subreddits?.name || "unknown",
      title: item.title,
      content: item.content,
      postType: item.post_type,
      url: item.url,
      imageUrl: item.image_url,
      upvotes: item.upvotes,
      downvotes: item.downvotes,
      commentCount: item.comment_count,
      isStickied: item.is_stickied,
      isLocked: item.is_locked,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      userVote: item.votes?.[0]?.vote_type || null,
      isSaved: !!item.saved_items?.[0],
    }));

    return posts;
  },

  async getPost(postId: string) {
    const { data, error } = await supabase
      .from("posts")
      .select(
        `
        *,
        users!posts_user_id_fkey (username),
        subreddits!posts_subreddit_id_fkey (name, display_name),
        votes!left (vote_type),
        saved_items!left (id)
      `
      )
      .eq("id", postId)
      .single();

    if (error) throw error;

    const post: Post = {
      id: data.id,
      userId: data.user_id,
      author: data.users?.username || "unknown",
      subredditId: data.subreddit_id,
      subreddit: data.subreddits?.name || "unknown",
      title: data.title,
      content: data.content,
      postType: data.post_type,
      url: data.url,
      imageUrl: data.image_url,
      upvotes: data.upvotes,
      downvotes: data.downvotes,
      commentCount: data.comment_count,
      isStickied: data.is_stickied,
      isLocked: data.is_locked,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      userVote: data.votes?.[0]?.vote_type || null,
      isSaved: !!data.saved_items?.[0],
    };

    return post;
  },

  async deletePost(postId: string) {
    const { error } = await supabase.from("posts").delete().eq("id", postId);

    if (error) throw error;
  },

  async searchPosts(query: string) {
    const { data, error } = await supabase
      .from("posts")
      .select(
        `
        *,
        users!posts_user_id_fkey (username),
        subreddits!posts_subreddit_id_fkey (name, display_name),
        votes!left (vote_type),
        saved_items!left (id)
      `
      )
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order("upvotes", { ascending: false })
      .limit(20);

    if (error) throw error;

    // Transform the data to match our Post type
    const posts: Post[] = data.map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      author: item.users?.username || "unknown",
      subredditId: item.subreddit_id,
      subreddit: item.subreddits?.name || "unknown",
      title: item.title,
      content: item.content,
      postType: item.post_type,
      url: item.url,
      imageUrl: item.image_url,
      upvotes: item.upvotes,
      downvotes: item.downvotes,
      commentCount: item.comment_count,
      isStickied: item.is_stickied,
      isLocked: item.is_locked,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      userVote: item.votes?.[0]?.vote_type || null,
      isSaved: !!item.saved_items?.[0],
    }));

    return posts;
  },
};
