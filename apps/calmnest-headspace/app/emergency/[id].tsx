import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { MediaPlayer } from "../../src/components/MediaPlayer";
import { useAudioPlayer } from "../../src/hooks/useAudioPlayer";
import { useAuth } from "../../src/contexts/AuthContext";
import { getAudioUrl } from "../../src/constants/audioFiles";
import { getNarratorByName } from "../../src/constants/narratorData";
import {
  addToListeningHistory,
  toggleFavorite,
  isFavorite,
} from "../../src/services/firestoreService";

// Helper to lighten a hex color
function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

function EmergencyPlayerScreen() {
  const { id, title, description, duration, audioKey, color, icon, narrator } =
    useLocalSearchParams<{
      id: string;
      title: string;
      description: string;
      duration: string;
      audioKey: string;
      color: string;
      icon: string;
      narrator: string;
    }>();

  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasTrackedPlay, setHasTrackedPlay] = useState(false);
  const [isFavoritedState, setIsFavoritedState] = useState(false);

  const audioPlayer = useAudioPlayer();

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

  const handleToggleFavorite = async () => {
    if (!user || !id) return;

    // Optimistic update
    const previousState = isFavoritedState;
    setIsFavoritedState(!previousState);

    try {
      const newFavorited = await toggleFavorite(user.uid, id, "emergency");
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
      if (!hasTrackedPlay && user && id && title) {
        setHasTrackedPlay(true);
        await addToListeningHistory(
          user.uid,
          id,
          "emergency",
          title,
          parseInt(duration) || 4,
          undefined
        );
      }
    }
  };

  // Parse the color from params or use default
  const bgColor = color || "#E57373";
  const gradientColors: [string, string] = [bgColor, adjustColor(bgColor, 20)];

  const instructorName = narrator || "Guide";
  const narratorData = getNarratorByName(instructorName);

  return (
    <MediaPlayer
      category="emergency"
      title={title || "Emergency Relief"}
      instructor={instructorName}
      instructorPhotoUrl={narratorData?.photoUrl}
      description={description || "Quick relief for moments of distress"}
      durationMinutes={parseInt(duration) || 4}
      gradientColors={gradientColors}
      artworkIcon={(icon as any) || "flash"}
      safeAreaBgColor={bgColor}
      isFavorited={isFavoritedState}
      isLoading={loading}
      audioPlayer={audioPlayer}
      onBack={handleGoBack}
      onToggleFavorite={handleToggleFavorite}
      onPlayPause={handlePlayPause}
      loadingText="Loading..."
    />
  );
}

export default function EmergencyPlayer() {
  return (
    <ProtectedRoute>
      <EmergencyPlayerScreen />
    </ProtectedRoute>
  );
}
