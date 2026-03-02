import React, { useEffect, useMemo, useState, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ProtectedRoute } from '@shared/ui/ProtectedRoute';
import { MediaPlayer } from '@shared/ui/MediaPlayer';
import { useAudioPlayer } from '@shared/hooks/useAudioPlayer';
import { usePlayerBehavior } from '@shared/hooks/usePlayerBehavior';
import { useTheme } from '@core/providers/contexts/ThemeContext';
import { useAuth } from '@core/providers/contexts/AuthContext';
import { getAudioUrlFromPath } from '@/constants/audioFiles';
import { markContentCompleted } from '@shared/data/content';
import { createSession } from '@/features/profile/data/profileRepository';
import { getCourseSessionById } from '@/features/meditate/data/meditateRepository';
import { getLocalAudioPath } from '@/services/downloadService';
import { buildSessionMetaInfo } from '@shared/utils/courseCodeParser';
import { Theme } from '@/theme';
import { useSubscription } from '@core/providers/contexts/SubscriptionContext';
import { PaywallModal } from '@shared/ui/PaywallModal';
import { isCourseSessionLocked } from '@shared/utils/premiumPolicy';

interface SessionItem {
  id: string;
  code?: string;
  audioPath: string;
  title: string;
  duration_minutes: number;
  dayNumber?: number;
  description?: string;
  isFree?: boolean;
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
  const { isPremium: hasSubscription } = useSubscription();
  
  const [loading, setLoading] = useState(true);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | undefined>();
  const [showPaywall, setShowPaywall] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const hasTrackedSession = useRef(false);

  const styles = useMemo(() => createStyles(theme), [theme]);
  const audioPlayer = useAudioPlayer();
  const durationMinutes = parseInt(duration) || 0;

  // Use the shared player behavior hook
  const {
    isFavorited,
    userRating,
    onToggleFavorite,
    onPlayPause,
    onRate,
    onReport,
  } = usePlayerBehavior({
    contentId: id,
    contentType: "course_session",
    audioPlayer,
    title,
    durationMinutes,
    thumbnailUrl,
  });

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

  // Reset session tracking when content changes
  useEffect(() => {
    hasTrackedSession.current = false;
  }, [id]);

  useEffect(() => {
    async function loadSessionAudio() {
      if (!audioPath) {
        setLoading(false);
        return;
      }
      
      try {
        let currentSession: SessionItem | undefined;
        if (sessions.length > 0) {
          currentSession = sessions.find((session) => session.id === id);
        }
        if (!currentSession && id) {
          currentSession = (await getCourseSessionById(id)) || undefined;
        }

        if (isCourseSessionLocked(currentSession, hasSubscription)) {
          setIsLocked(true);
          setShowPaywall(true);
          return;
        }

        setIsLocked(false);
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
  }, [audioPath, hasSubscription, id, sessions]);

  // Auto-start playback when coming from auto-play navigation
  useEffect(() => {
    if (
      !isLocked &&
      autoPlay === 'true' &&
      !loading &&
      audioPlayer.duration > 0 &&
      !audioPlayer.isPlaying
    ) {
      audioPlayer.play();
    }
  }, [audioPlayer.duration, audioPlayer.isPlaying, autoPlay, isLocked, loading]);

  // Track session completion (mark as completed at 80%)
  useEffect(() => {
    async function trackSessionCompletion() {
      if (
        !hasTrackedSession.current &&
        user &&
        id &&
        audioPlayer.progress >= 0.8 &&
        audioPlayer.duration > 0
      ) {
        hasTrackedSession.current = true;
        try {
          await markContentCompleted(user.uid, id, 'course_session');
        } catch (error) {
          console.error('Failed to mark session completed:', error);
        }
      }
    }
    trackSessionCompletion();
  }, [audioPlayer.progress, user, id]);

  const handleGoBack = () => {
    audioPlayer.cleanup();
    router.back();
  };

  const handlePrevious = () => {
    if (!hasPrevious) return;
    const prevSession = sessions[currentIdx - 1];
    
    if (isCourseSessionLocked(prevSession, hasSubscription)) {
      setShowPaywall(true);
      return;
    }
    
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
    
    if (isCourseSessionLocked(nextSession, hasSubscription)) {
      setShowPaywall(true);
      return;
    }
    
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
  const handlePlayPause = async () => {
    if (isLocked) {
      setShowPaywall(true);
      return;
    }
    await onPlayPause();
  };

  return (
    <>
      <MediaPlayer
        category={courseTitle || 'Course'}
        title={title || 'Loading...'}
        instructor={instructor}
        metaInfo={metaInfo}
        durationMinutes={durationMinutes}
        gradientColors={gradientColors}
        artworkIcon="school"
        artworkThumbnailUrl={thumbnailUrl}
        isFavorited={isFavorited}
        isLoading={loading}
        audioPlayer={audioPlayer}
        onBack={handleGoBack}
        onToggleFavorite={onToggleFavorite}
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
        userRating={userRating}
        onRate={onRate}
        onReport={onReport}
      />
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </>
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
