import { supabase } from "../supabase";

export interface UserStats {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  current_streak: number;
  total_xp: number;
  level: number;
  preferences: any;
  created_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_threshold: number | null;
  streak_threshold: number | null;
  lesson_threshold: number | null;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: Achievement;
}

export const progressService = {
  // Get user stats
  async getUserStats(userId: string): Promise<UserStats | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  },

  // Update user XP and level
  async addXP(userId: string, xpToAdd: number): Promise<UserStats> {
    // Get current stats
    const { data: current, error: fetchError } = await supabase
      .from("users")
      .select("total_xp, level")
      .eq("id", userId)
      .single();

    if (fetchError) throw fetchError;

    const newXP = (current.total_xp || 0) + xpToAdd;
    const newLevel = Math.floor(newXP / 100) + 1; // 100 XP per level

    // Update user stats
    const { data, error } = await supabase
      .from("users")
      .update({
        total_xp: newXP,
        level: newLevel,
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;

    // Check for achievements
    await this.checkAchievements(userId);

    return data;
  },

  // Update user streak
  async updateStreak(userId: string): Promise<number> {
    // Get last activity
    const { data: lastProgress, error: progressError } = await supabase
      .from("user_progress")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (progressError && progressError.code !== "PGRST116") throw progressError;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let newStreak = 1;

    if (lastProgress) {
      const lastActivity = new Date(lastProgress.created_at);
      const lastActivityDate = new Date(
        lastActivity.getFullYear(),
        lastActivity.getMonth(),
        lastActivity.getDate()
      );

      const daysDiff = Math.floor(
        (today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === 0) {
        // Already practiced today, maintain streak
        const { data: current } = await supabase
          .from("users")
          .select("current_streak")
          .eq("id", userId)
          .single();

        return current?.current_streak || 1;
      } else if (daysDiff === 1) {
        // Practiced yesterday, increment streak
        const { data: current } = await supabase
          .from("users")
          .select("current_streak")
          .eq("id", userId)
          .single();

        newStreak = (current?.current_streak || 0) + 1;
      }
      // else: missed days, reset to 1
    }

    // Update streak
    const { data, error } = await supabase
      .from("users")
      .update({ current_streak: newStreak })
      .eq("id", userId)
      .select("current_streak")
      .single();

    if (error) throw error;

    // Check for streak achievements
    await this.checkAchievements(userId);

    return data.current_streak;
  },

  // Get all achievements
  async getAchievements(): Promise<Achievement[]> {
    const { data, error } = await supabase
      .from("achievements")
      .select("*")
      .order("name");

    if (error) throw error;
    return data || [];
  },

  // Get user's earned achievements
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    const { data, error } = await supabase
      .from("user_achievements")
      .select(
        `
        *,
        achievement:achievements(*)
      `
      )
      .eq("user_id", userId)
      .order("earned_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Check and award achievements
  async checkAchievements(userId: string): Promise<Achievement[]> {
    // Get user stats
    const userStats = await this.getUserStats(userId);
    if (!userStats) return [];

    // Get completed lessons count
    const { count: lessonCount } = await supabase
      .from("user_progress")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .not("completed_at", "is", null);

    // Get all achievements
    const achievements = await this.getAchievements();

    // Get user's current achievements
    const userAchievements = await this.getUserAchievements(userId);
    const earnedIds = new Set(userAchievements.map((ua) => ua.achievement_id));

    // Check which achievements should be awarded
    const newAchievements: Achievement[] = [];

    for (const achievement of achievements) {
      if (earnedIds.has(achievement.id)) continue;

      let shouldAward = false;

      if (
        achievement.xp_threshold &&
        userStats.total_xp >= achievement.xp_threshold
      ) {
        shouldAward = true;
      }

      if (
        achievement.streak_threshold &&
        userStats.current_streak >= achievement.streak_threshold
      ) {
        shouldAward = true;
      }

      if (
        achievement.lesson_threshold &&
        lessonCount &&
        lessonCount >= achievement.lesson_threshold
      ) {
        shouldAward = true;
      }

      if (shouldAward) {
        // Award achievement
        const { error } = await supabase.from("user_achievements").insert({
          user_id: userId,
          achievement_id: achievement.id,
        });

        if (!error) {
          newAchievements.push(achievement);
        }
      }
    }

    return newAchievements;
  },

  // Get weekly XP data
  async getWeeklyXP(userId: string): Promise<{ [key: string]: number }> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from("user_progress")
      .select("completed_at, lesson_id")
      .eq("user_id", userId)
      .gte("completed_at", weekAgo.toISOString())
      .not("completed_at", "is", null);

    if (error) throw error;

    // Get lesson XP rewards
    const lessonIds = [...new Set(data?.map((p) => p.lesson_id) || [])];
    const { data: lessons } = await supabase
      .from("lessons")
      .select("id, xp_reward")
      .in("id", lessonIds);

    const lessonXPMap = new Map(lessons?.map((l) => [l.id, l.xp_reward]) || []);

    // Calculate daily XP
    const dailyXP: { [key: string]: number } = {};
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Initialize all days to 0
    days.forEach((day) => {
      dailyXP[day] = 0;
    });

    data?.forEach((progress) => {
      const date = new Date(progress.completed_at!);
      const dayName = days[date.getDay()];
      const xp = lessonXPMap.get(progress.lesson_id) || 0;
      dailyXP[dayName] += xp;
    });

    return dailyXP;
  },
};


