import React, { useMemo } from 'react';
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
import { useTheme } from '../contexts/ThemeContext';
import { Theme } from '../theme';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

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
  safeAreaBgColor?: string;
  iconColor?: string;

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
  safeAreaBgColor,
  iconColor = 'white',
  isFavorited,
  isLoading,
  audioPlayer,
  onBack,
  onToggleFavorite,
  onPlayPause,
  loadingText = 'Loading...',
  footerContent,
}: MediaPlayerProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const bgColor = safeAreaBgColor || gradientColors[0];

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
        <LinearGradient colors={gradientColors} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={iconColor} />
            <Text style={[styles.loadingText, { color: iconColor }]}>{loadingText}</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <LinearGradient
        colors={gradientColors}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={iconColor} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onToggleFavorite} style={styles.favoriteButton}>
            <Ionicons
              name={isFavorited ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorited ? '#FF6B6B' : iconColor}
            />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Artwork: Thumbnail or Icon */}
          <View style={styles.iconContainer}>
            {artworkThumbnailUrl ? (
              <Image source={{ uri: artworkThumbnailUrl }} style={styles.thumbnailImage} />
            ) : (
              <View style={styles.iconCircle}>
                <Ionicons name={artworkIcon} size={64} color={iconColor} />
              </View>
            )}
          </View>

          {/* Info */}
          <View style={styles.infoContainer}>
            <Text style={[styles.category, { color: `${iconColor}B3` }]}>
              {category.replace('-', ' ')}
            </Text>
            <Text style={[styles.title, { color: iconColor }]}>{title}</Text>
            {description && (
              <Text style={[styles.description, { color: `${iconColor}D9` }]} numberOfLines={2}>
                {description}
              </Text>
            )}

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color={`${iconColor}CC`} />
                <Text style={[styles.metaText, { color: `${iconColor}CC` }]}>
                  {durationMinutes} min
                </Text>
              </View>
              {difficultyLevel && (
                <View style={styles.metaItem}>
                  <Ionicons name="fitness-outline" size={16} color={`${iconColor}CC`} />
                  <Text style={[styles.metaText, { color: `${iconColor}CC` }]}>
                    {difficultyLevel}
                  </Text>
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
                    <Ionicons name="person" size={16} color={`${iconColor}99`} />
                  </View>
                )}
                <Text style={[styles.narratorText, { color: `${iconColor}CC` }]}>
                  with {instructor}
                </Text>
              </View>
            )}
          </View>

          {/* Audio Player */}
          <View style={styles.playerContainer}>
            {audioPlayer.isLoading && !audioPlayer.duration ? (
              <View style={styles.loadingPlayer}>
                <ActivityIndicator size="large" color={iconColor} />
                <Text style={[styles.loadingPlayerText, { color: `${iconColor}B3` }]}>
                  Loading audio...
                </Text>
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
      </LinearGradient>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
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
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    favoriteButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
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
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: theme.spacing.xs,
    },
    title: {
      fontFamily: theme.fonts.display.semiBold,
      fontSize: 28,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    description: {
      fontFamily: theme.fonts.body.regular,
      fontSize: 15,
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
    },
  });
