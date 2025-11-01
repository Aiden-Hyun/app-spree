import { supabase } from "../supabase";
import { Listing } from "./listing.service";

export interface Favorite {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
}

export const favoritesService = {
  // Get all favorites for current user
  async getUserFavorites(): Promise<Listing[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("favorites")
      .select(
        `
        listing_id,
        listings (
          *,
          user:users!user_id(id, email, full_name, avatar_url, rating),
          category:categories!category_id(id, name, icon)
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching favorites:", error);
      throw error;
    }

    // Extract listings from the nested structure
    return (data || []).map((fav: any) => fav.listings).filter(Boolean);
  },

  // Check if listing is favorited
  async isFavorite(listingId: string): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("listing_id", listingId)
      .single();

    return !error && !!data;
  },

  // Add listing to favorites
  async addFavorite(listingId: string): Promise<Favorite | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Check if already favorited
    const { data: existing } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("listing_id", listingId)
      .single();

    if (existing) {
      return existing;
    }

    const { data, error } = await supabase
      .from("favorites")
      .insert({
        user_id: user.id,
        listing_id: listingId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding favorite:", error);
      throw error;
    }

    return data;
  },

  // Remove listing from favorites
  async removeFavorite(listingId: string): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("listing_id", listingId);

    if (error) {
      console.error("Error removing favorite:", error);
      throw error;
    }

    return true;
  },

  // Toggle favorite status
  async toggleFavorite(listingId: string): Promise<boolean> {
    const isFav = await this.isFavorite(listingId);

    if (isFav) {
      await this.removeFavorite(listingId);
      return false;
    } else {
      await this.addFavorite(listingId);
      return true;
    }
  },

  // Get favorite count for user
  async getFavoriteCount(): Promise<number> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
      .from("favorites")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (error) {
      console.error("Error counting favorites:", error);
      return 0;
    }

    return count || 0;
  },
};
