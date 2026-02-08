import { User, AuthCredential } from "firebase/auth";

/**
 * Error thrown when attempting to link a credential that's already
 * associated with another Firebase account.
 */
export class CredentialCollisionError extends Error {
  constructor(
    public readonly pendingCredential: AuthCredential,
    public readonly providerType: "google.com" | "apple.com" | "password",
    public readonly email: string | null = null
  ) {
    super("This credential is already linked to another account");
    this.name = "CredentialCollisionError";
  }
}

export interface AuthContextType {
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
  upgradeAnonymousWithGoogle: () => Promise<void>;
  upgradeAnonymousWithApple: () => Promise<void>;
  upgradeAnonymousWithEmail: (email: string, password: string) => Promise<void>;
  signInWithPendingCredential: (credential: AuthCredential) => Promise<void>;
  getGoogleCredential: () => Promise<AuthCredential | null>;
  getAppleCredential: () => Promise<AuthCredential | null>;
  linkProvider: (
    providerType: "google.com" | "apple.com" | "password",
    emailPassword?: { email: string; password: string }
  ) => Promise<void>;
  unlinkProvider: (providerId: string) => Promise<void>;
  changeEmail: (newEmail: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  getLinkedProviders: () => string[];
}
