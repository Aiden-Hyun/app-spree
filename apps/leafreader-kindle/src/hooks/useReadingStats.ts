import { useState, useEffect, useCallback } from "react";
import {
  progressService,
  ReadingStats,
  ReadingSession,
} from "../services/progressService";

interface WeeklyData {
  day: string;
  minutes: number;
}

export function useReadingStats() {
  const [stats, setStats] = useState<ReadingStats>({
    totalBooksRead: 0,
    totalPagesRead: 0,
    totalReadingTime: 0,
    averageReadingSpeed: 0,
    currentStreak: 0,
    longestStreak: 0,
    dailyGoalProgress: 0,
  });
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [recentSessions, setRecentSessions] = useState<ReadingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load overall stats
      const statsData = await progressService.getReadingStats();
      setStats(statsData);

      // Load recent sessions
      const sessions = await progressService.getAllSessions();
      setRecentSessions(sessions.slice(0, 5)); // Show last 5 sessions

      // Calculate weekly data
      const weekData = calculateWeeklyData(sessions);
      setWeeklyData(weekData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
      console.error("Error loading stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateWeeklyData = (sessions: ReadingSession[]): WeeklyData[] => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const weekData: WeeklyData[] = [];

    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];
      const dateStr = date.toDateString();

      // Calculate minutes for this day
      const dayMinutes = sessions
        .filter(
          (session) => new Date(session.created_at).toDateString() === dateStr
        )
        .reduce((sum, session) => sum + session.duration_minutes, 0);

      weekData.push({
        day: dayName,
        minutes: dayMinutes,
      });
    }

    return weekData;
  };

  const refresh = useCallback(async () => {
    await loadStats();
  }, [loadStats]);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Format functions
  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return {
    stats,
    weeklyData,
    recentSessions,
    loading,
    error,
    refresh,
    formatTime,
    formatNumber,
  };
}


