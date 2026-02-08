import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@core/providers/contexts/AuthContext';
import { useTheme } from '@core/providers/contexts/ThemeContext';
import { useSubscription } from '@core/providers/contexts/SubscriptionContext';
import { useHomeContent } from './useHomeContent';
import { useMeditateContent } from '../../meditate/hooks/useMeditateContent';
import { useSleepContent } from '../../sleep/hooks/useSleepContent';
import { useMusicContent } from '../../music/hooks/useMusicContent';
import { useStats } from '@shared/hooks/useStats';
import type { FirestoreEmergencyMeditation, FirestoreCourse } from '../../meditate/data/meditateRepository';
import type { FirestoreSeries, FirestoreSleepMeditation } from '../../sleep/data/sleepRepository';
import type { FirestoreSleepSound, FirestoreMusicItem, FirestoreAlbum } from '../../music/data/musicRepository';

const guestAdjectives = [
  'Calm', 'Peaceful', 'Serene', 'Gentle', 'Mindful', 'Tranquil', 'Zen',
  'Cozy', 'Dreamy', 'Blissful', 'Mellow', 'Quiet', 'Still', 'Soft',
  'Happy', 'Bright', 'Sunny', 'Warm', 'Kind', 'Sweet', 'Lovely',
];

const guestAnimals = [
  'Panda', 'Koala', 'Bunny', 'Owl', 'Fox', 'Bear', 'Deer', 'Dove',
  'Swan', 'Cloud', 'Moon', 'Star', 'Wave', 'Breeze', 'Leaf', 'Lotus',
  'Butterfly', 'Dolphin', 'Seal', 'Otter', 'Sloth', 'Cat', 'Penguin',
];

