import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { ChallengeService } from "../../src/services/challengeService";
import { AlarmService } from "../../src/services/alarmService";
import { Camera, CameraType, CameraView } from "expo-camera";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../src/supabase";

export default function PhotoChallenge() {
  const { alarmId, difficulty = "medium" } = useLocalSearchParams();
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);

  useEffect(() => {
    initializeChallenge();
    playAlarmSound();
    requestCameraPermission();

    return () => {
      if (sound) {
        sound.stopAsync();
        sound.unloadAsync();
      }
    };
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === "granted");
  };

  const initializeChallenge = async () => {
    // Create challenge record
    if (user && alarmId) {
      try {
        const challenge = await ChallengeService.createChallenge(
          user.id,
          alarmId as string,
          "photo",
          difficulty as any
        );
        setChallengeId(challenge.id);

        // Get reference image from challenge config
        const { data } = await supabase
          .from("challenge_configs")
          .select("config")
          .eq("alarm_id", alarmId)
          .single();

        if (data?.config?.referenceImage) {
          setReferenceImage(data.config.referenceImage);
        }
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

  const takePicture = async () => {
    if (!cameraRef) return;

    setProcessing(true);
    try {
      const photo = await cameraRef.takePictureAsync();
      setPhotoTaken(true);

      // In a real app, you would compare the photo with the reference
      // For now, we'll simulate a match after taking any photo
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Simulate processing time
      setTimeout(() => {
        completeChallenge();
      }, 2000);
    } catch (error) {
      console.error("Error taking picture:", error);
      setProcessing(false);
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

    Alert.alert("🎉 Perfect Match!", "You completed the photo challenge!", [
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

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No access to camera</Text>
        <TouchableOpacity style={styles.snoozeButton} onPress={handleSnooze}>
          <Text style={styles.snoozeButtonText}>Snooze (5 min)</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Photo Challenge</Text>
        <Text style={styles.subtitle}>
          Take a photo matching your reference image
        </Text>
      </View>

      <View style={styles.cameraContainer}>
        {!photoTaken ? (
          <CameraView style={styles.camera} facing="back" ref={setCameraRef}>
            <View style={styles.cameraOverlay}>
              {referenceImage && (
                <View style={styles.referenceContainer}>
                  <Text style={styles.referenceText}>Match this:</Text>
                  <Image
                    source={{ uri: referenceImage }}
                    style={styles.referenceImage}
                  />
                </View>
              )}
              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePicture}
                disabled={processing}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </CameraView>
        ) : (
          <View style={styles.processingContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#27ae60" />
            <Text style={styles.processingText}>
              {processing ? "Analyzing photo..." : "Photo captured!"}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          Take a photo of your designated wake-up spot
        </Text>
        <Text style={styles.instructionSubtext}>
          (e.g., bathroom sink, coffee maker, front door)
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
    backgroundColor: "#34495e",
  },
  header: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 20,
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
  cameraContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    overflow: "hidden",
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 40,
  },
  referenceContainer: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 10,
    borderRadius: 10,
  },
  referenceText: {
    color: "#fff",
    fontSize: 12,
    marginBottom: 5,
  },
  referenceImage: {
    width: 80,
    height: 80,
    borderRadius: 5,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
  },
  processingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2c3e50",
  },
  processingText: {
    fontSize: 20,
    color: "#fff",
    marginTop: 20,
  },
  instructions: {
    alignItems: "center",
    padding: 20,
  },
  instructionText: {
    fontSize: 16,
    color: "#ecf0f1",
  },
  instructionSubtext: {
    fontSize: 14,
    color: "#95a5a6",
    marginTop: 5,
  },
  snoozeButton: {
    backgroundColor: "#e74c3c",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    margin: 20,
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
  errorText: {
    color: "#e74c3c",
    fontSize: 18,
    textAlign: "center",
    marginTop: 100,
  },
});
