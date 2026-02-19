import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@core/providers/contexts/ThemeContext';
import { useJobDetail } from '@features/admin/hooks/useJobQueue';
import { PipelineStepper } from '@features/admin/components/PipelineStepper';
import { CollapsibleSection, SummaryItem } from '@features/admin/components/CollapsibleSection';
import { CONTENT_TYPE_LABELS, JOB_STATUS_LABELS, BACKEND_LABELS } from '@features/admin/types';
import { getVoiceLabelById } from '@features/admin/constants/models';
import { publishCompletedJob } from '@features/admin/data/adminRepository';
import { Theme } from '@/theme';

const SECTION_IDS = [
  'pipeline',
  'courseProgress',
  'jobDetails',
  'coursePlan',
  'publishedCourse',
  'customInstructions',
  'generatedScript',
  'error',
  'imagePrompt',
  'thumbnail',
  'output',
];

function toSummaryItems(
  items: Array<{ label: string; value?: string | number | null }>
): SummaryItem[] {
  return items
    .filter((item) => item.value !== undefined && item.value !== null)
    .map((item) => ({
      label: item.label,
      value: String(item.value).trim(),
    }))
    .filter((item) => item.value.length > 0);
}

function formatDuration(seconds?: number) {
  if (!seconds && seconds !== 0) return '';
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${minutes}:${String(remaining).padStart(2, '0')}`;
}

function getErrorType(error?: string) {
  if (!error) return '';
  const parts = error.split(':');
  return (parts[0] || 'Error').trim();
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { job, isLoading, retry, cancel, requestDelete } = useJobDetail(id);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [errorManuallyCollapsed, setErrorManuallyCollapsed] = useState(false);

  useEffect(() => {
    if (!job) return;
    const initial: Record<string, boolean> = {};
    SECTION_IDS.forEach((sectionId) => {
      initial[sectionId] = false;
    });
    if (job.error) {
      initial.error = true;
    }
    setExpandedSections(initial);
    setErrorManuallyCollapsed(false);
  }, [job?.id, job?.error]);

  const handleRetry = () => {
    Alert.alert('Retry Job', 'Re-queue this job for processing?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Retry', onPress: retry },
    ]);
  };

  const handleCancel = () => {
    Alert.alert('Cancel Job', 'Are you sure you want to cancel this job?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: cancel },
    ]);
  };

  const handlePublish = () => {
    if (!job) return;
    Alert.alert(
      'Publish Content',
      'This will make the content visible to users. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish',
          onPress: async () => {
            try {
              await publishCompletedJob(job.id);
              Alert.alert('Published', 'Content is now live.');
            } catch (error) {
              Alert.alert('Error', 'Failed to publish. Please try again.');
              console.error('Publish error:', error);
            }
          },
        },
      ]
    );
  };

  const isAwaitingApproval =
    job?.status === 'completed' && !job.autoPublish && !job.publishedContentId;
  const isReviewable =
    job?.status === 'completed' && !job.autoPublish;
  const isDeletable =
    job?.status === 'failed' || (job?.status === 'completed' && !job.autoPublish);

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

  const createdDate = job.createdAt?.toDate
    ? job.createdAt.toDate().toLocaleString()
    : 'Unknown';

  const sections = [
    {
      id: 'pipeline',
      title: 'Pipeline Progress',
      summaryItems: toSummaryItems([
        { label: 'Current', value: JOB_STATUS_LABELS[job.status] },
      ]),
      shouldRender: true,
      content: <PipelineStepper currentStatus={job.status} />,
    },
    {
      id: 'courseProgress',
      title: 'Course Progress',
      summaryItems: toSummaryItems([
        { label: 'Progress', value: job.courseProgress },
      ]),
      shouldRender: job.contentType === 'course' && Boolean(job.courseProgress),
      content: (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {job.status !== 'completed' && job.status !== 'failed' && (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          )}
          <Text
            style={{
              fontFamily: 'DMSans-SemiBold',
              fontSize: 15,
              color:
                job.status === 'completed'
                  ? theme.colors.success
                  : job.status === 'failed'
                    ? theme.colors.error
                    : theme.colors.primary,
            }}
          >
            {job.courseProgress}
          </Text>
        </View>
      ),
    },
    {
      id: 'jobDetails',
      title: 'Job Details',
      summaryItems: toSummaryItems([
        { label: 'Type', value: CONTENT_TYPE_LABELS[job.contentType] },
        {
          label: 'Models',
          value: `${job.llmModel} / ${job.ttsModel}`,
        },
        { label: 'Narrator', value: getVoiceLabelById(job.ttsVoice) },
      ]),
      shouldRender: true,
      content: (
        <>
          {(job.generatedTitle || job.title) && (
            <InfoRow label="Title" value={job.generatedTitle || job.title || ''} />
          )}
          <InfoRow
            label="LLM Backend"
            value={BACKEND_LABELS[job.llmBackend] || job.llmBackend || 'Local'}
          />
          <InfoRow
            label="TTS Backend"
            value={BACKEND_LABELS[job.ttsBackend] || job.ttsBackend || 'Local'}
          />
          <InfoRow label="Content Type" value={CONTENT_TYPE_LABELS[job.contentType]} />
          {job.contentType === 'course' ? (
            <>
              <InfoRow label="Course Code" value={job.params.courseCode || ''} />
              <InfoRow label="Course Title" value={job.params.courseTitle || ''} />
              <InfoRow label="Subject" value={job.params.subjectLabel || ''} />
              <InfoRow label="Audience" value={job.params.targetAudience || ''} />
              <InfoRow label="Tone" value={job.params.tone || ''} />
              <InfoRow label="Description" value={job.params.topic} />
            </>
          ) : (
            <>
              <InfoRow label="Topic" value={job.params.topic} />
              <InfoRow label="Duration" value={`${job.params.duration_minutes} minutes`} />
              {job.params.difficulty && (
                <InfoRow label="Difficulty" value={job.params.difficulty} />
              )}
              {job.params.style && <InfoRow label="Style" value={job.params.style} />}
              {job.params.technique && (
                <InfoRow label="Technique" value={job.params.technique} />
              )}
            </>
          )}
          <InfoRow label="Auto-publish" value={job.autoPublish ? 'Yes' : 'No (needs approval)'} />
          <InfoRow label="LLM Model" value={job.llmModel} />
          <InfoRow label="TTS Model" value={job.ttsModel} />
          <InfoRow label="Narrator" value={getVoiceLabelById(job.ttsVoice)} />
          <InfoRow label="Voice ID" value={job.ttsVoice} />
          {job.lastCompletedStage && (
            <InfoRow label="Last Completed" value={JOB_STATUS_LABELS[job.lastCompletedStage]} />
          )}
          {job.failedStage && (
            <InfoRow label="Failed Stage" value={JOB_STATUS_LABELS[job.failedStage]} />
          )}
          {typeof job.resumeAvailable === 'boolean' && (
            <InfoRow label="Resume Available" value={job.resumeAvailable ? 'Yes' : 'No'} />
          )}
          <InfoRow label="Created" value={createdDate} />
        </>
      ),
    },
    {
      id: 'coursePlan',
      title: 'Course Plan',
      summaryItems: toSummaryItems([
        {
          label: 'Modules',
          value: job.coursePlan?.modules ? job.coursePlan.modules.length : undefined,
        },
        {
          label: 'Title',
          value: job.coursePlan?.courseTitle || job.params.courseTitle,
        },
      ]),
      shouldRender: job.contentType === 'course' && Boolean(job.coursePlan),
      content: (
        <>
          {job.coursePlan?.courseGoal && (
            <Text style={[styles.scriptText, { marginBottom: 12 }]}>
              {job.coursePlan.courseGoal}
            </Text>
          )}
          {(job.coursePlan?.modules || []).map((mod: any, i: number) => (
            <View
              key={i}
              style={{
                marginBottom: 12,
                borderTopWidth: i > 0 ? 1 : 0,
                borderTopColor: theme.colors.gray[200],
                paddingTop: i > 0 ? 12 : 0,
              }}
            >
              <Text
                style={{
                  fontFamily: 'DMSans-SemiBold',
                  fontSize: 14,
                  color: theme.colors.text,
                  marginBottom: 4,
                }}
              >
                Module {mod.moduleNumber || i + 1}: {mod.moduleTitle}
              </Text>
              <Text
                style={{
                  fontFamily: 'DMSans-Regular',
                  fontSize: 13,
                  color: theme.colors.textMuted,
                }}
              >
                Lesson: {mod.lessonTitle}
              </Text>
              <Text
                style={{
                  fontFamily: 'DMSans-Regular',
                  fontSize: 13,
                  color: theme.colors.textMuted,
                }}
              >
                Practice: {mod.practiceTitle}
              </Text>
            </View>
          ))}
        </>
      ),
    },
    {
      id: 'publishedCourse',
      title: 'Published Course',
      summaryItems: toSummaryItems([
        { label: 'Course ID', value: job.courseId },
        {
          label: 'Sessions',
          value: job.courseSessionIds ? `${job.courseSessionIds.length}` : undefined,
        },
      ]),
      shouldRender: job.contentType === 'course' && Boolean(job.courseId),
      content: (
        <>
          <InfoRow label="Course ID" value={job.courseId || ''} />
          {job.courseSessionIds && (
            <InfoRow label="Sessions" value={`${job.courseSessionIds.length} published`} />
          )}
        </>
      ),
    },
    {
      id: 'customInstructions',
      title: 'Custom Instructions',
      summaryItems: toSummaryItems([
        {
          label: 'Preview',
          value: job.params.customInstructions
            ? job.params.customInstructions.trim().slice(0, 40) +
              (job.params.customInstructions.length > 40 ? '...' : '')
            : undefined,
        },
      ]),
      shouldRender: Boolean(job.params.customInstructions),
      content: <Text style={styles.scriptText}>{job.params.customInstructions}</Text>,
    },
    {
      id: 'generatedScript',
      title: 'Generated Script',
      summaryItems: toSummaryItems([
        {
          label: 'Length',
          value: job.generatedScript ? `${job.generatedScript.length}` : undefined,
        },
      ]),
      shouldRender: Boolean(job.generatedScript),
      content: (
        <Text style={styles.scriptText} numberOfLines={20}>
          {job.generatedScript}
        </Text>
      ),
    },
    {
      id: 'error',
      title: 'Error',
      summaryItems: toSummaryItems([
        { label: 'Error', value: getErrorType(job.error) },
      ]),
      shouldRender: Boolean(job.error),
      content: (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
          <Text style={styles.errorText}>{job.error}</Text>
        </View>
      ),
    },
    {
      id: 'imagePrompt',
      title: 'Image Prompt',
      summaryItems: toSummaryItems([{ label: 'Prompt', value: 'Present' }]),
      shouldRender: Boolean(job.imagePrompt),
      content: <Text style={styles.scriptText}>{job.imagePrompt}</Text>,
    },
    {
      id: 'thumbnail',
      title: 'Thumbnail',
      summaryItems: toSummaryItems([
        { label: 'Source', value: job.thumbnailUrl ? 'URL' : 'Path' },
      ]),
      shouldRender: Boolean(job.thumbnailUrl || job.imagePath),
      content: (
        <>
          {job.thumbnailUrl ? (
            <Image source={{ uri: job.thumbnailUrl }} style={styles.thumbnailImage} />
          ) : (
            <Text style={styles.emptySubtext}>Thumbnail URL not available.</Text>
          )}
          {job.thumbnailUrl && <InfoRow label="Thumbnail URL" value={job.thumbnailUrl} />}
          {job.imagePath && <InfoRow label="Image Path" value={job.imagePath} />}
        </>
      ),
    },
    {
      id: 'output',
      title: 'Output',
      summaryItems: toSummaryItems([
        { label: 'Duration', value: formatDuration(job.audioDurationSec) || undefined },
        { label: 'Content ID', value: job.publishedContentId },
      ]),
      shouldRender: Boolean(job.audioPath),
      content: (
        <>
          <InfoRow label="Audio Path" value={job.audioPath || ''} />
          {job.audioDurationSec && (
            <InfoRow label="Audio Duration" value={formatDuration(job.audioDurationSec)} />
          )}
          {job.publishedContentId && (
            <InfoRow label="Content ID" value={job.publishedContentId} />
          )}
        </>
      ),
    },
  ];

  const visibleSections = sections.filter((section) => section.shouldRender);
  const allExpanded =
    visibleSections.length > 0 &&
    visibleSections.every((section) => expandedSections[section.id]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const nextExpanded = !prev[sectionId];
      if (sectionId === 'error') {
        setErrorManuallyCollapsed(!nextExpanded);
      }
      return { ...prev, [sectionId]: nextExpanded };
    });
  };

  const handleExpandAll = () => {
    setExpandedSections((prev) => {
      const next = { ...prev };
      visibleSections.forEach((section) => {
        next[section.id] = true;
      });
      return next;
    });
    setErrorManuallyCollapsed(false);
  };

  const handleCollapseAll = () => {
    setExpandedSections((prev) => {
      const next = { ...prev };
      visibleSections.forEach((section) => {
        if (section.id === 'error' && job.error && !errorManuallyCollapsed) {
          next[section.id] = true;
          return;
        }
        next[section.id] = false;
      });
      return next;
    });
  };

  const handleReview = () => {
    if (!job) return;
    router.push({
      pathname: '/admin/job/[id]/review',
      params: { id: job.id },
    });
  };

  const handleDelete = () => {
    if (!job) return;
    Alert.alert(
      'Delete Job',
      'This will delete any generated audio and remove the job. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await requestDelete();
              Alert.alert('Delete queued', 'Job will be deleted shortly.');
            } catch (error) {
              Alert.alert('Error', 'Failed to request delete. Please try again.');
              console.error('Delete error:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen
        options={{
          title: 'Job Details',
          headerRight: () => (
            <Pressable
              style={({ pressed }) => [
                styles.controlButton,
                pressed && { opacity: 0.85 },
              ]}
              onPress={allExpanded ? handleCollapseAll : handleExpandAll}
            >
              <Ionicons
                name={allExpanded ? 'contract-outline' : 'expand-outline'}
                size={16}
                color={theme.colors.text}
              />
            </Pressable>
          ),
        }}
      />

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Current Status</Text>
        <Text
          style={[
            styles.statusValue,
            {
              color:
                job.status === 'completed'
                  ? theme.colors.success
                  : job.status === 'failed'
                    ? theme.colors.error
                    : theme.colors.primary,
            },
          ]}
        >
          {JOB_STATUS_LABELS[job.status]}
        </Text>
      </View>

      {visibleSections.map((section) => (
        <CollapsibleSection
          key={section.id}
          title={section.title}
          summaryItems={section.summaryItems}
          expanded={Boolean(expandedSections[section.id])}
          onToggle={() => toggleSection(section.id)}
        >
          {section.content}
        </CollapsibleSection>
      ))}

      {/* Actions */}
      {job.status === 'failed' && (
        <Pressable
          style={({ pressed }) => [
            styles.retryButton,
            pressed && { opacity: 0.85 },
          ]}
          onPress={handleRetry}
        >
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.retryText}>Retry Job</Text>
        </Pressable>
      )}

      {isReviewable && (
        <Pressable
          style={({ pressed }) => [
            styles.reviewButton,
            pressed && { opacity: 0.85 },
          ]}
          onPress={handleReview}
        >
          <Ionicons name="play-circle-outline" size={20} color="#fff" />
          <Text style={styles.retryText}>Review Audio</Text>
        </Pressable>
      )}

      {isAwaitingApproval && (
        <Pressable
          style={({ pressed }) => [
            styles.publishButton,
            pressed && { opacity: 0.85 },
          ]}
          onPress={handlePublish}
        >
          <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
          <Text style={styles.retryText}>Publish Now</Text>
        </Pressable>
      )}

      {isDeletable && (
        <Pressable
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && { opacity: 0.85 },
          ]}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.retryText}>Delete Job</Text>
        </Pressable>
      )}

      {job.status !== 'completed' && job.status !== 'failed' && (
        <Pressable
          style={({ pressed }) => [
            styles.cancelButton,
            pressed && { opacity: 0.85 },
          ]}
          onPress={handleCancel}
        >
          <Ionicons name="close-circle-outline" size={20} color={theme.colors.error} />
          <Text style={styles.cancelText}>Cancel Job</Text>
        </Pressable>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', paddingVertical: 8 }}>
      <Text
        style={{
          fontFamily: 'DMSans-Medium',
          fontSize: 14,
          color: theme.colors.textMuted,
          width: 120,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: 'DMSans-Regular',
          fontSize: 14,
          color: theme.colors.text,
          flex: 1,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: 20,
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
      fontSize: 13,
      color: theme.colors.textMuted,
      marginBottom: 8,
    },
    statusCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      marginBottom: 16,
      ...theme.shadows.sm,
    },
    statusLabel: {
      fontFamily: 'DMSans-Regular',
      fontSize: 13,
      color: theme.colors.textMuted,
      marginBottom: 4,
    },
    statusValue: {
      fontFamily: 'DMSans-Bold',
      fontSize: 22,
    },
    errorCard: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'flex-start',
    },
    errorText: {
      fontFamily: 'DMSans-Regular',
      fontSize: 14,
      color: theme.colors.error,
      flex: 1,
      lineHeight: 20,
    },
    thumbnailImage: {
      width: '100%',
      height: 180,
      borderRadius: 12,
      marginBottom: 12,
      backgroundColor: theme.colors.gray[200],
    },
    scriptText: {
      fontFamily: 'DMSans-Regular',
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 22,
    },
    controlButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.gray[200],
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      borderRadius: 16,
      paddingVertical: 16,
      gap: 10,
      marginTop: 12,
    },
    retryText: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 16,
      color: '#fff',
    },
    publishButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.success,
      borderRadius: 16,
      paddingVertical: 16,
      gap: 10,
      marginTop: 12,
    },
    reviewButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      borderRadius: 16,
      paddingVertical: 16,
      gap: 10,
      marginTop: 12,
    },
    deleteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.error,
      borderRadius: 16,
      paddingVertical: 16,
      gap: 10,
      marginTop: 12,
    },
    cancelButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.error,
      borderRadius: 16,
      paddingVertical: 16,
      gap: 10,
      marginTop: 12,
    },
    cancelText: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 16,
      color: theme.colors.error,
    },
  });
