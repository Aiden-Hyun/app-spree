import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ProtectedRoute } from "../../../src/components/ProtectedRoute";
import { MediaPlayer } from "../../../src/components/MediaPlayer";
import { useAudioPlayer } from "../../../src/hooks/useAudioPlayer";
import { getAudioUrl } from "../../../src/constants/audioFiles";
import { getNarratorByName } from "../../../src/constants/narratorData";

function TechniqueMeditationPlayerScreen() {
  const {
    id,
    audioKey,
    title,
    description,
    duration,
    instructor,
    technique,
    color,
  } = useLocalSearchParams<{
    id: string;
    audioKey: string;
    title: string;
    description: string;
    duration: string;
    instructor: string;
    technique: string;
    color: string;
  }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isFavoritedState, setIsFavoritedState] = useState(false);

  const audioPlayer = useAudioPlayer();
  const narrator = instructor ? getNarratorByName(instructor) : undefined;

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

  const handlePlayPause = () => {
    if (audioPlayer.isPlaying) {
      audioPlayer.pause();
    } else {
      audioPlayer.play();
    }
  };

  const handleToggleFavorite = () => {
    // TODO: Implement favorite toggling
    setIsFavoritedState(!isFavoritedState);
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
      safeAreaBgColor={color || "#7DAFB4"}
      isFavorited={isFavoritedState}
      isLoading={loading}
      audioPlayer={audioPlayer}
      onBack={handleGoBack}
      onToggleFavorite={handleToggleFavorite}
      onPlayPause={handlePlayPause}
      loadingText="Loading meditation..."
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
