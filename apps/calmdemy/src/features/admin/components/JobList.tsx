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
  headerComponent?: React.ReactElement | null;
  footerComponent?: React.ReactElement | null;
}

export function JobList({
  jobs,
  isLoading,
  hasDrafts,
  onJobSelect,
  headerComponent = null,
  footerComponent = null,
}: JobListProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (isLoading) {
    return (
      <FlatList
        data={[]}
        keyExtractor={(_, index) => `loading-${index}`}
        renderItem={() => null}
        ListHeaderComponent={headerComponent}
        ListFooterComponent={
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    );
  }

  if (jobs.length === 0 && !hasDrafts) {
    return (
      <FlatList
        data={[]}
        keyExtractor={(_, index) => `empty-${index}`}
        renderItem={() => null}
        ListHeaderComponent={headerComponent}
        ListFooterComponent={
          <View style={styles.center}>
            <Ionicons name="flask-outline" size={48} color={theme.colors.textMuted} />
            <Text style={styles.emptyText}>No jobs yet</Text>
            <Text style={styles.emptySubtext}>
              Tap + to create your first content
            </Text>
            {footerComponent}
          </View>
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    );
  }

  return (
    <FlatList
      data={jobs}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.jobItem}>
          <JobCard job={item} onPress={() => onJobSelect(item.id)} />
        </View>
      )}
      ListHeaderComponent={headerComponent}
      ListFooterComponent={footerComponent}
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
      paddingBottom: 100,
    },
    jobItem: {
      marginHorizontal: 16,
    },
  });
