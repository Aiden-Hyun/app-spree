import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import { 
  User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInAnonymously as firebaseSignInAnonymously,
  linkWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  EmailAuthProvider,
  reauthenticateWithCredential,
  AuthCredential,
} from "firebase/auth";
import { auth } from "../firebase";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import { deleteUserAccount } from "../services/firestoreService";
import { deleteAllDownloads } from "../services/downloadService";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Configure Google Sign In
GoogleSignin.configure({
  webClientId: "1012641376582-d37ir0jp1r9a4hb4r82dbn5nemaddnki.apps.googleusercontent.com",
  iosClientId: "1012641376582-q3b2a8q3k1qlvgqokaq229aujeat7hme.apps.googleusercontent.com",
});

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAnonymous: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  linkAnonymousAccount: (credential: AuthCredential) => Promise<void>;
  isAppleSignInAvailable: boolean;
  logout: () => Promise<void>;
  deleteAccount: (password?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAppleSignInAvailable, setIsAppleSignInAvailable] = useState(false);

  // Check Apple Sign In availability on mount
  useEffect(() => {
    if (Platform.OS === "ios") {
      AppleAuthentication.isAvailableAsync().then(setIsAppleSignInAvailable);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInAnonymously = async () => {
    await firebaseSignInAnonymously(auth);
  };

  const linkAnonymousAccount = async (credential: AuthCredential) => {
    if (!user) {
      throw new Error("No user is currently signed in");
    }
    if (!user.isAnonymous) {
      throw new Error("User is not anonymous");
    }
    await linkWithCredential(user, credential);
  };

  const signInWithGoogle = async () => {
    try {
      // Check if device supports Google Play Services
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      // Get the user's ID token
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;
      if (!idToken) {
        // User likely cancelled or no token returned; silently abort
        return;
      }
      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(idToken);
      // Sign in with the credential
      await signInWithCredential(auth, googleCredential);
    } catch (err: any) {
      // Swallow user-cancelled sign-in
      if (
        err?.code === statusCodes.SIGN_IN_CANCELLED ||
        err?.code === "12501" // common Android cancel code
      ) {
        return;
      }
      throw err;
    }
  };

  const signInWithApple = async () => {
    if (!isAppleSignInAvailable) {
      throw new Error("Apple Sign In is not available on this device");
    }
    
    try {
      // Perform Apple Sign In request
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Ensure we have an identity token
      const { identityToken } = credential;
      if (!identityToken) {
        // User likely cancelled; silently abort
        return;
      }

      // Create a Firebase credential from the Apple response (provider instance in modular SDK)
      const provider = new OAuthProvider("apple.com");
      const appleCredential = provider.credential({
        idToken: identityToken,
      });

      // Sign in with the credential
      await signInWithCredential(auth, appleCredential);
    } catch (err: any) {
      // Swallow user-cancelled sign-in
      if (
        err?.code === AppleAuthentication.AppleAuthenticationError?.CANCELED ||
        err?.code === "ERR_CANCELED" ||
        err?.code === "ERR_REQUEST_CANCELED"
      ) {
        return;
      }
      throw err;
    }
  };

  const logout = async () => {
    // Sign out from Google as well
    try {
      await GoogleSignin.signOut();
    } catch {
      // Ignore if not signed in with Google
    }
    await signOut(auth);
  };

  const deleteAccount = async (password?: string) => {
    if (!user) {
      throw new Error("No user is currently signed in");
    }

    const userId = user.uid;
    const providerData = user.providerData;
    const isEmailProvider = providerData.some(p => p.providerId === "password");
    const isGoogleProvider = providerData.some(p => p.providerId === "google.com");
    const isAppleProvider = providerData.some(p => p.providerId === "apple.com");

    try {
      // Re-authenticate based on sign-in method
      if (isEmailProvider && password) {
        // Re-authenticate with email/password
        const credential = EmailAuthProvider.credential(user.email!, password);
        await reauthenticateWithCredential(user, credential);
      } else if (isGoogleProvider) {
        // Re-authenticate with Google
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const signInResult = await GoogleSignin.signIn();
        const idToken = signInResult.data?.idToken;
        if (!idToken) {
          throw new Error("Failed to get Google token for re-authentication");
        }
        const googleCredential = GoogleAuthProvider.credential(idToken);
        await reauthenticateWithCredential(user, googleCredential);
      } else if (isAppleProvider) {
        // Re-authenticate with Apple
        const appleCredential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });
        const { identityToken } = appleCredential;
        if (!identityToken) {
          throw new Error("Failed to get Apple token for re-authentication");
        }
        const provider = new OAuthProvider("apple.com");
        const oauthCredential = provider.credential({ idToken: identityToken });
        await reauthenticateWithCredential(user, oauthCredential);
      } else if (!isEmailProvider && !isGoogleProvider && !isAppleProvider) {
        // Unknown provider - try to proceed anyway (might fail)
        console.warn("Unknown auth provider, attempting deletion without re-auth");
      }

      // Delete all user data from Firestore
      await deleteUserAccount(userId);

      // Clear downloaded content
      await deleteAllDownloads();

      // Clear AsyncStorage preferences
      const keysToKeep = ["@theme_mode"]; // Keep theme preference
      const allKeys = await AsyncStorage.getAllKeys();
      const keysToRemove = allKeys.filter(key => !keysToKeep.includes(key));
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
      }

      // Sign out from Google if applicable
      try {
        await GoogleSignin.signOut();
      } catch {
        // Ignore
      }

      // Delete the Firebase Auth account
      await user.delete();

      console.log("Account deleted successfully");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      // Re-throw with user-friendly message
      if (error.code === "auth/requires-recent-login") {
        throw new Error("Please sign out and sign back in, then try again.");
      }
      if (error.code === "auth/wrong-password") {
        throw new Error("Incorrect password. Please try again.");
      }
      throw error;
    }
  };

  const value = {
    user,
    loading,
    isAnonymous: user?.isAnonymous ?? false,
    signUp,
    signIn,
    signInAnonymously,
    signInWithGoogle,
    signInWithApple,
    linkAnonymousAccount,
    isAppleSignInAvailable,
    logout,
    deleteAccount,
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
