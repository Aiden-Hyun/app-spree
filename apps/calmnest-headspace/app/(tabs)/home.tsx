import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import { AnimatedView } from '../../src/components/AnimatedView';
import { AnimatedPressable } from '../../src/components/AnimatedPressable';
import { Skeleton } from '../../src/components/Skeleton';
import { useStats } from '../../src/hooks/useStats';
import { 
  getTodayQuote, 
  getListeningHistory, 
  getFavoritesWithDetails,
  ResolvedContent
} from '../../src/services/firestoreService';
import { seriesData } from '../../src/constants/seriesData';
import { Theme } from '../../src/theme';
import { DailyQuote, ListeningHistoryItem } from '../../src/types';

function HomeScreen() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const { stats, loading: statsLoading } = useStats();
  const [quote, setQuote] = useState<DailyQuote | null>(null);
  const [recentlyPlayed, setRecentlyPlayed] = useState<ListeningHistoryItem[]>([]);
  const [favorites, setFavorites] = useState<ResolvedContent[]>([]);
  const [loading, setLoading] = useState(true);

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [user])
  );

  const loadHomeData = async () => {
    if (!user) return;
    
    try {
      const [quoteData, historyData, favoritesData] = await Promise.all([
        getTodayQuote(),
        getListeningHistory(user.uid, 10),
        getFavoritesWithDetails(user.uid)
      ]);
      setQuote(quoteData);
      setRecentlyPlayed(historyData);
      
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
    for (const series of seriesData) {
      const chapter = series.chapters.find(ch => ch.id === chapterId);
      if (chapter) {
        return { series, chapter };
      }
    }
    return null;
  };

  const navigateToContent = (contentId: string, contentType: string) => {
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
        // Look up series chapter data and navigate with full params
        const result = findSeriesChapter(contentId);
        if (result) {
          router.push({
            pathname: '/series/chapter/[id]',
            params: {
              id: result.chapter.id,
              audioKey: result.chapter.audioKey,
              title: result.chapter.title,
              seriesTitle: result.series.title,
              duration: String(result.chapter.duration_minutes),
              narrator: result.series.narrator
            }
          });
        } else {
          router.push('/(tabs)/sleep');
        }
        break;
      case 'album_track':
        // Album tracks require additional params - navigate to music tab for now
        router.push('/(tabs)/music');
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
      default:
        return 'play-circle';
    }
  };

  const intentionGradient = isDark 
    ? [theme.colors.surface, theme.colors.background] as [string, string]
    : ['#F5EDE3', '#FAF8F5'] as [string, string];

  const renderRecentlyPlayedItem = useCallback(({ item }: { item: ListeningHistoryItem }) => (
    <AnimatedPressable
      onPress={() => navigateToContent(item.content_id, item.content_type)}
      style={styles.contentCard}
    >
      {item.content_thumbnail ? (
        <Image source={{ uri: item.content_thumbnail }} style={styles.contentThumbnail} />
      ) : (
        <View style={[styles.contentThumbnail, styles.contentThumbnailPlaceholder]}>
          <Ionicons 
            name={getContentIcon(item.content_type)} 
            size={24} 
            color={theme.colors.primary} 
          />
        </View>
      )}
      <Text style={styles.contentTitle} numberOfLines={2}>{item.content_title}</Text>
      <Text style={styles.contentMeta}>{item.duration_minutes} min</Text>
    </AnimatedPressable>
  ), [styles, theme]);

  const renderFavoriteItem = useCallback(({ item }: { item: ResolvedContent }) => (
    <AnimatedPressable
      onPress={() => navigateToContent(item.id, item.content_type)}
      style={styles.contentCard}
    >
      {item.thumbnail_url ? (
        <Image source={{ uri: item.thumbnail_url }} style={styles.contentThumbnail} />
      ) : (
        <View style={[styles.contentThumbnail, styles.contentThumbnailPlaceholder]}>
          <Ionicons 
            name={getContentIcon(item.content_type)} 
            size={24} 
            color={theme.colors.primary} 
          />
        </View>
      )}
      <Text style={styles.contentTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.contentMeta}>{item.duration_minutes} min</Text>
    </AnimatedPressable>
  ), [styles, theme]);

  const renderSkeletonCards = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.contentCard}>
          <Skeleton width={120} height={120} style={{ borderRadius: theme.borderRadius.lg }} />
          <Skeleton width={100} height={14} style={{ marginTop: 8 }} />
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
                {user?.email?.split('@')[0] || 'Friend'}
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
    horizontalList: {
      paddingLeft: theme.spacing.lg,
    },
    horizontalListContent: {
      paddingLeft: theme.spacing.lg,
      paddingRight: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    contentCard: {
      width: 130,
      marginRight: theme.spacing.md,
    },
    contentThumbnail: {
      width: 130,
      height: 130,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: theme.colors.surface,
    },
    contentThumbnailPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? theme.colors.gray[100] : `${theme.colors.primary}15`,
    },
    contentTitle: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 14,
      color: theme.colors.text,
      marginTop: theme.spacing.sm,
    },
    contentMeta: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 12,
      color: theme.colors.textLight,
      marginTop: 2,
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
