import { supabase } from "../supabase";
import { encryptionService } from "./encryptionService";

export interface PasswordData {
  id?: string;
  userId: string;
  categoryId?: string;
  title: string;
  username?: string;
  passwordEncrypted: string;
  website?: string;
  notes?: string;
  isFavorite: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastUsed?: string;
}

export class PasswordService {
  // Log password usage
  async logPasswordUsage(passwordId: string, userId: string): Promise<void> {
    try {
      await supabase
        .from("passwords")
        .update({ last_used: new Date().toISOString() })
        .eq("id", passwordId)
        .eq("user_id", userId);

      // Log security event
      await this.logSecurityEvent(
        userId,
        "password_accessed",
        `Password accessed: ${passwordId}`
      );
    } catch (error) {
      console.error("Failed to log password usage:", error);
    }
  }

  // Log security event
  async logSecurityEvent(
    userId: string,
    eventType: string,
    description: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await supabase.from("security_events").insert({
        user_id: userId,
        event_type: eventType,
        description,
        ip_address: ipAddress,
        user_agent: userAgent,
      });
    } catch (error) {
      console.error("Failed to log security event:", error);
    }
  }

  // Add password to history when changed
  async addPasswordToHistory(
    passwordId: string,
    oldPasswordEncrypted: string
  ): Promise<void> {
    try {
      await supabase.from("password_history").insert({
        password_id: passwordId,
        old_password_encrypted: oldPasswordEncrypted,
      });
    } catch (error) {
      console.error("Failed to add password to history:", error);
    }
  }

  // Get password history
  async getPasswordHistory(passwordId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("password_history")
        .select("*")
        .eq("password_id", passwordId)
        .order("changed_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Failed to get password history:", error);
      return [];
    }
  }

  // Check for duplicate passwords
  async checkDuplicatePasswords(
    userId: string,
    encryptedPassword: string
  ): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from("passwords")
        .select("id, title")
        .eq("user_id", userId)
        .eq("password_encrypted", encryptedPassword);

      if (error) throw error;
      return data?.map((p) => p.title) || [];
    } catch (error) {
      console.error("Failed to check duplicate passwords:", error);
      return [];
    }
  }

  // Get password strength statistics
  async getPasswordStats(userId: string): Promise<{
    total: number;
    weak: number;
    reused: number;
    old: number;
  }> {
    try {
      const { data, error } = await supabase
        .from("passwords")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        weak: 0,
        reused: 0,
        old: 0,
      };

      // Check for old passwords (>90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      data?.forEach((pwd) => {
        if (new Date(pwd.updated_at) < ninetyDaysAgo) {
          stats.old++;
        }
      });

      // Check for reused passwords
      const passwordMap = new Map<string, number>();
      data?.forEach((pwd) => {
        const count = passwordMap.get(pwd.password_encrypted) || 0;
        passwordMap.set(pwd.password_encrypted, count + 1);
      });

      passwordMap.forEach((count) => {
        if (count > 1) {
          stats.reused += count;
        }
      });

      return stats;
    } catch (error) {
      console.error("Failed to get password stats:", error);
      return { total: 0, weak: 0, reused: 0, old: 0 };
    }
  }

  // Share password with another user
  async sharePassword(
    passwordId: string,
    ownerId: string,
    sharedWithEmail: string,
    permissionLevel: "read" | "write" = "read"
  ): Promise<void> {
    try {
      // Get user ID from email
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("email", sharedWithEmail)
        .single();

      if (userError || !userData) {
        throw new Error("User not found");
      }

      // Create shared password entry
      const { error } = await supabase.from("shared_passwords").insert({
        password_id: passwordId,
        shared_with_user_id: userData.id,
        permission_level: permissionLevel,
      });

      if (error) throw error;

      // Log security event
      await this.logSecurityEvent(
        ownerId,
        "password_shared",
        `Password shared with ${sharedWithEmail}`
      );
    } catch (error) {
      console.error("Failed to share password:", error);
      throw error;
    }
  }

  // Get shared passwords
  async getSharedPasswords(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("shared_passwords")
        .select(
          `
          *,
          passwords (
            id,
            title,
            username,
            password_encrypted,
            website,
            notes,
            user_id
          )
        `
        )
        .eq("shared_with_user_id", userId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Failed to get shared passwords:", error);
      return [];
    }
  }

  // Remove password sharing
  async unsharePassword(
    passwordId: string,
    sharedWithUserId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("shared_passwords")
        .delete()
        .eq("password_id", passwordId)
        .eq("shared_with_user_id", sharedWithUserId);

      if (error) throw error;
    } catch (error) {
      console.error("Failed to unshare password:", error);
      throw error;
    }
  }
}

export const passwordService = new PasswordService();
