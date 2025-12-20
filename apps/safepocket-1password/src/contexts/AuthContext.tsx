import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { encryptionService } from "../services/encryptionService";

interface AuthContextType {
  user: User | null;
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
  const [loading, setLoading] = useState(true);
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [hasMasterPassword, setHasMasterPassword] = useState(false);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Check if user has master password set
        const hasPassword = await encryptionService.hasMasterPassword();
        setHasMasterPassword(hasPassword);

        // Create user document if it doesn't exist
        const userRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          await setDoc(userRef, {
            email: firebaseUser.email,
            createdAt: new Date().toISOString(),
            twoFactorEnabled: false,
            biometricEnabled: false,
            autoLockMinutes: 15,
            preferences: {},
          });
        }
      } else {
        // User logged out, lock vault
        encryptionService.lockVault();
        setIsVaultUnlocked(false);
        setHasMasterPassword(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { user: newUser } = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Create user document in Firestore
    await setDoc(doc(db, "users", newUser.uid), {
      email: newUser.email,
      createdAt: new Date().toISOString(),
      twoFactorEnabled: false,
      biometricEnabled: false,
      autoLockMinutes: 15,
      preferences: {},
    });
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    // Lock vault before logging out
    encryptionService.lockVault();
    setIsVaultUnlocked(false);

    await signOut(auth);
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
