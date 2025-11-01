import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../supabase";
import { encryptionService } from "../services/encryptionService";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isVaultUnlocked: boolean;
  hasMasterPassword: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initializeMasterPassword: (masterPassword: string) => Promise<void>;
  unlockVault: (masterPassword: string) => Promise<boolean>;
  lockVault: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [hasMasterPassword, setHasMasterPassword] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Check if user has master password set
      if (session?.user) {
        const hasPassword = await encryptionService.hasMasterPassword();
        setHasMasterPassword(hasPassword);
      }

      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Check if user has master password set
      if (session?.user) {
        const hasPassword = await encryptionService.hasMasterPassword();
        setHasMasterPassword(hasPassword);
      } else {
        // User logged out, lock vault
        encryptionService.lockVault();
        setIsVaultUnlocked(false);
        setHasMasterPassword(false);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const logout = async () => {
    // Lock vault before logging out
    encryptionService.lockVault();
    setIsVaultUnlocked(false);

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const initializeMasterPassword = async (masterPassword: string) => {
    await encryptionService.initializeMasterPassword(masterPassword);
    setHasMasterPassword(true);
    setIsVaultUnlocked(true);
  };

  const unlockVault = async (masterPassword: string): Promise<boolean> => {
    const success = await encryptionService.unlockVault(masterPassword);
    setIsVaultUnlocked(success);
    return success;
  };

  const lockVault = () => {
    encryptionService.lockVault();
    setIsVaultUnlocked(false);
  };

  const value = {
    user,
    session,
    loading,
    isVaultUnlocked,
    hasMasterPassword,
    signUp,
    signIn,
    logout,
    initializeMasterPassword,
    unlockVault,
    lockVault,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
