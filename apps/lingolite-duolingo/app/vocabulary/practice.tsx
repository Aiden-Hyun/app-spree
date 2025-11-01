import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { VocabularyCard } from "../../src/components/VocabularyCard";
import { ProgressBar } from "../../src/components/ProgressBar";
import { useVocabularyPractice } from "../../src/hooks/useVocabulary";
import { useProgress } from "../../src/hooks/useProgress";

function VocabularyPracticeScreen() {
  const { user } = useAuth();
  const { type } = useLocalSearchParams<{ type?: string }>();
  const { checkAchievements } = useProgress();

  const {
    currentWord,
    currentIndex,
    totalWords,
    hasMore,
    isComplete,
    sessionStats,
    loading,
    error,
    handleAnswer,
    reset,
  } = useVocabularyPractice();

  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (isComplete && totalWords > 0) {
      setShowResults(true);
      // Check for new achievements after practice session
      checkAchievements();
    }
  }, [isComplete, totalWords, checkAchievements]);

  const handleKnow = async () => {
    await handleAnswer(true);
  };

  const handleDontKnow = async () => {
    await handleAnswer(false);
  };

  const handleFinish = () => {
    router.back();
  };

  const handlePracticeAgain = () => {
    setShowResults(false);
    reset();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00b894" />
        <Text style={styles.loadingText}>Loading vocabulary...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (totalWords === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📚</Text>
        <Text style={styles.emptyTitle}>No Words to Practice</Text>
        <Text style={styles.emptyText}>
          Start learning some lessons to build your vocabulary!
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (showResults) {
    const accuracy =
      sessionStats.total > 0
        ? Math.round((sessionStats.correct / sessionStats.total) * 100)
        : 0;

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsIcon}>🎉</Text>
          <Text style={styles.resultsTitle}>Practice Complete!</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{sessionStats.correct}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{sessionStats.incorrect}</Text>
              <Text style={styles.statLabel}>Incorrect</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{accuracy}%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
          </View>

          <View style={styles.resultActions}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handlePracticeAgain}
            >
              <Text style={styles.secondaryButtonText}>Practice Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleFinish}>
              <Text style={styles.buttonText}>Finish</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {currentIndex + 1} / {totalWords}
          </Text>
          <ProgressBar
            progress={((currentIndex + 1) / totalWords) * 100}
            height={6}
            animated={true}
          />
        </View>
      </View>

      <View style={styles.content}>
        {currentWord && (
          <VocabularyCard
            word={currentWord.word}
            translation={currentWord.translation}
            pronunciation={currentWord.pronunciation}
            onKnow={handleKnow}
            onDontKnow={handleDontKnow}
            showAnswer={true}
          />
        )}
      </View>

      <View style={styles.sessionStats}>
        <Text style={styles.sessionStatsText}>
          Session: ✅ {sessionStats.correct} | ❌ {sessionStats.incorrect}
        </Text>
      </View>
    </SafeAreaView>
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#e74c3c",
    textAlign: "center",
    marginBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d3436",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  closeButton: {
    fontSize: 24,
    color: "#666",
    marginBottom: 20,
  },
  progressContainer: {
    marginBottom: 10,
  },
  progressText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  sessionStats: {
    padding: 20,
    alignItems: "center",
  },
  sessionStatsText: {
    fontSize: 16,
    color: "#666",
  },
  resultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  resultsIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2d3436",
    marginBottom: 32,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
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
  statDivider: {
    width: 1,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 20,
  },
  resultActions: {
    width: "100%",
    gap: 12,
  },
  button: {
    backgroundColor: "#00b894",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#00b894",
  },
  secondaryButtonText: {
    color: "#00b894",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default function VocabularyPractice() {
  return (
    <ProtectedRoute>
      <VocabularyPracticeScreen />
    </ProtectedRoute>
  );
}
