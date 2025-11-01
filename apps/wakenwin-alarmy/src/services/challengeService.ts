import { supabase } from "../supabase";
import * as Haptics from "expo-haptics";

export type ChallengeType =
  | "basic"
  | "math"
  | "shake"
  | "photo"
  | "memory"
  | "typing";
export type ChallengeDifficulty = "easy" | "medium" | "hard";

export interface Challenge {
  id: string;
  user_id: string;
  alarm_id: string;
  challenge_type: ChallengeType;
  difficulty: ChallengeDifficulty;
  completed_at?: string;
  failed_at?: string;
  created_at: string;
}

export interface MathProblem {
  question: string;
  answer: number;
}

export class ChallengeService {
  static async createChallenge(
    userId: string,
    alarmId: string,
    challengeType: ChallengeType,
    difficulty: ChallengeDifficulty = "easy"
  ): Promise<Challenge> {
    const { data, error } = await supabase
      .from("challenges")
      .insert({
        user_id: userId,
        alarm_id: alarmId,
        challenge_type: challengeType,
        difficulty,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async completeChallenge(challengeId: string): Promise<void> {
    const { error } = await supabase
      .from("challenges")
      .update({
        completed_at: new Date().toISOString(),
      })
      .eq("id", challengeId);

    if (error) throw error;

    // Update user stats
    const { data: challenge } = await supabase
      .from("challenges")
      .select("user_id")
      .eq("id", challengeId)
      .single();

    if (challenge) {
      await this.updateUserStats(challenge.user_id);
    }

    // Haptic feedback
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  static async failChallenge(challengeId: string): Promise<void> {
    const { error } = await supabase
      .from("challenges")
      .update({
        failed_at: new Date().toISOString(),
      })
      .eq("id", challengeId);

    if (error) throw error;

    // Haptic feedback
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }

  private static async updateUserStats(userId: string): Promise<void> {
    // Get current stats
    const { data: user } = await supabase
      .from("users")
      .select("wake_up_streak, total_challenges_completed")
      .eq("id", userId)
      .single();

    if (!user) return;

    // Check if this continues a streak
    const { data: yesterdaySession } = await supabase
      .from("wake_up_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("challenge_completed", true)
      .gte(
        "created_at",
        new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
      )
      .lte(
        "created_at",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      )
      .single();

    const newStreak = yesterdaySession ? user.wake_up_streak + 1 : 1;

    // Update user stats
    await supabase
      .from("users")
      .update({
        wake_up_streak: newStreak,
        total_challenges_completed: user.total_challenges_completed + 1,
      })
      .eq("id", userId);

    // Check for achievements
    await this.checkAchievements(
      userId,
      newStreak,
      user.total_challenges_completed + 1
    );
  }

  private static async checkAchievements(
    userId: string,
    streak: number,
    totalChallenges: number
  ): Promise<void> {
    const achievements = [
      { type: "early_bird_7", condition: streak >= 7 },
      { type: "early_bird_30", condition: streak >= 30 },
      { type: "challenge_rookie", condition: totalChallenges >= 10 },
      { type: "challenge_master", condition: totalChallenges >= 100 },
      { type: "streak_warrior", condition: streak >= 50 },
    ];

    for (const achievement of achievements) {
      if (achievement.condition) {
        await supabase.from("achievements").upsert(
          {
            user_id: userId,
            type: achievement.type,
            unlocked_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,type",
          }
        );
      }
    }
  }

  // Math Challenge Methods
  static generateMathProblem(difficulty: ChallengeDifficulty): MathProblem {
    let num1: number, num2: number, operator: string, answer: number;

    switch (difficulty) {
      case "easy":
        num1 = Math.floor(Math.random() * 10) + 1;
        num2 = Math.floor(Math.random() * 10) + 1;
        operator = ["+", "-"][Math.floor(Math.random() * 2)];
        break;
      case "medium":
        num1 = Math.floor(Math.random() * 50) + 10;
        num2 = Math.floor(Math.random() * 20) + 1;
        operator = ["+", "-", "*"][Math.floor(Math.random() * 3)];
        break;
      case "hard":
        num1 = Math.floor(Math.random() * 100) + 50;
        num2 = Math.floor(Math.random() * 50) + 10;
        operator = ["+", "-", "*", "/"][Math.floor(Math.random() * 4)];
        break;
    }

    switch (operator) {
      case "+":
        answer = num1 + num2;
        break;
      case "-":
        answer = num1 - num2;
        break;
      case "*":
        answer = num1 * num2;
        break;
      case "/":
        // Ensure clean division
        num1 = num2 * Math.floor(num1 / num2);
        answer = num1 / num2;
        break;
      default:
        answer = num1 + num2;
    }

    return {
      question: `${num1} ${operator} ${num2} = ?`,
      answer: Math.round(answer),
    };
  }

  static generateMathProblems(
    count: number,
    difficulty: ChallengeDifficulty
  ): MathProblem[] {
    return Array(count)
      .fill(null)
      .map(() => this.generateMathProblem(difficulty));
  }

  // Shake Challenge Methods
  static getShakeCount(difficulty: ChallengeDifficulty): number {
    switch (difficulty) {
      case "easy":
        return 10;
      case "medium":
        return 20;
      case "hard":
        return 30;
      default:
        return 10;
    }
  }

  // Memory Challenge Methods
  static generateMemorySequence(difficulty: ChallengeDifficulty): number[] {
    const length = difficulty === "easy" ? 4 : difficulty === "medium" ? 6 : 8;
    return Array(length)
      .fill(null)
      .map(() => Math.floor(Math.random() * 9) + 1);
  }

  // Typing Challenge Methods
  static getTypingPhrases(difficulty: ChallengeDifficulty): string[] {
    const phrases = {
      easy: ["I am awake", "Good morning", "Rise and shine", "Time to start"],
      medium: [
        "Today is going to be amazing",
        "I am ready to conquer the day",
        "Success starts with waking up",
        "Every morning is a fresh start",
      ],
      hard: [
        "The early bird catches the worm and succeeds",
        "Discipline is choosing between what you want now and what you want most",
        "Wake up with determination and go to bed with satisfaction",
        "Your future is created by what you do today not tomorrow",
      ],
    };

    return phrases[difficulty];
  }

  static getRandomTypingPhrase(difficulty: ChallengeDifficulty): string {
    const phrases = this.getTypingPhrases(difficulty);
    return phrases[Math.floor(Math.random() * phrases.length)];
  }
}
