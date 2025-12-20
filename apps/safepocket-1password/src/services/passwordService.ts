import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
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
      const passwordRef = doc(db, "users", userId, "passwords", passwordId);
      await updateDoc(passwordRef, {
        lastUsed: Timestamp.now(),
      });

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
      const eventsRef = collection(db, "users", userId, "security_events");
      await addDoc(eventsRef, {
        eventType,
        description,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        createdAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Failed to log security event:", error);
    }
  }

  // Add password to history when changed
  async addPasswordToHistory(
    userId: string,
    passwordId: string,
    oldPasswordEncrypted: string
  ): Promise<void> {
    try {
      const historyRef = collection(db, "users", userId, "password_history");
      await addDoc(historyRef, {
        passwordId,
        oldPasswordEncrypted,
        changedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Failed to add password to history:", error);
    }
  }

  // Get password history
  async getPasswordHistory(userId: string, passwordId: string): Promise<any[]> {
    try {
      const historyRef = collection(db, "users", userId, "password_history");
      const historyQuery = query(
        historyRef,
        where("passwordId", "==", passwordId),
        orderBy("changedAt", "desc")
      );
      const snapshot = await getDocs(historyQuery);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        changedAt: doc.data().changedAt?.toDate?.()?.toISOString(),
      }));
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
      const passwordsRef = collection(db, "users", userId, "passwords");
      const passwordsQuery = query(
        passwordsRef,
        where("passwordEncrypted", "==", encryptedPassword)
      );
      const snapshot = await getDocs(passwordsQuery);

      return snapshot.docs.map((doc) => doc.data().title);
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
      const passwordsRef = collection(db, "users", userId, "passwords");
      const snapshot = await getDocs(passwordsRef);
      const passwords = snapshot.docs.map((doc) => doc.data());

      const stats = {
        total: passwords.length,
        weak: 0,
        reused: 0,
        old: 0,
      };

      // Check for old passwords (>90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      passwords.forEach((pwd) => {
        const updatedAt = pwd.updatedAt?.toDate?.() || new Date(pwd.updatedAt);
        if (updatedAt < ninetyDaysAgo) {
          stats.old++;
        }
      });

      // Check for reused passwords
      const passwordMap = new Map<string, number>();
      passwords.forEach((pwd) => {
        const count = passwordMap.get(pwd.passwordEncrypted) || 0;
        passwordMap.set(pwd.passwordEncrypted, count + 1);
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
}

export const passwordService = new PasswordService();
