import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { ProtectedRoute } from '../src/components/ProtectedRoute';
import { StatsCard } from '../src/components/StatsCard';
import { useStats } from '../src/hooks/useStats';
import { theme } from '../src/theme';

const { width } = Dimensions.get('window');

function StatsScreen() {
  const router = useRouter();
  const { stats, loading } = useStats();
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [chartData, setChartData] = useState<any>(null);

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
      // TODO: Implement monthly chart from Firestore
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

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(108, 92, 231, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(45, 52, 54, ${opacity})`,
    style: {
      borderRadius: theme.borderRadius.lg,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
  };

  if (loading || !stats) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Your Statistics</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <StatsCard
            icon="time"
            label="Total Time"
            value={Math.floor(stats.total_minutes / 60)}
            unit="hours"
            color={theme.colors.primary}
          />
          <StatsCard
            icon="calendar"
            label="Total Sessions"
            value={stats.total_sessions}
            color={theme.colors.secondary}
          />
          <StatsCard
            icon="flame"
            label="Current Streak"
            value={stats.current_streak}
            unit="days"
            color={theme.colors.error}
          />
          <StatsCard
            icon="trophy"
            label="Longest Streak"
            value={stats.longest_streak}
            unit="days"
            color={theme.colors.warning}
          />
        </View>

        {/* Time Range Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, timeRange === 'week' && styles.toggleButtonActive]}
            onPress={() => setTimeRange('week')}
          >
            <Text style={[styles.toggleText, timeRange === 'week' && styles.toggleTextActive]}>
              Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, timeRange === 'month' && styles.toggleButtonActive]}
            onPress={() => setTimeRange('month')}
          >
            <Text style={[styles.toggleText, timeRange === 'month' && styles.toggleTextActive]}>
              Month
            </Text>
          </TouchableOpacity>
        </View>

        {/* Chart */}
        {chartData && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Minutes Meditated</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <LineChart
                data={chartData}
                width={Math.max(width - 40, chartData.labels.length * 60)}
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
        )}

        {/* Insights */}
        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>Insights</Text>
          
          <View style={styles.insightCard}>
            <View style={[styles.insightIcon, { backgroundColor: `${theme.colors.secondary}20` }]}>
              <Ionicons name="sunny" size={24} color={theme.colors.secondary} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Favorite Time</Text>
              <Text style={styles.insightValue}>
                {stats.favorite_time_of_day || 'Not enough data'}
              </Text>
            </View>
          </View>

          <View style={styles.insightCard}>
            <View style={[styles.insightIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
              <Ionicons name="trending-up" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Average Session</Text>
              <Text style={styles.insightValue}>
                {stats.total_sessions > 0 
                  ? `${Math.round(stats.total_minutes / stats.total_sessions)} minutes`
                  : 'No sessions yet'}
              </Text>
            </View>
          </View>

          <View style={styles.insightCard}>
            <View style={[styles.insightIcon, { backgroundColor: `${theme.colors.success}20` }]}>
              <Ionicons name="happy" size={24} color={theme.colors.success} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Mood Improvement</Text>
              <Text style={styles.insightValue}>
                {stats.mood_improvement > 0 
                  ? `+${stats.mood_improvement.toFixed(1)} points`
                  : 'Track your mood to see'}
              </Text>
            </View>
          </View>
        </View>

        {/* Milestones */}
        <View style={styles.milestonesSection}>
          <Text style={styles.sectionTitle}>Milestones</Text>
          <View style={styles.milestonesList}>
            {[1, 3, 7, 14, 21, 30, 50, 100].map((days) => (
              <View 
                key={days} 
                style={[
                  styles.milestone,
                  stats.longest_streak >= days && styles.milestoneAchieved
                ]}
              >
                <Text style={[
                  styles.milestoneText,
                  stats.longest_streak >= days && styles.milestoneTextAchieved
                ]}>
                  {days}
                </Text>
                <Text style={[
                  styles.milestoneLabel,
                  stats.longest_streak >= days && styles.milestoneLabelAchieved
                ]}>
                  days
                </Text>
              </View>
            ))}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.full,
    padding: 4,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    alignSelf: 'center',
  },
  toggleButton: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  toggleButtonActive: {
    backgroundColor: 'white',
    ...theme.shadows.sm,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textLight,
  },
  toggleTextActive: {
    color: theme.colors.text,
  },
  chartContainer: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  chart: {
    borderRadius: theme.borderRadius.lg,
  },
  insightsSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  insightIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 2,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  milestonesSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  milestonesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  milestone: {
    width: (width - theme.spacing.lg * 2 - theme.spacing.sm * 3) / 4,
    aspectRatio: 1,
    backgroundColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneAchieved: {
    backgroundColor: theme.colors.primary,
  },
  milestoneText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textLight,
  },
  milestoneTextAchieved: {
    color: 'white',
  },
  milestoneLabel: {
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
