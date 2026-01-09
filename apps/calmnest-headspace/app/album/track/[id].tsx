import React, { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ProtectedRoute } from '../../../src/components/ProtectedRoute';
import { MediaPlayer } from '../../../src/components/MediaPlayer';
import { useAudioPlayer } from '../../../src/hooks/useAudioPlayer';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import { getAudioUrlFromPath } from '../../../src/constants/audioFiles';
import { addToListeningHistory, toggleFavorite, isFavorite, createSession, markContentCompleted } from '../../../src/services/firestoreService';

interface TrackItem {
  id: string;
  audioPath: string;
  title: string;
  duration_minutes: number;
  trackNumber: number;
}

function AlbumTrackPlayerScreen() {
  const { id, audioPath, title, albumTitle, duration, artist, thumbnailUrl, tracksJson, currentIndex, autoPlay } = useLocalSearchParams<{
    id: string;
    audioPath: string;
    title: string;
    albumTitle: string;
    duration: string;
    artist: string;
    thumbnailUrl?: string;
    tracksJson?: string;
    currentIndex?: string;
    autoPlay?: string;
  }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [hasTrackedPlay, setHasTrackedPlay] = useState(false);
  const [hasTrackedSession, setHasTrackedSession] = useState(false);
  const [isFavoritedState, setIsFavoritedState] = useState(false);

  const audioPlayer = useAudioPlayer();

  // Parse tracks for prev/next navigation
  const tracks: TrackItem[] = useMemo(() => {
    if (!tracksJson) return [];
    try {
      return JSON.parse(tracksJson);
    } catch {
      return [];
    }
  }, [tracksJson]);

  const currentIdx = parseInt(currentIndex || '0', 10);
  const hasPrevious = tracks.length > 0 && currentIdx > 0;
  const hasNext = tracks.length > 0 && currentIdx < tracks.length - 1;

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
    
    loadTrackAudio();
  }, [audioPath]);

  // Auto-start playback when coming from auto-play navigation
  useEffect(() => {
    if (autoPlay === 'true' && !loading && audioPlayer.duration > 0 && !audioPlayer.isPlaying) {
      audioPlayer.play();
    }
  }, [autoPlay, loading, audioPlayer.duration]);

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
            session_type: 'album_track',
          });
          // Mark this track as completed
          await markContentCompleted(user.uid, id, 'album_track');
        } catch (error) {
          console.error('Failed to track session:', error);
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

  const handlePrevious = () => {
    if (!hasPrevious) return;
    const prevTrack = tracks[currentIdx - 1];
    audioPlayer.cleanup();
    router.replace({
      pathname: '/album/track/[id]',
      params: {
        id: prevTrack.id,
        audioPath: prevTrack.audioPath,
        title: prevTrack.title,
        albumTitle,
        duration: String(prevTrack.duration_minutes),
        artist,
        thumbnailUrl: thumbnailUrl || '',
        tracksJson,
        currentIndex: String(currentIdx - 1),
      },
    });
  };

  const handleNext = () => {
    if (!hasNext) return;
    const nextTrack = tracks[currentIdx + 1];
    audioPlayer.cleanup();
    router.replace({
      pathname: '/album/track/[id]',
      params: {
        id: nextTrack.id,
        audioPath: nextTrack.audioPath,
        title: nextTrack.title,
        albumTitle,
        duration: String(nextTrack.duration_minutes),
        artist,
        thumbnailUrl: thumbnailUrl || '',
        tracksJson,
        currentIndex: String(currentIdx + 1),
        autoPlay: 'true',
      },
    });
  };

  return (
    <MediaPlayer
      category={albumTitle || 'Album'}
      title={title || 'Loading...'}
      instructor={artist}
      durationMinutes={parseInt(duration) || 0}
      gradientColors={theme.gradients.sleepyNight as [string, string]}
      artworkIcon="musical-notes"
      artworkThumbnailUrl={thumbnailUrl}
      isFavorited={isFavoritedState}
      isLoading={loading}
      audioPlayer={audioPlayer}
      onBack={handleGoBack}
      onToggleFavorite={handleToggleFavorite}
      onPlayPause={handlePlayPause}
      loadingText="Loading track..."
      onPrevious={hasPrevious ? handlePrevious : undefined}
      onNext={hasNext ? handleNext : undefined}
      hasPrevious={hasPrevious}
      hasNext={hasNext}
      contentId={id}
      contentType="album_track"
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