export function useHomeViewModel() {
  const { user, isAnonymous } = useAuth();
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const { stats, loading: statsLoading } = useStats();
  const { restorePurchases, isPremium: hasSubscription } = useSubscription();
  const { homeContent, refreshHome } = useHomeContent();
  const { meditateContent } = useMeditateContent();
  const { sleepContent } = useSleepContent();
  const { musicContent } = useMusicContent();

  // Use preloaded data
  const quote = homeContent.quote;
  const recentlyPlayed = homeContent.recentlyPlayed;
  const favorites = homeContent.favorites;

  // Refreshing state for pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // Emergency meditations from preloaded data
  const emergencyMeditations = meditateContent.emergencyMeditations;

  // Content data from preload context (for lookups)
  const seriesDataRef = useRef<FirestoreSeries[]>([]);
  const albumsDataRef = useRef<FirestoreAlbum[]>([]);
  const coursesDataRef = useRef<FirestoreCourse[]>([]);
  const emergencyDataRef = useRef<FirestoreEmergencyMeditation[]>([]);
  const sleepSoundsDataRef = useRef<FirestoreSleepSound[]>([]);
  const whiteNoiseDataRef = useRef<FirestoreMusicItem[]>([]);
  const musicDataRef = useRef<FirestoreMusicItem[]>([]);
  const asmrDataRef = useRef<FirestoreMusicItem[]>([]);
  const sleepMeditationsDataRef = useRef<FirestoreSleepMeditation[]>([]);

  // Sync preloaded data to refs for navigation lookups
  useFocusEffect(
    useCallback(() => {
      seriesDataRef.current = sleepContent.series;
      emergencyDataRef.current = meditateContent.emergencyMeditations;
      coursesDataRef.current = meditateContent.courses;
      sleepSoundsDataRef.current = musicContent.sleepSounds;
      whiteNoiseDataRef.current = musicContent.whiteNoise;
      musicDataRef.current = musicContent.music;
      asmrDataRef.current = musicContent.asmr;
      albumsDataRef.current = musicContent.albums;
      sleepMeditationsDataRef.current = sleepContent.sleepMeditations;
    }, [sleepContent, meditateContent, musicContent])
  );

  // Generate a consistent random nickname for anonymous users based on their UID
  const generateGuestNickname = (uid: string): string => {
    const hash = uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const adjIndex = hash % guestAdjectives.length;
    const animalIndex = (hash * 7) % guestAnimals.length;
    return `${guestAdjectives[adjIndex]} ${guestAnimals[animalIndex]}`;
  };

  const displayName = useMemo(() => {
    const directName =
      user?.displayName ||
      user?.providerData?.find((provider) => provider.displayName)?.displayName;
    if (directName) return directName;

    const emailPrefix = user?.email?.split('@')[0];
    if (emailPrefix) return emailPrefix;

    // For anonymous users, generate a fun random nickname
    if (isAnonymous && user?.uid) {
      return generateGuestNickname(user.uid);
    }

    return 'Friend';
  }, [user, isAnonymous]);

  // Refresh home data on pull-to-refresh or focus (for favorites/history updates)
  const handleRefresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    await refreshHome(user.uid, isAnonymous);
    setRefreshing(false);
  }, [user, isAnonymous, refreshHome]);

  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Time to rest';
  }, []);

  const getGreetingEmoji = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅';
    if (hour < 17) return '☀️';
    if (hour < 21) return '🌿';
    return '🌙';
  }, []);

  const handleEmergencyPress = useCallback((meditation: FirestoreEmergencyMeditation) => {
    if (!meditation.isFree && !hasSubscription) {
      setShowPaywall(true);
      return;
    }
    router.push({
      pathname: '/emergency/[id]',
      params: {
        id: meditation.id,
        title: meditation.title,
        description: meditation.description,
        duration: meditation.duration_minutes.toString(),
        audioPath: meditation.audioPath,
        color: meditation.color,
        icon: meditation.icon,
        narrator: meditation.narrator || '',
        thumbnailUrl: meditation.thumbnailUrl || '',
      },
    });
  }, [hasSubscription, router]);

  const findSeriesChapter = (chapterId: string) => {
    for (const series of seriesDataRef.current) {
      const chapter = series.chapters.find((ch) => ch.id === chapterId);
      if (chapter) {
        return { series, chapter };
      }
    }
    return null;
  };

  const findAlbumTrack = (trackId: string) => {
    for (const album of albumsDataRef.current) {
      const track = album.tracks?.find((t) => t.id === trackId);
      if (track) {
        return { album, track };
      }
    }
    return null;
  };

  const findCourseSession = (sessionId: string) => {
    for (const course of coursesDataRef.current) {
      const session = course.sessions?.find((s) => s.id === sessionId);
      if (session) {
        return { course, session };
      }
    }
    return null;
  };

  const getThumbnailForContent = useCallback((contentId: string, contentType: string): string | undefined => {
    switch (contentType) {
      case 'emergency':
        return emergencyDataRef.current.find((e) => e.id === contentId)?.thumbnailUrl;
      case 'series_chapter':
        for (const series of seriesDataRef.current) {
          if (series.chapters.some((c) => c.id === contentId)) {
            return series.thumbnailUrl;
          }
        }
        return undefined;
      case 'album_track':
        for (const album of albumsDataRef.current) {
          if (album.tracks?.some((t) => t.id === contentId)) {
            return album.thumbnailUrl;
          }
        }
        return undefined;
      case 'course_session':
        for (const course of coursesDataRef.current) {
          if (course.sessions?.some((s) => s.id === contentId)) {
            return course.thumbnailUrl;
          }
        }
        return undefined;
      case 'nature_sound': {
        const sleepSound = sleepSoundsDataRef.current.find((s) => s.id === contentId);
        if (sleepSound) return sleepSound.thumbnailUrl;
        const whiteNoise = whiteNoiseDataRef.current.find((w) => w.id === contentId);
        if (whiteNoise) return whiteNoise.thumbnailUrl;
        const music = musicDataRef.current.find((m) => m.id === contentId);
        if (music) return music.thumbnailUrl;
        const asmr = asmrDataRef.current.find((a) => a.id === contentId);
        if (asmr) return asmr.thumbnailUrl;
        return undefined;
      }
      case 'sleep_meditation':
        return sleepMeditationsDataRef.current.find((m) => m.id === contentId)?.thumbnailUrl;
      default:
        return undefined;
    }
  }, []);

  const navigateToContent = useCallback((contentId: string, contentType: string) => {
    if (contentId.startsWith('emergency_')) {
      const emergency = emergencyDataRef.current.find((e) => e.id === contentId);
      if (emergency) {
        router.push({
          pathname: '/emergency/[id]',
          params: {
            id: emergency.id,
            title: emergency.title,
            description: emergency.description,
            duration: String(emergency.duration_minutes),
            audioPath: emergency.audioPath,
            color: emergency.color,
            icon: emergency.icon,
            narrator: emergency.narrator || '',
          },
        });
      } else {
        router.push('/(tabs)/meditate');
      }
      return;
    }

    switch (contentType) {
      case 'meditation':
        router.push({ pathname: '/meditation/[id]', params: { id: contentId } });
        break;
      case 'bedtime_story':
        router.push({ pathname: '/sleep/[id]', params: { id: contentId } });
        break;
      case 'breathing_exercise':
        router.push('/breathing');
        break;
      case 'nature_sound':
        router.push({ pathname: '/music/[id]', params: { id: contentId } });
        break;
      case 'series_chapter': {
        const result = findSeriesChapter(contentId);
        if (result) {
          router.push({
            pathname: '/series/[id]',
            params: {
              id: result.series.id,
              autoOpenItemId: contentId,
            },
          });
        } else {
          router.push('/(tabs)/sleep');
        }
        break;
      }
      case 'album_track': {
        const albumResult = findAlbumTrack(contentId);
        if (albumResult) {
          router.push({
            pathname: '/album/[id]',
            params: {
              id: albumResult.album.id,
              autoOpenItemId: contentId,
            },
          });
        } else {
          router.push('/(tabs)/music');
        }
        break;
      }
      case 'emergency': {
        const emergency = emergencyDataRef.current.find((e) => e.id === contentId);
        if (emergency) {
          router.push({
            pathname: '/emergency/[id]',
            params: {
              id: emergency.id,
              title: emergency.title,
              description: emergency.description,
              duration: String(emergency.duration_minutes),
              audioPath: emergency.audioPath,
              color: emergency.color,
              icon: emergency.icon,
              narrator: emergency.narrator || '',
            },
          });
        } else {
          router.push('/(tabs)/meditate');
        }
        break;
      }
      case 'course_session': {
        const courseResult = findCourseSession(contentId);
        if (courseResult) {
          router.push({
            pathname: '/course/[id]',
            params: {
              id: courseResult.course.id,
              autoOpenItemId: contentId,
            },
          });
        } else {
          router.push('/(tabs)/meditate');
        }
        break;
      }
      case 'sleep_meditation':
        router.push({ pathname: '/sleep/meditation/[id]', params: { id: contentId } });
        break;
    }
  }, [router]);

  const navigateToSettings = useCallback(() => {
    router.push('/settings');
  }, [router]);

  const navigateToStats = useCallback(() => {
    router.push('/stats');
  }, [router]);

  const navigateToLogin = useCallback(() => {
    router.push(hasSubscription ? '/login?mode=link' : '/login');
  }, [router, hasSubscription]);

  const intentionGradient = useMemo(() => (
    isDark
      ? [theme.colors.surface, theme.colors.background] as [string, string]
      : ['#F5EDE3', '#FAF8F5'] as [string, string]
  ), [isDark, theme.colors.background, theme.colors.surface]);

  return {
    theme,
    isDark,
    stats,
    statsLoading,
    quote,
    recentlyPlayed,
    favorites,
    emergencyMeditations,
    isAnonymous,
    hasSubscription,
    restorePurchases,
    showPaywall,
    setShowPaywall,
    displayName,
    getGreeting,
    getGreetingEmoji,
    handleEmergencyPress,
    navigateToContent,
    navigateToSettings,
    navigateToStats,
    navigateToLogin,
    getThumbnailForContent,
    intentionGradient,
    refreshing,
    handleRefresh,
  };
}
