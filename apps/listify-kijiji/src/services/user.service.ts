import { supabase } from "../supabase";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  location_lat: number | null;
  location_lng: number | null;
  location_name: string | null;
  rating: number;
  total_reviews: number;
  preferences: any;
  created_at: string;
}

export const userService = {
  // Get user profile by ID
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }

    return data;
  },

  // Update current user's profile
  async updateProfile(
    updates: Partial<Omit<UserProfile, "id" | "created_at">>
  ): Promise<UserProfile | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      throw error;
    }

    return data;
  },

  // Get user's reviews
  async getUserReviews(userId: string) {
    const { data, error } = await supabase
      .from("reviews")
      .select(
        `
        *,
        reviewer:users!reviewer_id(id, email, full_name, avatar_url),
        listing:listings!listing_id(id, title)
      `
      )
      .eq("reviewee_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reviews:", error);
      throw error;
    }

    return data || [];
  },

  // Create a review
  async createReview(review: {
    reviewee_id: string;
    listing_id: string;
    rating: number;
    comment?: string;
  }) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("reviews")
      .insert({
        ...review,
        reviewer_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating review:", error);
      throw error;
    }

    // Update user's rating
    await this.updateUserRating(review.reviewee_id);

    return data;
  },

  // Update user's average rating
  async updateUserRating(userId: string) {
    const { data: reviews } = await supabase
      .from("reviews")
      .select("rating")
      .eq("reviewee_id", userId);

    if (reviews && reviews.length > 0) {
      const avgRating =
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

      await supabase
        .from("users")
        .update({
          rating: Number(avgRating.toFixed(1)),
          total_reviews: reviews.length,
        })
        .eq("id", userId);
    }
  },

  // Ensure user exists in users table (called after signup)
  async ensureUserExists(userId: string, email: string) {
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    if (!existing) {
      await supabase.from("users").insert({
        id: userId,
        email: email,
      });
    }
  },
};


