import React, { createContext, useContext, useState, useEffect } from "react";
import { passwordService } from "../services/passwordService";
import { useAuth } from "./AuthContext";
import { useVault } from "./VaultContext";
import { calculatePasswordStrength } from "../utils/passwordStrength";
import { encryptionService } from "../services/encryptionService";

export interface SecurityStats {
  totalPasswords: number;
  weakPasswords: number;
  reusedPasswords: number;
  oldPasswords: number;
  securityScore: number;
}

export interface SecurityEvent {
  id: string;
  userId: string;
  eventType: string;
  description: string;
  createdAt: string;
}

interface SecurityContextType {
  securityStats: SecurityStats | null;
  securityEvents: SecurityEvent[];
  loading: boolean;
  refreshSecurityData: () => Promise<void>;
  checkPasswordStrength: (
    password: string
  ) => ReturnType<typeof calculatePasswordStrength>;
  checkForBreaches: (password: string) => Promise<boolean>;
  getWeakPasswords: () => any[];
  getReusedPasswords: () => any[];
  getOldPasswords: () => any[];
}

const SecurityContext = createContext<SecurityContextType | undefined>(
  undefined
);

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const { user, isVaultUnlocked } = useAuth();
  const { passwords } = useVault();
  const [securityStats, setSecurityStats] = useState<SecurityStats | null>(
    null
  );
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && isVaultUnlocked && passwords.length > 0) {
      refreshSecurityData();
    }
  }, [user, isVaultUnlocked, passwords]);

  const refreshSecurityData = async () => {
    if (!user || !isVaultUnlocked) return;

    setLoading(true);
    try {
      // Calculate security stats
      const stats = await calculateSecurityStats();
      setSecurityStats(stats);

      // Fetch recent security events
      const events = await passwordService.getPasswordHistory(user.id);
      setSecurityEvents(events.slice(0, 10)); // Last 10 events
    } catch (error) {
      console.error("Failed to refresh security data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSecurityStats = async (): Promise<SecurityStats> => {
    let weakCount = 0;
    const passwordMap = new Map<string, number>();
    let oldCount = 0;

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Analyze each password
    for (const pwd of passwords) {
      // Check password strength
      const strength = calculatePasswordStrength(pwd.password);
      if (strength.score <= 2) {
        weakCount++;
      }

      // Track reused passwords
      const count = passwordMap.get(pwd.password) || 0;
      passwordMap.set(pwd.password, count + 1);

      // Check for old passwords
      if (new Date(pwd.updatedAt) < ninetyDaysAgo) {
        oldCount++;
      }
    }

    // Count reused passwords
    let reusedCount = 0;
    passwordMap.forEach((count) => {
      if (count > 1) {
        reusedCount += count;
      }
    });

    // Calculate security score (0-100)
    const totalPasswords = passwords.length || 1;
    const weakPercentage = (weakCount / totalPasswords) * 100;
    const reusedPercentage = (reusedCount / totalPasswords) * 100;
    const oldPercentage = (oldCount / totalPasswords) * 100;

    const securityScore = Math.max(
      0,
      100 - weakPercentage - reusedPercentage - oldPercentage
    );

    return {
      totalPasswords: passwords.length,
      weakPasswords: weakCount,
      reusedPasswords: reusedCount,
      oldPasswords: oldCount,
      securityScore: Math.round(securityScore),
    };
  };

  const checkPasswordStrength = (password: string) => {
    return calculatePasswordStrength(password);
  };

  const checkForBreaches = async (password: string): Promise<boolean> => {
    // In a real app, you would check against a breach database like HaveIBeenPwned
    // For now, we'll simulate by checking against common passwords
    const commonPasswords = [
      "password",
      "123456",
      "password123",
      "admin",
      "qwerty",
      "letmein",
      "welcome",
      "monkey",
      "dragon",
      "baseball",
    ];

    return commonPasswords.includes(password.toLowerCase());
  };

  const getWeakPasswords = () => {
    return passwords.filter((pwd) => {
      const strength = calculatePasswordStrength(pwd.password);
      return strength.score <= 2;
    });
  };

  const getReusedPasswords = () => {
    const passwordGroups = new Map<string, any[]>();

    passwords.forEach((pwd) => {
      const group = passwordGroups.get(pwd.password) || [];
      group.push(pwd);
      passwordGroups.set(pwd.password, group);
    });

    const reused: any[] = [];
    passwordGroups.forEach((group) => {
      if (group.length > 1) {
        reused.push(...group);
      }
    });

    return reused;
  };

  const getOldPasswords = () => {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    return passwords.filter((pwd) => new Date(pwd.updatedAt) < ninetyDaysAgo);
  };

  const value = {
    securityStats,
    securityEvents,
    loading,
    refreshSecurityData,
    checkPasswordStrength,
    checkForBreaches,
    getWeakPasswords,
    getReusedPasswords,
    getOldPasswords,
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error("useSecurity must be used within a SecurityProvider");
  }
  return context;
}


