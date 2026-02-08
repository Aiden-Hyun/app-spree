import {
  AuthCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInAnonymously as firebaseSignInAnonymously,
  signInWithCredential,
} from "firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { auth } from "@/firebase";

interface SessionActionDeps {
  getGoogleCredential: () => Promise<AuthCredential | null>;
  getAppleCredential: () => Promise<AuthCredential | null>;
}

export function createSessionActions({
  getGoogleCredential,
  getAppleCredential,
}: SessionActionDeps) {
  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInAnonymously = async () => {
    await firebaseSignInAnonymously(auth);
  };

  const signInWithGoogle = async () => {
    const googleCredential = await getGoogleCredential();
    if (!googleCredential) {
      return;
    }
    await signInWithCredential(auth, googleCredential);
  };

  const signInWithApple = async () => {
    const appleCredential = await getAppleCredential();
    if (!appleCredential) {
      return;
    }
    await signInWithCredential(auth, appleCredential);
  };

  const logout = async () => {
    try {
      await GoogleSignin.signOut();
    } catch {
      // Ignore if not signed in with Google
    }
    await signOut(auth);
  };

  return {
    signUp,
    signIn,
    signInAnonymously,
    signInWithGoogle,
    signInWithApple,
    logout,
  };
}
