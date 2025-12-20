import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
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
      // Find user by email - search through users collection
      const usersRef = collection(db, "users");
      const userQuery = query(usersRef, where("email", "==", sharedWithEmail));
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        return {
          success: false,
          message: "User not found. Make sure they have a SafePocket account.",
        };
      }

      const sharedWithUserId = userSnapshot.docs[0].id;

      // Check if already shared
      const sharesRef = collection(db, "shared_passwords");
      const existingQuery = query(
        sharesRef,
        where("passwordId", "==", passwordId),
        where("sharedWithUserId", "==", sharedWithUserId)
      );
      const existingSnapshot = await getDocs(existingQuery);

      if (!existingSnapshot.empty) {
        return {
          success: false,
          message: "Password is already shared with this user.",
        };
      }

      // Create share
      await addDoc(sharesRef, {
        passwordId,
        ownerId,
        sharedWithUserId,
        sharedWithEmail,
        permissionLevel,
        sharedAt: Timestamp.now(),
      });

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
      const sharesRef = collection(db, "shared_passwords");
      const sharesQuery = query(
        sharesRef,
        where("sharedWithUserId", "==", userId)
      );
      const sharesSnapshot = await getDocs(sharesQuery);

      const sharedPasswords = await Promise.all(
        sharesSnapshot.docs.map(async (shareDoc) => {
          const shareData = shareDoc.data();
          
          // Get the password document
          const passwordRef = doc(
            db,
            "users",
            shareData.ownerId,
            "passwords",
            shareData.passwordId
          );
          const passwordDoc = await getDoc(passwordRef);

          if (!passwordDoc.exists()) {
            return null;
          }

          // Get owner info
          const ownerRef = doc(db, "users", shareData.ownerId);
          const ownerDoc = await getDoc(ownerRef);
          const ownerData = ownerDoc.data();

          return {
            shareId: shareDoc.id,
            permissionLevel: shareData.permissionLevel,
            sharedAt: shareData.sharedAt?.toDate?.()?.toISOString(),
            password: {
              id: passwordDoc.id,
              ...passwordDoc.data(),
              owner: {
                email: ownerData?.email,
                fullName: ownerData?.fullName,
              },
            },
          };
        })
      );

      return sharedPasswords.filter(Boolean);
    } catch (error) {
      console.error("Failed to get shared passwords:", error);
      return [];
    }
  }

  // Get all passwords shared by the current user
  async getSharedByMe(userId: string): Promise<any[]> {
    try {
      const sharesRef = collection(db, "shared_passwords");
      const sharesQuery = query(sharesRef, where("ownerId", "==", userId));
      const sharesSnapshot = await getDocs(sharesQuery);

      const sharedPasswords = await Promise.all(
        sharesSnapshot.docs.map(async (shareDoc) => {
          const shareData = shareDoc.data();

          // Get the password document
          const passwordRef = doc(
            db,
            "users",
            userId,
            "passwords",
            shareData.passwordId
          );
          const passwordDoc = await getDoc(passwordRef);

          if (!passwordDoc.exists()) {
            return null;
          }

          // Get shared with user info
          const sharedWithRef = doc(db, "users", shareData.sharedWithUserId);
          const sharedWithDoc = await getDoc(sharedWithRef);
          const sharedWithData = sharedWithDoc.data();

          return {
            shareId: shareDoc.id,
            permissionLevel: shareData.permissionLevel,
            sharedAt: shareData.sharedAt?.toDate?.()?.toISOString(),
            passwordId: shareData.passwordId,
            passwordTitle: passwordDoc.data()?.title,
            sharedWith: {
              userId: shareData.sharedWithUserId,
              email: sharedWithData?.email,
              fullName: sharedWithData?.fullName,
            },
          };
        })
      );

      return sharedPasswords.filter(Boolean);
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
      const shareRef = doc(db, "shared_passwords", shareId);
      await updateDoc(shareRef, { permissionLevel });

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
      const sharesRef = collection(db, "shared_passwords");
      const shareQuery = query(
        sharesRef,
        where("passwordId", "==", passwordId),
        where("sharedWithUserId", "==", sharedWithUserId)
      );
      const snapshot = await getDocs(shareQuery);

      if (!snapshot.empty) {
        await deleteDoc(snapshot.docs[0].ref);
      }

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
    return share.permissionLevel === "write";
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
