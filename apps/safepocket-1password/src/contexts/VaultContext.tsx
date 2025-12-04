import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabase";
import { encryptionService } from "../services/encryptionService";
import { useAuth } from "./AuthContext";

export interface PasswordEntry {
  id: string;
  userId?: string;
  categoryId?: string;
  title: string;
  username?: string;
  password: string; // Decrypted in memory
  website?: string;
  notes?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsed?: string;
}

export interface Category {
  id: string;
  userId?: string;
  name: string;
  color: string;
  icon?: string;
  createdAt: string;
}

interface VaultContextType {
  passwords: PasswordEntry[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  refreshVault: () => Promise<void>;
  addPassword: (
    entry: Omit<PasswordEntry, "id" | "createdAt" | "updatedAt">
  ) => Promise<PasswordEntry>;
  updatePassword: (
    id: string,
    updates: Partial<PasswordEntry>
  ) => Promise<void>;
  deletePassword: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  addCategory: (
    category: Omit<Category, "id" | "createdAt">
  ) => Promise<Category>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  searchPasswords: (query: string) => PasswordEntry[];
  getPasswordsByCategory: (categoryId: string) => PasswordEntry[];
  getFavoritePasswords: () => PasswordEntry[];
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const { user, isVaultUnlocked } = useAuth();
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load vault data when unlocked
  useEffect(() => {
    if (user && isVaultUnlocked) {
      refreshVault();
    } else {
      // Clear vault when locked
      setPasswords([]);
      setCategories([]);
      setLoading(false);
    }
  }, [user, isVaultUnlocked]);

  const refreshVault = async () => {
    if (!user || !isVaultUnlocked) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("password_categories")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (categoriesError) throw categoriesError;

      // Fetch passwords
      const { data: passwordsData, error: passwordsError } = await supabase
        .from("passwords")
        .select("*")
        .eq("user_id", user.id)
        .order("title");

      if (passwordsError) throw passwordsError;

      // Decrypt passwords
      const decryptedPasswords = await Promise.all(
        passwordsData.map(async (pwd) => {
          try {
            const decryptedPassword = await encryptionService.decryptPassword(
              pwd.password_encrypted
            );
            const decryptedNotes = pwd.notes
              ? await encryptionService.decryptPassword(pwd.notes)
              : undefined;

            return {
              id: pwd.id,
              categoryId: pwd.category_id,
              title: pwd.title,
              username: pwd.username,
              password: decryptedPassword,
              website: pwd.website,
              notes: decryptedNotes,
              isFavorite: pwd.is_favorite,
              createdAt: pwd.created_at,
              updatedAt: pwd.updated_at,
              lastUsed: pwd.last_used,
            };
          } catch (err) {
            console.error("Failed to decrypt password:", pwd.id, err);
            return null;
          }
        })
      );

      setCategories(categoriesData || []);
      setPasswords(decryptedPasswords.filter(Boolean) as PasswordEntry[]);
    } catch (err: any) {
      console.error("Failed to load vault:", err);
      setError(err.message || "Failed to load vault");
    } finally {
      setLoading(false);
    }
  };

  const addPassword = async (
    entry: Omit<PasswordEntry, "id" | "createdAt" | "updatedAt">
  ): Promise<PasswordEntry> => {
    if (!user) throw new Error("Not authenticated");
    if (!isVaultUnlocked) throw new Error("Vault is locked");

    const encryptedPassword = await encryptionService.encryptPassword(
      entry.password
    );
    const encryptedNotes = entry.notes
      ? await encryptionService.encryptPassword(entry.notes)
      : null;

    const { data, error } = await supabase
      .from("passwords")
      .insert({
        user_id: user.id,
        category_id: entry.categoryId,
        title: entry.title,
        username: entry.username,
        password_encrypted: encryptedPassword,
        website: entry.website,
        notes: encryptedNotes,
        is_favorite: entry.isFavorite || false,
      })
      .select()
      .single();

    if (error) throw error;

    const newEntry: PasswordEntry = {
      id: data.id,
      categoryId: data.category_id,
      title: data.title,
      username: data.username,
      password: entry.password,
      website: data.website,
      notes: entry.notes,
      isFavorite: data.is_favorite,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastUsed: data.last_used,
    };

    setPasswords([...passwords, newEntry]);
    return newEntry;
  };

