import { supabase } from "../supabase";
import { calculatePasswordStrength } from "../utils/passwordStrength";

export interface SecurityEvent {
  id: string;
  userId: string;
  eventType: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface BreachCheckResult {
  isBreached: boolean;
  breachCount?: number;
  breachDetails?: any[];
}

export class SecurityService {
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

  // Get security events for user
  async getSecurityEvents(
    userId: string,
    limit: number = 50
  ): Promise<SecurityEvent[]> {
    try {
      const { data, error } = await supabase
        .from("security_events")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Failed to fetch security events:", error);
      return [];
    }
  }

  // Check password against known breaches (simulated)
  async checkPasswordBreach(password: string): Promise<BreachCheckResult> {
    // In a real app, this would check against HaveIBeenPwned API
    // For now, we'll simulate with common passwords
    const commonBreachedPasswords = [
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
      "iloveyou",
      "trustno1",
      "1234567",
      "sunshine",
      "master",
      "123456789",
      "welcome123",
      "shadow",
      "ashley",
      "football",
      "jesus",
      "michael",
      "ninja",
      "mustang",
      "password1",
    ];

    const isBreached = commonBreachedPasswords.includes(password.toLowerCase());

    return {
      isBreached,
      breachCount: isBreached ? Math.floor(Math.random() * 1000000) + 10000 : 0,
      breachDetails: isBreached
        ? [
            {
              name: "Collection #1",
              date: "2019-01-07",
              compromisedAccounts: 773000000,
            },
          ]
        : [],
    };
  }

  // Analyze password security
  async analyzePasswordSecurity(passwords: any[]): Promise<{
    weakPasswords: any[];
    reusedPasswords: any[];
    oldPasswords: any[];
    breachedPasswords: any[];
  }> {
    const weakPasswords: any[] = [];
    const passwordMap = new Map<string, any[]>();
    const oldPasswords: any[] = [];
    const breachedPasswords: any[] = [];

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    for (const pwd of passwords) {
      // Check password strength
      const strength = calculatePasswordStrength(pwd.password);
      if (strength.score <= 2) {
        weakPasswords.push(pwd);
      }

      // Track password reuse
      const existing = passwordMap.get(pwd.password) || [];
      existing.push(pwd);
      passwordMap.set(pwd.password, existing);

      // Check for old passwords
      if (new Date(pwd.updatedAt) < ninetyDaysAgo) {
        oldPasswords.push(pwd);
      }

      // Check for breached passwords
      const breachResult = await this.checkPasswordBreach(pwd.password);
      if (breachResult.isBreached) {
        breachedPasswords.push({ ...pwd, breachInfo: breachResult });
      }
    }

    // Collect reused passwords
    const reusedPasswords: any[] = [];
    passwordMap.forEach((group) => {
      if (group.length > 1) {
        reusedPasswords.push(...group);
      }
    });

    return {
      weakPasswords,
      reusedPasswords,
      oldPasswords,
      breachedPasswords,
    };
  }

  // Generate security report
  async generateSecurityReport(userId: string): Promise<{
    overallScore: number;
    recommendations: string[];
    criticalIssues: string[];
    stats: any;
  }> {
    try {
      const { data: passwords } = await supabase
        .from("passwords")
        .select("*")
        .eq("user_id", userId);

      if (!passwords || passwords.length === 0) {
        return {
          overallScore: 100,
          recommendations: ["Start adding passwords to your vault"],
          criticalIssues: [],
          stats: {
            totalPasswords: 0,
            weakPasswords: 0,
            reusedPasswords: 0,
            oldPasswords: 0,
            breachedPasswords: 0,
          },
        };
      }

      const analysis = await this.analyzePasswordSecurity(passwords);
      const totalPasswords = passwords.length;

      // Calculate score
      const weakPercentage =
        (analysis.weakPasswords.length / totalPasswords) * 100;
      const reusedPercentage =
        (analysis.reusedPasswords.length / totalPasswords) * 100;
      const oldPercentage =
        (analysis.oldPasswords.length / totalPasswords) * 100;
      const breachedPercentage =
        (analysis.breachedPasswords.length / totalPasswords) * 100;

      const overallScore = Math.max(
        0,
        100 -
          weakPercentage -
          reusedPercentage -
          oldPercentage -
          breachedPercentage * 2
      );

      // Generate recommendations
      const recommendations: string[] = [];
      const criticalIssues: string[] = [];

      if (analysis.breachedPasswords.length > 0) {
        criticalIssues.push(
          `${analysis.breachedPasswords.length} password(s) found in data breaches!`
        );
      }

      if (analysis.weakPasswords.length > 0) {
        recommendations.push(
          `Strengthen ${analysis.weakPasswords.length} weak password(s)`
        );
      }

      if (analysis.reusedPasswords.length > 0) {
        recommendations.push(
          `Replace ${analysis.reusedPasswords.length} reused password(s)`
        );
      }

      if (analysis.oldPasswords.length > 0) {
        recommendations.push(
          `Update ${analysis.oldPasswords.length} old password(s)`
        );
      }

      if (recommendations.length === 0 && criticalIssues.length === 0) {
        recommendations.push("Great job! Your passwords are looking secure.");
      }

      return {
        overallScore: Math.round(overallScore),
        recommendations,
        criticalIssues,
        stats: {
          totalPasswords,
          weakPasswords: analysis.weakPasswords.length,
          reusedPasswords: analysis.reusedPasswords.length,
          oldPasswords: analysis.oldPasswords.length,
          breachedPasswords: analysis.breachedPasswords.length,
        },
      };
    } catch (error) {
      console.error("Failed to generate security report:", error);
      return {
        overallScore: 0,
        recommendations: ["Unable to generate security report"],
        criticalIssues: ["Error analyzing passwords"],
        stats: {},
      };
    }
  }

  // Enable two-factor authentication
  async enableTwoFactor(userId: string): Promise<{
    success: boolean;
    secret?: string;
    qrCode?: string;
  }> {
    // This would integrate with an authenticator app
    // For now, return a placeholder
    return {
      success: false,
      secret: undefined,
      qrCode: undefined,
    };
  }

  // Verify two-factor code
  async verifyTwoFactorCode(userId: string, code: string): Promise<boolean> {
    // Placeholder for 2FA verification
    return false;
  }
}

export const securityService = new SecurityService();
