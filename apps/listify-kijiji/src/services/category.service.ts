import { supabase } from "../supabase";

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
}

export const categoryService = {
  // Fetch all active categories
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }

    return data || [];
  },

  // Fetch a single category by ID
  async getCategoryById(id: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching category:", error);
      return null;
    }

    return data;
  },

  // Create a new category (admin only)
  async createCategory(
    category: Omit<Category, "id" | "created_at">
  ): Promise<Category | null> {
    const { data, error } = await supabase
      .from("categories")
      .insert(category)
      .select()
      .single();

    if (error) {
      console.error("Error creating category:", error);
      throw error;
    }

    return data;
  },

  // Update a category (admin only)
  async updateCategory(
    id: string,
    updates: Partial<Category>
  ): Promise<Category | null> {
    const { data, error } = await supabase
      .from("categories")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating category:", error);
      throw error;
    }

    return data;
  },
};


