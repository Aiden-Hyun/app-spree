import * as SecureStore from "expo-secure-store";
import {
  encryptData,
  decryptData,
  hashMasterPassword,
  storeMasterPasswordHash,
  verifyMasterPassword,
  isMasterPasswordSet,
  deriveKey,
  generateSalt,
  setSessionEncryptionKey,
  getSessionEncryptionKey,
  clearSessionEncryptionKey,
  clearSecureStorage,
  xorEncrypt,
  xorDecrypt,
} from "../utils/crypto";

export interface EncryptedPassword {
  id: string;
  title: string;
  username: string;
  encryptedPassword: string;
  website?: string;
  notes?: string;
  categoryId?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsed?: string;
}

class EncryptionService {
  private masterPassword: string | null = null;

  // Initialize master password for new users
  async initializeMasterPassword(masterPassword: string): Promise<void> {
    // Generate and store salt
    const salt = await generateSalt();
    await SecureStore.setItemAsync("vault_salt", salt);

    // Hash and store master password
    const hash = await hashMasterPassword(masterPassword);
    await storeMasterPasswordHash(hash);

    // Derive and store encryption key in session
    const encryptionKey = await deriveKey(masterPassword, salt);
    setSessionEncryptionKey(encryptionKey);
    this.masterPassword = masterPassword;
  }

  // Unlock vault with master password
  async unlockVault(masterPassword: string): Promise<boolean> {
    const isValid = await verifyMasterPassword(masterPassword);

    if (isValid) {
      const salt = await SecureStore.getItemAsync("vault_salt");
      if (!salt) throw new Error("Vault not initialized");

      const encryptionKey = await deriveKey(masterPassword, salt);
      setSessionEncryptionKey(encryptionKey);
      this.masterPassword = masterPassword;
      return true;
    }

    return false;
  }

  // Lock vault
  lockVault(): void {
    clearSessionEncryptionKey();
    this.masterPassword = null;
  }

  // Check if vault is locked
  isVaultLocked(): boolean {
    return getSessionEncryptionKey() === null;
  }

  // Check if master password is set
  async hasMasterPassword(): Promise<boolean> {
    return await isMasterPasswordSet();
  }

  // Encrypt password entry
  async encryptPassword(password: string): Promise<string> {
    const encryptionKey = getSessionEncryptionKey();
    if (!encryptionKey) throw new Error("Vault is locked");

    return xorEncrypt(password, encryptionKey);
  }

  // Decrypt password entry
  async decryptPassword(encryptedPassword: string): Promise<string> {
    const encryptionKey = getSessionEncryptionKey();
    if (!encryptionKey) throw new Error("Vault is locked");

    return xorDecrypt(encryptedPassword, encryptionKey);
  }

  // Encrypt sensitive fields in a password entry
  async encryptPasswordEntry(entry: {
    password: string;
    notes?: string;
  }): Promise<{
    encryptedPassword: string;
    encryptedNotes?: string;
  }> {
    const encryptionKey = getSessionEncryptionKey();
    if (!encryptionKey) throw new Error("Vault is locked");

    const result: any = {
      encryptedPassword: await this.encryptPassword(entry.password),
    };

    if (entry.notes) {
      result.encryptedNotes = xorEncrypt(entry.notes, encryptionKey);
    }

    return result;
  }

  // Decrypt sensitive fields in a password entry
  async decryptPasswordEntry(entry: {
    encryptedPassword: string;
    notes?: string;
  }): Promise<{
    password: string;
    notes?: string;
  }> {
    const encryptionKey = getSessionEncryptionKey();
    if (!encryptionKey) throw new Error("Vault is locked");

    const result: any = {
      password: await this.decryptPassword(entry.encryptedPassword),
    };

    if (entry.notes) {
      result.notes = xorDecrypt(entry.notes, encryptionKey);
    }

    return result;
  }

  // Change master password
  async changeMasterPassword(
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    // Verify current password
    const isValid = await verifyMasterPassword(currentPassword);
    if (!isValid) return false;

    // Get current encryption key
    const currentSalt = await SecureStore.getItemAsync("vault_salt");
    if (!currentSalt) throw new Error("Vault not initialized");
    const currentKey = await deriveKey(currentPassword, currentSalt);

    // Generate new salt and derive new key
    const newSalt = await generateSalt();
    const newKey = await deriveKey(newPassword, newSalt);

    // TODO: Re-encrypt all passwords with new key
    // This would require fetching all passwords, decrypting with old key,
    // and re-encrypting with new key

    // Update stored values
    await SecureStore.setItemAsync("vault_salt", newSalt);
    const newHash = await hashMasterPassword(newPassword);
    await storeMasterPasswordHash(newHash);

    // Update session
    setSessionEncryptionKey(newKey);
    this.masterPassword = newPassword;

    return true;
  }

  // Reset vault (delete all data)
  async resetVault(): Promise<void> {
    await clearSecureStorage();
    this.masterPassword = null;
  }

  // Export vault data (encrypted)
  async exportVault(): Promise<string> {
    const encryptionKey = getSessionEncryptionKey();
    if (!encryptionKey) throw new Error("Vault is locked");

    // This would gather all vault data and export it
    // For now, return a placeholder
    return JSON.stringify({
      version: "1.0",
      exportDate: new Date().toISOString(),
      // encrypted data would go here
    });
  }

  // Import vault data
  async importVault(
    encryptedData: string,
    masterPassword: string
  ): Promise<boolean> {
    try {
      const data = JSON.parse(encryptedData);
      // Verify and import data
      // This would decrypt and validate the imported data
      return true;
    } catch (error) {
      console.error("Import failed:", error);
      return false;
    }
  }
}

export const encryptionService = new EncryptionService();


