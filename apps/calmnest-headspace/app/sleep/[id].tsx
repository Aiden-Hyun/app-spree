import React, { useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { MediaPlayer } from "../../src/components/MediaPlayer";
import { useAudioPlayer } from "../../src/hooks/useAudioPlayer";
import { useTheme } from "../../src/contexts/ThemeContext";
import { getBedtimeStoryById, addToListeningHistory, toggleFavorite, isFavorite } from "../../src/services/firestoreService";
import { useAuth } from "../../src/contexts/AuthContext";
import { getAudioUrl } from "../../src/constants/audioFiles";
import { getNarratorByName } from "../../src/constants/narratorData";
import { Theme } from "../../src/theme";
import { BedtimeStory } from "../../src/types";

function SleepStoryPlayerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [story, setStory] = useState<BedtimeStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasTrackedPlay, setHasTrackedPlay] = useState(false);
  const [isFavoritedState, setIsFavoritedState] = useState(false);

  const styles = useMemo(() => createStyles(theme), [theme]);
  const audioPlayer = useAudioPlayer();

  // Check if favorited on load
  useEffect(() => {
    async function checkFavorite() {
      if (user && id) {
        const favorited = await isFavorite(user.uid, id as string);
        setIsFavoritedState(favorited);
      }
    }
    checkFavorite();
  }, [user, id]);

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

  const handleToggleFavorite = async () => {
    if (!user || !story) return;
    
    // Optimistic update
    const previousState = isFavoritedState;
    setIsFavoritedState(!previousState);
    
    try {
      const newFavorited = await toggleFavorite(user.uid, story.id, 'bedtime_story');
      if (newFavorited !== !previousState) {
        setIsFavoritedState(newFavorited);
      }
    } catch {
      setIsFavoritedState(previousState);
    }
  };

  const handlePlayPause = async () => {
    if (audioPlayer.isPlaying) {
      audioPlayer.pause();
    } else {
      audioPlayer.play();
      
      // Track listening history on first play
      if (!hasTrackedPlay && user && story) {
        setHasTrackedPlay(true);
        await addToListeningHistory(
          user.uid,
          story.id,
          'bedtime_story',
          story.title,
          story.duration_minutes,
          story.thumbnail_url
        );
      }
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

  // Error state - story not found
  if (!loading && !story) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={["#1A1D29", "#2A2D3E"]} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <Ionicons name="alert-circle-outline" size={64} color={theme.colors.sleepAccent} />
            <Text style={styles.errorText}>Story not found</Text>
            <TouchableOpacity style={styles.backButtonLarge} onPress={handleGoBack}>
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const narratorData = story?.narrator ? getNarratorByName(story.narrator) : undefined;

  const sleepTimerButton = (
    <TouchableOpacity style={styles.timerButton}>
      <Ionicons name="moon-outline" size={20} color={theme.colors.sleepTextMuted} />
      <Text style={styles.timerButtonText}>Set Sleep Timer</Text>
    </TouchableOpacity>
  );

  return (
    <MediaPlayer
      category={story?.category || 'bedtime story'}
      title={story?.title || 'Loading...'}
      instructor={story?.narrator}
      instructorPhotoUrl={narratorData?.photoUrl}
      description={story?.description}
      durationMinutes={story?.duration_minutes || 0}
      gradientColors={["#1A1D29", "#2A2D3E"]}
      artworkIcon={getCategoryIcon()}
      artworkThumbnailUrl={story?.thumbnail_url}
      safeAreaBgColor="#1A1D29"
      iconColor={theme.colors.sleepAccent}
      isFavorited={isFavoritedState}
      isLoading={loading}
      audioPlayer={audioPlayer}
      onBack={handleGoBack}
      onToggleFavorite={handleToggleFavorite}
      onPlayPause={handlePlayPause}
      loadingText="Loading story..."
      footerContent={sleepTimerButton}
    />
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
