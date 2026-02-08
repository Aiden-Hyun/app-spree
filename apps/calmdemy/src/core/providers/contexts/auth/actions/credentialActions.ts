import {
  AuthCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  linkWithCredential,
  signInWithCredential,
  User,
} from "firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import { auth } from "@/firebase";
import { CredentialCollisionError } from "@core/providers/contexts/auth/types";
import {
  isAppleSignInCancelled,
  isGoogleSignInCancelled,
  logAuthDebug,
} from "@core/providers/contexts/auth/helpers";
import { APPLE_SCOPES } from "@core/providers/contexts/auth/actions/constants";
import { isCredentialInUseError } from "@core/providers/contexts/auth/actions/utils";

interface CredentialActionDeps {
  isAppleSignInAvailable: boolean;
  requireAuthenticatedUser: () => User;
  requireAnonymousUser: () => User;
}

export function createCredentialActions({
  isAppleSignInAvailable,
  requireAuthenticatedUser,
  requireAnonymousUser,
}: CredentialActionDeps) {
  const getGoogleCredential = async (): Promise<AuthCredential | null> => {
    try {
      logAuthDebug({
        location: "AuthContext.tsx:getGoogleCredential:beforeSignIn",
        message: "About to call GoogleSignin.signIn",
        data: {
          currentUserId: auth.currentUser?.uid,
          isAnonymous: auth.currentUser?.isAnonymous,
        },
        hypothesisId: "E",
      });

      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const signInResult = await GoogleSignin.signIn();

      logAuthDebug({
        location: "AuthContext.tsx:getGoogleCredential:afterSignIn",
        message: "GoogleSignin.signIn returned",
        data: {
          currentUserId: auth.currentUser?.uid,
          isAnonymous: auth.currentUser?.isAnonymous,
          hasIdToken: !!signInResult.data?.idToken,
        },
        hypothesisId: "E",
      });

      const idToken = signInResult.data?.idToken;
      if (!idToken) {
        return null;
      }

      return GoogleAuthProvider.credential(idToken);
    } catch (error: unknown) {
      if (isGoogleSignInCancelled(error)) {
        return null;
      }
      throw error;
    }
  };

  const getAppleCredential = async (): Promise<AuthCredential | null> => {
    if (!isAppleSignInAvailable) {
      throw new Error("Apple Sign In is not available on this device");
    }

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: APPLE_SCOPES,
      });

      const { identityToken } = credential;
      if (!identityToken) {
        return null;
      }

      const provider = new OAuthProvider("apple.com");
      return provider.credential({ idToken: identityToken });
    } catch (error: unknown) {
      if (isAppleSignInCancelled(error)) {
        return null;
      }
      throw error;
    }
  };

  const linkAnonymousAccount = async (credential: AuthCredential) => {
    const currentUser = requireAnonymousUser();
    await linkWithCredential(currentUser, credential);
  };

  const upgradeAnonymousWithGoogle = async (): Promise<void> => {
    const currentUser = requireAnonymousUser();

    logAuthDebug({
      location: "AuthContext.tsx:upgradeAnonymousWithGoogle:entry",
      message: "upgradeAnonymousWithGoogle called",
      data: {
        hasUser: !!currentUser,
        isAnonymous: currentUser.isAnonymous,
        userId: currentUser.uid,
      },
      hypothesisId: "A,E",
    });

    const credential = await getGoogleCredential();

    logAuthDebug({
      location: "AuthContext.tsx:upgradeAnonymousWithGoogle:afterGetCred",
      message: "Got Google credential",
      data: {
        hasCredential: !!credential,
        userStillAnonymous: currentUser.isAnonymous,
        userId: currentUser.uid,
      },
      hypothesisId: "E",
    });

    if (!credential) {
      throw new Error("User cancelled");
    }

    try {
      logAuthDebug({
        location: "AuthContext.tsx:upgradeAnonymousWithGoogle:beforeLink",
        message: "About to call linkWithCredential",
        data: {
          userId: currentUser.uid,
          isAnonymous: currentUser.isAnonymous,
        },
        hypothesisId: "C",
      });

      await linkWithCredential(currentUser, credential);

      logAuthDebug({
        location: "AuthContext.tsx:upgradeAnonymousWithGoogle:linkSuccess",
        message: "linkWithCredential SUCCEEDED - no collision",
        data: { userId: currentUser.uid },
        hypothesisId: "C",
      });
    } catch (error: any) {
      logAuthDebug({
        location: "AuthContext.tsx:upgradeAnonymousWithGoogle:linkError",
        message: "linkWithCredential threw error",
        data: {
          errorCode: error?.code,
          errorMessage: error?.message,
          errorName: error?.name,
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
        },
        hypothesisId: "B",
      });

      if (error?.code === "auth/credential-already-in-use") {
        const googleUser = await GoogleSignin.getCurrentUser();
        const email = googleUser?.user?.email || null;
        throw new CredentialCollisionError(credential, "google.com", email);
      }

      throw error;
    }
  };

  const upgradeAnonymousWithApple = async (): Promise<void> => {
    const currentUser = requireAnonymousUser();

    if (!isAppleSignInAvailable) {
      throw new Error("Apple Sign In is not available on this device");
    }

    let appleEmail: string | null = null;
    let credential: AuthCredential;

    try {
      const appleResponse = await AppleAuthentication.signInAsync({
        requestedScopes: APPLE_SCOPES,
      });

      const { identityToken, email } = appleResponse;
      appleEmail = email || null;

      if (!identityToken) {
        throw new Error("User cancelled");
      }

      const provider = new OAuthProvider("apple.com");
      credential = provider.credential({ idToken: identityToken });
    } catch (error: unknown) {
      if (isAppleSignInCancelled(error)) {
        throw new Error("User cancelled");
      }
      throw error;
    }

    try {
      await linkWithCredential(currentUser, credential);
    } catch (error: any) {
      if (error?.code === "auth/credential-already-in-use") {
        throw new CredentialCollisionError(credential, "apple.com", appleEmail);
      }
      throw error;
    }
  };

  const upgradeAnonymousWithEmail = async (
    email: string,
    password: string
  ): Promise<void> => {
    const currentUser = requireAnonymousUser();
    const credential = EmailAuthProvider.credential(email, password);

    try {
      await linkWithCredential(currentUser, credential);
    } catch (error: any) {
      if (isCredentialInUseError(error?.code)) {
        throw new CredentialCollisionError(credential, "password", email);
      }
      throw error;
    }
  };

  const signInWithPendingCredential = async (credential: AuthCredential) => {
    await signInWithCredential(auth, credential);
  };

  const linkProvider = async (
    providerType: "google.com" | "apple.com" | "password",
    emailPassword?: { email: string; password: string }
  ): Promise<void> => {
    const currentUser = requireAuthenticatedUser();

    let credential: AuthCredential | null = null;
    let providerEmail: string | null = null;

    if (providerType === "google.com") {
      credential = await getGoogleCredential();
      if (credential) {
        const googleUser = await GoogleSignin.getCurrentUser();
        providerEmail = googleUser?.user?.email || null;
      }
    } else if (providerType === "apple.com") {
      credential = await getAppleCredential();
    } else if (providerType === "password" && emailPassword) {
      credential = EmailAuthProvider.credential(
        emailPassword.email,
        emailPassword.password
      );
      providerEmail = emailPassword.email;
    }

    if (!credential) {
      return;
    }

    try {
      await linkWithCredential(currentUser, credential);
    } catch (error: any) {
      if (isCredentialInUseError(error?.code)) {
        throw new CredentialCollisionError(credential, providerType, providerEmail);
      }
      throw error;
    }
  };

  return {
    getGoogleCredential,
    getAppleCredential,
    linkAnonymousAccount,
    upgradeAnonymousWithGoogle,
    upgradeAnonymousWithApple,
    upgradeAnonymousWithEmail,
    signInWithPendingCredential,
    linkProvider,
  };
}
