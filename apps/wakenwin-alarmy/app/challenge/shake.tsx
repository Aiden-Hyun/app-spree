import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { ChallengeService } from "../../src/services/challengeService";
import { AlarmService } from "../../src/services/alarmService";
import { Accelerometer } from "expo-sensors";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

export default function ShakeChallenge() {
  const { alarmId, difficulty = "medium" } = useLocalSearchParams();
  const { user } = useAuth();
  const [shakeCount, setShakeCount] = useState(0);
  const [targetShakes, setTargetShakes] = useState(0);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    initializeChallenge();
    playAlarmSound();
    startAccelerometer();

    return () => {
      Accelerometer.removeAllListeners();
      if (sound) {
        sound.stopAsync();
        sound.unloadAsync();
      }
    };
  }, []);

  const initializeChallenge = async () => {
    // Set target shakes based on difficulty
    const target = ChallengeService.getShakeCount(difficulty as any);
    setTargetShakes(target);

    // Create challenge record
    if (user && alarmId) {
      try {
        const challenge = await ChallengeService.createChallenge(
          user.id,
          alarmId as string,
          "shake",
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

  const startAccelerometer = () => {
    let lastShakeTime = 0;
    const SHAKE_THRESHOLD = 2.5;
    const SHAKE_COOLDOWN = 300; // milliseconds

    Accelerometer.setUpdateInterval(100);

    Accelerometer.addListener(({ x, y, z }) => {
      const acceleration = Math.sqrt(x * x + y * y + z * z);
      const currentTime = Date.now();

      if (
        acceleration > SHAKE_THRESHOLD &&
        currentTime - lastShakeTime > SHAKE_COOLDOWN
      ) {
        lastShakeTime = currentTime;
        handleShake();
      }
    });
  };

  const handleShake = async () => {
    setIsShaking(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setShakeCount((prev) => {
      const newCount = prev + 1;
      if (newCount >= targetShakes) {
        completeChallenge();
      }
      return newCount;
    });

    setTimeout(() => setIsShaking(false), 200);
  };

  const completeChallenge = async () => {
    Accelerometer.removeAllListeners();
    await stopAlarmSound();

    if (challengeId) {
      await ChallengeService.completeChallenge(challengeId);
    }

    // Update wake up session
    if (user && alarmId) {
      await AlarmService.snoozeAlarm(alarmId as string, 0); // Mark as completed
    }

    Alert.alert("🎉 Great Job!", "You completed the shake challenge!", [
      {
        text: "OK",
        onPress: () => router.replace("/(tabs)/alarms"),
      },
    ]);
  };

  const handleSnooze = async () => {
    if (!alarmId) return;

    Accelerometer.removeAllListeners();
    await stopAlarmSound();
    await AlarmService.snoozeAlarm(alarmId as string, 5);

    Alert.alert("Alarm Snoozed", "Alarm will ring again in 5 minutes", [
      {
        text: "OK",
        onPress: () => router.back(),
      },
    ]);
  };

  const progress = shakeCount / targetShakes;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shake to Wake!</Text>
        <Text style={styles.subtitle}>
          Shake your phone {targetShakes} times
        </Text>
      </View>

      <View style={styles.shakeContainer}>
        <View style={[styles.phoneIcon, isShaking && styles.phoneIconShaking]}>
          <Ionicons name="phone-portrait" size={120} color="#fff" />
        </View>

        <Text style={styles.shakeCount}>{shakeCount}</Text>
        <Text style={styles.shakeLabel}>of {targetShakes} shakes</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.motivationContainer}>
        <Text style={styles.motivationText}>
          {shakeCount === 0 && "Start shaking to turn off the alarm!"}
          {shakeCount > 0 &&
            shakeCount < targetShakes / 2 &&
            "Keep going! You're getting there!"}
          {shakeCount >= targetShakes / 2 &&
            shakeCount < targetShakes &&
            "Almost there! Don't stop now!"}
        </Text>
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
    backgroundColor: "#8e44ad",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  subtitle: {
    fontSize: 18,
    color: "#ecf0f1",
    marginTop: 8,
  },
  shakeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  phoneIcon: {
    marginBottom: 40,
  },
  phoneIconShaking: {
    transform: [{ rotate: "10deg" }],
  },
  shakeCount: {
    fontSize: 72,
    fontWeight: "bold",
    color: "#fff",
  },
  shakeLabel: {
    fontSize: 20,
    color: "#ecf0f1",
    marginTop: 8,
  },
  progressContainer: {
    height: 12,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 6,
    overflow: "hidden",
    marginVertical: 30,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#f39c12",
  },
  motivationContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  motivationText: {
    fontSize: 16,
    color: "#ecf0f1",
    textAlign: "center",
  },
  snoozeButton: {
    backgroundColor: "#e74c3c",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  snoozeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
