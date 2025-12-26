import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ProtectedRoute } from '../../../src/components/ProtectedRoute';
import { AudioPlayer } from '../../../src/components/AudioPlayer';
import { useAudioPlayer } from '../../../src/hooks/useAudioPlayer';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { getAudioUrl } from '../../../src/constants/audioFiles';
import { getNarratorByName } from '../../../src/constants/narratorData';
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

  const styles = useMemo(() => createStyles(theme), [theme]);
  const audioPlayer = useAudioPlayer();
  const narratorData = narrator ? getNarratorByName(narrator) : undefined;

  useEffect(() => {
    async function loadChapterAudio() {
      if (!audioKey) return;
      
      const audioUrl = await getAudioUrl(audioKey);
      if (audioUrl) {
        audioPlayer.loadAudio(audioUrl);
      }
    }
    
    loadChapterAudio();
  }, [audioKey]);

  const handleGoBack = () => {
    audioPlayer.cleanup();
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={theme.gradients.sleepyNight as [string, string]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.sleepText} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="heart-outline" size={24} color={theme.colors.sleepText} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Chapter Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="book" size={64} color={theme.colors.sleepAccent} />
            </View>
          </View>

          {/* Chapter Info */}
          <View style={styles.chapterInfo}>
            <Text style={styles.seriesTitle}>{seriesTitle}</Text>
            <Text style={styles.chapterTitle}>{title}</Text>
            
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color={theme.colors.sleepTextMuted} />
                <Text style={styles.metaText}>{duration} min</Text>
              </View>
            </View>
          </View>

          {/* Narrator Section */}
          {narrator && (
            <View style={styles.narratorSection}>
              {narratorData?.photoUrl ? (
                <Image source={{ uri: narratorData.photoUrl }} style={styles.narratorPhoto} />
              ) : (
                <View style={styles.narratorPhotoPlaceholder}>
                  <Ionicons name="person" size={20} color={theme.colors.sleepTextMuted} />
                </View>
              )}
              <Text style={styles.narratorText}>Narrated by {narrator}</Text>
            </View>
          )}

          {/* Audio Player */}
          <View style={styles.playerContainer}>
            {audioPlayer.isLoading && !audioPlayer.duration ? (
              <View style={styles.loadingPlayer}>
                <ActivityIndicator size="large" color={theme.colors.sleepAccent} />
                <Text style={styles.loadingText}>Loading audio...</Text>
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
                onPlay={audioPlayer.play}
                onPause={audioPlayer.pause}
                onSeek={audioPlayer.seekTo}
              />
            )}
          </View>

          {/* Sleep Timer */}
          <TouchableOpacity style={styles.timerButton}>
            <Ionicons name="moon-outline" size={20} color={theme.colors.sleepTextMuted} />
            <Text style={styles.timerButtonText}>Set Sleep Timer</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.sleepBackground,
    },
    gradient: {
      flex: 1,
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
      backgroundColor: 'rgba(255,255,255,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    moreButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.1)',
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
      backgroundColor: 'rgba(201, 184, 150, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    chapterInfo: {
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    seriesTitle: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 14,
      color: theme.colors.sleepAccent,
      marginBottom: theme.spacing.xs,
    },
    chapterTitle: {
      fontFamily: theme.fonts.display.semiBold,
      fontSize: 28,
      color: theme.colors.sleepText,
      textAlign: 'center',
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
      color: theme.colors.sleepTextMuted,
    },
    narratorSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: theme.borderRadius.full,
    },
    narratorPhoto: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    narratorPhotoPlaceholder: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    narratorText: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 14,
      color: theme.colors.sleepTextMuted,
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
    loadingText: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 14,
      color: theme.colors.sleepTextMuted,
    },
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

