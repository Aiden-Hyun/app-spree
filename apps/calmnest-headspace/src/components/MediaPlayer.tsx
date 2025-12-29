import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AudioPlayer } from './AudioPlayer';
import { BackgroundAudioPicker } from './BackgroundAudioPicker';
import { useTheme } from '../contexts/ThemeContext';
import { Theme } from '../theme';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useBackgroundAudio } from '../hooks/useBackgroundAudio';
import { getAudioUrl } from '../constants/audioFiles';
import { getBackgroundSoundById } from '../constants/backgroundSoundsData';

export interface MediaPlayerProps {
  // Content info
  category: string;
  title: string;
  instructor?: string;
  instructorPhotoUrl?: string;
  description?: string;
  durationMinutes: number;
  difficultyLevel?: string;

  // Styling
  gradientColors: [string, string];
  artworkIcon: keyof typeof Ionicons.glyphMap;
  artworkThumbnailUrl?: string;

  // State
  isFavorited: boolean;
  isLoading: boolean;

  // Audio player state (from useAudioPlayer)
  audioPlayer: ReturnType<typeof useAudioPlayer>;

  // Callbacks
  onBack: () => void;
  onToggleFavorite: () => void;
  onPlayPause: () => void;

  // Optional loading text
  loadingText?: string;

  // Optional footer content (e.g., sleep timer button)
  footerContent?: React.ReactNode;

  // Enable background audio feature (default: true for meditations)
  enableBackgroundAudio?: boolean;
}

