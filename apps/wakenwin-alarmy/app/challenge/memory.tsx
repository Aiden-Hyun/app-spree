import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { ChallengeService } from "../../src/services/challengeService";
import { AlarmService } from "../../src/services/alarmService";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";

export default function MemoryChallenge() {
  const { alarmId, difficulty = "medium" } = useLocalSearchParams();
  const { user } = useAuth();
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [showingSequence, setShowingSequence] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [attempts, setAttempts] = useState(0);

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

  useEffect(() => {
    if (sequence.length > 0 && !showingSequence) {
      showSequence();
    }
  }, [sequence]);

  const initializeChallenge = async () => {
    // Generate memory sequence
    const generatedSequence = ChallengeService.generateMemorySequence(
      difficulty as any
    );
    setSequence(generatedSequence);

    // Create challenge record
    if (user && alarmId) {
      try {
        const challenge = await ChallengeService.createChallenge(
          user.id,
          alarmId as string,
          "memory",
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
        require("../../assets/alarm-sound.mp3"),
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

  const showSequence = async () => {
    setShowingSequence(true);
    setUserSequence([]);

    for (let i = 0; i < sequence.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setCurrentIndex(i);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await new Promise((resolve) => setTimeout(resolve, 400));
      setCurrentIndex(-1);
    }

    setShowingSequence(false);
  };

  const handleButtonPress = async (number: number) => {
    if (showingSequence) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newUserSequence = [...userSequence, number];
    setUserSequence(newUserSequence);

    // Check if the sequence matches so far
    const currentPosition = newUserSequence.length - 1;
    if (newUserSequence[currentPosition] !== sequence[currentPosition]) {
      // Wrong sequence
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAttempts((prev) => prev + 1);

      if (attempts >= 2) {
        Alert.alert(
          "Hint",
          `The sequence starts with: ${sequence.slice(0, 3).join(", ")}...`,
          [{ text: "OK", onPress: () => showSequence() }]
        );
      } else {
        Alert.alert("Wrong Sequence", "Watch carefully and try again!", [
          { text: "OK", onPress: () => showSequence() },
        ]);
      }
      setUserSequence([]);
      return;
    }

    // Check if sequence is complete
    if (newUserSequence.length === sequence.length) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      completeChallenge();
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

    Alert.alert("🎉 Excellent Memory!", "You completed the memory challenge!", [
      {
        text: "OK",
        onPress: () => router.replace("/(tabs)/alarms"),
      },
    ]);
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

  const renderButton = (number: number) => {
    const isActive = showingSequence && sequence[currentIndex] === number;
    const isPressed = userSequence[userSequence.length - 1] === number;

    return (
      <TouchableOpacity
        key={number}
        style={[
          styles.memoryButton,
          isActive && styles.memoryButtonActive,
          isPressed && styles.memoryButtonPressed,
        ]}
        onPress={() => handleButtonPress(number)}
        disabled={showingSequence}
      >
        <Text style={styles.memoryButtonText}>{number}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Memory Challenge</Text>
        <Text style={styles.subtitle}>
          {showingSequence
            ? "Watch the sequence..."
            : `Repeat the ${sequence.length}-digit sequence`}
        </Text>
      </View>

      <View style={styles.gameContainer}>
        <View style={styles.grid}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(renderButton)}
        </View>

        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Progress: {userSequence.length} / {sequence.length}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(userSequence.length / sequence.length) * 100}%` },
              ]}
            />
          </View>
        </View>
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
    marginBottom: 40,
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
  gameContainer: {
    flex: 1,
    justifyContent: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 40,
  },
  memoryButton: {
    width: 80,
    height: 80,
    backgroundColor: "#34495e",
    margin: 10,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#2c3e50",
  },
  memoryButtonActive: {
    backgroundColor: "#f39c12",
    borderColor: "#f39c12",
  },
  memoryButtonPressed: {
    backgroundColor: "#27ae60",
    borderColor: "#27ae60",
  },
  memoryButtonText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  progressContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  progressText: {
    fontSize: 16,
    color: "#ecf0f1",
    textAlign: "center",
    marginBottom: 10,
  },
  progressBar: {
    height: 10,
    backgroundColor: "#34495e",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#27ae60",
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
});


