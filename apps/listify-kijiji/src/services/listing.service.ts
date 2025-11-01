import { supabase } from "../supabase";

export interface Listing {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  condition: "new" | "like_new" | "good" | "fair" | "poor";
  status: "active" | "sold" | "pending" | "draft";
  location_lat: number | null;
  location_lng: number | null;
  location_name: string | null;
  images: string[];
  is_featured: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
  // Relations
  user?: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    rating: number;
  };
  category?: {
    id: string;
    name: string;
    icon: string | null;
  };
}

export interface CreateListingData {
  category_id: string;
  title: string;
  description?: string;
  price: number;
  condition?: "new" | "like_new" | "good" | "fair" | "poor";
  location_name?: string;
  location_lat?: number;
  location_lng?: number;
  images?: string[];
}

export const listingService = {
  // Get all active listings
  async getListings(options?: {
    category_id?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Listing[]; count: number }> {
    let query = supabase
      .from("listings")
      .select(
        `
        *,
        user:users!user_id(id, email, full_name, avatar_url, rating),
        category:categories!category_id(id, name, icon)
      `,
        { count: "exact" }
      )
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (options?.category_id) {
      query = query.eq("category_id", options.category_id);
    }

    if (options?.search) {
      query = query.or(
        `title.ilike.%${options.search}%,description.ilike.%${options.search}%`
      );
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 10) - 1
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching listings:", error);
      throw error;
    }

    return { data: data || [], count: count || 0 };
  },

  // Get recent listings
  async getRecentListings(limit = 10): Promise<Listing[]> {
    const { data } = await this.getListings({ limit });
    return data;
  },

  // Get listings by category
  async getListingsByCategory(
    categoryId: string,
    limit = 20,
    offset = 0
  ): Promise<{ data: Listing[]; count: number }> {
    return this.getListings({ category_id: categoryId, limit, offset });
  },

  // Get single listing by ID
  async getListingById(id: string): Promise<Listing | null> {
    const { data, error } = await supabase
      .from("listings")
      .select(
        `
        *,
        user:users!user_id(id, email, full_name, avatar_url, rating),
        category:categories!category_id(id, name, icon)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching listing:", error);
      return null;
    }

    // Increment view count
    await supabase
      .from("listings")
      .update({ views_count: (data.views_count || 0) + 1 })
      .eq("id", id);

    return data;
  },

  // Get user's listings
  async getUserListings(userId: string): Promise<Listing[]> {
    const { data, error } = await supabase
      .from("listings")
      .select(
        `
        *,
        category:categories!category_id(id, name, icon)
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user listings:", error);
      throw error;
    }

    return data || [];
  },

  // Create new listing
  async createListing(listingData: CreateListingData): Promise<Listing | null> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("listings")
      .insert({
        ...listingData,
        user_id: userData.user.id,
        condition: listingData.condition || "good",
        images: listingData.images || [],
      })
      .select(
        `
        *,
        user:users!user_id(id, email, full_name, avatar_url, rating),
        category:categories!category_id(id, name, icon)
      `
      )
      .single();

    if (error) {
      console.error("Error creating listing:", error);
      throw error;
    }

    return data;
  },

  // Update listing
  async updateListing(
    id: string,
    updates: Partial<Listing>
  ): Promise<Listing | null> {
    const { data, error } = await supabase
      .from("listings")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(
        `
        *,
        user:users!user_id(id, email, full_name, avatar_url, rating),
        category:categories!category_id(id, name, icon)
      `
      )
      .single();

    if (error) {
      console.error("Error updating listing:", error);
      throw error;
    }

    return data;
  },

  // Delete listing
  async deleteListing(id: string): Promise<boolean> {
    const { error } = await supabase.from("listings").delete().eq("id", id);

    if (error) {
      console.error("Error deleting listing:", error);
      throw error;
    }

    return true;
  },

  // Mark listing as sold
  async markAsSold(id: string): Promise<Listing | null> {
    return this.updateListing(id, { status: "sold" });
  },

  // Search listings
  async searchListings(
    query: string,
    filters?: {
      category_id?: string;
      min_price?: number;
      max_price?: number;
      condition?: string;
      location_name?: string;
      radius_km?: number;
    }
  ): Promise<{ data: Listing[]; count: number }> {
    let dbQuery = supabase
      .from("listings")
      .select(
        `
        *,
        user:users!user_id(id, email, full_name, avatar_url, rating),
        category:categories!category_id(id, name, icon)
      `,
        { count: "exact" }
      )
      .eq("status", "active")
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`);

    if (filters?.category_id) {
      dbQuery = dbQuery.eq("category_id", filters.category_id);
    }

    if (filters?.min_price !== undefined) {
      dbQuery = dbQuery.gte("price", filters.min_price);
    }

    if (filters?.max_price !== undefined) {
      dbQuery = dbQuery.lte("price", filters.max_price);
    }

    if (filters?.condition) {
      dbQuery = dbQuery.eq("condition", filters.condition);
    }

    if (filters?.location_name) {
      dbQuery = dbQuery.ilike("location_name", `%${filters.location_name}%`);
    }

    const { data, error, count } = await dbQuery.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Error searching listings:", error);
      throw error;
    }

    return { data: data || [], count: count || 0 };
  },
};