export function MediaPlayer({
  category,
  title,
  instructor,
  instructorPhotoUrl,
  description,
  durationMinutes,
  difficultyLevel,
  gradientColors,
  artworkIcon,
  artworkThumbnailUrl,
  isFavorited,
  isLoading,
  audioPlayer,
  onBack,
  onToggleFavorite,
  onPlayPause,
  loadingText = 'Loading...',
  footerContent,
  enableBackgroundAudio = true,
}: MediaPlayerProps) {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);

  // Background audio hook
  const backgroundAudio = useBackgroundAudio();

  // Load saved background sound audio URL when initialized
  useEffect(() => {
    async function loadSavedSoundAudio() {
      if (enableBackgroundAudio && backgroundAudio.isInitialized && backgroundAudio.selectedSoundId) {
        const sound = getBackgroundSoundById(backgroundAudio.selectedSoundId);
        if (sound) {
          const url = await getAudioUrl(sound.audioKey);
          if (url) {
            backgroundAudio.loadAudio(url);
          }
        }
      }
    }
    loadSavedSoundAudio();
  }, [backgroundAudio.isInitialized, backgroundAudio.selectedSoundId, enableBackgroundAudio]);

  // Sync background audio with main audio play/pause
  useEffect(() => {
    if (!enableBackgroundAudio) return;

    if (audioPlayer.isPlaying && backgroundAudio.isEnabled && backgroundAudio.selectedSoundId && backgroundAudio.hasAudioLoaded) {
      // Play background audio when main audio starts
      if (!hasStartedPlaying) {
        setHasStartedPlaying(true);
      }
      // Small delay to ensure audio is ready
      setTimeout(() => {
        backgroundAudio.play();
      }, 100);
    } else if (!audioPlayer.isPlaying) {
      backgroundAudio.pause();
    }
  }, [audioPlayer.isPlaying, backgroundAudio.isEnabled, backgroundAudio.hasAudioLoaded, enableBackgroundAudio]);

  // Cleanup background audio on unmount
  useEffect(() => {
    return () => {
      backgroundAudio.cleanup();
    };
  }, []);

  // Handle background sound selection
  const handleSelectSound = async (soundId: string | null, audioKey: string | null) => {
    if (soundId && audioKey) {
      backgroundAudio.selectSound(soundId);
      const url = await getAudioUrl(audioKey);
      if (url) {
        backgroundAudio.loadAudio(url);
        // If main audio is playing, start background audio too
        if (audioPlayer.isPlaying) {
          setTimeout(() => {
            backgroundAudio.play();
          }, 200);
        }
      }
    } else {
      backgroundAudio.selectSound(null);
    }
  };

  // Use dark gradient in dark mode
  const darkGradient: [string, string] = ['#1A1D29', '#2A2D3E'];
  const effectiveGradient = isDark ? darkGradient : gradientColors;

  // Get current background sound name for display
  const currentBackgroundSound = backgroundAudio.selectedSoundId
    ? getBackgroundSoundById(backgroundAudio.selectedSoundId)
    : null;

  if (isLoading) {
    return (
      <LinearGradient colors={effectiveGradient} style={styles.fullScreen}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.loadingText}>{loadingText}</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={effectiveGradient}
      style={styles.fullScreen}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerRight}>
            {/* Background Audio Button */}
            {enableBackgroundAudio && (
              <TouchableOpacity
                onPress={() => setShowBackgroundPicker(true)}
                style={[
                  styles.headerButton,
                  backgroundAudio.isEnabled && backgroundAudio.selectedSoundId && styles.headerButtonActive,
                ]}
              >
                <Ionicons
                  name="layers"
                  size={20}
                  color={
                    backgroundAudio.isEnabled && backgroundAudio.selectedSoundId
                      ? '#7DAFB4'
                      : 'white'
                  }
                />
              </TouchableOpacity>
            )}
            
            {/* Favorite Button */}
            <TouchableOpacity onPress={onToggleFavorite} style={styles.favoriteButton}>
              <Ionicons
                name={isFavorited ? 'heart' : 'heart-outline'}
                size={24}
                color={isFavorited ? '#FF6B6B' : 'white'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Background Audio Indicator */}
        {enableBackgroundAudio && backgroundAudio.isEnabled && currentBackgroundSound && audioPlayer.isPlaying && (
          <TouchableOpacity
            style={styles.backgroundIndicator}
            onPress={() => setShowBackgroundPicker(true)}
          >
            <Ionicons name="musical-notes" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={styles.backgroundIndicatorText}>
              {currentBackgroundSound.title}
            </Text>
          </TouchableOpacity>
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Artwork: Thumbnail or Icon */}
          <View style={styles.iconContainer}>
            {artworkThumbnailUrl ? (
              <Image source={{ uri: artworkThumbnailUrl }} style={styles.thumbnailImage} />
            ) : (
              <View style={styles.iconCircle}>
                <Ionicons name={artworkIcon} size={64} color="white" />
              </View>
            )}
          </View>

          {/* Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.category}>{category.replace('-', ' ')}</Text>
            <Text style={styles.title}>{title}</Text>
            {description && (
              <Text style={styles.description} numberOfLines={2}>
                {description}
              </Text>
            )}

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.metaText}>{durationMinutes} min</Text>
              </View>
              {difficultyLevel && (
                <View style={styles.metaItem}>
                  <Ionicons name="fitness-outline" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.metaText}>{difficultyLevel}</Text>
                </View>
              )}
            </View>

            {/* Narrator */}
            {instructor && (
              <View style={styles.narratorSection}>
                {instructorPhotoUrl ? (
                  <Image
                    source={{ uri: instructorPhotoUrl }}
                    style={styles.narratorPhoto}
                  />
                ) : (
                  <View style={styles.narratorPhotoPlaceholder}>
                    <Ionicons name="person" size={16} color="rgba(255,255,255,0.6)" />
                  </View>
                )}
                <Text style={styles.narratorText}>with {instructor}</Text>
              </View>
            )}
          </View>

          {/* Audio Player */}
          <View style={styles.playerContainer}>
            {audioPlayer.isLoading && !audioPlayer.duration ? (
              <View style={styles.loadingPlayer}>
                <ActivityIndicator size="large" color="white" />
                <Text style={styles.loadingPlayerText}>Loading audio...</Text>
              </View>
            ) : (
              <AudioPlayer
                isPlaying={audioPlayer.isPlaying}
                isLoading={audioPlayer.isLoading}
                duration={audioPlayer.duration}
                position={audioPlayer.position}
                progress={audioPlayer.progress}
                formattedPosition={audioPlayer.formattedPosition}
                formattedDuration={audioPlayer.formattedDuration}
                onPlay={onPlayPause}
                onPause={onPlayPause}
                onSeek={audioPlayer.seekTo}
              />
            )}
          </View>

          {/* Optional Footer Content */}
          {footerContent}
        </View>

        {/* Background Audio Picker Modal */}
        <BackgroundAudioPicker
          visible={showBackgroundPicker}
          onClose={() => setShowBackgroundPicker(false)}
          selectedSoundId={backgroundAudio.selectedSoundId}
          volume={backgroundAudio.volume}
          isEnabled={backgroundAudio.isEnabled}
          onSelectSound={handleSelectSound}
          onVolumeChange={backgroundAudio.setVolume}
          onToggleEnabled={backgroundAudio.setEnabled}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    fullScreen: {
      flex: 1,
    },
    safeArea: {
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
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerButtonActive: {
      backgroundColor: 'rgba(125, 175, 180, 0.25)',
    },
    favoriteButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    backgroundIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 16,
      alignSelf: 'center',
      marginTop: -8,
    },
    backgroundIndicatorText: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.7)',
    },
    content: {
      flex: 1,
      paddingHorizontal: theme.spacing.xl,
      alignItems: 'center',
    },
    iconContainer: {
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.xl,
    },
    iconCircle: {
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    thumbnailImage: {
      width: 140,
      height: 140,
      borderRadius: 70,
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
    description: {
      fontFamily: theme.fonts.body.regular,
      fontSize: 15,
      color: 'rgba(255, 255, 255, 0.85)',
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    metaRow: {
      flexDirection: 'row',
      gap: theme.spacing.xl,
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
    narratorSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    narratorPhoto: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    narratorPhotoPlaceholder: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    narratorText: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    playerContainer: {
      width: '100%',
      marginBottom: theme.spacing.xl,
    },
    loadingPlayer: {
      alignItems: 'center',
      justifyContent: 'center',
      height: 150,
      gap: theme.spacing.md,
    },
    loadingPlayerText: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.7)',
    },
  });
