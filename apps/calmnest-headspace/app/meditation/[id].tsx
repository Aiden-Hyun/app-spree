import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import { MediaPlayer } from '../../src/components/MediaPlayer';
import { useAudioPlayer } from '../../src/hooks/useAudioPlayer';
import { useTheme } from '../../src/contexts/ThemeContext';
import { getMeditationById, addToListeningHistory, toggleFavorite, isFavorite, createSession } from '../../src/services/firestoreService';
import { useAuth } from '../../src/contexts/AuthContext';
import { getAudioUrl, getAudioUrlFromPath } from '../../src/constants/audioFiles';
import { Theme } from '../../src/theme';
import { GuidedMeditation } from '../../src/types';

function MeditationPlayerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const { user, isAnonymous } = useAuth();
  const [meditation, setMeditation] = useState<GuidedMeditation | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasTrackedPlay, setHasTrackedPlay] = useState(false);
  const [hasTrackedSession, setHasTrackedSession] = useState(false);
  const [isFavoritedState, setIsFavoritedState] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);

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
    async function loadMeditation() {
      try {
        setLoading(true);
        const data = await getMeditationById(id as string);
        setMeditation(data);
      } catch (error) {
        console.error('Failed to load meditation:', error);
      } finally {
        setLoading(false);
      }
    }
    
    if (id) {
      loadMeditation();
    }
  }, [id]);

  useEffect(() => {
    async function loadMeditationAudio() {
      if (!meditation) return;
      
      // Use the new audioPath field
      if (meditation.audioPath) {
        const url = await getAudioUrlFromPath(meditation.audioPath);
        if (url) {
          setAudioUrl(url);
          audioPlayer.loadAudio(url);
        }
      }
    }
    
    loadMeditationAudio();
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
            session_type: 'meditation',
          });
        } catch (error) {
          console.error('Failed to track session:', error);
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
    
    // Optimistic update - toggle immediately
    const previousState = isFavoritedState;
    setIsFavoritedState(!previousState);
    
    try {
      const newFavorited = await toggleFavorite(user.uid, meditation.id, 'meditation');
      // Sync with server response in case of mismatch
      if (newFavorited !== !previousState) {
        setIsFavoritedState(newFavorited);
      }
    } catch {
      // Revert on error
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
          'meditation',
          meditation.title,
          meditation.duration_minutes,
          meditation.thumbnailUrl
        );
      }
    }
  };

  const getGradientColors = (): [string, string] => {
    // Use the first theme if available
    const primaryTheme = meditation?.themes?.[0] || 'focus';
    switch (primaryTheme) {
      case 'sleep':
        return ['#1A1D29', '#2A2D3E'];
      case 'stress':
      case 'anxiety':
        return ['#8B9F82', '#A8B89F'];
      case 'focus':
        return ['#7B8FA1', '#9AABB8'];
      case 'gratitude':
      case 'loving-kindness':
        return ['#C4A77D', '#D4BFA0'];
      default:
        return ['#8B9F82', '#A8B89F'];
    }
  };

  // Error state - meditation not found
  if (!loading && !meditation) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={['#8B9F82', '#A8B89F', '#D4D9D2']} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="white" />
            <Text style={styles.errorText}>Meditation not found</Text>
            <TouchableOpacity style={styles.backButtonLarge} onPress={handleGoBack}>
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const instructorName = meditation?.instructor || 'Guide';

  return (
    <MediaPlayer
      category={meditation?.themes?.[0] || 'meditation'}
      title={meditation?.title || 'Loading...'}
      instructor={instructorName}
      description={meditation?.description || ''}
      durationMinutes={meditation?.duration_minutes || 0}
      difficultyLevel={meditation?.difficulty_level}
      gradientColors={getGradientColors()}
      artworkIcon="leaf"
      artworkThumbnailUrl={meditation?.thumbnailUrl}
      isFavorited={isFavoritedState}
      isLoading={loading}
      audioPlayer={audioPlayer}
      onBack={handleGoBack}
      onToggleFavorite={handleToggleFavorite}
      onPlayPause={handlePlayPause}
      loadingText="Loading meditation..."
      contentId={id as string}
      contentType="guided_meditation"
      audioUrl={audioUrl}
      audioPath={meditation?.audioPath}
    />
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  errorText: {
    fontFamily: theme.fonts.ui.semiBold,
    fontSize: 18,
    color: 'white',
    marginTop: 16,
  },
  backButtonLarge: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: theme.borderRadius.lg,
  },
  backButtonText: {
    fontFamily: theme.fonts.ui.semiBold,
    fontSize: 16,
    color: 'white',
  },
});

export default function MeditationPlayer() {
  return (
    <ProtectedRoute>
      <MeditationPlayerScreen />
    </ProtectedRoute>
  );
}
