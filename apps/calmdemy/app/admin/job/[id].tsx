import React from 'react';
import { View, ActivityIndicator, Text, Alert, StyleSheet, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@core/providers/contexts/ThemeContext';
import { useJobDetail, useJobStepTimeline } from '@features/admin/hooks/useJobQueue';
import { publishCompletedJob } from '@features/admin/data/adminRepository';
import { JobDetailView } from '@features/admin/components/JobDetailView';
import { Theme } from '@/theme';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const {
    job,
    isLoading,
    retry,
    cancel,
    requestDelete,
    regenerateCourse,
    approvePendingScripts,
    regeneratePendingScripts,
  } = useJobDetail(id);
  const { timeline, isLoading: isTimelineLoading } = useJobStepTimeline(
    id || '',
    job?.v2RunId
  );

  const handleRetry = () => retry();
  const handleCancel = () => cancel();
  const confirmAction = (message: string) => {
    if (Platform.OS !== 'web') {
      return Promise.resolve(true);
    }

    const webConfirm = (
      globalThis as typeof globalThis & { confirm?: (value?: string) => boolean }
    ).confirm;
    return Promise.resolve(typeof webConfirm === 'function' ? webConfirm(message) : true);
  };

  const startPublish = async () => {
    if (!job) {
      return;
    }

    await publishCompletedJob(job.id);
  };

  const handlePublish = async () => {
    if (!job) return;
    const isPublishingRegeneratedSessions =
      job.contentType === 'course' &&
      job.status === 'completed' &&
      Boolean(job.courseRegeneration?.active && job.courseRegeneration.requiresPublishApproval);
    const message = isPublishingRegeneratedSessions
      ? 'This will replace the selected live course sessions with regenerated audio. Continue?'
      : 'This will make the content visible to users. Continue?';

    if (Platform.OS === 'web') {
      const confirmed = await confirmAction(message);
      if (!confirmed) {
        return;
      }
      await startPublish();
      return;
    }

    Alert.alert(
      isPublishingRegeneratedSessions ? 'Publish Regenerated Sessions' : 'Publish Content',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish',
          onPress: async () => {
            await startPublish();
          },
        },
      ]
    );
  };
  const handleDelete = () => requestDelete();
  const startApprovePendingScripts = async (input?: {
    rawScriptEdits?: Record<string, string>;
    script?: string;
  }) => {
    await approvePendingScripts(input);
  };

  const startRegeneratePendingScripts = async () => {
    await regeneratePendingScripts();
  };

  const handleApprovePendingScripts = async (input?: {
    rawScriptEdits?: Record<string, string>;
    script?: string;
  }) => {
    if (!job) {
      return;
    }

    const isRegenerationApproval = Boolean(
      job.courseRegeneration?.active &&
        job.courseRegeneration.mode === 'script_and_audio' &&
        job.courseRegeneration.awaitingScriptApproval
    );
    const isSingleScriptApproval = Boolean(
      job.contentType !== 'course' &&
        job.scriptApproval?.enabled &&
        job.scriptApproval.awaitingApproval
    );
    const message = isRegenerationApproval
      ? 'This will confirm the regenerated scripts and continue with formatting and audio generation.'
      : isSingleScriptApproval
        ? 'This will confirm the script and continue with formatting, image generation, and audio generation.'
        : 'This will confirm the course scripts and continue with formatting and audio generation.';

    if (Platform.OS === 'web') {
      const confirmed = await confirmAction(message);
      if (!confirmed) {
        return;
      }

      await startApprovePendingScripts(input);
      return;
    }

    Alert.alert(
      isRegenerationApproval
        ? 'Approve Regenerated Scripts'
        : isSingleScriptApproval
          ? 'Approve Script'
          : 'Approve Course Scripts',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await startApprovePendingScripts(input);
            } catch (error) {
              Alert.alert(
                'Approval Failed',
                error instanceof Error ? error.message : 'Unable to approve pending script.'
              );
            }
          },
        },
      ]
    );
  };

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

  const isCourseRegenAwaitingPublish =
    job.contentType === 'course' &&
    job.status === 'completed' &&
    Boolean(
      job.courseRegeneration?.active &&
        job.courseRegeneration.requiresPublishApproval &&
        !job.courseRegeneration.awaitingScriptApproval
    );
  const isCourseRegenAwaitingScriptApproval =
    job.contentType === 'course' &&
    job.status === 'completed' &&
    Boolean(
      job.courseRegeneration?.active &&
        job.courseRegeneration.mode === 'script_and_audio' &&
        job.courseRegeneration.awaitingScriptApproval
    );
  const isCourseInitialAwaitingScriptApproval =
    job.contentType === 'course' &&
    job.status === 'completed' &&
    Boolean(job.courseScriptApproval?.enabled && job.courseScriptApproval.awaitingApproval);
  const isSingleAwaitingScriptApproval =
    job.contentType !== 'course' &&
    job.status === 'completed' &&
    Boolean(job.scriptApproval?.enabled && job.scriptApproval.awaitingApproval);
  const isAwaitingAnyScriptApproval =
    isCourseRegenAwaitingScriptApproval ||
    isCourseInitialAwaitingScriptApproval ||
    isSingleAwaitingScriptApproval;
  const isAwaitingApproval =
    !isAwaitingAnyScriptApproval &&
    (isCourseRegenAwaitingPublish ||
      (job.status === 'completed' && !job.autoPublish && !job.publishedContentId));
  const isReviewable =
    job.status === 'completed' &&
    !isAwaitingAnyScriptApproval &&
    (!job.autoPublish || isCourseRegenAwaitingPublish);
  const isDeletable =
    job.status === 'failed' || (job.status === 'completed' && !job.autoPublish);
  const publishButtonLabel = isCourseRegenAwaitingPublish
    ? 'Publish Regenerated Sessions'
    : 'Publish Now';

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack.Screen
        options={{
          title: 'Job Details',
        }}
      />
      <JobDetailView
        job={job}
        timeline={timeline}
        isTimelineLoading={isTimelineLoading}
        isAwaitingApproval={isAwaitingApproval}
        isReviewable={isReviewable}
        isDeletable={isDeletable}
        onRetry={handleRetry}
        onCancel={handleCancel}
        onPublish={handlePublish}
        publishButtonLabel={publishButtonLabel}
        onRegenerateCourse={regenerateCourse}
        onApprovePendingScripts={handleApprovePendingScripts}
        onRegeneratePendingScripts={startRegeneratePendingScripts}
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
