import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useAuth } from "../../src/contexts/AuthContext";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { useProgress, useAchievements } from "../../src/hooks/useProgress";
import { AchievementBadge } from "../../src/components/AchievementBadge";
import { ProgressBar } from "../../src/components/ProgressBar";
import { router } from "expo-router";

function ProgressScreen() {
  const { user } = useAuth();
  const { stats, weeklyXP, loading: progressLoading } = useProgress();
  const {
    allAchievements,
    isUnlocked,
    getAchievementProgress,
    loading: achievementsLoading,
  } = useAchievements();

  const loading = progressLoading || achievementsLoading;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00b894" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Progress</Text>
        <Text style={styles.subtitle}>Track your learning journey</Text>
      </View>

      <View style={styles.overviewSection}>
        <View style={styles.overviewCard}>
          <View style={styles.levelIndicator}>
            <Text style={styles.levelNumber}>{stats?.level || 1}</Text>
          </View>
          <View style={styles.levelInfo}>
            <Text style={styles.levelTitle}>Level {stats?.level || 1}</Text>
            <ProgressBar
              progress={(stats?.total_xp || 0) % 100}
              height={8}
              showLabel={false}
            />
            <Text style={styles.xpText}>
              {(stats?.total_xp || 0) % 100} / 100 XP to Level{" "}
              {(stats?.level || 1) + 1}
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.total_xp || 0}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.current_streak || 0}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Lessons</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Words</Text>
          </View>
        </View>
      </View>

      <View style={styles.achievementsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <TouchableOpacity onPress={() => router.push("/achievements")}>
            <Text style={styles.viewAllLink}>View All →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.achievementsGrid}>
          {allAchievements.slice(0, 4).map((achievement) => (
            <View key={achievement.id} style={styles.achievementItem}>
              <AchievementBadge
                name={achievement.name}
                description={achievement.description}
                icon={achievement.icon}
                isUnlocked={isUnlocked(achievement.id)}
                progress={getAchievementProgress(achievement)}
                size="medium"
              />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.weeklySection}>
        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.weeklyChart}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => {
            const dayXP = weeklyXP[day] || 0;
            const maxXP = Math.max(...Object.values(weeklyXP), 20); // Minimum 20 for scale
            const barHeight = maxXP > 0 ? (dayXP / maxXP) * 80 : 0;

            return (
              <View key={day} style={styles.dayColumn}>
                <View style={[styles.dayBar, { height: barHeight }]} />
                <Text style={styles.dayLabel}>{day.charAt(0)}</Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.weeklyTotal}>
          {Object.values(weeklyXP).reduce((sum, xp) => sum + xp, 0)} XP earned
          this week
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2d3436",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  overviewSection: {
    padding: 20,
  },
  overviewCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  levelIndicator: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#00b894",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  levelNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 8,
  },
  xpBar: {
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginBottom: 4,
    overflow: "hidden",
  },
  xpProgress: {
    height: "100%",
    backgroundColor: "#00b894",
    borderRadius: 4,
  },
  xpText: {
    fontSize: 12,
    color: "#666",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#00b894",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
  achievementsSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewAllLink: {
    fontSize: 14,
    color: "#00b894",
    fontWeight: "500",
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  achievementItem: {
    width: "45%",
    alignItems: "center",
  },
  achievementIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#00b894",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  lockedAchievement: {
    backgroundColor: "#e0e0e0",
  },
  achievementEmoji: {
    fontSize: 24,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 2,
    textAlign: "center",
  },
  achievementDesc: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  weeklySection: {
    padding: 20,
    paddingTop: 0,
  },
  weeklyChart: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dayColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  dayBar: {
    width: "60%",
    backgroundColor: "#00b894",
    borderRadius: 2,
    marginBottom: 8,
  },
  dayLabel: {
    fontSize: 12,
    color: "#666",
  },
  weeklyTotal: {
    textAlign: "center",
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
});

export default function Progress() {
  return (
    <ProtectedRoute>
      <ProgressScreen />
    </ProtectedRoute>
  );
}
