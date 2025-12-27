import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProtectedRoute } from '../../../src/components/ProtectedRoute';
import { MediaPlayer } from '../../../src/components/MediaPlayer';
import { useAudioPlayer } from '../../../src/hooks/useAudioPlayer';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import { getAudioUrl } from '../../../src/constants/audioFiles';
import { getNarratorByName } from '../../../src/constants/narratorData';
import { addToListeningHistory, toggleFavorite, isFavorite } from '../../../src/services/firestoreService';
import { Theme } from '../../../src/theme';

function SeriesChapterPlayerScreen() {
  const { id, audioKey, title, seriesTitle, duration, narrator } = useLocalSearchParams<{
    id: string;
    audioKey: string;
    title: string;
    seriesTitle: string;
    duration: string;
    narrator: string;
  }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [hasTrackedPlay, setHasTrackedPlay] = useState(false);
  const [isFavoritedState, setIsFavoritedState] = useState(false);

  const styles = useMemo(() => createStyles(theme), [theme]);
  const audioPlayer = useAudioPlayer();
  const narratorData = narrator ? getNarratorByName(narrator) : undefined;

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
    async function loadChapterAudio() {
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
    
    loadChapterAudio();
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
          'series_chapter',
          `${seriesTitle}: ${title}`,
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
      const newFavorited = await toggleFavorite(user.uid, id, 'series_chapter');
      if (newFavorited !== !previousState) {
        setIsFavoritedState(newFavorited);
      }
    } catch {
      setIsFavoritedState(previousState);
    }
  };

  const sleepTimerButton = (
          <TouchableOpacity style={styles.timerButton}>
            <Ionicons name="moon-outline" size={20} color={theme.colors.sleepTextMuted} />
            <Text style={styles.timerButtonText}>Set Sleep Timer</Text>
          </TouchableOpacity>
  );

  return (
    <MediaPlayer
      category={seriesTitle || 'Series'}
      title={title || 'Loading...'}
      instructor={narrator}
      instructorPhotoUrl={narratorData?.photoUrl}
      durationMinutes={parseInt(duration) || 0}
      gradientColors={theme.gradients.sleepyNight as [string, string]}
      artworkIcon="book"
      isFavorited={isFavoritedState}
      isLoading={loading}
      audioPlayer={audioPlayer}
      onBack={handleGoBack}
      onToggleFavorite={handleToggleFavorite}
      onPlayPause={handlePlayPause}
      loadingText="Loading chapter..."
      footerContent={sleepTimerButton}
    />
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    timerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: theme.borderRadius.lg,
    },
    timerButtonText: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 14,
      color: theme.colors.sleepTextMuted,
    },
  });

export default function SeriesChapterPlayer() {
  return (
    <ProtectedRoute>
      <SeriesChapterPlayerScreen />
    </ProtectedRoute>
  );
}
