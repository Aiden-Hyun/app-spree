import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import {
  ChallengeService,
  MathProblem,
} from "../../src/services/challengeService";
import { AlarmService } from "../../src/services/alarmService";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";

export default function MathChallenge() {
  const { alarmId, difficulty = "medium" } = useLocalSearchParams();
  const { user } = useAuth();
  const [problems, setProblems] = useState<MathProblem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);

  useEffect(() => {
    initializeChallenge();
    playAlarmSound();

    return () => {
      if (sound) {
        sound.stopAsync();
        sound.unloadAsync();
      }
    };
  }, []);

  const initializeChallenge = async () => {
    // Generate math problems
    const problemCount =
      difficulty === "easy" ? 3 : difficulty === "medium" ? 5 : 7;
    const generatedProblems = ChallengeService.generateMathProblems(
      problemCount,
      difficulty as any
    );
    setProblems(generatedProblems);

    // Create challenge record
    if (user && alarmId) {
      try {
        const challenge = await ChallengeService.createChallenge(
          user.id,
          alarmId as string,
          "math",
          difficulty as any
        );
        setChallengeId(challenge.id);
      } catch (error) {
        console.error("Error creating challenge:", error);
      }
    }
  };

  const playAlarmSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("../../assets/alarm-sound.mp3"), // You'll need to add this
        { isLooping: true, shouldPlay: true }
      );
      setSound(sound);
    } catch (error) {
      console.error("Error playing alarm sound:", error);
    }
  };

  const stopAlarmSound = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }
  };

  const handleSubmit = async () => {
    const currentProblem = problems[currentProblemIndex];
    const userAnswer = parseInt(answer);

    if (userAnswer === currentProblem.answer) {
      // Correct answer
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (currentProblemIndex === problems.length - 1) {
        // All problems solved
        await completeChallenge();
      } else {
        // Move to next problem
        setCurrentProblemIndex((prev) => prev + 1);
        setAnswer("");
        setAttemptCount(0);
      }
    } else {
      // Wrong answer
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAttemptCount((prev) => prev + 1);

      if (attemptCount >= 2) {
        Alert.alert("Hint", `The answer is ${currentProblem.answer}`, [
          { text: "OK" },
        ]);
      } else {
        Alert.alert("Wrong Answer", "Try again!", [{ text: "OK" }]);
      }
      setAnswer("");
    }
  };

  const completeChallenge = async () => {
    await stopAlarmSound();

    if (challengeId) {
      await ChallengeService.completeChallenge(challengeId);
    }

    // Update wake up session
    if (user && alarmId) {
      await AlarmService.snoozeAlarm(alarmId as string, 0); // Mark as completed
    }

    Alert.alert(
      "🎉 Great Job!",
      "You completed the challenge and turned off the alarm!",
      [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)/alarms"),
        },
      ]
    );
  };

  const handleSnooze = async () => {
    if (!alarmId) return;

    await stopAlarmSound();
    await AlarmService.snoozeAlarm(alarmId as string, 5);

    Alert.alert("Alarm Snoozed", "Alarm will ring again in 5 minutes", [
      {
        text: "OK",
        onPress: () => router.back(),
      },
    ]);
  };

  if (problems.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Preparing challenge...</Text>
      </View>
    );
  }

  const currentProblem = problems[currentProblemIndex];
  const progress = (currentProblemIndex + 1) / problems.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Math Challenge</Text>
        <Text style={styles.subtitle}>
          Problem {currentProblemIndex + 1} of {problems.length}
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.problemContainer}>
        <Text style={styles.problem}>{currentProblem.question}</Text>

        <TextInput
          style={styles.input}
          value={answer}
          onChangeText={setAnswer}
          keyboardType="numeric"
          placeholder="Your answer"
          autoFocus
        />

        <TouchableOpacity
          style={[styles.submitButton, !answer && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!answer}
        >
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.snoozeButton} onPress={handleSnooze}>
        <Text style={styles.snoozeButtonText}>Snooze (5 min)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2c3e50",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  subtitle: {
    fontSize: 16,
    color: "#ecf0f1",
    marginTop: 8,
  },
  progressContainer: {
    height: 8,
    backgroundColor: "#34495e",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 40,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#f39c12",
  },
  problemContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  problem: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 40,
  },
  input: {
    backgroundColor: "#fff",
    fontSize: 32,
    padding: 20,
    borderRadius: 12,
    width: "100%",
    textAlign: "center",
    marginBottom: 30,
  },
  submitButton: {
    backgroundColor: "#27ae60",
    paddingVertical: 20,
    paddingHorizontal: 60,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    backgroundColor: "#7f8c8d",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  snoozeButton: {
    backgroundColor: "#e74c3c",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  snoozeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    marginTop: 100,
  },
});
