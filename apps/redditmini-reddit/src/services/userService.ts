import { supabase } from "../supabase";
import { User } from "../types";

export const userService = {
  async createUserProfile(userId: string, username: string, email: string) {
    const { data, error } = await supabase
      .from("users")
      .insert({
        id: userId,
        username,
        email,
        karma: 0,
        cake_day: new Date().toISOString().split("T")[0],
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data as User;
  },

  async getUserProfileByUsername(username: string) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .single();

    if (error) throw error;
    return data as User;
  },

  async updateUserProfile(
    userId: string,
    updates: {
      fullName?: string;
      bio?: string;
      avatarUrl?: string;
      preferences?: Record<string, any>;
    }
  ) {
    const { data, error } = await supabase
      .from("users")
      .update({
        full_name: updates.fullName,
        bio: updates.bio,
        avatar_url: updates.avatarUrl,
        preferences: updates.preferences,
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data as User;
  },

  async calculateUserKarma(userId: string) {
    const { data, error } = await supabase.rpc("calculate_user_karma", {
      user_id: userId,
    });

    if (error) throw error;
    return data as number;
  },

  async updateUserKarma(userId: string) {
    const karma = await this.calculateUserKarma(userId);

    const { error } = await supabase
      .from("users")
      .update({ karma })
      .eq("id", userId);

    if (error) throw error;
    return karma;
  },
};


