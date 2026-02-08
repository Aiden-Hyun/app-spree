import {
  AuthCredential,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  unlink,
  updateEmail,
  User,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { auth } from "@/firebase";
import { deleteUserAccount } from "@features/profile/data/profileRepository";
import { deleteAllDownloads } from "@/services/downloadService";

interface AccountActionDeps {
  getCurrentUser: () => User | null;
  requireAuthenticatedUser: () => User;
  getGoogleCredential: () => Promise<AuthCredential | null>;
  getAppleCredential: () => Promise<AuthCredential | null>;
}

export function createAccountActions({
  getCurrentUser,
  requireAuthenticatedUser,
  getGoogleCredential,
  getAppleCredential,
}: AccountActionDeps) {
  const unlinkProvider = async (providerId: string): Promise<void> => {
    const currentUser = requireAuthenticatedUser();
    const providers = currentUser.providerData.map((provider) => provider.providerId);

    if (providers.length <= 1) {
      throw new Error("Cannot remove the last sign-in method");
    }

    await unlink(currentUser, providerId);
  };

  const changeEmail = async (newEmail: string, password: string): Promise<void> => {
    const currentUser = requireAuthenticatedUser();

    if (!currentUser.email) {
      throw new Error("No user with email is currently signed in");
    }

    const credential = EmailAuthProvider.credential(currentUser.email, password);
    await reauthenticateWithCredential(currentUser, credential);
    await updateEmail(currentUser, newEmail);
  };

  const sendPasswordReset = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  };

  const getLinkedProviders = (): string[] => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return [];
    }
    return currentUser.providerData.map((provider) => provider.providerId);
  };

  const deleteAccount = async (password?: string) => {
    const currentUser = requireAuthenticatedUser();
    const userId = currentUser.uid;
    const providerIds = currentUser.providerData.map((provider) => provider.providerId);

    const isEmailProvider = providerIds.includes("password");
    const isGoogleProvider = providerIds.includes("google.com");
    const isAppleProvider = providerIds.includes("apple.com");

    try {
      if (isEmailProvider && password) {
        if (!currentUser.email) {
          throw new Error("No user with email is currently signed in");
        }
        const credential = EmailAuthProvider.credential(currentUser.email, password);
        await reauthenticateWithCredential(currentUser, credential);
      } else if (isGoogleProvider) {
        const googleCredential = await getGoogleCredential();
        if (!googleCredential) {
          throw new Error("Failed to get Google token for re-authentication");
        }
        await reauthenticateWithCredential(currentUser, googleCredential);
      } else if (isAppleProvider) {
        const appleCredential = await getAppleCredential();
        if (!appleCredential) {
          throw new Error("Failed to get Apple token for re-authentication");
        }
        await reauthenticateWithCredential(currentUser, appleCredential);
      } else if (!isEmailProvider && !isGoogleProvider && !isAppleProvider) {
        console.warn("Unknown auth provider, attempting deletion without re-auth");
      }

      await deleteUserAccount(userId);
      await deleteAllDownloads();

      const keysToKeep = ["@theme_mode"];
      const allKeys = await AsyncStorage.getAllKeys();
      const keysToRemove = allKeys.filter((key) => !keysToKeep.includes(key));

      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
      }

      try {
        await GoogleSignin.signOut();
      } catch {
        // Ignore Google signout errors here too.
      }

      await currentUser.delete();
    } catch (error: any) {
      if (error?.code === "auth/requires-recent-login") {
        throw new Error("Please sign out and sign back in, then try again.");
      }
      if (error?.code === "auth/wrong-password") {
        throw new Error("Incorrect password. Please try again.");
      }
      throw error;
    }
  };

  return {
    unlinkProvider,
    changeEmail,
    sendPasswordReset,
    getLinkedProviders,
    deleteAccount,
  };
}
