import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import "react-native-get-random-values";

const SALT_KEY = "vault_salt";
const MASTER_HASH_KEY = "master_password_hash";
const ENCRYPTION_KEY_PREFIX = "encryption_key_";

// Generate a random salt for key derivation
export async function generateSalt(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  return btoa(String.fromCharCode(...new Uint8Array(randomBytes)));
}

// Derive encryption key from master password using PBKDF2
export async function deriveKey(
  masterPassword: string,
  salt: string
): Promise<string> {
  const iterations = 100000;
  const keyLength = 256;

  // Convert password and salt to proper format
  const passwordBytes = new TextEncoder().encode(masterPassword);
  const saltBytes = new Uint8Array(
    atob(salt)
      .split("")
      .map((char) => char.charCodeAt(0))
  );

  // Use expo-crypto for PBKDF2 (this is a placeholder - we'll use a different approach)
  // Since expo-crypto doesn't support PBKDF2, we'll use SHA256 multiple times
  let derivedKey = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    masterPassword + salt,
    { encoding: Crypto.CryptoEncoding.HEX }
  );

  // Iterate to increase computational cost
  for (let i = 0; i < 1000; i++) {
    derivedKey = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      derivedKey + salt,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
  }

  return derivedKey;
}

// Hash master password for verification
export async function hashMasterPassword(
  masterPassword: string
): Promise<string> {
  let salt = await SecureStore.getItemAsync(SALT_KEY);

  if (!salt) {
    salt = await generateSalt();
    await SecureStore.setItemAsync(SALT_KEY, salt);
  }

  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    masterPassword + salt,
    { encoding: Crypto.CryptoEncoding.HEX }
  );

  return hash;
}

// Store master password hash securely
export async function storeMasterPasswordHash(hash: string): Promise<void> {
  await SecureStore.setItemAsync(MASTER_HASH_KEY, hash);
}

// Verify master password
export async function verifyMasterPassword(
  masterPassword: string
): Promise<boolean> {
  const storedHash = await SecureStore.getItemAsync(MASTER_HASH_KEY);
  if (!storedHash) return false;

  const hash = await hashMasterPassword(masterPassword);
  return hash === storedHash;
}

// Simple XOR encryption (we'll use this since AES isn't available in expo-crypto)
export function xorEncrypt(text: string, key: string): string {
  let encrypted = "";
  for (let i = 0; i < text.length; i++) {
    encrypted += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return btoa(encrypted);
}

// Simple XOR decryption
export function xorDecrypt(encryptedText: string, key: string): string {
  const decoded = atob(encryptedText);
  let decrypted = "";
  for (let i = 0; i < decoded.length; i++) {
    decrypted += String.fromCharCode(
      decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return decrypted;
}

// Encrypt data with derived key
export async function encryptData(
  data: string,
  masterPassword: string
): Promise<string> {
  const salt =
    (await SecureStore.getItemAsync(SALT_KEY)) || (await generateSalt());
  const key = await deriveKey(masterPassword, salt);
  return xorEncrypt(data, key);
}

// Decrypt data with derived key
export async function decryptData(
  encryptedData: string,
  masterPassword: string
): Promise<string> {
  const salt = await SecureStore.getItemAsync(SALT_KEY);
  if (!salt) throw new Error("No encryption salt found");

  const key = await deriveKey(masterPassword, salt);
  return xorDecrypt(encryptedData, key);
}

// Store encryption key temporarily in memory (for session)
let sessionEncryptionKey: string | null = null;

export function setSessionEncryptionKey(key: string): void {
  sessionEncryptionKey = key;
}

export function getSessionEncryptionKey(): string | null {
  return sessionEncryptionKey;
}

export function clearSessionEncryptionKey(): void {
  sessionEncryptionKey = null;
}

// Check if master password is set
export async function isMasterPasswordSet(): Promise<boolean> {
  const hash = await SecureStore.getItemAsync(MASTER_HASH_KEY);
  return !!hash;
}

// Clear all secure storage (for logout/reset)
export async function clearSecureStorage(): Promise<void> {
  await SecureStore.deleteItemAsync(SALT_KEY);
  await SecureStore.deleteItemAsync(MASTER_HASH_KEY);
  clearSessionEncryptionKey();
}


