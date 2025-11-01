import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  progressService,
  UserStats,
  Achievement,
  UserAchievement,
} from "../services/progressService";

export function useProgress() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [weeklyXP, setWeeklyXP] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch user stats
      const userStats = await progressService.getUserStats(user.id);
      setStats(userStats);

      // Fetch achievements
      const userAchievements = await progressService.getUserAchievements(
        user.id
      );
      setAchievements(userAchievements);

      // Fetch weekly XP
      const weekly = await progressService.getWeeklyXP(user.id);
      setWeeklyXP(weekly);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch progress");
      console.error("Error fetching progress:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const checkAchievements = useCallback(async () => {
    if (!user?.id) return [];

    try {
      const newAchievements = await progressService.checkAchievements(user.id);
      if (newAchievements.length > 0) {
        // Refresh achievements list
        await fetchProgress();
      }
      return newAchievements;
    } catch (err) {
      console.error("Error checking achievements:", err);
      return [];
    }
  }, [user?.id, fetchProgress]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return {
    stats,
    achievements,
    weeklyXP,
    loading,
    error,
    checkAchievements,
    refetch: fetchProgress,
  };
}

export function useAchievements() {
  const { user } = useAuth();
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAchievements = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch all achievements
      const all = await progressService.getAchievements();
      setAllAchievements(all);

      // Fetch user's achievements
      const userAchs = await progressService.getUserAchievements(user.id);
      setUserAchievements(userAchs);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch achievements"
      );
      console.error("Error fetching achievements:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const getAchievementProgress = useCallback(
    (achievement: Achievement): number => {
      if (!stats) return 0;

      if (achievement.xp_threshold) {
        return Math.min((stats.total_xp / achievement.xp_threshold) * 100, 100);
      }

      if (achievement.streak_threshold) {
        return Math.min(
          (stats.current_streak / achievement.streak_threshold) * 100,
          100
        );
      }

      if (achievement.lesson_threshold) {
        // This would need to be fetched separately
        return 0;
      }

      return 0;
    },
    []
  );

  const isUnlocked = useCallback(
    (achievementId: string): boolean => {
      return userAchievements.some((ua) => ua.achievement_id === achievementId);
    },
    [userAchievements]
  );

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  // Get stats for progress calculation
  const { stats } = useProgress();

  return {
    allAchievements,
    userAchievements,
    loading,
    error,
    getAchievementProgress,
    isUnlocked,
    refetch: fetchAchievements,
  };
}

export function useStreak() {
  const { user } = useAuth();
  const { stats, refetch } = useProgress();
  const [updating, setUpdating] = useState(false);

  const updateStreak = useCallback(async () => {
    if (!user?.id) return;

    try {
      setUpdating(true);
      await progressService.updateStreak(user.id);
      await refetch();
    } catch (err) {
      console.error("Error updating streak:", err);
    } finally {
      setUpdating(false);
    }
  }, [user?.id, refetch]);

  return {
    streak: stats?.current_streak || 0,
    updateStreak,
    updating,
  };
}
