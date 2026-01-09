import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ProtectedRoute } from "../../../src/components/ProtectedRoute";
import { MediaPlayer } from "../../../src/components/MediaPlayer";
import { useAudioPlayer } from "../../../src/hooks/useAudioPlayer";
import { useAuth } from "../../../src/contexts/AuthContext";
import { getAudioUrlFromPath } from "../../../src/constants/audioFiles";
import { getNarratorByName } from "../../../src/constants/narratorData";
import { addToListeningHistory, createSession, toggleFavorite, isFavorite } from "../../../src/services/firestoreService";

function TechniqueMeditationPlayerScreen() {
  const {
    id,
    audioPath,
    title,
    description,
    duration,
    instructor,
    technique,
    color,
    thumbnailUrl,
  } = useLocalSearchParams<{
    id: string;
    audioPath: string;
    title: string;
    description: string;
    duration: string;
    instructor: string;
    technique: string;
    color: string;
    thumbnailUrl?: string;
  }>();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasTrackedPlay, setHasTrackedPlay] = useState(false);
  const [hasTrackedSession, setHasTrackedSession] = useState(false);
  const [isFavoritedState, setIsFavoritedState] = useState(false);

  const audioPlayer = useAudioPlayer();
  const narrator = instructor ? getNarratorByName(instructor) : undefined;

  // Check if favorited on load
  useEffect(() => {
    async function checkFavorite() {
      if (user && id) {
        const favorited = await isFavorite(user.uid, id);
        setIsFavoritedState(favorited);
      }
    }
    checkFavorite();
  }, [user, id]);

  useEffect(() => {
    async function loadAudio() {
      if (!audioPath) {
        setLoading(false);
        return;
      }

      try {
        const audioUrl = await getAudioUrlFromPath(audioPath);
        if (audioUrl) {
          audioPlayer.loadAudio(audioUrl);
        }
      } finally {
        setLoading(false);
      }
    }

    loadAudio();
  }, [audioPath]);

  // Track session for stats when user completes 80% of audio
  useEffect(() => {
    async function trackSession() {
      if (
        !hasTrackedSession &&
        user &&
        id &&
        audioPlayer.progress >= 0.8 &&
        audioPlayer.duration > 0
      ) {
        setHasTrackedSession(true);
        try {
          await createSession({
            user_id: user.uid,
            duration_minutes: parseInt(duration) || 0,
            session_type: "technique",
          });
        } catch (error) {
          console.error("Failed to track session:", error);
        }
      }
    }
    trackSession();
  }, [audioPlayer.progress, hasTrackedSession, user, id, duration]);

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
          "meditation",
          title,
          parseInt(duration) || 0,
          undefined
        );
      }
    }
  };

  const handleToggleFavorite = async () => {
    if (!user || !id) return;

    const previousState = isFavoritedState;
    setIsFavoritedState(!previousState);

    try {
      const newFavorited = await toggleFavorite(user.uid, id, "meditation");
      if (newFavorited !== !previousState) {
        setIsFavoritedState(newFavorited);
      }
    } catch {
      setIsFavoritedState(previousState);
    }
  };

  const getGradientColors = (): [string, string] => {
    if (color) {
      return [color, `${color}CC`];
    }
    return ["#7DAFB4", "#7DAFB4CC"];
  };

  const getTechniqueIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (technique) {
      case "body-scan":
        return "body";
      case "breathing":
        return "fitness";
      case "visualization":
        return "image";
      case "mindfulness-walking":
        return "walk";
      case "progressive-relaxation":
        return "contract";
      case "loving-kindness":
        return "heart";
      default:
        return "leaf";
    }
  };

  return (
    <MediaPlayer
      category={technique?.replace("-", " ") || "meditation"}
      title={title || "Loading..."}
      instructor={instructor}
      instructorPhotoUrl={narrator?.photoUrl}
      description={description}
      durationMinutes={parseInt(duration) || 0}
      gradientColors={getGradientColors()}
      artworkIcon={getTechniqueIcon()}
      artworkThumbnailUrl={thumbnailUrl}
      isFavorited={isFavoritedState}
      isLoading={loading}
      audioPlayer={audioPlayer}
      onBack={handleGoBack}
      onToggleFavorite={handleToggleFavorite}
      onPlayPause={handlePlayPause}
      loadingText="Loading meditation..."
      contentId={id}
      contentType="technique_meditation"
    />
  );
}

export default function TechniqueMeditationPlayer() {
  return (
    <ProtectedRoute>
      <TechniqueMeditationPlayerScreen />
    </ProtectedRoute>
  );
}
