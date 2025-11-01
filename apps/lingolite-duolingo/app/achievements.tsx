import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useAuth } from "../src/contexts/AuthContext";
import { ProtectedRoute } from "../src/components/ProtectedRoute";
import { useAchievements } from "../src/hooks/useProgress";
import { AchievementBadge } from "../src/components/AchievementBadge";
import { router } from "expo-router";

function AchievementsScreen() {
  const { user } = useAuth();
  const {
    allAchievements,
    userAchievements,
    isUnlocked,
    getAchievementProgress,
    loading,
  } = useAchievements();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00b894" />
      </View>
    );
  }

  const unlockedCount = userAchievements.length;
  const totalCount = allAchievements.length;
  const completionPercentage =
    totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Achievements</Text>
        <Text style={styles.subtitle}>
          Unlock achievements as you progress in your learning journey
        </Text>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Overall Progress</Text>
          <Text style={styles.progressValue}>
            {unlockedCount} / {totalCount}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${completionPercentage}%` },
              ]}
            />
          </View>
          <Text style={styles.progressPercentage}>
            {completionPercentage}% Complete
          </Text>
        </View>
      </View>

      <View style={styles.achievementsSection}>
        <Text style={styles.sectionTitle}>All Achievements</Text>

        <View style={styles.achievementsGrid}>
          {allAchievements.map((achievement) => {
            const unlocked = isUnlocked(achievement.id);
            const progress = getAchievementProgress(achievement);

            return (
              <TouchableOpacity
                key={achievement.id}
                style={styles.achievementCard}
                activeOpacity={0.8}
              >
                <AchievementBadge
                  name={achievement.name}
                  description={achievement.description}
                  icon={achievement.icon}
                  isUnlocked={unlocked}
                  progress={progress}
                  size="large"
                />

                {!unlocked && (
                  <View style={styles.requirementText}>
                    {achievement.xp_threshold && (
                      <Text style={styles.requirement}>
                        Earn {achievement.xp_threshold} XP
                      </Text>
                    )}
                    {achievement.streak_threshold && (
                      <Text style={styles.requirement}>
                        {achievement.streak_threshold} day streak
                      </Text>
                    )}
                    {achievement.lesson_threshold && (
                      <Text style={styles.requirement}>
                        Complete {achievement.lesson_threshold} lessons
                      </Text>
                    )}
                  </View>
                )}

                {unlocked &&
                  userAchievements.find(
                    (ua) => ua.achievement_id === achievement.id
                  ) && (
                    <Text style={styles.unlockedDate}>
                      Unlocked{" "}
                      {new Date(
                        userAchievements.find(
                          (ua) => ua.achievement_id === achievement.id
                        )!.earned_at
                      ).toLocaleDateString()}
                    </Text>
                  )}
              </TouchableOpacity>
            );
          })}
        </View>
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
  backButton: {
    fontSize: 16,
    color: "#00b894",
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2d3436",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    lineHeight: 22,
  },
  progressSection: {
    padding: 20,
  },
  progressCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 12,
  },
  progressValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#00b894",
    marginBottom: 16,
  },
  progressBar: {
    width: "100%",
    height: 12,
    backgroundColor: "#e0e0e0",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#00b894",
    borderRadius: 6,
  },
  progressPercentage: {
    fontSize: 14,
    color: "#666",
  },
  achievementsSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 20,
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  achievementCard: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requirementText: {
    marginTop: 12,
    alignItems: "center",
  },
  requirement: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    lineHeight: 18,
  },
  unlockedDate: {
    fontSize: 12,
    color: "#00b894",
    marginTop: 12,
    textAlign: "center",
  },
});

export default function Achievements() {
  return (
    <ProtectedRoute>
      <AchievementsScreen />
    </ProtectedRoute>
  );
}
