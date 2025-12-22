import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Theme } from '../theme';

interface AudioPlayerProps {
  isPlaying: boolean;
  isLoading: boolean;
  duration: number;
  position: number;
  progress: number;
  formattedPosition: string;
  formattedDuration: string;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (position: number) => void;
  onSkipBack?: () => void;
  onSkipForward?: () => void;
  title?: string;
  subtitle?: string;
}

export function AudioPlayer({
  isPlaying,
  isLoading,
  duration,
  position,
  progress,
  formattedPosition,
  formattedDuration,
  onPlay,
  onPause,
  onSeek,
  onSkipBack,
  onSkipForward,
  title,
  subtitle,
}: AudioPlayerProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      {(title || subtitle) && (
        <View style={styles.infoContainer}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}

      <View style={styles.progressContainer}>
        <Text style={styles.timeText}>{formattedPosition}</Text>
        <Slider
          style={styles.slider}
          value={position}
          minimumValue={0}
          maximumValue={duration}
          onSlidingComplete={onSeek}
          minimumTrackTintColor={theme.colors.primary}
          maximumTrackTintColor={theme.colors.gray[300]}
          thumbTintColor={theme.colors.primary}
          disabled={isLoading || duration === 0}
        />
        <Text style={styles.timeText}>{formattedDuration}</Text>
      </View>

      <View style={styles.controls}>
        {onSkipBack && (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={onSkipBack}
            disabled={isLoading}
          >
            <Ionicons
              name="play-skip-back"
              size={28}
              color={theme.colors.text}
            />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.playButton}
          onPress={isPlaying ? onPause : onPlay}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={36}
              color="white"
              style={isPlaying ? {} : { marginLeft: 4 }}
            />
          )}
        </TouchableOpacity>

        {onSkipForward && (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={onSkipForward}
            disabled={isLoading}
          >
            <Ionicons
              name="play-skip-forward"
              size={28}
              color={theme.colors.text}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
      fontFamily: theme.fonts.display.semiBold,
    fontSize: 20,
    color: theme.colors.text,
    textAlign: 'center',
  },
  subtitle: {
      fontFamily: theme.fonts.ui.regular,
    fontSize: 16,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: theme.spacing.sm,
  },
  timeText: {
      fontFamily: theme.fonts.ui.regular,
    fontSize: 14,
    color: theme.colors.textLight,
    minWidth: 45,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
});
