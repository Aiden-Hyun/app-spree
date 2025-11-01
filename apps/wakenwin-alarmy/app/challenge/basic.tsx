import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { ChallengeService } from "../../src/services/challengeService";
import { AlarmService } from "../../src/services/alarmService";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

export default function BasicChallenge() {
  const { alarmId } = useLocalSearchParams();
  const { user } = useAuth();
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [dismissing, setDismissing] = useState(false);

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
    // Create challenge record
    if (user && alarmId) {
      try {
        const challenge = await ChallengeService.createChallenge(
          user.id,
          alarmId as string,
          "basic",
          "easy"
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

  const handleDismiss = async () => {
    setDismissing(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await stopAlarmSound();

    if (challengeId) {
      await ChallengeService.completeChallenge(challengeId);
    }

    // Update wake up session
    if (user && alarmId) {
      await AlarmService.snoozeAlarm(alarmId as string, 0); // Mark as completed
    }

    Alert.alert("Good Morning! ☀️", "Your alarm has been turned off", [
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

  return (
    <View style={styles.container}>
      <View style={styles.timeContainer}>
        <Text style={styles.time}>
          {new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </View>

      <View style={styles.iconContainer}>
        <View style={styles.iconPulse}>
          <Ionicons name="alarm" size={120} color="#fff" />
        </View>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.dismissButton, dismissing && styles.dismissingButton]}
          onPress={handleDismiss}
          disabled={dismissing}
        >
          <Ionicons name="checkmark-circle" size={32} color="#fff" />
          <Text style={styles.dismissButtonText}>
            {dismissing ? "Turning off..." : "Turn Off Alarm"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.snoozeButton} onPress={handleSnooze}>
          <Ionicons name="time" size={24} color="#fff" />
          <Text style={styles.snoozeButtonText}>Snooze 5 min</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2c3e50",
    justifyContent: "space-between",
    padding: 20,
  },
  timeContainer: {
    alignItems: "center",
    marginTop: 80,
  },
  time: {
    fontSize: 64,
    fontWeight: "200",
    color: "#fff",
  },
  date: {
    fontSize: 20,
    color: "#ecf0f1",
    marginTop: 8,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  iconPulse: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 100,
    padding: 40,
  },
  buttonsContainer: {
    marginBottom: 40,
  },
  dismissButton: {
    backgroundColor: "#27ae60",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    gap: 12,
  },
  dismissingButton: {
    backgroundColor: "#7f8c8d",
  },
  dismissButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  snoozeButton: {
    backgroundColor: "#e74c3c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  snoozeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
