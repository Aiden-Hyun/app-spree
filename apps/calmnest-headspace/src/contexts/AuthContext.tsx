import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import { 
  User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential
} from "firebase/auth";
import { auth } from "../firebase";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";

// Configure Google Sign In
GoogleSignin.configure({
  webClientId: "1012641376582-d37ir0jp1r9a4hb4r82dbn5nemaddnki.apps.googleusercontent.com",
  iosClientId: "1012641376582-q3b2a8q3k1qlvgqokaq229aujeat7hme.apps.googleusercontent.com",
});

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  isAppleSignInAvailable: boolean;
  logout: () => Promise<void>;
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

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithApple,
    isAppleSignInAvailable,
    logout,
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
