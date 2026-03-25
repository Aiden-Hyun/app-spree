import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@core/providers/contexts/ThemeContext';
import { ActiveJobWorker, ContentJob, JOB_STATUS_LABELS, CONTENT_TYPE_LABELS } from '../types';
import { formatCourseCode } from '@shared/utils/courseCodeParser';
import { Theme } from '@/theme';

interface JobCardProps {
  job: ContentJob;
  activeWorkers?: ActiveJobWorker[];
  onPress: () => void;
}

function getStatusColor(status: string, theme: Theme): string {
  switch (status) {
    case 'completed':
      return theme.colors.success;
    case 'failed':
      return theme.colors.error;
    case 'paused':
      return theme.colors.warning;
    case 'pending':
      return theme.colors.gray[400];
    default:
      return theme.colors.info;
  }
}

function getStatusIcon(status: string): keyof typeof Ionicons.glyphMap {
  switch (status) {
    case 'completed':
      return 'checkmark-circle';
    case 'failed':
      return 'close-circle';
    case 'paused':
      return 'pause-circle';
    case 'pending':
      return 'time-outline';
    default:
      return 'sync-outline';
  }
}

export function JobCard({ job, activeWorkers = [], onPress }: JobCardProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const statusColor = getStatusColor(job.status, theme);
  const headline = useMemo(() => getJobHeadline(job), [job]);
  const visibleWorkerIds = useMemo(
    () => getVisibleActiveWorkerIds(activeWorkers),
    [activeWorkers]
  );
  const timingLabel = useMemo(() => getTimingLabel(job), [job]);
  const ttsProgressLabel = useMemo(() => getTtsProgressLabel(job), [job]);

  const timeAgo = useMemo(() => {
    if (!job.createdAt?.toDate) return '';
    const diff = Date.now() - job.createdAt.toDate().getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }, [job.createdAt]);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
          <Ionicons name={getStatusIcon(job.status)} size={14} color={statusColor} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {JOB_STATUS_LABELS[job.status]}
          </Text>
        </View>
        <Text style={styles.timeText}>{timeAgo}</Text>
      </View>

      <Text style={styles.topic} numberOfLines={2}>
        {headline}
      </Text>

      <View style={styles.meta}>
        <Text style={styles.metaText}>
          {CONTENT_TYPE_LABELS[job.contentType]}
        </Text>
        {job.contentType !== 'full_subject' && (
          <>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>
              {job.params.duration_minutes} min
            </Text>
          </>
        )}
        {job.contentType === 'full_subject' && (
          <>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>
              {job.params.courseCount || 0} courses
            </Text>
          </>
        )}
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.metaText}>{job.llmModel}</Text>
      </View>

      {ttsProgressLabel ? (
        <View style={styles.ttsProgressBadge}>
          <Ionicons
            name="volume-high-outline"
            size={14}
            color={theme.colors.info}
          />
          <Text style={styles.ttsProgressBadgeText}>{ttsProgressLabel}</Text>
        </View>
      ) : null}

      {timingLabel ? (
        <View
          style={[
            styles.timingBadge,
            {
              backgroundColor: `${statusColor}12`,
              borderColor: `${statusColor}28`,
            },
          ]}
        >
          <Ionicons
            name="stopwatch-outline"
            size={14}
            color={statusColor}
          />
          <Text style={[styles.timingBadgeText, { color: statusColor }]}>{timingLabel}</Text>
        </View>
      ) : null}

      {visibleWorkerIds.length > 0 ? (
        <View style={styles.workerPanel}>
          <View style={styles.workerHeader}>
            <Ionicons
              name="hardware-chip-outline"
              size={14}
              color={theme.colors.primary}
            />
            <Text style={styles.workerLabel}>Workers</Text>
          </View>
          <View style={styles.workerList}>
            {visibleWorkerIds.map((workerId) => (
              <View key={workerId} style={styles.workerChip}>
                <Text style={styles.workerChipText}>{workerId}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {job.error && (
        <Text style={styles.errorText} numberOfLines={1}>
          {job.error}
        </Text>
      )}
    </Pressable>
  );
}

function getJobHeadline(job: ContentJob): string {
  if (job.contentType === 'full_subject') {
    const subjectLabel = String(job.params.subjectLabel || job.params.subjectId || '').trim();
    const totalCourses = Number(job.params.courseCount || 0);
    if (subjectLabel && totalCourses > 0) {
      return `${subjectLabel} Full Subject — ${totalCourses} courses`;
    }
    if (subjectLabel) {
      return `${subjectLabel} Full Subject`;
    }
  }

  if (job.contentType === 'course') {
    const courseCode = formatCourseCode(String(job.params.courseCode || '').trim());
    const courseTitle = String(job.params.courseTitle || '').trim();

    if (courseCode && courseTitle) {
      return `${courseCode} — ${courseTitle}`;
    }

    if (courseTitle) {
      return courseTitle;
    }

    if (courseCode) {
      return courseCode;
    }
  }

  return String(job.params.topic || '').trim();
}

function getVisibleActiveWorkerIds(activeWorkers: ActiveJobWorker[]): string[] {
  return Array.from(
    new Set(
      activeWorkers
        .map((worker) => String(worker.stackId || '').trim())
        .filter(Boolean)
    )
  );
}

function getTimingLabel(job: ContentJob): string | null {
  if (job.status !== 'completed' && job.status !== 'failed') {
    const liveElapsedMs =
      typeof job.activeRunElapsedMs === 'number' && Number.isFinite(job.activeRunElapsedMs)
        ? job.activeRunElapsedMs
        : 0;
    if (liveElapsedMs <= 0) {
      return null;
    }
    return `${formatElapsedMsRoundedToMinute(liveElapsedMs)} active`;
  }
  if (job.timingStatus !== 'exact') {
    return null;
  }
  const elapsedMs =
    typeof job.effectiveElapsedMs === 'number' && Number.isFinite(job.effectiveElapsedMs)
      ? job.effectiveElapsedMs
      : 0;
  if (elapsedMs <= 0) {
    return null;
  }
  return `${formatElapsedMsCompact(elapsedMs)} active`;
}

function getTtsProgressLabel(job: ContentJob): string | null {
  if (job.status !== 'tts_converting' || job.contentType !== 'course') {
    return null;
  }

  const totalChunks =
    typeof job.ttsProgress?.totalChunks === 'number' && Number.isFinite(job.ttsProgress.totalChunks)
      ? job.ttsProgress.totalChunks
      : 0;
  const completedChunks =
    typeof job.ttsProgress?.completedChunks === 'number' &&
    Number.isFinite(job.ttsProgress.completedChunks)
      ? Math.max(0, Math.min(totalChunks, job.ttsProgress.completedChunks))
      : 0;

  if (totalChunks > 0) {
    const percent =
      typeof job.ttsProgress?.percent === 'number' && Number.isFinite(job.ttsProgress.percent)
        ? Math.max(0, Math.min(100, Math.round(job.ttsProgress.percent)))
        : Math.round((completedChunks / totalChunks) * 100);
    return `TTS ${percent}% | ${completedChunks}/${totalChunks} chunks`;
  }

  const sessionCounts = getCourseAudioSessionCounts(job);
  if (!sessionCounts) {
    return null;
  }

  const sessionPercent = Math.round((sessionCounts.completed / sessionCounts.total) * 100);
  return `TTS ${sessionPercent}% | ${sessionCounts.completed}/${sessionCounts.total} audio`;
}

function getCourseAudioSessionCounts(job: ContentJob): { completed: number; total: number } | null {
  const progressMatch = String(job.courseProgress || '').match(/Audio\s+(\d+)\/(\d+)/i);
  if (progressMatch) {
    const completed = Number(progressMatch[1]);
    const total = Number(progressMatch[2]);
    if (Number.isFinite(completed) && Number.isFinite(total) && total > 0) {
      return {
        completed: Math.max(0, Math.min(total, Math.round(completed))),
        total: Math.max(1, Math.round(total)),
      };
    }
  }

  const audioResults = job.courseAudioResults || {};
  const completed = Object.values(audioResults).filter((result) => {
    if (!result || typeof result !== 'object') {
      return false;
    }
    return Boolean(String(result.storagePath || '').trim());
  }).length;

  if (completed <= 0) {
    return { completed: 0, total: 9 };
  }

  return {
    completed,
    total: 9,
  };
}

function formatElapsedMsRoundedToMinute(ms: number): string {
  const roundedMinutes = Math.max(1, Math.round(Math.max(0, ms) / 60000));
  if (roundedMinutes < 60) {
    return `${roundedMinutes}m`;
  }
  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
}

function formatElapsedMsCompact(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }
  const totalMinutes = Math.round(totalSeconds / 60);
  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      ...theme.shadows.sm,
    },
    pressed: {
      opacity: 0.85,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 12,
    },
    timeText: {
      fontFamily: 'DMSans-Regular',
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    topic: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 16,
      color: theme.colors.text,
      marginBottom: 8,
    },
    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    workerPanel: {
      marginTop: 10,
    },
    timingBadge: {
      marginTop: 10,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderWidth: 1,
    },
    timingBadgeText: {
      fontFamily: 'DMSans-Medium',
      fontSize: 12,
    },
    ttsProgressBadge: {
      marginTop: 10,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
      backgroundColor: `${theme.colors.info}12`,
      borderWidth: 1,
      borderColor: `${theme.colors.info}28`,
    },
    ttsProgressBadgeText: {
      fontFamily: 'DMSans-Medium',
      fontSize: 12,
      color: theme.colors.info,
    },
    workerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    metaText: {
      fontFamily: 'DMSans-Regular',
      fontSize: 13,
      color: theme.colors.textMuted,
    },
    workerLabel: {
      fontFamily: 'DMSans-Medium',
      fontSize: 12,
      color: theme.colors.text,
    },
    workerList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    workerChip: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
      backgroundColor: theme.colors.gray[100],
      borderWidth: 1,
      borderColor: theme.colors.gray[200],
    },
    workerChipText: {
      fontFamily: 'DMSans-Medium',
      fontSize: 12,
      color: theme.colors.text,
    },
    metaDot: {
      color: theme.colors.textMuted,
      fontSize: 13,
    },
    errorText: {
      fontFamily: 'DMSans-Regular',
      fontSize: 12,
      color: theme.colors.error,
      marginTop: 8,
    },
  });
