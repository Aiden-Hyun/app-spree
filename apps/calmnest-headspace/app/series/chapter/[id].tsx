import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProtectedRoute } from '../../../src/components/ProtectedRoute';
import { MediaPlayer } from '../../../src/components/MediaPlayer';
import { useAudioPlayer } from '../../../src/hooks/useAudioPlayer';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import { getAudioUrlFromPath } from '../../../src/constants/audioFiles';
import { getNarratorByName } from '../../../src/constants/narratorData';
import { addToListeningHistory, toggleFavorite, isFavorite, createSession, markContentCompleted } from '../../../src/services/firestoreService';
import { getLocalAudioPath } from '../../../src/services/downloadService';
import { Theme } from '../../../src/theme';

interface ChapterItem {
  id: string;
  audioPath: string;
  title: string;
  duration_minutes: number;
  chapterNumber: number;
  description?: string;
}

function SeriesChapterPlayerScreen() {
  const { id, audioPath, title, seriesTitle, duration, narrator, thumbnailUrl, chaptersJson, currentIndex, autoPlay } = useLocalSearchParams<{
    id: string;
    audioPath: string;
    title: string;
    seriesTitle: string;
    duration: string;
    narrator: string;
    thumbnailUrl?: string;
    chaptersJson?: string;
    currentIndex?: string;
    autoPlay?: string;
  }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [hasTrackedPlay, setHasTrackedPlay] = useState(false);
  const [hasTrackedSession, setHasTrackedSession] = useState(false);
  const [isFavoritedState, setIsFavoritedState] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | undefined>();

  const styles = useMemo(() => createStyles(theme), [theme]);
  const audioPlayer = useAudioPlayer();
  const narratorData = narrator ? getNarratorByName(narrator) : undefined;

  // Parse chapters for prev/next navigation
  const chapters: ChapterItem[] = useMemo(() => {
    if (!chaptersJson) return [];
    try {
      return JSON.parse(chaptersJson);
    } catch {
      return [];
    }
  }, [chaptersJson]);

  const currentIdx = parseInt(currentIndex || '0', 10);
  const hasPrevious = chapters.length > 0 && currentIdx > 0;
  const hasNext = chapters.length > 0 && currentIdx < chapters.length - 1;

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
      if (!audioPath) {
        setLoading(false);
        return;
      }
      
      try {
        // Try to use downloaded audio first, fall back to streaming
        const localPath = await getLocalAudioPath(id);
        if (localPath) {
          setCurrentAudioUrl(localPath);
          audioPlayer.loadAudio(localPath);
        } else {
          const audioUrl = await getAudioUrlFromPath(audioPath);
          if (audioUrl) {
            setCurrentAudioUrl(audioUrl);
            audioPlayer.loadAudio(audioUrl);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    
    loadChapterAudio();
  }, [audioPath]);

  // Auto-start playback when coming from auto-play navigation
  useEffect(() => {
    if (autoPlay === 'true' && !loading && audioPlayer.duration > 0 && !audioPlayer.isPlaying) {
      audioPlayer.play();
    }
  }, [autoPlay, loading, audioPlayer.duration]);

  // Track session for stats when user completes 80% of audio
  useEffect(() => {
    async function trackSession() {
      if (
        !hasTrackedSession &&
        user &&
        id &&
        audioPlayer.progress >= 0.8 &&
        audioPlayer.duration > 0
      ) {
        setHasTrackedSession(true);
        try {
          await createSession({
            user_id: user.uid,
            duration_minutes: parseInt(duration) || 0,
            session_type: 'series_chapter',
          });
          // Mark this chapter as completed
          await markContentCompleted(user.uid, id, 'series_chapter');
        } catch (error) {
          console.error('Failed to track session:', error);
        }
      }
    }
    trackSession();
  }, [audioPlayer.progress, hasTrackedSession, user, id, duration]);

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

  const handlePrevious = () => {
    if (!hasPrevious) return;
    const prevChapter = chapters[currentIdx - 1];
    audioPlayer.cleanup();
    router.replace({
      pathname: '/series/chapter/[id]',
      params: {
        id: prevChapter.id,
        audioPath: prevChapter.audioPath,
        title: prevChapter.title,
        seriesTitle,
        duration: String(prevChapter.duration_minutes),
        narrator,
        thumbnailUrl: thumbnailUrl || '',
        chaptersJson,
        currentIndex: String(currentIdx - 1),
      },
    });
  };

  const handleNext = () => {
    if (!hasNext) return;
    const nextChapter = chapters[currentIdx + 1];
    audioPlayer.cleanup();
    router.replace({
      pathname: '/series/chapter/[id]',
      params: {
        id: nextChapter.id,
        audioPath: nextChapter.audioPath,
        title: nextChapter.title,
        seriesTitle,
        duration: String(nextChapter.duration_minutes),
        narrator,
        thumbnailUrl: thumbnailUrl || '',
        chaptersJson,
        currentIndex: String(currentIdx + 1),
        autoPlay: 'true',
      },
    });
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
      artworkThumbnailUrl={thumbnailUrl}
      isFavorited={isFavoritedState}
      isLoading={loading}
      audioPlayer={audioPlayer}
      onBack={handleGoBack}
      onToggleFavorite={handleToggleFavorite}
      onPlayPause={handlePlayPause}
      loadingText="Loading chapter..."
      footerContent={sleepTimerButton}
      onPrevious={hasPrevious ? handlePrevious : undefined}
      onNext={hasNext ? handleNext : undefined}
      hasPrevious={hasPrevious}
      hasNext={hasNext}
      contentId={id}
      contentType="series_chapter"
      audioUrl={currentAudioUrl}
      audioPath={audioPath}
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
