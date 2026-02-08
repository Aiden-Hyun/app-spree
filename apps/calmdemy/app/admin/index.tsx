import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@core/providers/contexts/ThemeContext';
import { useJobQueue } from '@features/admin/hooks/useJobQueue';
import { JobCard } from '@features/admin/components/JobCard';
import { JobStatus } from '@features/admin/types';
import { Theme } from '@/theme';

const FILTER_OPTIONS: { label: string; value: JobStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Pending', value: 'pending' },
  { label: 'Active', value: 'llm_generating' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [filter, setFilter] = useState<JobStatus | undefined>(undefined);
  const { jobs, isLoading } = useJobQueue(filter);

  const activeCount = jobs.filter(
    (j) => j.status !== 'completed' && j.status !== 'failed' && j.status !== 'pending'
  ).length;
  const pendingCount = jobs.filter((j) => j.status === 'pending').length;

  return (
    <View style={styles.container}>
      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: `${theme.colors.primary}15` }]}>
          <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
            {pendingCount}
          </Text>
          <Text style={styles.statLabel}>Queued</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: `${theme.colors.warning}15` }]}>
          <Text style={[styles.statNumber, { color: theme.colors.warning }]}>
            {activeCount}
          </Text>
          <Text style={styles.statLabel}>Processing</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: `${theme.colors.success}15` }]}>
          <Text style={[styles.statNumber, { color: theme.colors.success }]}>
            {jobs.filter((j) => j.status === 'completed').length}
          </Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersRow}>
        {FILTER_OPTIONS.map((opt) => (
          <Pressable
            key={opt.label}
            style={[
              styles.filterChip,
              filter === opt.value && styles.filterChipActive,
            ]}
            onPress={() => setFilter(opt.value)}
          >
            <Text
              style={[
                styles.filterText,
                filter === opt.value && styles.filterTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Job List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : jobs.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="flask-outline" size={48} color={theme.colors.textMuted} />
          <Text style={styles.emptyText}>No jobs yet</Text>
          <Text style={styles.emptySubtext}>
            Tap + to create your first content
          </Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <JobCard
              job={item}
              onPress={() => router.push(`/admin/job/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: theme.colors.primary },
          pressed && { opacity: 0.85 },
        ]}
        onPress={() => router.push('/admin/create')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    statsRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
      gap: 10,
    },
    statCard: {
      flex: 1,
      borderRadius: 14,
      padding: 14,
      alignItems: 'center',
    },
    statNumber: {
      fontFamily: 'DMSans-Bold',
      fontSize: 24,
    },
    statLabel: {
      fontFamily: 'DMSans-Regular',
      fontSize: 12,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    filtersRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
    },
    filterChipActive: {
      backgroundColor: theme.colors.primary,
    },
    filterText: {
      fontFamily: 'DMSans-Medium',
      fontSize: 13,
      color: theme.colors.textMuted,
    },
    filterTextActive: {
      color: '#fff',
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    emptyText: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 18,
      color: theme.colors.text,
    },
    emptySubtext: {
      fontFamily: 'DMSans-Regular',
      fontSize: 14,
      color: theme.colors.textMuted,
    },
    list: {
      padding: 16,
      paddingBottom: 100,
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 32,
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
  });
