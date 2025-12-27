import React, { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ProtectedRoute } from '../../../src/components/ProtectedRoute';
import { MediaPlayer } from '../../../src/components/MediaPlayer';
import { useAudioPlayer } from '../../../src/hooks/useAudioPlayer';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import { getAudioUrl } from '../../../src/constants/audioFiles';
import { addToListeningHistory, toggleFavorite, isFavorite } from '../../../src/services/firestoreService';

function AlbumTrackPlayerScreen() {
  const { id, audioKey, title, albumTitle, duration, artist } = useLocalSearchParams<{
    id: string;
    audioKey: string;
    title: string;
    albumTitle: string;
    duration: string;
    artist: string;
  }>();
  const router = useRouter();
  const { theme } = useTheme();
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
    async function loadTrackAudio() {
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
    
    loadTrackAudio();
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
          'album_track',
          `${albumTitle}: ${title}`,
          parseInt(duration) || 0,
          undefined
        );
      }
    }
  };

  const handleToggleFavorite = async () => {
    if (!user || !id) return;
    
    // Optimistic update
    const previousState = isFavoritedState;
    setIsFavoritedState(!previousState);
    
    try {
      const newFavorited = await toggleFavorite(user.uid, id, 'album_track');
      if (newFavorited !== !previousState) {
        setIsFavoritedState(newFavorited);
      }
    } catch {
      setIsFavoritedState(previousState);
    }
  };

  return (
    <MediaPlayer
      category={albumTitle || 'Album'}
      title={title || 'Loading...'}
      instructor={artist}
      durationMinutes={parseInt(duration) || 0}
      gradientColors={theme.gradients.sleepyNight as [string, string]}
      artworkIcon="musical-notes"
      isFavorited={isFavoritedState}
      isLoading={loading}
      audioPlayer={audioPlayer}
      onBack={handleGoBack}
      onToggleFavorite={handleToggleFavorite}
      onPlayPause={handlePlayPause}
      loadingText="Loading track..."
    />
  );
}

export default function AlbumTrackPlayer() {
  return (
    <ProtectedRoute>
      <AlbumTrackPlayerScreen />
    </ProtectedRoute>
  );
}
