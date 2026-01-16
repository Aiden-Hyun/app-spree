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
import { addToListeningHistory, toggleFavorite, isFavorite, createSession, markContentCompleted } from '../../../src/services/firestoreService';
import { getLocalAudioPath } from '../../../src/services/downloadService';
import { buildSessionMetaInfo } from '../../../src/utils/courseCodeParser';
import { Theme } from '../../../src/theme';

interface SessionItem {
  id: string;
  code?: string;
  audioPath: string;
  title: string;
  duration_minutes: number;
  dayNumber: number;
  description?: string;
}

function CourseSessionPlayerScreen() {
  const { id, audioPath, title, courseTitle, courseCode, sessionCode, duration, instructor, color, thumbnailUrl, sessionsJson, currentIndex, autoPlay } = useLocalSearchParams<{
    id: string;
    audioPath: string;
    title: string;
    courseTitle: string;
    courseCode?: string;
    sessionCode?: string;
    duration: string;
    instructor: string;
    color: string;
    thumbnailUrl?: string;
    sessionsJson?: string;
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

  // Parse sessions for prev/next navigation
  const sessions: SessionItem[] = useMemo(() => {
    if (!sessionsJson) return [];
    try {
      return JSON.parse(sessionsJson);
    } catch {
      return [];
    }
  }, [sessionsJson]);

  const currentIdx = parseInt(currentIndex || '0', 10);
  const hasPrevious = sessions.length > 0 && currentIdx > 0;
  const hasNext = sessions.length > 0 && currentIdx < sessions.length - 1;

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
    
    loadSessionAudio();
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
            session_type: 'course_session',
          });
          // Mark this session as completed
          await markContentCompleted(user.uid, id, 'course_session');
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
          'course_session',
          title, // Just session title, not "Course: Session"
          parseInt(duration) || 0,
          thumbnailUrl, // Include thumbnail
          courseCode, // Course code for display
          sessionCode // Session code for module info
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

  const handlePrevious = () => {
    if (!hasPrevious) return;
    const prevSession = sessions[currentIdx - 1];
    audioPlayer.cleanup();
    router.replace({
      pathname: '/course/session/[id]',
      params: {
        id: prevSession.id,
        audioPath: prevSession.audioPath,
        title: prevSession.title,
        courseTitle,
        courseCode: courseCode || '',
        sessionCode: prevSession.code || '',
        duration: String(prevSession.duration_minutes),
        instructor,
        color,
        thumbnailUrl: thumbnailUrl || '',
        sessionsJson,
        currentIndex: String(currentIdx - 1),
      },
    });
  };

  const handleNext = () => {
    if (!hasNext) return;
    const nextSession = sessions[currentIdx + 1];
    audioPlayer.cleanup();
    router.replace({
      pathname: '/course/session/[id]',
      params: {
        id: nextSession.id,
        audioPath: nextSession.audioPath,
        title: nextSession.title,
        courseTitle,
        courseCode: courseCode || '',
        sessionCode: nextSession.code || '',
        duration: String(nextSession.duration_minutes),
        instructor,
        color,
        thumbnailUrl: thumbnailUrl || '',
        sessionsJson,
        currentIndex: String(currentIdx + 1),
        autoPlay: 'true',
      },
    });
  };

  // Use course color for gradient, fallback to teal
  const courseColor = color || '#7DAFB4';
  const gradientColors: [string, string] = [courseColor, `${courseColor}CC`];

  // Build meta info from course and session codes
  const metaInfo = sessionCode && courseCode 
    ? buildSessionMetaInfo(sessionCode, courseCode) 
    : undefined;

  return (
    <MediaPlayer
      category={courseTitle || 'Course'}
      title={title || 'Loading...'}
      instructor={instructor}
      metaInfo={metaInfo}
      durationMinutes={parseInt(duration) || 0}
      gradientColors={gradientColors}
      artworkIcon="school"
      artworkThumbnailUrl={thumbnailUrl}
      isFavorited={isFavoritedState}
      isLoading={loading}
      audioPlayer={audioPlayer}
      onBack={handleGoBack}
      onToggleFavorite={handleToggleFavorite}
      onPlayPause={handlePlayPause}
      loadingText="Loading session..."
      onPrevious={hasPrevious ? handlePrevious : undefined}
      onNext={hasNext ? handleNext : undefined}
      hasPrevious={hasPrevious}
      hasNext={hasNext}
      contentId={id}
      contentType="course_session"
      audioUrl={currentAudioUrl}
      audioPath={audioPath}
      parentTitle={courseTitle}
      skipRestore={autoPlay === 'true'}
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

