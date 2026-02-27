import React from 'react';
import { View, ActivityIndicator, Text, Alert, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@core/providers/contexts/ThemeContext';
import { useJobDetail } from '@features/admin/hooks/useJobQueue';
import { publishCompletedJob } from '@features/admin/data/adminRepository';
import { JobDetailView } from '@features/admin/components/JobDetailView';
import { Theme } from '@/theme';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { job, isLoading, retry, cancel, requestDelete } = useJobDetail(id);

  const handleRetry = () => retry();
  const handleCancel = () => cancel();
  const handlePublish = async () => {
    if (!job) return;
    Alert.alert(
      'Publish Content',
      'This will make the content visible to users. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish',
          onPress: async () => {
            await publishCompletedJob(job.id);
          },
        },
      ]
    );
  };
  const handleDelete = () => requestDelete();
  const handleReview = () => {
    if (!job) return;
    router.push({ pathname: '/admin/job/[id]/review', params: { id: job.id } });
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.colors.textMuted} />
        <Text style={styles.emptyText}>Job not found</Text>
      </View>
    );
  }

  const isAwaitingApproval =
    job.status === 'completed' && !job.autoPublish && !job.publishedContentId;
  const isReviewable =
    job.status === 'completed' && !job.autoPublish;
  const isDeletable =
    job.status === 'failed' || (job.status === 'completed' && !job.autoPublish);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack.Screen
        options={{
          title: 'Job Details',
        }}
      />
      <JobDetailView
        job={job}
        isAwaitingApproval={isAwaitingApproval}
        isReviewable={isReviewable}
        isDeletable={isDeletable}
        onRetry={handleRetry}
        onCancel={handleCancel}
        onPublish={handlePublish}
        onDelete={handleDelete}
        onReview={handleReview}
      />
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      backgroundColor: theme.colors.background,
    },
    emptyText: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 18,
      color: theme.colors.text,
    },
  });
