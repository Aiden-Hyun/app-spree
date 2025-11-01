import { useState, useEffect } from "react";
import { categoryService, Category } from "../services/category.service";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCategories = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch categories"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const refresh = () => fetchCategories(true);

  return {
    categories,
    loading,
    error,
    refreshing,
    refresh,
  };
}

export function useCategory(categoryId: string) {
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await categoryService.getCategoryById(categoryId);
        setCategory(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch category"
        );
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      fetchCategory();
    }
  }, [categoryId]);

  return {
    category,
    loading,
    error,
  };
}
