import React, { createContext, useContext, useState, useEffect } from "react";
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
      const categoriesRef = collection(db, "users", user.uid, "password_categories");
      const categoriesQuery = query(categoriesRef, orderBy("name"));
      const categoriesSnapshot = await getDocs(categoriesQuery);
      const categoriesData = categoriesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      })) as Category[];

      // Fetch passwords
      const passwordsRef = collection(db, "users", user.uid, "passwords");
      const passwordsQuery = query(passwordsRef, orderBy("title"));
      const passwordsSnapshot = await getDocs(passwordsQuery);
      const passwordsData = passwordsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Decrypt passwords
      const decryptedPasswords = await Promise.all(
        passwordsData.map(async (pwd: any) => {
          try {
            const decryptedPassword = await encryptionService.decryptPassword(
              pwd.passwordEncrypted
            );
            const decryptedNotes = pwd.notes
              ? await encryptionService.decryptPassword(pwd.notes)
              : undefined;

            return {
              id: pwd.id,
              categoryId: pwd.categoryId,
              title: pwd.title,
              username: pwd.username,
              password: decryptedPassword,
              website: pwd.website,
              notes: decryptedNotes,
              isFavorite: pwd.isFavorite || false,
              createdAt: pwd.createdAt?.toDate?.()?.toISOString() || pwd.createdAt,
              updatedAt: pwd.updatedAt?.toDate?.()?.toISOString() || pwd.updatedAt,
              lastUsed: pwd.lastUsed?.toDate?.()?.toISOString() || pwd.lastUsed,
            };
          } catch (err) {
            console.error("Failed to decrypt password:", pwd.id, err);
            return null;
          }
        })
      );

      setCategories(categoriesData);
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

    const now = Timestamp.now();
    const passwordData = {
      categoryId: entry.categoryId || null,
      title: entry.title,
      username: entry.username || null,
      passwordEncrypted: encryptedPassword,
      website: entry.website || null,
      notes: encryptedNotes,
      isFavorite: entry.isFavorite || false,
      createdAt: now,
      updatedAt: now,
      lastUsed: null,
    };

    const passwordsRef = collection(db, "users", user.uid, "passwords");
    const docRef = await addDoc(passwordsRef, passwordData);

    const newEntry: PasswordEntry = {
      id: docRef.id,
      categoryId: entry.categoryId,
      title: entry.title,
      username: entry.username,
      password: entry.password,
      website: entry.website,
      notes: entry.notes,
      isFavorite: entry.isFavorite || false,
      createdAt: now.toDate().toISOString(),
      updatedAt: now.toDate().toISOString(),
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

    const updateData: any = {
      updatedAt: Timestamp.now(),
    };

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.username !== undefined) updateData.username = updates.username;
    if (updates.website !== undefined) updateData.website = updates.website;
    if (updates.categoryId !== undefined) updateData.categoryId = updates.categoryId;
    if (updates.isFavorite !== undefined) updateData.isFavorite = updates.isFavorite;

    if (updates.password !== undefined) {
      updateData.passwordEncrypted = await encryptionService.encryptPassword(
        updates.password
      );
    }

    if (updates.notes !== undefined) {
      updateData.notes = updates.notes
        ? await encryptionService.encryptPassword(updates.notes)
        : null;
    }

    const passwordRef = doc(db, "users", user.uid, "passwords", id);
    await updateDoc(passwordRef, updateData);

    setPasswords(
      passwords.map((pwd) =>
        pwd.id === id
          ? { ...pwd, ...updates, updatedAt: new Date().toISOString() }
          : pwd
      )
    );
  };

  const deletePassword = async (id: string) => {
    if (!user) throw new Error("Not authenticated");

    const passwordRef = doc(db, "users", user.uid, "passwords", id);
    await deleteDoc(passwordRef);

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

    const now = Timestamp.now();
    const categoryData = {
      name: category.name,
      color: category.color,
      icon: category.icon || null,
      createdAt: now,
    };

    const categoriesRef = collection(db, "users", user.uid, "password_categories");
    const docRef = await addDoc(categoriesRef, categoryData);

    const newCategory: Category = {
      id: docRef.id,
      name: category.name,
      color: category.color,
      icon: category.icon,
      createdAt: now.toDate().toISOString(),
    };

    setCategories([...categories, newCategory]);
    return newCategory;
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    if (!user) throw new Error("Not authenticated");

    const categoryRef = doc(db, "users", user.uid, "password_categories", id);
    await updateDoc(categoryRef, updates);

    setCategories(
      categories.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat))
    );
  };

  const deleteCategory = async (id: string) => {
    if (!user) throw new Error("Not authenticated");

    const categoryRef = doc(db, "users", user.uid, "password_categories", id);
    await deleteDoc(categoryRef);

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
