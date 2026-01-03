import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProtectedRoute } from '../../../src/components/ProtectedRoute';
import { MediaPlayer } from '../../../src/components/MediaPlayer';
import { useAudioPlayer } from '../../../src/hooks/useAudioPlayer';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import { getAudioUrlFromPath } from '../../../src/constants/audioFiles';
import { getNarratorByName } from '../../../src/constants/narratorData';
import { addToListeningHistory, toggleFavorite, isFavorite } from '../../../src/services/firestoreService';
import { Theme } from '../../../src/theme';

function CourseSessionPlayerScreen() {
  const { id, audioPath, title, courseTitle, duration, instructor, color } = useLocalSearchParams<{
    id: string;
    audioPath: string;
    title: string;
    courseTitle: string;
    duration: string;
    instructor: string;
    color: string;
  }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [hasTrackedPlay, setHasTrackedPlay] = useState(false);
  const [isFavoritedState, setIsFavoritedState] = useState(false);

  const styles = useMemo(() => createStyles(theme), [theme]);
  const audioPlayer = useAudioPlayer();
  const narratorData = instructor ? getNarratorByName(instructor) : undefined;

  // Check if favorited on load
  useEffect(() => {
    async function checkFavorite() {
      if (user && id) {
        const favorited = await isFavorite(user.uid, id, 'course_session');
        setIsFavoritedState(favorited);
      }
    }
    checkFavorite();
  }, [user, id]);

  useEffect(() => {
    async function loadSessionAudio() {
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
    
    loadSessionAudio();
  }, [audioPath]);

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
          'course_session',
          `${courseTitle}: ${title}`,
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
      const newFavorited = await toggleFavorite(user.uid, id, 'course_session');
      if (newFavorited !== !previousState) {
        setIsFavoritedState(newFavorited);
      }
    } catch {
      setIsFavoritedState(previousState);
    }
  };

  // Use course color for gradient, fallback to teal
  const courseColor = color || '#7DAFB4';
  const gradientColors: [string, string] = [courseColor, `${courseColor}CC`];

  return (
    <MediaPlayer
      category={courseTitle || 'Course'}
      title={title || 'Loading...'}
      instructor={instructor}
      instructorPhotoUrl={narratorData?.photoUrl}
      durationMinutes={parseInt(duration) || 0}
      gradientColors={gradientColors}
      artworkIcon="school"
      isFavorited={isFavoritedState}
      isLoading={loading}
      audioPlayer={audioPlayer}
      onBack={handleGoBack}
      onToggleFavorite={handleToggleFavorite}
      onPlayPause={handlePlayPause}
      loadingText="Loading session..."
    />
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    // No additional styles needed - MediaPlayer handles everything
  });

export default function CourseSessionPlayer() {
  return (
    <ProtectedRoute>
      <CourseSessionPlayerScreen />
    </ProtectedRoute>
  );
}

