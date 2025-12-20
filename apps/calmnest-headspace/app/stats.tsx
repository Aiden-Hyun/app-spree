import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { ProtectedRoute } from '../src/components/ProtectedRoute';
import { StatsCard } from '../src/components/StatsCard';
import { AnimatedView } from '../src/components/AnimatedView';
import { AnimatedPressable } from '../src/components/AnimatedPressable';
import { Skeleton } from '../src/components/Skeleton';
import { useStats } from '../src/hooks/useStats';
import { useTheme } from '../src/contexts/ThemeContext';
import { Theme } from '../src/theme';

const { width } = Dimensions.get('window');

function StatsScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { stats, loading } = useStats();
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [chartData, setChartData] = useState<any>(null);

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  useEffect(() => {
    loadChartData();
  }, [timeRange, stats]);

  const loadChartData = () => {
    if (timeRange === 'week') {
      const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const data = stats?.weekly_minutes || Array(7).fill(0);
      
      setChartData({
        labels,
        datasets: [{
          data,
          strokeWidth: 2,
        }],
      });
    } else {
      const labels = Array(30).fill(0).map((_, i) => `${i + 1}`);
      const data = Array(30).fill(0).map(() => Math.floor(Math.random() * 30));
      
      setChartData({
        labels: labels.filter((_, i) => i % 5 === 0),
        datasets: [{
          data,
          strokeWidth: 2,
        }],
      });
    }
  };

  const chartConfig = useMemo(() => ({
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => isDark 
      ? `rgba(157, 176, 148, ${opacity})` 
      : `rgba(139, 159, 130, ${opacity})`,
    labelColor: () => theme.colors.textLight,
    style: {
      borderRadius: theme.borderRadius.lg,
    },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
  }), [theme, isDark]);

  // Loading state with skeletons
  if (loading || !stats) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <AnimatedPressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </AnimatedPressable>
            <Text style={styles.title}>Your Statistics</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Summary Cards Skeleton */}
          <View style={styles.summaryGrid}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={styles.skeletonCard}>
                <Skeleton width={40} height={40} borderRadius={20} style={{ marginBottom: 12 }} />
                <Skeleton width={50} height={28} style={{ marginBottom: 6 }} />
                <Skeleton width={70} height={14} />
              </View>
            ))}
          </View>

          {/* Chart Skeleton */}
          <View style={styles.chartContainer}>
            <Skeleton width={140} height={18} style={{ marginBottom: 16 }} />
            <Skeleton height={220} borderRadius={theme.borderRadius.lg} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <AnimatedView delay={0} duration={400}>
          <View style={styles.header}>
            <AnimatedPressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </AnimatedPressable>
            <Text style={styles.title}>Your Statistics</Text>
            <View style={{ width: 44 }} />
          </View>
        </AnimatedView>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <AnimatedView delay={50} duration={400} style={styles.statsCardWrapper}>
            <StatsCard
              icon="time"
              label="Total Time"
              value={Math.floor(stats.total_minutes / 60)}
              unit="hours"
              color={theme.colors.primary}
            />
          </AnimatedView>
          <AnimatedView delay={100} duration={400} style={styles.statsCardWrapper}>
            <StatsCard
              icon="calendar"
              label="Total Sessions"
              value={stats.total_sessions}
              color={theme.colors.secondary}
            />
          </AnimatedView>
          <AnimatedView delay={150} duration={400} style={styles.statsCardWrapper}>
            <StatsCard
              icon="flame"
              label="Current Streak"
              value={stats.current_streak}
              unit="days"
              color={theme.colors.error}
            />
          </AnimatedView>
          <AnimatedView delay={200} duration={400} style={styles.statsCardWrapper}>
            <StatsCard
              icon="trophy"
              label="Longest Streak"
              value={stats.longest_streak}
              unit="days"
              color={theme.colors.warning}
            />
          </AnimatedView>
        </View>

        {/* Time Range Toggle */}
        <AnimatedView delay={250} duration={400}>
          <View style={styles.toggleContainer}>
            <AnimatedPressable
              onPress={() => setTimeRange('week')}
              style={[styles.toggleButton, timeRange === 'week' && styles.toggleButtonActive]}
            >
              <Text style={[styles.toggleText, timeRange === 'week' && styles.toggleTextActive]}>
                Week
              </Text>
            </AnimatedPressable>
            <AnimatedPressable
              onPress={() => setTimeRange('month')}
              style={[styles.toggleButton, timeRange === 'month' && styles.toggleButtonActive]}
            >
              <Text style={[styles.toggleText, timeRange === 'month' && styles.toggleTextActive]}>
                Month
              </Text>
            </AnimatedPressable>
          </View>
        </AnimatedView>

        {/* Chart */}
        <AnimatedView delay={300} duration={400}>
          {chartData && (
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Minutes Meditated</Text>
              <View style={styles.chartCard}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <LineChart
                    data={chartData}
                    width={Math.max(width - 64, chartData.labels.length * 60)}
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                    withInnerLines={false}
                    withOuterLines={false}
                    withVerticalLabels={true}
                    withHorizontalLabels={true}
                    fromZero={true}
                  />
                </ScrollView>
              </View>
            </View>
          )}
        </AnimatedView>

        {/* Insights */}
        <View style={styles.insightsSection}>
          <AnimatedView delay={350} duration={400}>
            <Text style={styles.sectionTitle}>Insights</Text>
          </AnimatedView>
          
          {[
            { 
              icon: 'sunny-outline' as const, 
              title: 'Favorite Time', 
              value: stats.favorite_time_of_day || 'Not enough data',
              color: theme.colors.secondary 
            },
            { 
              icon: 'trending-up-outline' as const, 
              title: 'Average Session', 
              value: stats.total_sessions > 0 
                ? `${Math.round(stats.total_minutes / stats.total_sessions)} minutes`
                : 'No sessions yet',
              color: theme.colors.primary 
            },
            { 
              icon: 'happy-outline' as const, 
              title: 'Mood Improvement', 
              value: stats.mood_improvement > 0 
                ? `+${stats.mood_improvement.toFixed(1)} points`
                : 'Track your mood to see',
              color: theme.colors.success 
            },
          ].map((insight, index) => (
            <AnimatedView key={insight.title} delay={400 + index * 50} duration={400}>
              <View style={styles.insightCard}>
                <View style={[styles.insightIcon, { backgroundColor: `${insight.color}15` }]}>
                  <Ionicons name={insight.icon} size={24} color={insight.color} />
                </View>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightValue}>{insight.value}</Text>
                </View>
              </View>
            </AnimatedView>
          ))}
        </View>

        {/* Milestones */}
        <View style={styles.milestonesSection}>
          <AnimatedView delay={550} duration={400}>
            <Text style={styles.sectionTitle}>Milestones</Text>
          </AnimatedView>
          
          <View style={styles.milestonesList}>
            {[1, 3, 7, 14, 21, 30, 50, 100].map((days, index) => {
              const isAchieved = stats.longest_streak >= days;
              return (
                <AnimatedView 
                  key={days} 
                  delay={600 + index * 30} 
                  duration={400}
                  style={styles.milestoneWrapper}
                >
                  <View 
                    style={[
                      styles.milestone,
                      isAchieved && styles.milestoneAchieved
                    ]}
                  >
                    {isAchieved && (
                      <Ionicons 
                        name="checkmark-circle" 
                        size={16} 
                        color="white" 
                        style={styles.milestoneCheck}
                      />
                    )}
                    <Text style={[
                      styles.milestoneText,
                      isAchieved && styles.milestoneTextAchieved
                    ]}>
                      {days}
                    </Text>
                    <Text style={[
                      styles.milestoneLabel,
                      isAchieved && styles.milestoneLabelAchieved
                    ]}>
                      days
                    </Text>
                  </View>
                </AnimatedView>
              );
            })}
          </View>
        </View>
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.lg,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.sm,
    },
    title: {
      fontFamily: theme.fonts.display.semiBold,
      fontSize: 22,
      color: theme.colors.text,
    },
    summaryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: theme.spacing.lg,
      marginHorizontal: -theme.spacing.xs,
    },
    statsCardWrapper: {
      width: '50%',
      paddingHorizontal: theme.spacing.xs,
      marginBottom: theme.spacing.sm,
    },
    skeletonCard: {
      width: '50%',
      paddingHorizontal: theme.spacing.xs,
      marginBottom: theme.spacing.sm,
    },
    toggleContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.full,
      padding: 4,
      marginHorizontal: theme.spacing.lg,
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      alignSelf: 'center',
      ...theme.shadows.sm,
    },
    toggleButton: {
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
    },
    toggleButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    toggleText: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 14,
      color: theme.colors.textLight,
    },
    toggleTextActive: {
      color: 'white',
    },
    chartContainer: {
      paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
    },
    chartTitle: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 18,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    chartCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.md,
      ...theme.shadows.sm,
    },
    chart: {
      borderRadius: theme.borderRadius.lg,
    },
    insightsSection: {
      paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 18,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    insightCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.sm,
      ...theme.shadows.sm,
    },
    insightIcon: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    insightContent: {
      flex: 1,
    },
    insightTitle: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 14,
      color: theme.colors.textLight,
      marginBottom: 4,
    },
    insightValue: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 17,
      color: theme.colors.text,
    },
    milestonesSection: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
    },
    milestonesList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -theme.spacing.xs,
    },
    milestoneWrapper: {
      width: '25%',
      paddingHorizontal: theme.spacing.xs,
      marginBottom: theme.spacing.sm,
    },
    milestone: {
      aspectRatio: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xl,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.sm,
    },
    milestoneAchieved: {
      backgroundColor: theme.colors.primary,
    },
    milestoneCheck: {
      position: 'absolute',
      top: 8,
      right: 8,
    },
    milestoneText: {
      fontFamily: theme.fonts.display.bold,
      fontSize: 22,
      color: theme.colors.textLight,
    },
    milestoneTextAchieved: {
      color: 'white',
    },
    milestoneLabel: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 12,
      color: theme.colors.textLight,
      marginTop: 2,
    },
    milestoneLabelAchieved: {
      color: 'rgba(255, 255, 255, 0.8)',
    },
  });

export default function Stats() {
  return (
    <ProtectedRoute>
      <StatsScreen />
    </ProtectedRoute>
  );
}
