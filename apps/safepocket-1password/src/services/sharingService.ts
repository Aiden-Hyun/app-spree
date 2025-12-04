import { supabase } from "../supabase";
import { passwordService } from "./passwordService";

export interface SharedPassword {
  id: string;
  passwordId: string;
  sharedWithUserId: string;
  sharedWithEmail?: string;
  permissionLevel: "read" | "write";
  sharedAt: string;
}

export class SharingService {
  // Share a password with another user
  async sharePassword(
    passwordId: string,
    ownerId: string,
    sharedWithEmail: string,
    permissionLevel: "read" | "write" = "read"
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check if user exists
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("email", sharedWithEmail)
        .single();

      if (userError || !userData) {
        return {
          success: false,
          message: "User not found. Make sure they have a SafePocket account.",
        };
      }

      // Check if already shared
      const { data: existingShare } = await supabase
        .from("shared_passwords")
        .select("id")
        .eq("password_id", passwordId)
        .eq("shared_with_user_id", userData.id)
        .single();

      if (existingShare) {
        return {
          success: false,
          message: "Password is already shared with this user.",
        };
      }

      // Create share
      const { error } = await supabase.from("shared_passwords").insert({
        password_id: passwordId,
        shared_with_user_id: userData.id,
        permission_level: permissionLevel,
      });

      if (error) throw error;

      // Log security event
      await passwordService.logSecurityEvent(
        ownerId,
        "password_shared",
        `Password shared with ${sharedWithEmail}`
      );

      return {
        success: true,
        message: "Password shared successfully!",
      };
    } catch (error: any) {
      console.error("Failed to share password:", error);
      return {
        success: false,
        message: error.message || "Failed to share password",
      };
    }
  }

  // Get all passwords shared with the current user
  async getSharedWithMe(userId: string): Promise<any[]> {
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
            is_favorite,
            category_id,
            created_at,
            updated_at,
            last_used,
            users (
              email,
              full_name
            )
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

  // Get all passwords shared by the current user
  async getSharedByMe(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("passwords")
        .select(
          `
          id,
          title,
          shared_passwords (
            id,
            shared_with_user_id,
            permission_level,
            shared_at,
            users (
              email,
              full_name
            )
          )
        `
        )
        .eq("user_id", userId)
        .not("shared_passwords", "is", null);

      if (error) throw error;

      // Filter out passwords with no shares
      return (data || []).filter((pwd) => pwd.shared_passwords?.length > 0);
    } catch (error) {
      console.error("Failed to get shared passwords:", error);
      return [];
    }
  }

  // Update sharing permissions
  async updateSharePermissions(
    shareId: string,
    ownerId: string,
    permissionLevel: "read" | "write"
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("shared_passwords")
        .update({ permission_level: permissionLevel })
        .eq("id", shareId);

      if (error) throw error;

      await passwordService.logSecurityEvent(
        ownerId,
        "share_updated",
        `Share permissions updated to ${permissionLevel}`
      );

      return true;
    } catch (error) {
      console.error("Failed to update share permissions:", error);
      return false;
    }
  }

  // Remove password sharing
  async unsharePassword(
    passwordId: string,
    sharedWithUserId: string,
    ownerId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("shared_passwords")
        .delete()
        .eq("password_id", passwordId)
        .eq("shared_with_user_id", sharedWithUserId);

      if (error) throw error;

      await passwordService.logSecurityEvent(
        ownerId,
        "password_unshared",
        "Password sharing removed"
      );

      return true;
    } catch (error) {
      console.error("Failed to unshare password:", error);
      return false;
    }
  }

  // Check if user has permission to edit a shared password
  hasWritePermission(share: any): boolean {
    return share.permission_level === "write";
  }

  // Get sharing statistics
  async getSharingStats(userId: string): Promise<{
    sharedByMe: number;
    sharedWithMe: number;
  }> {
    try {
      const [sharedByMe, sharedWithMe] = await Promise.all([
        this.getSharedByMe(userId),
        this.getSharedWithMe(userId),
      ]);

      return {
        sharedByMe: sharedByMe.length,
        sharedWithMe: sharedWithMe.length,
      };
    } catch (error) {
      console.error("Failed to get sharing stats:", error);
      return {
        sharedByMe: 0,
        sharedWithMe: 0,
      };
    }
  }
}

export const sharingService = new SharingService();


