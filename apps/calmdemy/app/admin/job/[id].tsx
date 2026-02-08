import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@core/providers/contexts/ThemeContext';
import { useJobDetail } from '@features/admin/hooks/useJobQueue';
import { PipelineStepper } from '@features/admin/components/PipelineStepper';
import { CONTENT_TYPE_LABELS, JOB_STATUS_LABELS, BACKEND_LABELS } from '@features/admin/types';
import { Theme } from '@/theme';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { job, isLoading, retry, cancel } = useJobDetail(id);

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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Status Header */}
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Current Status</Text>
        <Text style={[styles.statusValue, {
          color: job.status === 'completed'
            ? theme.colors.success
            : job.status === 'failed'
              ? theme.colors.error
              : theme.colors.primary,
        }]}>
          {JOB_STATUS_LABELS[job.status]}
        </Text>
      </View>

      {/* Pipeline Progress */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pipeline Progress</Text>
        <View style={styles.card}>
          <PipelineStepper currentStatus={job.status} />
        </View>
      </View>

      {/* Job Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Job Details</Text>
        <View style={styles.card}>
          <InfoRow label="LLM Backend" value={BACKEND_LABELS[job.llmBackend] || job.llmBackend || 'Local'} />
          <InfoRow label="TTS Backend" value={BACKEND_LABELS[job.ttsBackend] || job.ttsBackend || 'Local'} />
          <InfoRow label="Content Type" value={CONTENT_TYPE_LABELS[job.contentType]} />
          <InfoRow label="Topic" value={job.params.topic} />
          <InfoRow label="Duration" value={`${job.params.duration_minutes} minutes`} />
          {job.params.difficulty && (
            <InfoRow label="Difficulty" value={job.params.difficulty} />
          )}
          {job.params.style && <InfoRow label="Style" value={job.params.style} />}
          {job.params.technique && (
            <InfoRow label="Technique" value={job.params.technique} />
          )}
          <InfoRow label="LLM Model" value={job.llmModel} />
          <InfoRow label="TTS Model" value={job.ttsModel} />
          <InfoRow label="Voice" value={job.ttsVoice} />
          <InfoRow label="Created" value={createdDate} />
        </View>
      </View>

      {/* Custom Instructions */}
      {job.params.customInstructions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Custom Instructions</Text>
          <View style={styles.card}>
            <Text style={styles.scriptText}>{job.params.customInstructions}</Text>
          </View>
        </View>
      )}

      {/* Generated Script */}
      {job.generatedScript && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Generated Script</Text>
          <View style={styles.card}>
            <Text style={styles.scriptText} numberOfLines={20}>
              {job.generatedScript}
            </Text>
          </View>
        </View>
      )}

      {/* Error */}
      {job.error && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Error</Text>
          <View style={[styles.card, styles.errorCard]}>
            <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
            <Text style={styles.errorText}>{job.error}</Text>
          </View>
        </View>
      )}

      {/* Output */}
      {job.audioPath && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Output</Text>
          <View style={styles.card}>
            <InfoRow label="Audio Path" value={job.audioPath} />
            {job.audioDurationSec && (
              <InfoRow
                label="Audio Duration"
                value={`${Math.floor(job.audioDurationSec / 60)}:${String(
                  Math.floor(job.audioDurationSec % 60)
                ).padStart(2, '0')}`}
              />
            )}
            {job.publishedContentId && (
              <InfoRow label="Content ID" value={job.publishedContentId} />
            )}
          </View>
        </View>
      )}

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
    statusCard: {
      alignItems: 'center',
      paddingVertical: 20,
      marginBottom: 8,
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
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 15,
      color: theme.colors.textLight,
      marginBottom: 10,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      ...theme.shadows.sm,
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
    scriptText: {
      fontFamily: 'DMSans-Regular',
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 22,
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
