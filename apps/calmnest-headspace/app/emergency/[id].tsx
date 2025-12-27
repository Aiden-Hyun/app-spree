import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { AudioPlayer } from "../../src/components/AudioPlayer";
import { useAudioPlayer } from "../../src/hooks/useAudioPlayer";
import { useTheme } from "../../src/contexts/ThemeContext";
import { useAuth } from "../../src/contexts/AuthContext";
import { getAudioUrl } from "../../src/constants/audioFiles";
import { addToListeningHistory } from "../../src/services/firestoreService";
import { Theme } from "../../src/theme";

function EmergencyPlayerScreen() {
  const { id, title, description, duration, audioKey, color, icon } =
    useLocalSearchParams<{
      id: string;
      title: string;
      description: string;
      duration: string;
      audioKey: string;
      color: string;
      icon: string;
    }>();

  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasTrackedPlay, setHasTrackedPlay] = useState(false);

  const styles = useMemo(() => createStyles(theme), [theme]);
  const audioPlayer = useAudioPlayer();

  useEffect(() => {
    async function loadAudio() {
      if (!audioKey) {
        setLoading(false);
        return;
      }

      try {
        const audioUrl = await getAudioUrl(audioKey);
        if (audioUrl) {
          audioPlayer.loadAudio(audioUrl);
        }
      } catch (error) {
        console.error("Failed to load emergency audio:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAudio();
  }, [audioKey]);

  const handleGoBack = () => {
    audioPlayer.cleanup();
    router.back();
  };

  const handlePlayPause = async () => {
    if (audioPlayer.isPlaying) {
      audioPlayer.pause();
    } else {
      audioPlayer.play();

      // Track listening history on first play
      if (!hasTrackedPlay && user && id && title) {
        setHasTrackedPlay(true);
        await addToListeningHistory(
          user.uid,
          id,
          "meditation", // Emergency meditations count as meditations
          title,
          parseInt(duration) || 2,
          undefined
        );
      }
    }
  };

  // Parse the color from params or use default
  const bgColor = color || "#E57373";
  const gradientColors: [string, string, string] = [
    bgColor,
    adjustColor(bgColor, 20),
    adjustColor(bgColor, 40),
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={gradientColors} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={gradientColors}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.emergencyBadge}>
            <Ionicons name="flash" size={16} color="white" />
            <Text style={styles.emergencyBadgeText}>EMERGENCY</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.infoContainer}>
            <View style={styles.iconCircle}>
              <Ionicons
                name={(icon as keyof typeof Ionicons.glyphMap) || "flash"}
                size={64}
                color="white"
              />
            </View>
            <Text style={styles.title}>{title || "Emergency Relief"}</Text>
            <Text style={styles.description}>
              {description || "Quick relief for moments of distress"}
            </Text>
            <View style={styles.durationBadge}>
              <Ionicons
                name="time-outline"
                size={16}
                color="rgba(255,255,255,0.9)"
              />
              <Text style={styles.durationText}>{duration || "2"} min</Text>
            </View>
          </View>

          {/* Player */}
          <View style={styles.playerContainer}>
            <AudioPlayer
              isPlaying={audioPlayer.isPlaying}
              isLoading={audioPlayer.isLoading}
              duration={audioPlayer.duration}
              position={audioPlayer.position}
              progress={audioPlayer.progress}
              formattedPosition={audioPlayer.formattedPosition}
              formattedDuration={audioPlayer.formattedDuration}
              onPlay={handlePlayPause}
              onPause={handlePlayPause}
              onSeek={audioPlayer.seekTo}
            />
          </View>

          {/* Calming message */}
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>
              Take a deep breath. You are safe. This feeling will pass.
            </Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

// Helper to lighten a hex color
function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    gradient: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
    },
    loadingText: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 16,
      color: "white",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.lg,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      alignItems: "center",
      justifyContent: "center",
    },
    emergencyBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    emergencyBadgeText: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 12,
      color: "white",
      letterSpacing: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
    },
    infoContainer: {
      alignItems: "center",
      marginBottom: theme.spacing.xl,
    },
    iconCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing.lg,
    },
    title: {
      fontFamily: theme.fonts.display.semiBold,
      fontSize: 28,
      color: "white",
      textAlign: "center",
      marginBottom: theme.spacing.sm,
    },
    description: {
      fontFamily: theme.fonts.body.regular,
      fontSize: 16,
      color: "rgba(255, 255, 255, 0.9)",
      textAlign: "center",
      marginBottom: theme.spacing.md,
    },
    durationBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
    },
    durationText: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 14,
      color: "rgba(255, 255, 255, 0.9)",
    },
    playerContainer: {
      flex: 1,
      justifyContent: "center",
    },
    messageContainer: {
      paddingBottom: theme.spacing.xxl,
      alignItems: "center",
    },
    messageText: {
      fontFamily: theme.fonts.body.italic,
      fontSize: 16,
      color: "rgba(255, 255, 255, 0.8)",
      textAlign: "center",
      lineHeight: 24,
    },
  });

export default function EmergencyPlayer() {
  return (
    <ProtectedRoute>
      <EmergencyPlayerScreen />
    </ProtectedRoute>
  );
}
