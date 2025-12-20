import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import { AnimatedView } from '../../src/components/AnimatedView';
import { AnimatedPressable } from '../../src/components/AnimatedPressable';
import { Skeleton, SkeletonCard, SkeletonListItem } from '../../src/components/Skeleton';
import { useStats } from '../../src/hooks/useStats';
import { getTodayQuote, getMeditations } from '../../src/services/firestoreService';
import { Theme } from '../../src/theme';
import { DailyQuote, GuidedMeditation } from '../../src/types';

function HomeScreen() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const { stats, loading: statsLoading } = useStats();
  const [quote, setQuote] = useState<DailyQuote | null>(null);
  const [featuredSession, setFeaturedSession] = useState<GuidedMeditation | null>(null);
  const [loading, setLoading] = useState(true);

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      const [quoteData, meditations] = await Promise.all([
        getTodayQuote(),
        getMeditations()
      ]);
      setQuote(quoteData);
      if (meditations.length > 0) {
        const randomIndex = Math.floor(Math.random() * Math.min(meditations.length, 5));
        setFeaturedSession(meditations[randomIndex]);
      }
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

  const quickActions = [
    { id: 'breathe', label: 'Breathe', icon: 'cloud-outline' as const, route: '/breathing' },
    { id: 'sleep', label: 'Sleep', icon: 'moon-outline' as const, route: '/(tabs)/sleep' },
    { id: 'focus', label: 'Focus', icon: 'eye-outline' as const, route: '/(tabs)/meditate' },
  ];

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

  const intentionGradient = isDark 
    ? [theme.colors.surface, theme.colors.background] as [string, string]
    : ['#F5EDE3', '#FAF8F5'] as [string, string];

  const featuredDefaultGradient = theme.gradients.sage as [string, string];

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

        {/* Daily Intention Card */}
        <AnimatedView delay={100} duration={400}>
          <View style={styles.intentionCard}>
            <LinearGradient
              colors={intentionGradient}
              style={styles.intentionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.intentionIcon}>
                <Text style={styles.intentionEmoji}>🕊️</Text>
              </View>
              <Text style={styles.intentionLabel}>Today's Intention</Text>
              {loading ? (
                <Skeleton height={20} width="80%" style={{ alignSelf: 'center' }} />
              ) : (
                <Text style={styles.intentionText}>
                  {quote?.text || "Take a breath. You're exactly where you need to be."}
                </Text>
              )}
              {quote?.author && (
                <Text style={styles.intentionAuthor}>— {quote.author}</Text>
              )}
            </LinearGradient>
          </View>
        </AnimatedView>

        {/* Featured Session */}
        <View style={styles.section}>
          <AnimatedView delay={200} duration={400}>
            <Text style={styles.sectionTitle}>Recommended for you</Text>
          </AnimatedView>
          
          {loading ? (
            <AnimatedView delay={250} duration={400}>
              <SkeletonCard />
            </AnimatedView>
          ) : featuredSession ? (
            <AnimatedView delay={250} duration={400}>
              <AnimatedPressable 
                onPress={() => router.push({
                  pathname: '/meditation/[id]',
                  params: { id: featuredSession.id }
                })}
                style={styles.featuredCard}
              >
                {featuredSession.thumbnail_url ? (
                  <Image 
                    source={{ uri: featuredSession.thumbnail_url }} 
                    style={styles.featuredImage}
                  />
                ) : null}
                <LinearGradient
                  colors={featuredSession.thumbnail_url 
                    ? ['transparent', 'rgba(0,0,0,0.6)'] 
                    : featuredDefaultGradient}
                  style={[
                    styles.featuredGradient,
                    featuredSession.thumbnail_url && styles.featuredGradientOverlay
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                >
                  <View style={styles.featuredContent}>
                    {!featuredSession.thumbnail_url && (
                      <View style={styles.featuredIcon}>
                        <Ionicons name="leaf" size={28} color="white" />
                      </View>
                    )}
                    <View style={styles.featuredInfo}>
                      <Text style={styles.featuredTitle}>{featuredSession.title}</Text>
                      <Text style={styles.featuredMeta}>
                        {featuredSession.duration_minutes} min · {featuredSession.category}
                      </Text>
                    </View>
                    <View style={styles.playButton}>
                      <Ionicons name="play" size={20} color={theme.colors.primary} />
                    </View>
                  </View>
                </LinearGradient>
              </AnimatedPressable>
            </AnimatedView>
          ) : null}
        </View>

        {/* Your Journey */}
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
              <View style={styles.journeyCard}>
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
              </View>
            )}
          </AnimatedView>
        </View>

        {/* Quick Access */}
        <View style={styles.section}>
          <AnimatedView delay={400} duration={400}>
            <Text style={styles.sectionTitle}>Quick Access</Text>
          </AnimatedView>
          
          <View style={styles.quickGrid}>
            {quickActions.map((action, index) => (
              <AnimatedView key={action.id} delay={450 + index * 50} duration={400}>
                <AnimatedPressable
                  onPress={() => router.push(action.route as any)}
                  style={styles.quickCard}
                >
                  <View style={styles.quickIconContainer}>
                    <Ionicons name={action.icon} size={28} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.quickLabel}>{action.label}</Text>
                </AnimatedPressable>
              </AnimatedView>
            ))}
          </View>
        </View>

        {/* See all stats link */}
        <AnimatedView delay={600} duration={400}>
          <AnimatedPressable 
            onPress={() => router.push('/stats')}
            style={styles.seeAllButton}
          >
            <Text style={styles.seeAllText}>View detailed statistics</Text>
            <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} />
          </AnimatedPressable>
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
    intentionCard: {
      marginHorizontal: theme.spacing.lg,
      marginTop: theme.spacing.md,
      borderRadius: theme.borderRadius.xl,
      overflow: 'hidden',
      ...theme.shadows.sm,
    },
    intentionGradient: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    intentionIcon: {
      marginBottom: theme.spacing.sm,
    },
    intentionEmoji: {
      fontSize: 32,
    },
    intentionLabel: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 12,
      color: theme.colors.textLight,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: theme.spacing.sm,
    },
    intentionText: {
      fontFamily: theme.fonts.body.italic,
      fontSize: 18,
      color: theme.colors.text,
      textAlign: 'center',
      lineHeight: 26,
    },
    intentionAuthor: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 14,
      color: theme.colors.textLight,
      marginTop: theme.spacing.sm,
    },
    section: {
      marginTop: theme.spacing.xl,
      paddingHorizontal: theme.spacing.lg,
    },
    sectionTitle: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 18,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    featuredCard: {
      borderRadius: theme.borderRadius.xl,
      overflow: 'hidden',
      ...theme.shadows.md,
      position: 'relative',
    },
    featuredImage: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    featuredGradient: {
      padding: theme.spacing.lg,
    },
    featuredGradientOverlay: {
      paddingTop: 80,
    },
    featuredContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    featuredIcon: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: 'rgba(255,255,255,0.25)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    featuredInfo: {
      flex: 1,
      marginLeft: theme.spacing.md,
    },
    featuredTitle: {
      fontFamily: theme.fonts.display.semiBold,
      fontSize: 18,
      color: 'white',
      marginBottom: 4,
    },
    featuredMeta: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 14,
      color: 'rgba(255,255,255,0.8)',
      textTransform: 'capitalize',
    },
    playButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'white',
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.md,
    },
    journeyCard: {
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
    quickGrid: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    quickCard: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.xl,
      alignItems: 'center',
      ...theme.shadows.sm,
    },
    quickIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: isDark ? theme.colors.gray[100] : `${theme.colors.primary}15`,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.md,
    },
    quickLabel: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 14,
      color: theme.colors.text,
    },
    seeAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: theme.spacing.xl,
      paddingVertical: theme.spacing.md,
      gap: theme.spacing.xs,
    },
    seeAllText: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 14,
      color: theme.colors.primary,
    },
  });

export default function Home() {
  return (
    <ProtectedRoute>
      <HomeScreen />
    </ProtectedRoute>
  );
}
