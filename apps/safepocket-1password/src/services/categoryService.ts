import { supabase } from "../supabase";

export interface CategoryData {
  id?: string;
  userId: string;
  name: string;
  color: string;
  icon?: string;
  createdAt?: string;
}

export class CategoryService {
  // Create default categories for new users
  async createDefaultCategories(userId: string): Promise<void> {
    const defaultCategories: Omit<
      CategoryData,
      "id" | "createdAt" | "userId"
    >[] = [
      { name: "Personal", color: "#0984e3", icon: "👤" },
      { name: "Work", color: "#00b894", icon: "💼" },
      { name: "Finance", color: "#fdcb6e", icon: "💰" },
      { name: "Social", color: "#e17055", icon: "💬" },
      { name: "Shopping", color: "#a29bfe", icon: "🛍️" },
    ];

    try {
      const categories = defaultCategories.map((cat) => ({
        ...cat,
        user_id: userId,
      }));

      await supabase.from("password_categories").insert(categories);
    } catch (error) {
      console.error("Failed to create default categories:", error);
    }
  }

  // Get all categories for a user
  async getUserCategories(userId: string): Promise<CategoryData[]> {
    try {
      const { data, error } = await supabase
        .from("password_categories")
        .select("*")
        .eq("user_id", userId)
        .order("name");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      return [];
    }
  }

  // Create a new category
  async createCategory(category: CategoryData): Promise<CategoryData | null> {
    try {
      const { data, error } = await supabase
        .from("password_categories")
        .insert({
          user_id: category.userId,
          name: category.name,
          color: category.color,
          icon: category.icon,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Failed to create category:", error);
      return null;
    }
  }

  // Update a category
  async updateCategory(
    categoryId: string,
    userId: string,
    updates: Partial<Omit<CategoryData, "id" | "userId" | "createdAt">>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("password_categories")
        .update(updates)
        .eq("id", categoryId)
        .eq("user_id", userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Failed to update category:", error);
      return false;
    }
  }

  // Delete a category
  async deleteCategory(categoryId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("password_categories")
        .delete()
        .eq("id", categoryId)
        .eq("user_id", userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Failed to delete category:", error);
      return false;
    }
  }

  // Get passwords count by category
  async getCategoryPasswordCounts(
    userId: string
  ): Promise<Record<string, number>> {
    try {
      const { data, error } = await supabase
        .from("passwords")
        .select("category_id")
        .eq("user_id", userId);

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((pwd) => {
        const categoryId = pwd.category_id || "uncategorized";
        counts[categoryId] = (counts[categoryId] || 0) + 1;
      });

      return counts;
    } catch (error) {
      console.error("Failed to get category counts:", error);
      return {};
    }
  }
}

export const categoryService = new CategoryService();


