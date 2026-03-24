import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@core/providers/contexts/ThemeContext';
import { ContentJob, JOB_STATUS_LABELS, CONTENT_TYPE_LABELS } from '../types';
import { formatCourseCode } from '@shared/utils/courseCodeParser';
import { Theme } from '@/theme';

interface JobCardProps {
  job: ContentJob;
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
      return theme.colors.primary;
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

export function JobCard({ job, onPress }: JobCardProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const statusColor = getStatusColor(job.status, theme);
  const headline = useMemo(() => getJobHeadline(job), [job]);

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
    metaText: {
      fontFamily: 'DMSans-Regular',
      fontSize: 13,
      color: theme.colors.textMuted,
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
