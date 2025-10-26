import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/contexts/AuthContext';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import { StatsCard } from '../../src/components/StatsCard';
import { ProgressRing } from '../../src/components/ProgressRing';
import { useStats } from '../../src/hooks/useStats';
import { theme } from '../../src/theme';

function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { stats, loading, refreshStats } = useStats();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const quickActions = [
    {
      id: 'meditate',
      title: 'Meditate',
      subtitle: 'Find your calm',
      icon: 'leaf' as const,
      route: '/(tabs)/meditate',
      gradient: ['#6c5ce7', '#a29bfe'],
    },
    {
      id: 'breathe',
      title: 'Breathe',
      subtitle: 'Quick exercise',
      icon: 'water' as const,
      route: '/breathing',
      gradient: ['#74b9ff', '#a0d2ff'],
    },
    {
      id: 'sleep',
      title: 'Sleep',
      subtitle: 'Wind down',
      icon: 'moon' as const,
      route: '/(tabs)/sleep',
      gradient: ['#5f3dc4', '#7c5cdb'],
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.email?.split('@')[0] || 'Friend'}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Daily Progress */}
        <View style={styles.progressSection}>
          <Text style={styles.sectionTitle}>Today's Progress</Text>
          <View style={styles.progressContainer}>
            <ProgressRing
              progress={stats ? (stats.total_sessions > 0 ? 100 : 0) : 0}
              size={120}
              centerText={stats?.current_streak.toString() || '0'}
              centerSubtext="day streak"
            />
            <View style={styles.dailyStats}>
              <View style={styles.dailyStat}>
                <Text style={styles.dailyStatValue}>
                  {stats?.weekly_minutes[6] || 0}
                </Text>
                <Text style={styles.dailyStatLabel}>minutes today</Text>
              </View>
              <View style={styles.dailyStat}>
                <Text style={styles.dailyStatValue}>
                  {stats ? (stats.weekly_minutes[6] > 0 ? 1 : 0) : 0}
                </Text>
                <Text style={styles.dailyStatLabel}>sessions today</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Start</Text>
          <View style={styles.actionGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={action.gradient}
                  style={styles.actionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name={action.icon} size={32} color="white" />
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Stats</Text>
            <TouchableOpacity onPress={() => router.push('/stats')}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statsGrid}>
            <StatsCard
              icon="time"
              label="Total Time"
              value={stats?.total_minutes || 0}
              unit="min"
              color={theme.colors.primary}
            />
            <StatsCard
              icon="flame"
              label="Longest Streak"
              value={stats?.longest_streak || 0}
              unit="days"
              color={theme.colors.error}
            />
          </View>
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  greeting: {
    fontSize: 16,
    color: theme.colors.textLight,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 2,
  },
  progressSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  dailyStats: {
    flex: 1,
    marginLeft: theme.spacing.xl,
  },
  dailyStat: {
    marginBottom: theme.spacing.md,
  },
  dailyStatValue: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  dailyStatLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  quickActions: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  actionCard: {
    flex: 1,
    height: 140,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  actionGradient: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'space-between',
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginTop: theme.spacing.sm,
  },
  actionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  seeAllText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
});

export default function Home() {
  return (
    <ProtectedRoute>
      <HomeScreen />
    </ProtectedRoute>
  );
}
