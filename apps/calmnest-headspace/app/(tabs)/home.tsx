import React, { useState, useMemo, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import { AnimatedView } from '../../src/components/AnimatedView';
import { AnimatedPressable } from '../../src/components/AnimatedPressable';
import { ContentCard } from '../../src/components/ContentCard';
import { Skeleton } from '../../src/components/Skeleton';
import { useStats } from '../../src/hooks/useStats';
import { parseSessionCode, formatCourseCode } from '../../src/utils/courseCodeParser';
import { 
  getTodayQuote, 
  getListeningHistory, 
  getFavoritesWithDetails,
  ResolvedContent,
  getSeries,
  getAlbums,
  getCourses,
  getEmergencyMeditations,
  getSleepSounds,
  getWhiteNoise,
  getMusic,
  getAsmr,
  getSleepMeditations,
  FirestoreSeries,
  FirestoreAlbum,
  FirestoreCourse,
  FirestoreEmergencyMeditation,
  FirestoreSleepSound,
  FirestoreMusicItem,
  FirestoreSleepMeditation,
} from '../../src/services/firestoreService';
import { Theme } from '../../src/theme';
import { DailyQuote, ListeningHistoryItem } from '../../src/types';
import { getDownloadedContent, DownloadedContent } from '../../src/services/downloadService';

function HomeScreen() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const { stats, loading: statsLoading } = useStats();
  const [quote, setQuote] = useState<DailyQuote | null>(null);
  const [recentlyPlayed, setRecentlyPlayed] = useState<ListeningHistoryItem[]>([]);
  const [favorites, setFavorites] = useState<ResolvedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadedContent, setDownloadedContent] = useState<DownloadedContent[]>([]);
  
  // Content data from Firestore
  const seriesDataRef = useRef<FirestoreSeries[]>([]);
  const albumsDataRef = useRef<FirestoreAlbum[]>([]);
  const coursesDataRef = useRef<FirestoreCourse[]>([]);
  const emergencyDataRef = useRef<FirestoreEmergencyMeditation[]>([]);
  const sleepSoundsDataRef = useRef<FirestoreSleepSound[]>([]);
  const whiteNoiseDataRef = useRef<FirestoreMusicItem[]>([]);
  const musicDataRef = useRef<FirestoreMusicItem[]>([]);
  const asmrDataRef = useRef<FirestoreMusicItem[]>([]);
  const sleepMeditationsDataRef = useRef<FirestoreSleepMeditation[]>([]);

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const displayName = useMemo(() => {
    const directName =
      user?.displayName ||
      user?.providerData?.find((provider) => provider.displayName)?.displayName;
    if (directName) return directName;

    const emailPrefix = user?.email?.split('@')[0];
    return emailPrefix || 'Friend';
  }, [user]);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
    loadHomeData();
    loadDownloads();
    }, [user])
  );

  const loadDownloads = async () => {
    const downloads = await getDownloadedContent();
    setDownloadedContent(downloads);
  };

  const loadHomeData = async () => {
    if (!user) return;
    
    try {
      const [
        quoteData, 
        historyData, 
        favoritesData,
        seriesResult,
        albumsResult,
        coursesResult,
        emergencyResult,
        sleepSoundsResult,
        whiteNoiseResult,
        musicResult,
        asmrResult,
        sleepMeditationsResult
      ] = await Promise.all([
        getTodayQuote(),
        getListeningHistory(user.uid, 10),
        getFavoritesWithDetails(user.uid),
        getSeries(),
        getAlbums(),
        getCourses(),
        getEmergencyMeditations(),
        getSleepSounds(),
        getWhiteNoise(),
        getMusic(),
        getAsmr(),
        getSleepMeditations()
      ]);
      setQuote(quoteData);
      setRecentlyPlayed(historyData);
      
      // Store content data in refs
      seriesDataRef.current = seriesResult;
      albumsDataRef.current = albumsResult;
      coursesDataRef.current = coursesResult;
      emergencyDataRef.current = emergencyResult;
      sleepSoundsDataRef.current = sleepSoundsResult;
      whiteNoiseDataRef.current = whiteNoiseResult;
      musicDataRef.current = musicResult;
      asmrDataRef.current = asmrResult;
      sleepMeditationsDataRef.current = sleepMeditationsResult;
      
      // Deduplicate favorites by content id
      const seenIds = new Set<string>();
      const uniqueFavorites = favoritesData.filter(fav => {
        if (seenIds.has(fav.id)) return false;
        seenIds.add(fav.id);
        return true;
      });
      setFavorites(uniqueFavorites);
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Time to rest';
  };

  const getGreetingEmoji = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅';
    if (hour < 17) return '☀️';
    if (hour < 21) return '🌿';
    return '🌙';
  };

  const renderStreakDots = () => {
    const currentStreak = stats?.current_streak || 0;
    const dots = [];
    for (let i = 0; i < 7; i++) {
      dots.push(
        <View
          key={i}
          style={[
            styles.streakDot,
            i < currentStreak ? styles.streakDotFilled : styles.streakDotEmpty
          ]}
        />
      );
    }
    return dots;
  };

  // Helper to find series chapter by ID
  const findSeriesChapter = (chapterId: string) => {
    for (const series of seriesDataRef.current) {
      const chapter = series.chapters.find(ch => ch.id === chapterId);
      if (chapter) {
        return { series, chapter };
      }
    }
    return null;
  };

  // Helper to find album track by ID
  const findAlbumTrack = (trackId: string) => {
    for (const album of albumsDataRef.current) {
      const track = album.tracks?.find(t => t.id === trackId);
      if (track) {
        return { album, track };
      }
    }
    return null;
  };

  // Helper to find course session by ID
  const findCourseSession = (sessionId: string) => {
    for (const course of coursesDataRef.current) {
      const session = course.sessions?.find(s => s.id === sessionId);
      if (session) {
        return { course, session };
      }
    }
    return null;
  };

  // Helper to get thumbnail for content from Firestore data
  const getThumbnailForContent = (contentId: string, contentType: string): string | undefined => {
    switch (contentType) {
      case 'emergency':
        return emergencyDataRef.current.find(e => e.id === contentId)?.thumbnailUrl;
      case 'series_chapter':
        for (const series of seriesDataRef.current) {
          if (series.chapters.some(c => c.id === contentId)) {
            return series.thumbnailUrl;
          }
        }
        return undefined;
      case 'album_track':
        for (const album of albumsDataRef.current) {
          if (album.tracks?.some(t => t.id === contentId)) {
            return album.thumbnailUrl;
          }
        }
        return undefined;
      case 'course_session':
        for (const course of coursesDataRef.current) {
          if (course.sessions?.some(s => s.id === contentId)) {
            return course.thumbnailUrl;
          }
        }
        return undefined;
      case 'nature_sound':
        // Check sleep sounds and white noise
        const sleepSound = sleepSoundsDataRef.current.find(s => s.id === contentId);
        if (sleepSound) return sleepSound.thumbnailUrl;
        const whiteNoise = whiteNoiseDataRef.current.find(w => w.id === contentId);
        if (whiteNoise) return whiteNoise.thumbnailUrl;
        const music = musicDataRef.current.find(m => m.id === contentId);
        if (music) return music.thumbnailUrl;
        const asmr = asmrDataRef.current.find(a => a.id === contentId);
        if (asmr) return asmr.thumbnailUrl;
        return undefined;
      case 'sleep_meditation':
        return sleepMeditationsDataRef.current.find(m => m.id === contentId)?.thumbnailUrl;
      default:
        return undefined;
    }
  };

  const navigateToContent = (contentId: string, contentType: string) => {
    // Handle emergency content that may have been saved with wrong type
    if (contentId.startsWith('emergency_')) {
      const emergency = emergencyDataRef.current.find(e => e.id === contentId);
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
            narrator: emergency.narrator || ''
          }
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
      case 'series_chapter':
        // Navigate to series detail page, which will auto-open the chapter
        const result = findSeriesChapter(contentId);
        if (result) {
          router.push({
            pathname: '/series/[id]',
            params: {
              id: result.series.id,
              autoOpenItemId: contentId
            }
          });
        } else {
          router.push('/(tabs)/sleep');
        }
        break;
      case 'album_track':
        // Navigate to album detail page, which will auto-open the track
        const albumResult = findAlbumTrack(contentId);
        if (albumResult) {
          router.push({
            pathname: '/album/[id]',
            params: {
              id: albumResult.album.id,
              autoOpenItemId: contentId
            }
          });
        } else {
          router.push('/(tabs)/music');
        }
        break;
      case 'emergency':
        // Look up emergency meditation data from Firestore
        const emergency = emergencyDataRef.current.find(e => e.id === contentId);
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
              narrator: emergency.narrator || ''
            }
          });
        } else {
          router.push('/(tabs)/meditate');
        }
        break;
      case 'course_session':
        // Navigate to course detail page, which will auto-open the session
        const courseResult = findCourseSession(contentId);
        if (courseResult) {
          router.push({
            pathname: '/course/[id]',
            params: {
              id: courseResult.course.id,
              autoOpenItemId: contentId
            }
          });
        } else {
          router.push('/(tabs)/meditate');
        }
        break;
      case 'sleep_meditation':
        router.push({ pathname: '/sleep/meditation/[id]', params: { id: contentId } });
        break;
    }
  };

  const getContentIcon = (contentType: string): keyof typeof Ionicons.glyphMap => {
    switch (contentType) {
      case 'meditation':
        return 'leaf';
      case 'bedtime_story':
      case 'series_chapter':
        return 'book';
      case 'album_track':
        return 'musical-notes';
      case 'breathing_exercise':
        return 'cloud';
      case 'nature_sound':
        return 'musical-notes';
      case 'emergency':
        return 'flash';
      case 'course_session':
        return 'school';
      case 'sleep_meditation':
        return 'moon';
      default:
        return 'play-circle';
    }
  };

  const intentionGradient = isDark 
    ? [theme.colors.surface, theme.colors.background] as [string, string]
    : ['#F5EDE3', '#FAF8F5'] as [string, string];

  const renderRecentlyPlayedItem = useCallback(({ item }: { item: ListeningHistoryItem }) => {
    // Use stored thumbnail or look up from local data
    const thumbnailUrl = item.content_thumbnail || getThumbnailForContent(item.content_id, item.content_type);
    
    // For course sessions, show code badge and module info
    const isCourseSession = item.content_type === 'course_session';
    const courseCode = isCourseSession ? item.course_code : undefined;
    const moduleInfo = isCourseSession && item.session_code && item.course_code
      ? parseSessionCode(item.session_code, item.course_code)
      : undefined;
    
    return (
      <ContentCard
        title={item.content_title}
        thumbnailUrl={thumbnailUrl}
        fallbackIcon={getContentIcon(item.content_type)}
        code={courseCode}
        subtitle={moduleInfo}
        meta={`${item.duration_minutes} min`}
        onPress={() => navigateToContent(item.content_id, item.content_type)}
      />
    );
  }, []);

  const renderFavoriteItem = useCallback(({ item }: { item: ResolvedContent }) => {
    // For course sessions, show code badge and module info
    const isCourseSession = item.content_type === 'course_session';
    const courseCode = isCourseSession ? item.course_code : undefined;
    const moduleInfo = isCourseSession && item.session_code && item.course_code
      ? parseSessionCode(item.session_code, item.course_code)
      : undefined;
    
    return (
      <ContentCard
        title={item.title}
        thumbnailUrl={item.thumbnail_url}
        fallbackIcon={getContentIcon(item.content_type)}
        code={courseCode}
        subtitle={moduleInfo}
        meta={`${item.duration_minutes} min`}
        onPress={() => navigateToContent(item.id, item.content_type)}
      />
    );
  }, []);

  const renderSkeletonCards = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalListContent}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <Skeleton width={150} height={120} style={{ borderRadius: theme.borderRadius.lg }} />
          <Skeleton width={120} height={14} style={{ marginTop: 8 }} />
          <Skeleton width={60} height={12} style={{ marginTop: 4 }} />
        </View>
      ))}
    </ScrollView>
  );

  const renderEmptyState = (message: string) => (
    <View style={styles.emptyState}>
      <Ionicons name="musical-notes-outline" size={32} color={theme.colors.textLight} />
      <Text style={styles.emptyStateText}>{message}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <AnimatedView delay={0} duration={400}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {getGreeting()} {getGreetingEmoji()}
            </Text>
            <Text style={styles.userName}>
              {displayName}
            </Text>
          </View>
            <AnimatedPressable 
              onPress={() => router.push('/settings')}
            style={styles.settingsButton}
          >
            <Ionicons name="settings-outline" size={22} color={theme.colors.textLight} />
            </AnimatedPressable>
        </View>
        </AnimatedView>

        {/* Recently Played Section */}
        <View style={styles.section}>
        <AnimatedView delay={100} duration={400}>
            <Text style={styles.sectionTitle}>Recently Played</Text>
          </AnimatedView>
          
          <AnimatedView delay={150} duration={400}>
              {loading ? (
              renderSkeletonCards()
            ) : recentlyPlayed.length > 0 ? (
              <FlatList
                horizontal
                data={recentlyPlayed}
                keyExtractor={(item) => item.id}
                renderItem={renderRecentlyPlayedItem}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalListContent}
              />
            ) : (
              renderEmptyState("Start listening to build your history")
            )}
          </AnimatedView>
        </View>

        {/* Favorites Section */}
          <View style={styles.section}>
          <AnimatedView delay={200} duration={400}>
            <Text style={styles.sectionTitle}>Favorites</Text>
          </AnimatedView>
          
          <AnimatedView delay={250} duration={400}>
          {loading ? (
              renderSkeletonCards()
            ) : favorites.length > 0 ? (
              <FlatList
                horizontal
                data={favorites}
                keyExtractor={(item) => item.id}
                renderItem={renderFavoriteItem}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalListContent}
              />
            ) : (
              renderEmptyState("Tap the heart icon to save favorites")
            )}
            </AnimatedView>
          </View>

        {/* Your Journey Section */}
        <View style={styles.section}>
          <AnimatedView delay={300} duration={400}>
          <Text style={styles.sectionTitle}>Your Journey</Text>
          </AnimatedView>
          
          <AnimatedView delay={350} duration={400}>
            {statsLoading ? (
              <View style={styles.journeyCard}>
                <View style={styles.streakRow}>
                  <Skeleton width={120} height={12} />
                  <Skeleton width={60} height={28} />
                </View>
                <View style={styles.journeyDivider} />
                <View style={styles.journeyStats}>
                  <View style={styles.journeyStat}>
                    <Skeleton width={50} height={22} style={{ marginBottom: 4 }} />
                    <Skeleton width={80} height={14} />
                  </View>
                  <View style={styles.journeyStat}>
                    <Skeleton width={50} height={22} style={{ marginBottom: 4 }} />
                    <Skeleton width={80} height={14} />
                  </View>
                </View>
              </View>
            ) : (
              <AnimatedPressable onPress={() => router.push('/stats')} style={styles.journeyCard}>
            <View style={styles.streakRow}>
              <View style={styles.streakDots}>
                {renderStreakDots()}
              </View>
              <View style={styles.streakInfo}>
                <Text style={styles.streakNumber}>{stats?.current_streak || 0}</Text>
                <Text style={styles.streakLabel}>day streak</Text>
              </View>
            </View>
            <View style={styles.journeyDivider} />
            <View style={styles.journeyStats}>
              <View style={styles.journeyStat}>
                <Text style={styles.journeyStatValue}>
                  {stats?.weekly_minutes?.reduce((a, b) => a + b, 0) || 0}
                </Text>
                <Text style={styles.journeyStatLabel}>min this week</Text>
              </View>
              <View style={styles.journeyStat}>
                <Text style={styles.journeyStatValue}>{stats?.total_sessions || 0}</Text>
                <Text style={styles.journeyStatLabel}>total sessions</Text>
              </View>
            </View>
              </AnimatedPressable>
            )}
          </AnimatedView>
        </View>

        {/* Inspirational Quote Section */}
          <AnimatedView delay={400} duration={400}>
          <View style={styles.quoteCard}>
            <LinearGradient
              colors={intentionGradient}
              style={styles.quoteGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              >
              <View style={styles.quoteIcon}>
                <Text style={styles.quoteEmoji}>✨</Text>
                  </View>
              <Text style={styles.quoteLabel}>Daily Inspiration</Text>
              {loading ? (
                <Skeleton height={20} width="80%" style={{ alignSelf: 'center' }} />
              ) : (
                <Text style={styles.quoteText}>
                  {quote?.text || "Take a breath. You're exactly where you need to be."}
                </Text>
              )}
              {quote?.author && (
                <Text style={styles.quoteAuthor}>— {quote.author}</Text>
              )}
            </LinearGradient>
          </View>
        </AnimatedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  greeting: {
    fontFamily: theme.fonts.ui.regular,
    fontSize: 15,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  userName: {
    fontFamily: theme.fonts.display.semiBold,
    fontSize: 26,
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  settingsButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  section: {
    marginTop: theme.spacing.xl,
  },
  sectionTitle: {
    fontFamily: theme.fonts.ui.semiBold,
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
    },
    horizontalListContent: {
      paddingHorizontal: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    skeletonCard: {
      width: 150,
    },
    emptyState: {
      marginHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.xl,
      paddingHorizontal: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
      gap: theme.spacing.sm,
  },
    emptyStateText: {
    fontFamily: theme.fonts.ui.regular,
    fontSize: 14,
      color: theme.colors.textLight,
      textAlign: 'center',
  },
  journeyCard: {
      marginHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.xl,
    ...theme.shadows.sm,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakDots: {
    flexDirection: 'row',
      gap: 10,
  },
  streakDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
  },
  streakDotFilled: {
    backgroundColor: theme.colors.primary,
  },
  streakDotEmpty: {
    backgroundColor: theme.colors.gray[200],
  },
  streakInfo: {
    alignItems: 'flex-end',
  },
  streakNumber: {
    fontFamily: theme.fonts.display.bold,
      fontSize: 32,
    color: theme.colors.primary,
  },
  streakLabel: {
    fontFamily: theme.fonts.ui.regular,
      fontSize: 13,
    color: theme.colors.textLight,
  },
  journeyDivider: {
    height: 1,
    backgroundColor: theme.colors.gray[200],
      marginVertical: theme.spacing.lg,
  },
  journeyStats: {
    flexDirection: 'row',
  },
  journeyStat: {
    flex: 1,
  },
  journeyStatValue: {
    fontFamily: theme.fonts.display.semiBold,
      fontSize: 24,
    color: theme.colors.text,
  },
  journeyStatLabel: {
    fontFamily: theme.fonts.ui.regular,
      fontSize: 14,
    color: theme.colors.textLight,
      marginTop: 4,
  },
    quoteCard: {
      marginHorizontal: theme.spacing.lg,
      marginTop: theme.spacing.xl,
      borderRadius: theme.borderRadius.xl,
      overflow: 'hidden',
      ...theme.shadows.sm,
    },
    quoteGradient: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    quoteIcon: {
      marginBottom: theme.spacing.sm,
  },
    quoteEmoji: {
      fontSize: 32,
  },
    quoteLabel: {
    fontFamily: theme.fonts.ui.medium,
      fontSize: 12,
      color: theme.colors.textLight,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: theme.spacing.sm,
    },
    quoteText: {
      fontFamily: theme.fonts.body.italic,
      fontSize: 18,
      color: theme.colors.text,
      textAlign: 'center',
      lineHeight: 26,
    },
    quoteAuthor: {
      fontFamily: theme.fonts.ui.regular,
    fontSize: 14,
      color: theme.colors.textLight,
      marginTop: theme.spacing.sm,
  },
});

export default function Home() {
  return (
    <ProtectedRoute>
      <HomeScreen />
    </ProtectedRoute>
  );
}