  const updatePassword = async (
    id: string,
    updates: Partial<PasswordEntry>
  ) => {
    if (!user) throw new Error("Not authenticated");
    if (!isVaultUnlocked) throw new Error("Vault is locked");

    const updateData: any = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.username !== undefined) updateData.username = updates.username;
    if (updates.website !== undefined) updateData.website = updates.website;
    if (updates.categoryId !== undefined)
      updateData.category_id = updates.categoryId;
    if (updates.isFavorite !== undefined)
      updateData.is_favorite = updates.isFavorite;

    if (updates.password !== undefined) {
      updateData.password_encrypted = await encryptionService.encryptPassword(
        updates.password
      );
    }

    if (updates.notes !== undefined) {
      updateData.notes = updates.notes
        ? await encryptionService.encryptPassword(updates.notes)
        : null;
    }

    updateData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from("passwords")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    setPasswords(
      passwords.map((pwd) =>
        pwd.id === id
          ? { ...pwd, ...updates, updatedAt: updateData.updated_at }
          : pwd
      )
    );
  };

  const deletePassword = async (id: string) => {
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("passwords")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    setPasswords(passwords.filter((pwd) => pwd.id !== id));
  };

  const toggleFavorite = async (id: string) => {
    const password = passwords.find((pwd) => pwd.id === id);
    if (!password) return;

    await updatePassword(id, { isFavorite: !password.isFavorite });
  };

  const addCategory = async (
    category: Omit<Category, "id" | "createdAt">
  ): Promise<Category> => {
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("password_categories")
      .insert({
        user_id: user.id,
        name: category.name,
        color: category.color,
        icon: category.icon,
      })
      .select()
      .single();

    if (error) throw error;

    const newCategory: Category = {
      id: data.id,
      name: data.name,
      color: data.color,
      icon: data.icon,
      createdAt: data.created_at,
    };

    setCategories([...categories, newCategory]);
    return newCategory;
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("password_categories")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    setCategories(
      categories.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat))
    );
  };

  const deleteCategory = async (id: string) => {
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("password_categories")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    setCategories(categories.filter((cat) => cat.id !== id));
  };

  const searchPasswords = (query: string): PasswordEntry[] => {
    const lowercaseQuery = query.toLowerCase();
    return passwords.filter(
      (pwd) =>
        pwd.title.toLowerCase().includes(lowercaseQuery) ||
        pwd.username?.toLowerCase().includes(lowercaseQuery) ||
        pwd.website?.toLowerCase().includes(lowercaseQuery) ||
        pwd.notes?.toLowerCase().includes(lowercaseQuery)
    );
  };

  const getPasswordsByCategory = (categoryId: string): PasswordEntry[] => {
    return passwords.filter((pwd) => pwd.categoryId === categoryId);
  };

  const getFavoritePasswords = (): PasswordEntry[] => {
    return passwords.filter((pwd) => pwd.isFavorite);
  };

  const value = {
    passwords,
    categories,
    loading,
    error,
    refreshVault,
    addPassword,
    updatePassword,
    deletePassword,
    toggleFavorite,
    addCategory,
    updateCategory,
    deleteCategory,
    searchPasswords,
    getPasswordsByCategory,
    getFavoritePasswords,
  };

  return (
    <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
  );
}

export function useVault() {
  const context = useContext(VaultContext);
  if (context === undefined) {
    throw new Error("useVault must be used within a VaultProvider");
  }
  return context;
}


