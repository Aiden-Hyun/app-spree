import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import { MeditationTimer } from '../../src/components/MeditationTimer';
import { AudioPlayer } from '../../src/components/AudioPlayer';
import { useMeditation } from '../../src/hooks/useMeditation';
import { useAudioPlayer } from '../../src/hooks/useAudioPlayer';
import { useTheme } from '../../src/contexts/ThemeContext';
import { getMeditationById, addToListeningHistory, toggleFavorite, isFavorite } from '../../src/services/firestoreService';
import { useAuth } from '../../src/contexts/AuthContext';
import { getAudioUrl } from '../../src/constants/audioFiles';
import { Theme } from '../../src/theme';
import { GuidedMeditation } from '../../src/types';

function MeditationPlayerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [meditation, setMeditation] = useState<GuidedMeditation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTimer, setShowTimer] = useState(false);
  const [hasTrackedPlay, setHasTrackedPlay] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const styles = useMemo(() => createStyles(theme), [theme]);

  const audioPlayer = useAudioPlayer();
  const meditationTimer = useMeditation({
    duration: meditation?.duration_minutes || 10,
    sessionType: 'meditation',
    onComplete: (session) => {
      console.log('Meditation completed:', session);
    },
  });

  // Check if favorited on load
  useEffect(() => {
    async function checkFavorite() {
      if (user && id) {
        const favorited = await isFavorite(user.uid, id as string);
        setIsFavorited(favorited);
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
      
      // Try to get audio URL from audio_file key
      if (meditation.audio_file) {
        const audioUrl = await getAudioUrl(meditation.audio_file);
        if (audioUrl) {
          audioPlayer.loadAudio(audioUrl);
          return;
        }
      }
      
      // Fallback to direct audio_url
      if (meditation.audio_url) {
        audioPlayer.loadAudio(meditation.audio_url);
      }
    }
    
    loadMeditationAudio();
  }, [meditation]);

  const handleGoBack = () => {
    audioPlayer.cleanup();
    router.back();
  };

  const handleToggleFavorite = async () => {
    if (!user || !meditation) return;
    
    const newFavorited = await toggleFavorite(user.uid, meditation.id, 'meditation');
    setIsFavorited(newFavorited);
  };

  const handlePlayPause = async () => {
    if (audioPlayer.isPlaying) {
      audioPlayer.pause();
      if (meditationTimer.isActive && !meditationTimer.isPaused) {
        meditationTimer.pause();
      }
    } else {
      audioPlayer.play();
      if (!meditationTimer.isActive) {
        meditationTimer.start();
      } else if (meditationTimer.isPaused) {
        meditationTimer.resume();
      }
      
      // Track listening history on first play
      if (!hasTrackedPlay && user && meditation) {
        setHasTrackedPlay(true);
        await addToListeningHistory(
          user.uid,
          meditation.id,
          'meditation',
          meditation.title,
          meditation.duration_minutes,
          meditation.thumbnail_url
        );
      }
    }
  };

  const getGradientColors = (): [string, string, string] => {
    const category = meditation?.category || 'focus';
    switch (category) {
      case 'sleep':
        return ['#1A1D29', '#2A2D3E', '#3D4158'];
      case 'stress':
      case 'anxiety':
        return ['#8B9F82', '#A8B89F', '#C4D4BC'];
      case 'focus':
        return ['#7B8FA1', '#9AABB8', '#B8C7D1'];
      case 'gratitude':
      case 'loving-kindness':
        return ['#C4A77D', '#D4BFA0', '#E4D7C0'];
      default:
        return ['#8B9F82', '#A8B89F', '#D4D9D2'];
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={['#8B9F82', '#A8B89F', '#D4D9D2']} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.loadingText}>Loading meditation...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!meditation) {
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={getGradientColors()}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleToggleFavorite} style={styles.moreButton}>
            <Ionicons 
              name={isFavorited ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorited ? "#FF6B6B" : "white"} 
            />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.infoContainer}>
            <Text style={styles.category}>{meditation.category?.replace('-', ' ')}</Text>
            <Text style={styles.title}>{meditation.title}</Text>
            <Text style={styles.instructor}>with {meditation.instructor || 'Guide'}</Text>
            <Text style={styles.description} numberOfLines={3}>
              {meditation.description}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.metaText}>{meditation.duration_minutes} min</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="fitness-outline" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.metaText}>{meditation.difficulty_level}</Text>
              </View>
            </View>
          </View>

          {/* Toggle between Timer and Audio Player */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, !showTimer && styles.toggleButtonActive]}
              onPress={() => setShowTimer(false)}
            >
              <Text style={[styles.toggleText, !showTimer && styles.toggleTextActive]}>
                Guided
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, showTimer && styles.toggleButtonActive]}
              onPress={() => setShowTimer(true)}
            >
              <Text style={[styles.toggleText, showTimer && styles.toggleTextActive]}>
                Timer
              </Text>
            </TouchableOpacity>
          </View>

          {/* Player/Timer */}
          {showTimer ? (
            <MeditationTimer
              progress={meditationTimer.progress}
              timeRemaining={meditationTimer.formattedTime}
              isActive={meditationTimer.isActive}
              isPaused={meditationTimer.isPaused}
              onStart={meditationTimer.start}
              onPause={meditationTimer.pause}
              onResume={meditationTimer.resume}
              onStop={meditationTimer.stop}
              size={280}
            />
          ) : (
            <View style={styles.playerContainer}>
              <View style={styles.artworkContainer}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                  style={styles.artwork}
                >
                  <Ionicons name="leaf" size={100} color="white" />
                </LinearGradient>
              </View>
              
              <AudioPlayer
                isPlaying={audioPlayer.isPlaying}
                isLoading={audioPlayer.isLoading}
                duration={audioPlayer.duration}
                position={audioPlayer.position}
                progress={audioPlayer.progress}
                formattedPosition={audioPlayer.formattedPosition}
                formattedDuration={audioPlayer.formattedDuration}
                onPlay={handlePlayPause}
                onPause={handlePlayPause}
                onSeek={audioPlayer.seekTo}
              />
            </View>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
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
  loadingText: {
    fontFamily: theme.fonts.ui.medium,
    fontSize: 16,
    color: 'white',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  category: {
    fontFamily: theme.fonts.ui.medium,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontFamily: theme.fonts.display.semiBold,
    fontSize: 28,
    color: 'white',
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  instructor: {
    fontFamily: theme.fonts.ui.regular,
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: theme.spacing.md,
  },
  description: {
    fontFamily: theme.fonts.body.regular,
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: theme.spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontFamily: theme.fonts.ui.regular,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'capitalize',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: theme.borderRadius.full,
    padding: 4,
    marginBottom: theme.spacing.xl,
    alignSelf: 'center',
  },
  toggleButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  toggleButtonActive: {
    backgroundColor: 'white',
  },
  toggleText: {
    fontFamily: theme.fonts.ui.semiBold,
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  toggleTextActive: {
    color: theme.colors.primary,
  },
  playerContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  artworkContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  artwork: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default function MeditationPlayer() {
  return (
    <ProtectedRoute>
      <MeditationPlayerScreen />
    </ProtectedRoute>
  );
}
