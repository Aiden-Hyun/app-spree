import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";

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
    const defaultCategories = [
      { name: "Personal", color: "#0984e3", icon: "👤" },
      { name: "Work", color: "#00b894", icon: "💼" },
      { name: "Finance", color: "#fdcb6e", icon: "💰" },
      { name: "Social", color: "#e17055", icon: "💬" },
      { name: "Shopping", color: "#a29bfe", icon: "🛍️" },
    ];

    try {
      const categoriesRef = collection(db, "users", userId, "password_categories");
      const now = Timestamp.now();

      for (const cat of defaultCategories) {
        await addDoc(categoriesRef, {
          ...cat,
          createdAt: now,
        });
      }
    } catch (error) {
      console.error("Failed to create default categories:", error);
    }
  }

  // Get all categories for a user
  async getUserCategories(userId: string): Promise<CategoryData[]> {
    try {
      const categoriesRef = collection(db, "users", userId, "password_categories");
      const categoriesQuery = query(categoriesRef, orderBy("name"));
      const snapshot = await getDocs(categoriesQuery);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        userId,
        name: doc.data().name,
        color: doc.data().color,
        icon: doc.data().icon,
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
      }));
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      return [];
    }
  }

  // Create a new category
  async createCategory(category: CategoryData): Promise<CategoryData | null> {
    try {
      const categoriesRef = collection(db, "users", category.userId, "password_categories");
      const now = Timestamp.now();

      const docRef = await addDoc(categoriesRef, {
        name: category.name,
        color: category.color,
        icon: category.icon || null,
        createdAt: now,
      });

      return {
        id: docRef.id,
        userId: category.userId,
        name: category.name,
        color: category.color,
        icon: category.icon,
        createdAt: now.toDate().toISOString(),
      };
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
      const categoryRef = doc(db, "users", userId, "password_categories", categoryId);
      await updateDoc(categoryRef, updates);
      return true;
    } catch (error) {
      console.error("Failed to update category:", error);
      return false;
    }
  }

  // Delete a category
  async deleteCategory(categoryId: string, userId: string): Promise<boolean> {
    try {
      const categoryRef = doc(db, "users", userId, "password_categories", categoryId);
      await deleteDoc(categoryRef);
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
      const passwordsRef = collection(db, "users", userId, "passwords");
      const snapshot = await getDocs(passwordsRef);

      const counts: Record<string, number> = {};
      snapshot.docs.forEach((doc) => {
        const categoryId = doc.data().categoryId || "uncategorized";
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
