import { supabase } from "../supabase";

export interface Language {
  id: string;
  code: string;
  name: string;
  flag_emoji: string;
  is_active: boolean;
}

export interface UserLanguage {
  id: string;
  user_id: string;
  language_id: string;
  level: number;
  xp: number;
  is_learning: boolean;
  started_at: string;
  language?: Language;
}

export const languageService = {
  // Fetch all active languages
  async getLanguages(): Promise<Language[]> {
    const { data, error } = await supabase
      .from("languages")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) throw error;
    return data || [];
  },

  // Get a single language by ID
  async getLanguageById(id: string): Promise<Language | null> {
    const { data, error } = await supabase
      .from("languages")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  // Get all languages user is learning
  async getUserLanguages(userId: string): Promise<UserLanguage[]> {
    const { data, error } = await supabase
      .from("user_languages")
      .select(
        `
        *,
        language:languages(*)
      `
      )
      .eq("user_id", userId)
      .eq("is_learning", true)
      .order("started_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Start learning a new language
  async startLearningLanguage(
    userId: string,
    languageId: string
  ): Promise<UserLanguage> {
    const { data, error } = await supabase
      .from("user_languages")
      .insert({
        user_id: userId,
        language_id: languageId,
        level: 1,
        xp: 0,
        is_learning: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Stop learning a language (soft delete)
  async stopLearningLanguage(
    userId: string,
    languageId: string
  ): Promise<void> {
    const { error } = await supabase
      .from("user_languages")
      .update({ is_learning: false })
      .eq("user_id", userId)
      .eq("language_id", languageId);

    if (error) throw error;
  },

  // Update user's progress in a language
  async updateLanguageProgress(
    userId: string,
    languageId: string,
    xpToAdd: number
  ): Promise<UserLanguage> {
    // First, get current progress
    const { data: current, error: fetchError } = await supabase
      .from("user_languages")
      .select("*")
      .eq("user_id", userId)
      .eq("language_id", languageId)
      .single();

    if (fetchError) throw fetchError;

    const newXP = (current.xp || 0) + xpToAdd;
    const newLevel = Math.floor(newXP / 100) + 1; // 100 XP per level

    // Update with new values
    const { data, error } = await supabase
      .from("user_languages")
      .update({
        xp: newXP,
        level: newLevel,
      })
      .eq("user_id", userId)
      .eq("language_id", languageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get user's current language (most recently accessed)
  async getCurrentLanguage(userId: string): Promise<UserLanguage | null> {
    const { data, error } = await supabase
      .from("user_languages")
      .select(
        `
        *,
        language:languages(*)
      `
      )
      .eq("user_id", userId)
      .eq("is_learning", true)
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows returned
    return data;
  },
};
