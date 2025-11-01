import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../../src/contexts/AuthContext";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { router } from "expo-router";
import { useUserLanguages } from "../../src/hooks/useLanguages";
import { useLessons } from "../../src/hooks/useLessons";
import { useStreak } from "../../src/hooks/useProgress";
import { LessonCard } from "../../src/components/LessonCard";
import { StreakCounter } from "../../src/components/StreakCounter";

function LearnScreen() {
  const { user } = useAuth();
  const { currentLanguage, loading: langLoading } = useUserLanguages();
  const { lessons, loading: lessonsLoading } = useLessons();
  const { streak } = useStreak();

  const handleLanguageSelect = () => {
    router.push("/language-select");
  };

  const handleStartLesson = (lessonId: string) => {
    router.push(`/lesson/${lessonId}`);
  };

  const loading = langLoading || lessonsLoading;

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
        <Text style={styles.welcomeText}>Welcome back!</Text>
        <View style={styles.streakContainer}>
          <StreakCounter count={streak} size="small" />
        </View>
      </View>

      {currentLanguage ? (
        <View style={styles.languageSection}>
          <Text style={styles.sectionTitle}>Current Language</Text>
          <TouchableOpacity
            style={styles.languageCard}
            onPress={handleLanguageSelect}
          >
            <Text style={styles.languageFlag}>
              {currentLanguage.language?.flag_emoji || "🌍"}
            </Text>
            <View style={styles.languageInfo}>
              <Text style={styles.languageName}>
                {currentLanguage.language?.name || "Unknown"}
              </Text>
              <Text style={styles.languageLevel}>
                Level {currentLanguage.level} • {currentLanguage.xp} XP
              </Text>
            </View>
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.languageSection}>
          <TouchableOpacity
            style={styles.selectLanguageCard}
            onPress={handleLanguageSelect}
          >
            <Text style={styles.selectLanguageIcon}>🌍</Text>
            <Text style={styles.selectLanguageText}>
              Select a Language to Start Learning
            </Text>
            <Text style={styles.selectLanguageArrow}>›</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.lessonsSection}>
        <Text style={styles.sectionTitle}>
          {currentLanguage ? "Today's Lessons" : "Get Started"}
        </Text>

        {currentLanguage && lessons.length > 0 ? (
          lessons
            .slice(0, 5)
            .map((lesson) => (
              <LessonCard
                key={lesson.id}
                id={lesson.id}
                title={lesson.title}
                description={lesson.description}
                type={lesson.lesson_type}
                difficulty={lesson.difficulty_level}
                xpReward={lesson.xp_reward}
                isLocked={lesson.is_locked}
                progress={lesson.is_completed ? 100 : 0}
                onPress={() =>
                  !lesson.is_locked && handleStartLesson(lesson.id)
                }
              />
            ))
        ) : currentLanguage ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No lessons available yet.</Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Select a language above to see available lessons
            </Text>
          </View>
        )}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d3436",
  },
  streakContainer: {
    marginLeft: 16,
  },
  languageSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 12,
  },
  languageCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  languageFlag: {
    fontSize: 32,
    marginRight: 12,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d3436",
  },
  languageLevel: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  changeText: {
    color: "#00b894",
    fontSize: 14,
    fontWeight: "600",
  },
  lessonsSection: {
    padding: 20,
  },
  lessonCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lockedLesson: {
    opacity: 0.6,
  },
  lessonIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e8f8f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  lessonEmoji: {
    fontSize: 24,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 4,
  },
  lessonDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  lessonMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  lessonXP: {
    fontSize: 12,
    color: "#00b894",
    fontWeight: "600",
    marginRight: 12,
  },
  lessonType: {
    fontSize: 12,
    color: "#666",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lockedText: {
    fontSize: 12,
    color: "#999",
  },
  selectLanguageCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectLanguageIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  selectLanguageText: {
    flex: 1,
    fontSize: 16,
    color: "#2d3436",
    fontWeight: "500",
  },
  selectLanguageArrow: {
    fontSize: 24,
    color: "#00b894",
    fontWeight: "300",
  },
  emptyState: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    marginTop: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});

export default function Learn() {
  return (
    <ProtectedRoute>
      <LearnScreen />
    </ProtectedRoute>
  );
}
