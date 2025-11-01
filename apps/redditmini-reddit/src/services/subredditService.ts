import { supabase } from "../supabase";
import { Subreddit } from "../types";

interface CreateSubredditData {
  name: string;
  displayName: string;
  description?: string;
  rules?: string;
}

export const subredditService = {
  async createSubreddit(data: CreateSubredditData) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Not authenticated");

    // Validate subreddit name (alphanumeric and underscores only)
    if (!/^[a-zA-Z0-9_]+$/.test(data.name)) {
      throw new Error(
        "Subreddit name can only contain letters, numbers, and underscores"
      );
    }

    const { data: subreddit, error } = await supabase
      .from("subreddits")
      .insert({
        ...data,
        created_by: user.user.id,
        subscriber_count: 1, // Creator is automatically subscribed
        is_private: false,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("A subreddit with this name already exists");
      }
      throw error;
    }

    // Auto-subscribe creator
    await subredditService.subscribe(subreddit.id);

    return subreddit;
  },

  async fetchSubreddits({
    limit = 20,
    offset = 0,
    orderBy = "subscriber_count",
  }: {
    limit?: number;
    offset?: number;
    orderBy?: "subscriber_count" | "created_at" | "name";
  } = {}) {
    const { data, error } = await supabase
      .from("subreddits")
      .select("*")
      .eq("is_private", false)
      .order(orderBy, { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data as Subreddit[];
  },

  async getSubreddit(id: string) {
    const { data, error } = await supabase
      .from("subreddits")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Subreddit;
  },

  async getSubredditByName(name: string) {
    const { data, error } = await supabase
      .from("subreddits")
      .select("*")
      .eq("name", name)
      .single();

    if (error) throw error;
    return data as Subreddit;
  },

  async searchSubreddits(query: string) {
    const { data, error } = await supabase
      .from("subreddits")
      .select("*")
      .eq("is_private", false)
      .or(
        `name.ilike.%${query}%,display_name.ilike.%${query}%,description.ilike.%${query}%`
      )
      .order("subscriber_count", { ascending: false })
      .limit(10);

    if (error) throw error;
    return data as Subreddit[];
  },

  async subscribe(subredditId: string) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Not authenticated");

    const { error } = await supabase.from("subscriptions").insert({
      user_id: user.user.id,
      subreddit_id: subredditId,
    });

    if (error && error.code !== "23505") {
      // Ignore duplicate subscription errors
      throw error;
    }
  },

  async unsubscribe(subredditId: string) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("subscriptions")
      .delete()
      .eq("user_id", user.user.id)
      .eq("subreddit_id", subredditId);

    if (error) throw error;
  },

  async isSubscribed(subredditId: string): Promise<boolean> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return false;

    const { data, error } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.user.id)
      .eq("subreddit_id", subredditId)
      .single();

    return !!data && !error;
  },

  async getUserSubscriptions() {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("subscriptions")
      .select(
        `
        subreddit:subreddits(*)
      `
      )
      .eq("user_id", user.user.id)
      .order("subscribed_at", { ascending: false });

    if (error) throw error;
    return data.map((item) => item.subreddit) as Subreddit[];
  },
};
