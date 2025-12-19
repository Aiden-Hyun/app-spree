import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/contexts/AuthContext';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import { useStats } from '../../src/hooks/useStats';
import { getTodayQuote, getMeditations } from '../../src/services/firestoreService';
import { theme } from '../../src/theme';
import { DailyQuote, GuidedMeditation } from '../../src/types';

function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { stats } = useStats();
  const [quote, setQuote] = useState<DailyQuote | null>(null);
  const [featuredSession, setFeaturedSession] = useState<GuidedMeditation | null>(null);

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
        // Pick a random featured session
        const randomIndex = Math.floor(Math.random() * Math.min(meditations.length, 5));
        setFeaturedSession(meditations[randomIndex]);
      }
    } catch (error) {
      console.error('Error loading home data:', error);
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
    { id: 'breathe', label: 'Breathe', icon: '🌬️', route: '/breathing' },
    { id: 'sleep', label: 'Sleep', icon: '🌙', route: '/(tabs)/sleep' },
    { id: 'focus', label: 'Focus', icon: '🎯', route: '/(tabs)/meditate' },
  ];

  // Create streak dots
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {getGreeting()} {getGreetingEmoji()}
            </Text>
            <Text style={styles.userName}>
              {user?.email?.split('@')[0] || 'Friend'}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={22} color={theme.colors.textLight} />
          </TouchableOpacity>
        </View>

        {/* Daily Intention Card */}
        <View style={styles.intentionCard}>
          <LinearGradient
            colors={['#F5EDE3', '#FAF8F5']}
            style={styles.intentionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.intentionIcon}>
              <Text style={styles.intentionEmoji}>🕊️</Text>
            </View>
            <Text style={styles.intentionLabel}>Today's Intention</Text>
            <Text style={styles.intentionText}>
              {quote?.text || "Take a breath. You're exactly where you need to be."}
            </Text>
            {quote?.author && (
              <Text style={styles.intentionAuthor}>— {quote.author}</Text>
            )}
          </LinearGradient>
        </View>

        {/* Featured Session */}
        {featuredSession && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommended for you</Text>
            <TouchableOpacity 
              style={styles.featuredCard}
              activeOpacity={0.9}
              onPress={() => router.push({
                pathname: '/meditation/[id]',
                params: { id: featuredSession.id }
              })}
            >
              <LinearGradient
                colors={['#A8B89F', '#8B9F82']}
                style={styles.featuredGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.featuredContent}>
                  <View style={styles.featuredIcon}>
                    <Ionicons name="leaf" size={28} color="white" />
                  </View>
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
            </TouchableOpacity>
          </View>
        )}

        {/* Your Journey */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Journey</Text>
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
        </View>

        {/* Quick Access */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickCard}
                activeOpacity={0.8}
                onPress={() => router.push(action.route as any)}
              >
                <Text style={styles.quickEmoji}>{action.icon}</Text>
                <Text style={styles.quickLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* See all stats link */}
        <TouchableOpacity 
          style={styles.seeAllButton}
          onPress={() => router.push('/stats')}
        >
          <Text style={styles.seeAllText}>View detailed statistics</Text>
          <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
  },
  featuredGradient: {
    padding: theme.spacing.lg,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  journeyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakDots: {
    flexDirection: 'row',
    gap: 8,
  },
  streakDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
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
    fontSize: 28,
    color: theme.colors.primary,
  },
  streakLabel: {
    fontFamily: theme.fonts.ui.regular,
    fontSize: 12,
    color: theme.colors.textLight,
  },
  journeyDivider: {
    height: 1,
    backgroundColor: theme.colors.gray[200],
    marginVertical: theme.spacing.md,
  },
  journeyStats: {
    flexDirection: 'row',
  },
  journeyStat: {
    flex: 1,
  },
  journeyStatValue: {
    fontFamily: theme.fonts.display.semiBold,
    fontSize: 22,
    color: theme.colors.text,
  },
  journeyStatLabel: {
    fontFamily: theme.fonts.ui.regular,
    fontSize: 13,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  quickCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  quickEmoji: {
    fontSize: 28,
    marginBottom: theme.spacing.sm,
  },
  quickLabel: {
    fontFamily: theme.fonts.ui.medium,
    fontSize: 14,
    color: theme.colors.text,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.xl,
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
