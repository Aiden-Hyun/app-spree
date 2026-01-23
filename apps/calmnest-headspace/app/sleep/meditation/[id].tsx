import React, { useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ProtectedRoute } from "../../../src/components/ProtectedRoute";
import { MediaPlayer } from "../../../src/components/MediaPlayer";
import { useAudioPlayer } from "../../../src/hooks/useAudioPlayer";
import { useTheme } from "../../../src/contexts/ThemeContext";
import { useAuth } from "../../../src/contexts/AuthContext";
import {
  addToListeningHistory,
  toggleFavorite,
  isFavorite,
  getSleepMeditationById,
  FirestoreSleepMeditation,
  createSession,
} from "../../../src/services/firestoreService";
import { getAudioUrlFromPath } from "../../../src/constants/audioFiles";
import { Theme } from "../../../src/theme";

function SleepMeditationPlayerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const { user, isAnonymous } = useAuth();
  const [meditation, setMeditation] = useState<FirestoreSleepMeditation | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [hasTrackedPlay, setHasTrackedPlay] = useState(false);
  const [hasTrackedSession, setHasTrackedSession] = useState(false);
  const [isFavoritedState, setIsFavoritedState] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);

  const styles = useMemo(() => createStyles(theme), [theme]);
  const audioPlayer = useAudioPlayer();

  // Fetch meditation from Firestore
  useEffect(() => {
    async function loadMeditation() {
      if (!id) return;
      setLoading(true);
      const data = await getSleepMeditationById(id as string);
      setMeditation(data);
      setLoading(false);
    }
    loadMeditation();
  }, [id]);

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

  // Load audio when meditation is found
  useEffect(() => {
    async function loadAudio() {
      if (!meditation?.audioPath) return;

      const url = await getAudioUrlFromPath(meditation.audioPath);
      if (url) {
        setAudioUrl(url);
        audioPlayer.loadAudio(url);
      }
    }

    loadAudio();
  }, [meditation]);

  // Track session for stats when user completes 80% of audio
  useEffect(() => {
    async function trackSession() {
      if (
        !hasTrackedSession &&
        user &&
        meditation &&
        audioPlayer.progress >= 0.8 &&
        audioPlayer.duration > 0
      ) {
        setHasTrackedSession(true);
        try {
          await createSession({
            user_id: user.uid,
            duration_minutes: meditation.duration_minutes,
            session_type: "sleep_meditation",
          });
        } catch (error) {
          console.error("Failed to track session:", error);
        }
      }
    }
    trackSession();
  }, [audioPlayer.progress, hasTrackedSession, user, meditation]);

  const handleGoBack = () => {
    audioPlayer.cleanup();
    router.back();
  };

  const handleToggleFavorite = async () => {
    if (!user || !meditation) return;

    // Prompt anonymous users to sign in
    if (isAnonymous) {
      Alert.alert(
        'Sign In Required',
        'Create an account to save favorites and sync across devices.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/login') },
        ]
      );
      return;
    }

    const previousState = isFavoritedState;
    setIsFavoritedState(!previousState);

    try {
      const newFavorited = await toggleFavorite(
        user.uid,
        meditation.id,
        "sleep_meditation"
      );
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
      if (!hasTrackedPlay && user && meditation && !isAnonymous) {
        setHasTrackedPlay(true);
        await addToListeningHistory(
          user.uid,
          meditation.id,
          "sleep_meditation",
          meditation.title,
          meditation.duration_minutes,
          meditation.thumbnailUrl
        );
      }
    }
  };

  // Error state - meditation not found
  if (!loading && !meditation) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={["#1A1D29", "#2A2D3E"]} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={64}
              color={theme.colors.sleepAccent}
            />
            <Text style={styles.errorText}>Meditation not found</Text>
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
    <MediaPlayer
      category="sleep meditation"
      title={meditation?.title || "Loading..."}
      instructor={meditation?.instructor}
      description={meditation?.description}
      durationMinutes={meditation?.duration_minutes || 0}
      gradientColors={["#1A1D29", "#2A2D3E"]}
      artworkIcon={
        (meditation?.icon as keyof typeof Ionicons.glyphMap) || "moon"
      }
      artworkThumbnailUrl={meditation?.thumbnailUrl}
      isFavorited={isFavoritedState}
      isLoading={loading}
      audioPlayer={audioPlayer}
      onBack={handleGoBack}
      onToggleFavorite={handleToggleFavorite}
      onPlayPause={handlePlayPause}
      loadingText="Loading meditation..."
      contentId={id as string}
      contentType="sleep_meditation"
      audioUrl={audioUrl}
      audioPath={meditation?.audioPath}
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
  });

export default function SleepMeditationPlayer() {
  return (
    <ProtectedRoute>
      <SleepMeditationPlayerScreen />
    </ProtectedRoute>
  );
}
