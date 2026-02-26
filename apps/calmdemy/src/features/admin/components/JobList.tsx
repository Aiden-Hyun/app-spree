import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@core/providers/contexts/ThemeContext';
import { ContentJob } from '../types';
import { JobCard } from './JobCard';
import { Theme } from '@/theme';

interface JobListProps {
  jobs: ContentJob[];
  isLoading: boolean;
  hasDrafts: boolean;
  onJobSelect: (jobId: string) => void;
}

export function JobList({ jobs, isLoading, hasDrafts, onJobSelect }: JobListProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (jobs.length === 0 && !hasDrafts) {
    return (
      <View style={styles.center}>
        <Ionicons name="flask-outline" size={48} color={theme.colors.textMuted} />
        <Text style={styles.emptyText}>No jobs yet</Text>
        <Text style={styles.emptySubtext}>
          Tap + to create your first content
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={jobs}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <JobCard job={item} onPress={() => onJobSelect(item.id)} />
      )}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      showsVerticalScrollIndicator={false}
    />
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
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
  });
