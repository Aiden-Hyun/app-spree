import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { AudioPlayer } from "../../src/components/AudioPlayer";
import { useAudioPlayer } from "../../src/hooks/useAudioPlayer";
import { useTheme } from "../../src/contexts/ThemeContext";
import { getBedtimeStoryById } from "../../src/services/firestoreService";
import { getAudioUrl } from "../../src/constants/audioFiles";
import { getNarratorByName } from "../../src/constants/narratorData";
import { Theme } from "../../src/theme";
import { BedtimeStory } from "../../src/types";

function SleepStoryPlayerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const [story, setStory] = useState<BedtimeStory | null>(null);
  const [loading, setLoading] = useState(true);

  const styles = useMemo(() => createStyles(theme), [theme]);

  const audioPlayer = useAudioPlayer();

  useEffect(() => {
    async function loadStory() {
      try {
        setLoading(true);
        const data = await getBedtimeStoryById(id as string);
        setStory(data);
      } catch (error) {
        console.error("Failed to load bedtime story:", error);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadStory();
    }
  }, [id]);

  useEffect(() => {
    async function loadStoryAudio() {
      if (!story) return;

      // Try to get audio URL from audio_file key
      if (story.audio_file) {
        const audioUrl = await getAudioUrl(story.audio_file);
        if (audioUrl) {
          audioPlayer.loadAudio(audioUrl);
          return;
        }
      }

      // Fallback to direct audio_url
      if (story.audio_url) {
        audioPlayer.loadAudio(story.audio_url);
      }
    }

    loadStoryAudio();
  }, [story]);

  const handleGoBack = () => {
    audioPlayer.cleanup();
    router.back();
  };

  const handlePlayPause = () => {
    if (audioPlayer.isPlaying) {
      audioPlayer.pause();
    } else {
      audioPlayer.play();
    }
  };

  const getCategoryIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (story?.category) {
      case "nature":
        return "leaf";
      case "fantasy":
        return "planet";
      case "travel":
        return "airplane";
      case "fiction":
        return "book";
      case "thriller":
        return "skull";
      default:
        return "book";
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient
          colors={["#1A1D29", "#2A2D3E", "#3D4158"]}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.sleepAccent} />
            <Text style={styles.loadingText}>Loading story...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!story) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient
          colors={["#1A1D29", "#2A2D3E", "#3D4158"]}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={64}
              color={theme.colors.sleepAccent}
            />
            <Text style={styles.errorText}>Story not found</Text>
            <TouchableOpacity
              style={styles.backButtonLarge}
              onPress={handleGoBack}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#1A1D29", "#2A2D3E", "#3D4158"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.colors.sleepText}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons
              name="heart-outline"
              size={24}
              color={theme.colors.sleepText}
            />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Story Icon/Image */}
          <View style={styles.iconContainer}>
            {story.thumbnail_url ? (
              <Image
                source={{ uri: story.thumbnail_url }}
                style={styles.thumbnailImage}
              />
            ) : (
              <View style={styles.iconCircle}>
                <Ionicons
                  name={getCategoryIcon()}
                  size={64}
                  color={theme.colors.sleepAccent}
                />
              </View>
            )}
          </View>

          {/* Story Info */}
          <View style={styles.storyInfo}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{story.category}</Text>
            </View>
            <Text style={styles.storyTitle}>{story.title}</Text>
            <Text style={styles.storyDescription}>{story.description}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={theme.colors.sleepTextMuted}
                />
                <Text style={styles.metaText}>
                  {story.duration_minutes} min
                </Text>
              </View>
            </View>
          </View>

          {/* Narrator Section */}
          {story.narrator &&
            (() => {
              const narrator = getNarratorByName(story.narrator);
              return (
                <View style={styles.narratorSection}>
                  {narrator?.photoUrl ? (
                    <Image
                      source={{ uri: narrator.photoUrl }}
                      style={styles.narratorPhoto}
                    />
                  ) : (
                    <View style={styles.narratorPhotoPlaceholder}>
                      <Ionicons
                        name="person"
                        size={20}
                        color={theme.colors.sleepTextMuted}
                      />
                    </View>
                  )}
                  <Text style={styles.narratorText}>
                    Narrated by {story.narrator}
                  </Text>
                </View>
              );
            })()}

          {/* Audio Player */}
          <View style={styles.playerContainer}>
            <AudioPlayer
              isPlaying={audioPlayer.isPlaying}
              isLoading={audioPlayer.isLoading}
              duration={audioPlayer.duration}
              position={audioPlayer.position}
              progress={audioPlayer.progress}
              formattedPosition={audioPlayer.formattedPosition}
              formattedDuration={audioPlayer.formattedDuration}
              onPlay={audioPlayer.play}
              onPause={audioPlayer.pause}
              onSeek={audioPlayer.seekTo}
            />
          </View>

          {/* Sleep Timer (Optional) */}
          <TouchableOpacity style={styles.timerButton}>
            <Ionicons
              name="moon-outline"
              size={20}
              color={theme.colors.sleepTextMuted}
            />
            <Text style={styles.timerButtonText}>Set Sleep Timer</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: "#1A1D29",
    },
    gradient: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.md,
    },
    loadingText: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 16,
      color: theme.colors.sleepTextMuted,
    },
    errorText: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 18,
      color: theme.colors.sleepText,
      marginTop: theme.spacing.md,
    },
    backButtonLarge: {
      marginTop: theme.spacing.lg,
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.sleepAccent,
      borderRadius: theme.borderRadius.lg,
    },
    backButtonText: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 16,
      color: theme.colors.sleepBackground,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "rgba(255,255,255,0.1)",
      alignItems: "center",
      justifyContent: "center",
    },
    moreButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "rgba(255,255,255,0.1)",
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      flex: 1,
      paddingHorizontal: theme.spacing.xl,
      alignItems: "center",
    },
    iconContainer: {
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.xl,
    },
    iconCircle: {
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: "rgba(201, 184, 150, 0.15)",
      alignItems: "center",
      justifyContent: "center",
    },
    thumbnailImage: {
      width: 140,
      height: 140,
      borderRadius: 70,
    },
    storyInfo: {
      alignItems: "center",
      marginBottom: theme.spacing.xl,
    },
    categoryBadge: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      backgroundColor: "rgba(201, 184, 150, 0.2)",
      borderRadius: theme.borderRadius.full,
      marginBottom: theme.spacing.sm,
    },
    categoryText: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 12,
      color: theme.colors.sleepAccent,
      textTransform: "capitalize",
    },
    storyTitle: {
      fontFamily: theme.fonts.display.semiBold,
      fontSize: 28,
      color: theme.colors.sleepText,
      textAlign: "center",
      marginBottom: theme.spacing.sm,
    },
    storyDescription: {
      fontFamily: theme.fonts.body.regular,
      fontSize: 15,
      color: theme.colors.sleepTextMuted,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
    },
    metaRow: {
      flexDirection: "row",
      gap: theme.spacing.xl,
    },
    metaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    metaText: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 14,
      color: theme.colors.sleepTextMuted,
    },
    narratorSection: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      backgroundColor: "rgba(255,255,255,0.05)",
      borderRadius: theme.borderRadius.full,
    },
    narratorPhoto: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    narratorPhotoPlaceholder: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "rgba(255,255,255,0.1)",
      alignItems: "center",
      justifyContent: "center",
    },
    narratorText: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 14,
      color: theme.colors.sleepTextMuted,
    },
    playerContainer: {
      width: "100%",
      marginBottom: theme.spacing.xl,
    },
    timerButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      backgroundColor: "rgba(255,255,255,0.05)",
      borderRadius: theme.borderRadius.lg,
    },
    timerButtonText: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 14,
      color: theme.colors.sleepTextMuted,
    },
  });

export default function SleepStoryPlayer() {
  return (
    <ProtectedRoute>
      <SleepStoryPlayerScreen />
    </ProtectedRoute>
  );
}
