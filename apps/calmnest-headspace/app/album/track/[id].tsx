import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ProtectedRoute } from '../../../src/components/ProtectedRoute';
import { AudioPlayer } from '../../../src/components/AudioPlayer';
import { useAudioPlayer } from '../../../src/hooks/useAudioPlayer';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import { getAudioUrl } from '../../../src/constants/audioFiles';
import { addToListeningHistory, toggleFavorite, isFavorite } from '../../../src/services/firestoreService';
import { Theme } from '../../../src/theme';

function AlbumTrackPlayerScreen() {
  const { id, audioKey, title, albumTitle, duration, artist } = useLocalSearchParams<{
    id: string;
    audioKey: string;
    title: string;
    albumTitle: string;
    duration: string;
    artist: string;
  }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();

  const [hasTrackedPlay, setHasTrackedPlay] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const styles = useMemo(() => createStyles(theme), [theme]);
  const audioPlayer = useAudioPlayer();

  // Check if favorited on load
  useEffect(() => {
    async function checkFavorite() {
      if (user && id) {
        const favorited = await isFavorite(user.uid, id);
        setIsFavorited(favorited);
      }
    }
    checkFavorite();
  }, [user, id]);

  useEffect(() => {
    async function loadTrackAudio() {
      if (!audioKey) return;
      
      const audioUrl = await getAudioUrl(audioKey);
      if (audioUrl) {
        audioPlayer.loadAudio(audioUrl);
      }
    }
    
    loadTrackAudio();
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
    
    // Optimistic update - toggle immediately
    const previousState = isFavorited;
    setIsFavorited(!previousState);
    
    try {
      const newFavorited = await toggleFavorite(user.uid, id, 'album_track');
      // Sync with server response in case of mismatch
      if (newFavorited !== !previousState) {
        setIsFavorited(newFavorited);
      }
    } catch {
      // Revert on error
      setIsFavorited(previousState);
    }
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
          <TouchableOpacity onPress={handleToggleFavorite} style={styles.moreButton}>
            <Ionicons 
              name={isFavorited ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorited ? theme.colors.error : theme.colors.sleepText} 
            />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Track Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="musical-notes" size={64} color={theme.colors.sleepAccent} />
            </View>
          </View>

          {/* Track Info */}
          <View style={styles.trackInfo}>
            <Text style={styles.albumTitle}>{albumTitle}</Text>
            <Text style={styles.trackTitle}>{title}</Text>
            
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color={theme.colors.sleepTextMuted} />
                <Text style={styles.metaText}>{duration} min</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="person-outline" size={16} color={theme.colors.sleepTextMuted} />
                <Text style={styles.metaText}>{artist}</Text>
              </View>
            </View>
          </View>

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
                onPlay={handlePlayPause}
                onPause={handlePlayPause}
                onSeek={audioPlayer.seekTo}
              />
            )}
          </View>
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
    trackInfo: {
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    albumTitle: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 14,
      color: theme.colors.sleepAccent,
      marginBottom: theme.spacing.xs,
    },
    trackTitle: {
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
  });

export default function AlbumTrackPlayer() {
  return (
    <ProtectedRoute>
      <AlbumTrackPlayerScreen />
    </ProtectedRoute>
  );
}
