import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { useLesson, useLessons } from "../../src/hooks/useLessons";
import { useVocabulary } from "../../src/hooks/useVocabulary";
import { VocabularyCard } from "../../src/components/VocabularyCard";
import { ProgressBar } from "../../src/components/ProgressBar";

function LessonScreen() {
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lesson, loading: lessonLoading } = useLesson(id);
  const { completeLesson } = useLessons();
  const {
    vocabulary,
    loading: vocabLoading,
    updateProgress,
  } = useVocabulary({
    languageId: lesson?.language_id,
    difficultyLevel: lesson?.difficulty_level,
    limit: 10, // Limit words per lesson
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [startTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);
  const [answers, setAnswers] = useState<{ [key: string]: boolean }>({});

  const loading = lessonLoading || vocabLoading;
  const currentWord = vocabulary[currentIndex];
  const progress =
    vocabulary.length > 0 ? ((currentIndex + 1) / vocabulary.length) * 100 : 0;

  const handleAnswer = async (correct: boolean) => {
    if (!currentWord) return;

    // Track answer
    setAnswers((prev) => ({ ...prev, [currentWord.id]: correct }));

    // Update vocabulary progress
    await updateProgress(currentWord.id, correct);

    if (correct) {
      setScore((prev) => prev + 1);
    }

    // Move to next word or complete
    if (currentIndex < vocabulary.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handleComplete = async () => {
    if (!lesson) return;

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const finalScore = Math.round((score / vocabulary.length) * 100);

    try {
      await completeLesson(lesson.id, finalScore, timeSpent);

      Alert.alert(
        "Lesson Complete! 🎉",
        `You earned ${lesson.xp_reward} XP!\nScore: ${finalScore}%`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to save lesson progress");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00b894" />
        <Text style={styles.loadingText}>Loading lesson...</Text>
      </View>
    );
  }

  if (!lesson) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Lesson not found</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (vocabulary.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          No vocabulary available for this lesson
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isComplete) {
    const finalScore = Math.round((score / vocabulary.length) * 100);

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.completeContainer}>
          <Text style={styles.completeIcon}>🎉</Text>
          <Text style={styles.completeTitle}>Lesson Complete!</Text>

          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Your Score</Text>
            <Text style={styles.scoreValue}>{finalScore}%</Text>
            <Text style={styles.scoreDetail}>
              {score} out of {vocabulary.length} correct
            </Text>
          </View>

          <View style={styles.xpCard}>
            <Text style={styles.xpLabel}>XP Earned</Text>
            <Text style={styles.xpValue}>+{lesson.xp_reward} XP</Text>
          </View>

          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleComplete}
          >
            <Text style={styles.completeButtonText}>Continue</Text>
          </TouchableOpacity>
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

        <View style={styles.lessonInfo}>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          <Text style={styles.lessonType}>{lesson.lesson_type}</Text>
        </View>

        <View style={styles.progressContainer}>
          <ProgressBar progress={progress} height={6} animated={true} />
          <Text style={styles.progressText}>
            {currentIndex + 1} / {vocabulary.length}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {currentWord && (
          <VocabularyCard
            word={currentWord.word}
            translation={currentWord.translation}
            pronunciation={currentWord.pronunciation}
            onKnow={() => handleAnswer(true)}
            onDontKnow={() => handleAnswer(false)}
            showAnswer={true}
          />
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.scoreText}>
          Score: {score}/{currentIndex}
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
    fontSize: 18,
    color: "#e74c3c",
    marginBottom: 20,
    textAlign: "center",
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  closeButton: {
    fontSize: 24,
    color: "#666",
    marginBottom: 16,
  },
  lessonInfo: {
    marginBottom: 16,
  },
  lessonTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2d3436",
    marginBottom: 4,
  },
  lessonType: {
    fontSize: 14,
    color: "#666",
    textTransform: "capitalize",
  },
  progressContainer: {
    marginTop: 12,
  },
  progressText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 6,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  footer: {
    padding: 20,
    alignItems: "center",
  },
  scoreText: {
    fontSize: 16,
    color: "#666",
  },
  completeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  completeIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2d3436",
    marginBottom: 32,
  },
  scoreCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreLabel: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#00b894",
    marginBottom: 4,
  },
  scoreDetail: {
    fontSize: 14,
    color: "#666",
  },
  xpCard: {
    backgroundColor: "#e8f8f5",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 32,
    width: "100%",
  },
  xpLabel: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  xpValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#00b894",
  },
  completeButton: {
    backgroundColor: "#00b894",
    padding: 16,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  completeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#00b894",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default function Lesson() {
  return (
    <ProtectedRoute>
      <LessonScreen />
    </ProtectedRoute>
  );
}


