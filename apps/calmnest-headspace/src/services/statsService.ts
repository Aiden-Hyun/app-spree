import { supabase } from '../supabase';
import { UserStats, MeditationSession } from '../types';

export class StatsService {
  // Get comprehensive user statistics
  async getUserStats(userId: string): Promise<UserStats> {
    // Fetch all user sessions
    const { data: sessions, error } = await supabase
      .from('meditation_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error) throw error;

    if (!sessions || sessions.length === 0) {
      return {
        total_sessions: 0,
        total_minutes: 0,
        current_streak: 0,
        longest_streak: 0,
        weekly_minutes: Array(7).fill(0),
        mood_improvement: 0,
      };
    }

    // Calculate basic stats
    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((sum, session) => sum + session.duration_minutes, 0);

    // Calculate streaks
    const currentStreak = this.calculateCurrentStreak(sessions);
    const longestStreak = this.calculateLongestStreak(sessions);

    // Calculate weekly minutes (last 7 days)
    const weeklyMinutes = this.calculateWeeklyMinutes(sessions);

    // Calculate favorite time of day
    const favoriteTimeOfDay = this.calculateFavoriteTimeOfDay(sessions);

    // Calculate most used category
    const mostUsedCategory = this.calculateMostUsedCategory(sessions);

    // Calculate mood improvement
    const moodImprovement = this.calculateMoodImprovement(sessions);

    return {
      total_sessions: totalSessions,
      total_minutes: totalMinutes,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      favorite_time_of_day: favoriteTimeOfDay,
      most_used_category: mostUsedCategory,
      weekly_minutes: weeklyMinutes,
      mood_improvement: moodImprovement,
    };
  }

  private calculateCurrentStreak(sessions: MeditationSession[]): number {
    if (sessions.length === 0) return 0;

    let streak = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastSession = new Date(sessions[0].completed_at);
    lastSession.setHours(0, 0, 0, 0);

    // Check if last session was today or yesterday
    const dayDiff = Math.floor((today.getTime() - lastSession.getTime()) / (1000 * 60 * 60 * 24));
    if (dayDiff > 1) return 0;

    // Count consecutive days
    for (let i = 1; i < sessions.length; i++) {
      const currentDate = new Date(sessions[i - 1].completed_at);
      const previousDate = new Date(sessions[i].completed_at);
      
      currentDate.setHours(0, 0, 0, 0);
      previousDate.setHours(0, 0, 0, 0);
      
      const diff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diff === 1) {
        streak++;
      } else if (diff > 1) {
        break;
      }
    }

    return streak;
  }

  private calculateLongestStreak(sessions: MeditationSession[]): number {
    if (sessions.length === 0) return 0;

    let longestStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < sessions.length; i++) {
      const currentDate = new Date(sessions[i - 1].completed_at);
      const previousDate = new Date(sessions[i].completed_at);
      
      currentDate.setHours(0, 0, 0, 0);
      previousDate.setHours(0, 0, 0, 0);
      
      const diff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diff === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else if (diff > 1) {
        currentStreak = 1;
      }
    }

    return longestStreak;
  }

  private calculateWeeklyMinutes(sessions: MeditationSession[]): number[] {
    const weeklyMinutes = Array(7).fill(0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    sessions.forEach(session => {
      const sessionDate = new Date(session.completed_at);
      sessionDate.setHours(0, 0, 0, 0);
      
      const dayDiff = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayDiff >= 0 && dayDiff < 7) {
        weeklyMinutes[6 - dayDiff] += session.duration_minutes;
      }
    });

    return weeklyMinutes;
  }

  private calculateFavoriteTimeOfDay(sessions: MeditationSession[]): string {
    const hourCounts: { [key: string]: number } = {};

    sessions.forEach(session => {
      const hour = new Date(session.completed_at).getHours();
      let timeOfDay: string;

      if (hour >= 5 && hour < 12) {
        timeOfDay = 'Morning';
      } else if (hour >= 12 && hour < 17) {
        timeOfDay = 'Afternoon';
      } else if (hour >= 17 && hour < 21) {
        timeOfDay = 'Evening';
      } else {
        timeOfDay = 'Night';
      }

      hourCounts[timeOfDay] = (hourCounts[timeOfDay] || 0) + 1;
    });

    let maxCount = 0;
    let favoriteTime = 'Morning';

    Object.entries(hourCounts).forEach(([time, count]) => {
      if (count > maxCount) {
        maxCount = count;
        favoriteTime = time;
      }
    });

    return favoriteTime;
  }

  private calculateMostUsedCategory(sessions: MeditationSession[]): string {
    const categoryCounts: { [key: string]: number } = {};

    sessions.forEach(session => {
      categoryCounts[session.session_type] = (categoryCounts[session.session_type] || 0) + 1;
    });

    let maxCount = 0;
    let mostUsed = 'meditation';

    Object.entries(categoryCounts).forEach(([category, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostUsed = category;
      }
    });

    return mostUsed;
  }

  private calculateMoodImprovement(sessions: MeditationSession[]): number {
    const sessionsWithMood = sessions.filter(s => s.mood_before && s.mood_after);
    
    if (sessionsWithMood.length === 0) return 0;

    const totalImprovement = sessionsWithMood.reduce((sum, session) => {
      return sum + ((session.mood_after || 0) - (session.mood_before || 0));
    }, 0);

    return Math.round((totalImprovement / sessionsWithMood.length) * 10) / 10;
  }

  // Get weekly statistics for chart display
  async getWeeklyStats(userId: string) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const { data, error } = await supabase
      .from('meditation_sessions')
      .select('completed_at, duration_minutes')
      .eq('user_id', userId)
      .gte('completed_at', startDate.toISOString())
      .lte('completed_at', endDate.toISOString())
      .order('completed_at', { ascending: true });

    if (error) throw error;

    // Group by day
    const dailyStats: { [key: string]: number } = {};
    
    data?.forEach(session => {
      const date = new Date(session.completed_at).toLocaleDateString();
      dailyStats[date] = (dailyStats[date] || 0) + session.duration_minutes;
    });

    return dailyStats;
  }

  // Get monthly statistics
  async getMonthlyStats(userId: string) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    const { data, error } = await supabase
      .from('meditation_sessions')
      .select('completed_at, duration_minutes, session_type')
      .eq('user_id', userId)
      .gte('completed_at', startDate.toISOString())
      .lte('completed_at', endDate.toISOString())
      .order('completed_at', { ascending: true });

    if (error) throw error;

    return {
      sessions: data,
      totalMinutes: data?.reduce((sum, session) => sum + session.duration_minutes, 0) || 0,
      totalSessions: data?.length || 0,
    };
  }
}

export const statsService = new StatsService();
