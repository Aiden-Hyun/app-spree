import React, { useMemo, useState, useEffect, useRef } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AudioPlayer } from './AudioPlayer';
import { BackgroundAudioPicker } from './BackgroundAudioPicker';
import { useTheme } from '../contexts/ThemeContext';
import { Theme } from '../theme';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useBackgroundAudio } from '../hooks/useBackgroundAudio';
import { getAudioUrlFromPath } from '../constants/audioFiles';
import { getBackgroundSoundById, getNarratorByName, FirestoreBackgroundSound, savePlaybackProgress, getPlaybackProgress, clearPlaybackProgress } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';
import { DownloadButton } from './DownloadButton';
import { useNetwork } from '../contexts/NetworkContext';

const AUTOPLAY_KEY = 'calmnest_autoplay_enabled';

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

  // Previous/Next navigation (for collections like courses, series, albums)
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;

  // Content identification for progress tracking
  contentId?: string;
  contentType?: string;

  // Audio URL for download
  audioUrl?: string;
  
  // Additional metadata for downloads
  parentId?: string;
  parentTitle?: string;
  audioPath?: string;
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
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  contentId,
  contentType,
  audioUrl,
  parentId,
  parentTitle,
  audioPath,
}: MediaPlayerProps) {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { isOffline } = useNetwork();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [currentBackgroundSound, setCurrentBackgroundSound] = useState<FirestoreBackgroundSound | null>(null);
  const [narratorPhotoUrl, setNarratorPhotoUrl] = useState<string | null>(instructorPhotoUrl || null);
  
  // Auto-play state
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const hasTriggeredAutoPlay = useRef(false);

  // Playback progress tracking
  const lastSaveTime = useRef(0);
  const hasRestoredPosition = useRef(false);

  // Load auto-play preference from AsyncStorage
  useEffect(() => {
    async function loadAutoPlayPreference() {
      try {
        const stored = await AsyncStorage.getItem(AUTOPLAY_KEY);
        if (stored !== null) {
          setAutoPlayEnabled(stored === 'true');
        }
      } catch (error) {
        console.error('Failed to load auto-play preference:', error);
      }
    }
    loadAutoPlayPreference();
  }, []);

  // Save auto-play preference when it changes
  const toggleAutoPlay = async () => {
    const newValue = !autoPlayEnabled;
    setAutoPlayEnabled(newValue);
    try {
      await AsyncStorage.setItem(AUTOPLAY_KEY, String(newValue));
    } catch (error) {
      console.error('Failed to save auto-play preference:', error);
    }
  };

  // Background audio hook
  const backgroundAudio = useBackgroundAudio();

  // Fetch narrator photo if not provided
  useEffect(() => {
    async function fetchNarratorPhoto() {
      if (instructor && !instructorPhotoUrl) {
        const narrator = await getNarratorByName(instructor);
        if (narrator?.profileUrl) {
          setNarratorPhotoUrl(narrator.profileUrl);
        }
      }
    }
    fetchNarratorPhoto();
  }, [instructor, instructorPhotoUrl]);

  // Fetch current background sound when selectedSoundId changes
  useEffect(() => {
    async function fetchCurrentSound() {
      if (backgroundAudio.selectedSoundId) {
        const sound = await getBackgroundSoundById(backgroundAudio.selectedSoundId);
        setCurrentBackgroundSound(sound);
      } else {
        setCurrentBackgroundSound(null);
      }
    }
    fetchCurrentSound();
  }, [backgroundAudio.selectedSoundId]);

  // Load saved background sound audio URL when initialized
  useEffect(() => {
    async function loadSavedSoundAudio() {
      if (enableBackgroundAudio && backgroundAudio.isInitialized && backgroundAudio.selectedSoundId) {
        const sound = await getBackgroundSoundById(backgroundAudio.selectedSoundId);
        if (sound) {
          const url = await getAudioUrlFromPath(sound.audioPath);
          if (url) {
            backgroundAudio.loadAudio(url, backgroundAudio.selectedSoundId);
          }
        }
      }
    }
    loadSavedSoundAudio();
  }, [backgroundAudio.isInitialized, backgroundAudio.selectedSoundId, enableBackgroundAudio]);

  // Auto-play background audio when it's loaded and enabled (independent of main audio)
  useEffect(() => {
    if (!enableBackgroundAudio) return;

    // Play background audio automatically when it's loaded and enabled
    // This runs independently of the main content audio
    if (backgroundAudio.isEnabled && backgroundAudio.selectedSoundId && backgroundAudio.hasAudioLoaded) {
      backgroundAudio.play();
    }
  }, [backgroundAudio.isEnabled, backgroundAudio.hasAudioLoaded, backgroundAudio.selectedSoundId, enableBackgroundAudio]);

  // Cleanup background audio on unmount
  useEffect(() => {
    return () => {
      backgroundAudio.cleanup();
    };
  }, []);

  // Reset auto-play trigger flag when track changes
  useEffect(() => {
    hasTriggeredAutoPlay.current = false;
  }, [title]);

  // Auto-play next track when current one completes
  useEffect(() => {
    // Check if audio has completed naturally (progress >= 0.99 and not playing)
    if (
      autoPlayEnabled &&
      hasNext &&
      onNext &&
      audioPlayer.progress >= 0.99 &&
      !audioPlayer.isPlaying &&
      audioPlayer.duration > 0 &&
      !hasTriggeredAutoPlay.current
    ) {
      // Mark as triggered to prevent double-firing
      hasTriggeredAutoPlay.current = true;
      // Small delay to ensure smooth transition
      setTimeout(() => {
        onNext();
      }, 500);
    }
  }, [autoPlayEnabled, hasNext, onNext, audioPlayer.progress, audioPlayer.isPlaying, audioPlayer.duration]);

  // Restore playback position on mount
  useEffect(() => {
    async function restorePosition() {
      if (!user?.uid || !contentId || hasRestoredPosition.current) return;
      
      const progress = await getPlaybackProgress(user.uid, contentId);
      if (progress && progress.position_seconds > 5) {
        // Wait for audio to be ready before seeking
        const checkAndSeek = () => {
          if (audioPlayer.duration > 0) {
            audioPlayer.seekTo(progress.position_seconds);
            hasRestoredPosition.current = true;
          } else {
            // Retry after a short delay if audio not ready
            setTimeout(checkAndSeek, 100);
          }
        };
        checkAndSeek();
      } else {
        hasRestoredPosition.current = true;
      }
    }
    restorePosition();
  }, [user?.uid, contentId, audioPlayer.duration]);

  // Reset restore flag when content changes
  useEffect(() => {
    hasRestoredPosition.current = false;
    lastSaveTime.current = 0;
  }, [contentId]);

  // Save playback position periodically (every 10 seconds) and on pause
  useEffect(() => {
    if (!user?.uid || !contentId || !contentType) return;
    if (audioPlayer.position < 5 || audioPlayer.duration === 0) return;

    const now = Date.now();
    const shouldSave = 
      (!audioPlayer.isPlaying && audioPlayer.position > 5) || // Save on pause
      (now - lastSaveTime.current >= 10000); // Save every 10 seconds

    if (shouldSave) {
      lastSaveTime.current = now;
      savePlaybackProgress(
        user.uid,
        contentId,
        contentType,
        audioPlayer.position,
        audioPlayer.duration
      );
    }
  }, [user?.uid, contentId, contentType, audioPlayer.position, audioPlayer.isPlaying, audioPlayer.duration]);

  // Clear progress when content is completed
  useEffect(() => {
    if (!user?.uid || !contentId) return;
    if (audioPlayer.progress >= 0.95 && audioPlayer.duration > 0) {
      clearPlaybackProgress(user.uid, contentId);
    }
  }, [user?.uid, contentId, audioPlayer.progress, audioPlayer.duration]);

  // Save position on unmount
  useEffect(() => {
    return () => {
      if (user?.uid && contentId && contentType && audioPlayer.position > 5 && audioPlayer.duration > 0) {
        savePlaybackProgress(
          user.uid,
          contentId,
          contentType,
          audioPlayer.position,
          audioPlayer.duration
        );
      }
    };
  }, [user?.uid, contentId, contentType, audioPlayer.position, audioPlayer.duration]);

  // Handle background sound selection
  const handleSelectSound = async (soundId: string | null, audioPath: string | null) => {
    if (soundId && audioPath) {
      backgroundAudio.selectSound(soundId);
      const url = await getAudioUrlFromPath(audioPath);
      if (url) {
        backgroundAudio.loadAudio(url, soundId);
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
                  name="musical-notes"
                  size={20}
                  color={
                    backgroundAudio.isEnabled && backgroundAudio.selectedSoundId
                      ? '#7DAFB4'
                      : 'white'
                  }
                />
              </TouchableOpacity>
            )}
            
            {/* Download Button */}
            {!isOffline && contentId && contentType && audioUrl && (
              <DownloadButton
                contentId={contentId}
                contentType={contentType}
                audioUrl={audioUrl}
                metadata={{
                  title,
                  duration_minutes: durationMinutes,
                  thumbnailUrl: artworkThumbnailUrl,
                  parentId,
                  parentTitle,
                  audioPath,
                }}
                size={24}
                darkMode={true}
              />
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
                {narratorPhotoUrl ? (
                  <Image
                    source={{ uri: narratorPhotoUrl }}
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
                // Playback controls
                playbackRate={audioPlayer.playbackRate}
                isLooping={audioPlayer.isLooping}
                onPlaybackRateChange={audioPlayer.setPlaybackRate}
                onSkipBack={() => audioPlayer.skipBackward(15)}
                onSkipForward={() => audioPlayer.skipForward(15)}
                onToggleLoop={() => audioPlayer.setLoop(!audioPlayer.isLooping)}
              />
            )}

            {/* Previous/Next Navigation */}
            {(onPrevious || onNext) && (
              <View style={styles.trackNavigation}>
                <TouchableOpacity
                  style={[styles.trackNavButton, !hasPrevious && styles.trackNavButtonDisabled]}
                  onPress={hasPrevious ? onPrevious : undefined}
                  disabled={!hasPrevious}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="play-skip-back"
                    size={24}
                    color={hasPrevious ? 'white' : 'rgba(255,255,255,0.3)'}
                  />
                  <Text style={[styles.trackNavText, !hasPrevious && styles.trackNavTextDisabled]}>
                    Previous
                  </Text>
                </TouchableOpacity>

                {/* Auto-play Toggle */}
                <TouchableOpacity
                  style={[styles.autoPlayButton, autoPlayEnabled && styles.autoPlayButtonActive]}
                  onPress={toggleAutoPlay}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={autoPlayEnabled ? 'play-forward-circle' : 'play-forward-circle-outline'}
                    size={20}
                    color={autoPlayEnabled ? 'white' : 'rgba(255,255,255,0.5)'}
                  />
                  <Text style={[styles.autoPlayText, autoPlayEnabled && styles.autoPlayTextActive]}>
                    Auto
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.trackNavButton, !hasNext && styles.trackNavButtonDisabled]}
                  onPress={hasNext ? onNext : undefined}
                  disabled={!hasNext}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.trackNavText, !hasNext && styles.trackNavTextDisabled]}>
                    Next
                  </Text>
                  <Ionicons
                    name="play-skip-forward"
                    size={24}
                    color={hasNext ? 'white' : 'rgba(255,255,255,0.3)'}
                  />
                </TouchableOpacity>
              </View>
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
          loadingSoundId={backgroundAudio.loadingSoundId}
          isAudioReady={backgroundAudio.isAudioReady}
          hasError={backgroundAudio.hasError}
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
    trackNavigation: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: theme.spacing.lg,
      paddingHorizontal: theme.spacing.md,
    },
    trackNavButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    trackNavButtonDisabled: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    trackNavText: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 14,
      color: 'white',
    },
    trackNavTextDisabled: {
      color: 'rgba(255, 255, 255, 0.3)',
    },
    autoPlayButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    autoPlayButtonActive: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    autoPlayText: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.5)',
    },
    autoPlayTextActive: {
      color: 'white',
    },
  });
