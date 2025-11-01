import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useAuth } from "../../src/contexts/AuthContext";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../src/supabase";

interface UserStats {
  wake_up_streak: number;
  total_challenges_completed: number;
  average_wake_time?: string;
  most_used_challenge?: string;
}

interface WeeklyStats {
  day: string;
  wake_ups: number;
  on_time: number;
}

function StatsScreen() {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserStats>({
    wake_up_streak: 0,
    total_challenges_completed: 0,
  });
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch user stats
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("wake_up_streak, total_challenges_completed")
        .eq("id", user?.id)
        .single();

      if (userError) throw userError;
      if (userData) {
        setUserStats(userData);
      }

      // Fetch weekly wake-up sessions
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: sessions, error: sessionsError } = await supabase
        .from("wake_up_sessions")
        .select("*")
        .eq("user_id", user?.id)
        .gte("created_at", weekAgo.toISOString());

      if (sessionsError) throw sessionsError;

      // Process weekly stats
      const dayStats = processWeeklyStats(sessions || []);
      setWeeklyStats(dayStats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const processWeeklyStats = (sessions: any[]): WeeklyStats[] => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const stats: WeeklyStats[] = days.map((day) => ({
      day,
      wake_ups: 0,
      on_time: 0,
    }));

    sessions.forEach((session) => {
      const dayIndex = new Date(session.created_at).getDay();
      stats[dayIndex].wake_ups++;
      if (session.challenge_completed) {
        stats[dayIndex].on_time++;
      }
    });

    return stats;
  };

  const StatCard = ({ icon, title, value, subtitle }: any) => (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={32} color="#f39c12" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Wake-Up Stats</Text>
        <Text style={styles.headerSubtitle}>Keep up the great work!</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading stats...</Text>
        </View>
      ) : (
        <>
          <View style={styles.statsGrid}>
            <StatCard
              icon="flame"
              title="Current Streak"
              value={userStats.wake_up_streak}
              subtitle="days"
            />
            <StatCard
              icon="trophy"
              title="Challenges"
              value={userStats.total_challenges_completed}
              subtitle="completed"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>This Week</Text>
            <View style={styles.weekChart}>
              {weeklyStats.map((stat, index) => (
                <View key={index} style={styles.dayColumn}>
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height:
                            stat.wake_ups > 0
                              ? `${(stat.on_time / stat.wake_ups) * 100}%`
                              : "0%",
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.dayLabel}>{stat.day}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <View style={styles.achievementsGrid}>
              <View style={styles.achievementCard}>
                <Ionicons name="medal" size={40} color="#f39c12" />
                <Text style={styles.achievementName}>Early Bird</Text>
                <Text style={styles.achievementDesc}>Wake up 7 days</Text>
              </View>
              <View style={styles.achievementCard}>
                <Ionicons name="flash" size={40} color="#e74c3c" />
                <Text style={styles.achievementName}>Speed Demon</Text>
                <Text style={styles.achievementDesc}>
                  Complete 10 challenges
                </Text>
              </View>
              <View style={[styles.achievementCard, styles.lockedAchievement]}>
                <Ionicons name="lock-closed" size={40} color="#bdc3c7" />
                <Text style={styles.achievementName}>Master</Text>
                <Text style={styles.achievementDesc}>30 day streak</Text>
              </View>
              <View style={[styles.achievementCard, styles.lockedAchievement]}>
                <Ionicons name="lock-closed" size={40} color="#bdc3c7" />
                <Text style={styles.achievementName}>Legend</Text>
                <Text style={styles.achievementDesc}>100 challenges</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sleep Quality</Text>
            <View style={styles.qualityCard}>
              <Text style={styles.qualityText}>
                Track your sleep to see quality metrics
              </Text>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    padding: 20,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#7f8c8d",
    marginTop: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#7f8c8d",
  },
  statsGrid: {
    flexDirection: "row",
    padding: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#2c3e50",
    marginTop: 8,
  },
  statTitle: {
    fontSize: 14,
    color: "#7f8c8d",
    marginTop: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: "#95a5a6",
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 16,
  },
  weekChart: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    height: 160,
  },
  dayColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  barContainer: {
    flex: 1,
    width: "60%",
    backgroundColor: "#ecf0f1",
    borderRadius: 4,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  bar: {
    backgroundColor: "#f39c12",
    borderRadius: 4,
  },
  dayLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 8,
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  achievementCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    width: "47%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lockedAchievement: {
    opacity: 0.5,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
    marginTop: 8,
  },
  achievementDesc: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 4,
    textAlign: "center",
  },
  qualityCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  qualityText: {
    fontSize: 14,
    color: "#7f8c8d",
    textAlign: "center",
  },
});

export default function Stats() {
  return (
    <ProtectedRoute>
      <StatsScreen />
    </ProtectedRoute>
  );
}
