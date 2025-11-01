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
import { useVocabulary } from "../../src/hooks/useVocabulary";
import { ProgressBar } from "../../src/components/ProgressBar";

function PracticeScreen() {
  const { user } = useAuth();
  const { stats, loading } = useVocabulary();

  const handleStartPractice = (type: string) => {
    router.push({
      pathname: "/vocabulary/practice",
      params: { type },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00b894" />
      </View>
    );
  }

  const masteryPercentage =
    stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Practice</Text>
        <Text style={styles.subtitle}>Strengthen your language skills</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.learned}</Text>
          <Text style={styles.statLabel}>Words Learned</Text>
        </View>
        <View style={styles.statCard}>
          <ProgressBar
            progress={masteryPercentage}
            height={8}
            color="#00b894"
            showLabel={false}
          />
          <Text style={styles.statLabel}>Overall Mastery</Text>
          <Text style={styles.statSubLabel}>{masteryPercentage}%</Text>
        </View>
      </View>

      <View style={styles.practiceSection}>
        <Text style={styles.sectionTitle}>Practice Modes</Text>

        <TouchableOpacity
          style={styles.practiceCard}
          onPress={() => handleStartPractice("flashcards")}
        >
          <View style={styles.practiceIcon}>
            <Text style={styles.practiceEmoji}>🃏</Text>
          </View>
          <View style={styles.practiceInfo}>
            <Text style={styles.practiceTitle}>Flashcards</Text>
            <Text style={styles.practiceDescription}>
              Review vocabulary with interactive flashcards
            </Text>
          </View>
          <Text style={styles.practiceArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.practiceCard}
          onPress={() => handleStartPractice("review")}
        >
          <View style={styles.practiceIcon}>
            <Text style={styles.practiceEmoji}>🔄</Text>
          </View>
          <View style={styles.practiceInfo}>
            <Text style={styles.practiceTitle}>Smart Review</Text>
            <Text style={styles.practiceDescription}>
              Practice words based on your learning progress
            </Text>
          </View>
          <Text style={styles.practiceArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.practiceCard}
          onPress={() => handleStartPractice("speed")}
        >
          <View style={styles.practiceIcon}>
            <Text style={styles.practiceEmoji}>⚡</Text>
          </View>
          <View style={styles.practiceInfo}>
            <Text style={styles.practiceTitle}>Speed Round</Text>
            <Text style={styles.practiceDescription}>
              Test your vocabulary knowledge against the clock
            </Text>
          </View>
          <Text style={styles.practiceArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recommendationSection}>
        <Text style={styles.sectionTitle}>Recommended for You</Text>
        <View style={styles.recommendationCard}>
          <Text style={styles.recommendationIcon}>💡</Text>
          <Text style={styles.recommendationText}>
            Start with Basic Greetings flashcards to build your foundation
          </Text>
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
  statsContainer: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
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
  statNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#00b894",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
  statSubLabel: {
    fontSize: 12,
    color: "#00b894",
    marginTop: 4,
    fontWeight: "600",
  },
  masteryBar: {
    width: 100,
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginBottom: 8,
    overflow: "hidden",
  },
  masteryProgress: {
    height: "100%",
    backgroundColor: "#00b894",
    borderRadius: 4,
  },
  practiceSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 16,
  },
  practiceCard: {
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
  practiceIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#e8f8f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  practiceEmoji: {
    fontSize: 24,
  },
  practiceInfo: {
    flex: 1,
  },
  practiceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 4,
  },
  practiceDescription: {
    fontSize: 14,
    color: "#666",
  },
  practiceArrow: {
    fontSize: 24,
    color: "#00b894",
    fontWeight: "300",
  },
  recommendationSection: {
    padding: 20,
    paddingTop: 0,
  },
  recommendationCard: {
    backgroundColor: "#e8f8f5",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  recommendationIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: "#2d3436",
    lineHeight: 20,
  },
});

export default function Practice() {
  return (
    <ProtectedRoute>
      <PracticeScreen />
    </ProtectedRoute>
  );
}
