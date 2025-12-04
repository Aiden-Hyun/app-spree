import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { ChallengeService } from "../../src/services/challengeService";
import { AlarmService } from "../../src/services/alarmService";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";

export default function TypingChallenge() {
  const { alarmId, difficulty = "medium" } = useLocalSearchParams();
  const { user } = useAuth();
  const [targetPhrase, setTargetPhrase] = useState("");
  const [userInput, setUserInput] = useState("");
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

  const initializeChallenge = async () => {
    // Get random phrase
    const phrase = ChallengeService.getRandomTypingPhrase(difficulty as any);
    setTargetPhrase(phrase);

    // Create challenge record
    if (user && alarmId) {
      try {
        const challenge = await ChallengeService.createChallenge(
          user.id,
          alarmId as string,
          "typing",
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

  const handleSubmit = async () => {
    // Case-insensitive comparison
    if (userInput.toLowerCase().trim() === targetPhrase.toLowerCase()) {
      // Correct phrase
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      completeChallenge();
    } else {
      // Wrong phrase
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAttempts((prev) => prev + 1);

      if (attempts >= 2) {
        Alert.alert(
          "Hint",
          "Make sure to type the phrase exactly as shown (punctuation optional)",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Incorrect", "Type the phrase exactly as shown", [
          { text: "OK" },
        ]);
      }
      setUserInput("");
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
      "🎉 Well Done!",
      "You typed the motivational phrase correctly!",
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

  const calculateAccuracy = () => {
    if (!userInput) return 0;
    let correct = 0;
    const userLower = userInput.toLowerCase();
    const targetLower = targetPhrase.toLowerCase();

    for (let i = 0; i < Math.min(userLower.length, targetLower.length); i++) {
      if (userLower[i] === targetLower[i]) correct++;
    }

    return Math.round((correct / targetLower.length) * 100);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Typing Challenge</Text>
        <Text style={styles.subtitle}>
          Type the phrase to turn off the alarm
        </Text>
      </View>

      <View style={styles.challengeContainer}>
        <View style={styles.targetPhraseContainer}>
          <Text style={styles.targetPhraseLabel}>Type this phrase:</Text>
          <Text style={styles.targetPhrase}>"{targetPhrase}"</Text>
        </View>

        <TextInput
          style={styles.input}
          value={userInput}
          onChangeText={setUserInput}
          placeholder="Start typing..."
          placeholderTextColor="#95a5a6"
          multiline
          autoFocus
          autoCapitalize="sentences"
          autoCorrect={false}
        />

        <View style={styles.accuracyContainer}>
          <Text style={styles.accuracyText}>
            Accuracy: {calculateAccuracy()}%
          </Text>
          <View style={styles.accuracyBar}>
            <View
              style={[
                styles.accuracyFill,
                { width: `${calculateAccuracy()}%` },
              ]}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            !userInput && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!userInput}
        >
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.snoozeButton} onPress={handleSnooze}>
        <Text style={styles.snoozeButtonText}>Snooze (5 min)</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#3498db",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 30,
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
  challengeContainer: {
    flex: 1,
    justifyContent: "center",
  },
  targetPhraseContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
  },
  targetPhraseLabel: {
    fontSize: 14,
    color: "#ecf0f1",
    marginBottom: 8,
  },
  targetPhrase: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    lineHeight: 28,
  },
  input: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    fontSize: 18,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  accuracyContainer: {
    marginBottom: 20,
  },
  accuracyText: {
    fontSize: 14,
    color: "#ecf0f1",
    marginBottom: 8,
  },
  accuracyBar: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 4,
    overflow: "hidden",
  },
  accuracyFill: {
    height: "100%",
    backgroundColor: "#27ae60",
  },
  submitButton: {
    backgroundColor: "#27ae60",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#7f8c8d",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
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
});


