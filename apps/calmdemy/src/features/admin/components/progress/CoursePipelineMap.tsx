import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@core/providers/contexts/ThemeContext';
import { Theme } from '@/theme';
import {
  COURSE_SHARD_KEYS,
  CourseProgressModel,
  ProgressState,
  progressStateLabel,
} from './courseProgressModel';

type Props = {
  model: CourseProgressModel;
};

function stateColor(state: ProgressState, theme: Theme): string {
  if (state === 'failed') return theme.colors.error;
  if (state === 'cancelled') return theme.colors.textMuted;
  if (state === 'succeeded') return theme.colors.success;
  if (state === 'running') return theme.colors.primary;
  if (state === 'retrying') return theme.colors.warning;
  return theme.colors.textMuted;
}

function truncate(text: string, max = 120): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + '...';
}

function StageCard({
  label,
  state,
  attempt,
  workerLabel,
  errorCode,
  errorMessage,
}: {
  label: string;
  state: ProgressState;
  attempt?: number;
  workerLabel?: string;
  errorCode?: string;
  errorMessage?: string;
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const color = stateColor(state, theme);
  const errorText = [errorCode, errorMessage].filter(Boolean).join(': ');

  return (
    <View style={styles.stageCard}>
      <View style={styles.stageHeaderRow}>
        <Text style={styles.stageTitle}>{label}</Text>
        <View style={[styles.statePill, { borderColor: color }]}>
          <Text style={[styles.statePillText, { color }]}>{progressStateLabel(state)}</Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        {typeof attempt === 'number' && (
          <Text style={styles.metaText}>Attempt {attempt}</Text>
        )}
        {workerLabel && (
          <Text style={styles.metaText}>Worker {workerLabel}</Text>
        )}
      </View>
      {Boolean(errorText) && (
        <Text style={styles.errorText}>{truncate(errorText)}</Text>
      )}
    </View>
  );
}

export function CoursePipelineMap({ model }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { stages, audioSummary } = model;

  return (
    <View style={styles.container}>
      {model.selectedRunId && (
        <Text style={styles.runLabel}>Run {model.selectedRunId}</Text>
      )}

      <StageCard
        label={stages.generate_course_plan.label}
        state={stages.generate_course_plan.state}
        attempt={stages.generate_course_plan.attempt}
        workerLabel={stages.generate_course_plan.workerLabel}
        errorCode={stages.generate_course_plan.errorCode}
        errorMessage={stages.generate_course_plan.errorMessage}
      />

      <Text style={styles.connectorLabel}>Parallel branch</Text>
      <View style={styles.parallelRow}>
        <View style={styles.parallelColumn}>
          <StageCard
            label={stages.generate_course_thumbnail.label}
            state={stages.generate_course_thumbnail.state}
            attempt={stages.generate_course_thumbnail.attempt}
            workerLabel={stages.generate_course_thumbnail.workerLabel}
            errorCode={stages.generate_course_thumbnail.errorCode}
            errorMessage={stages.generate_course_thumbnail.errorMessage}
          />
        </View>
        <View style={styles.parallelColumn}>
          <StageCard
            label={stages.generate_course_scripts.label}
            state={stages.generate_course_scripts.state}
            attempt={stages.generate_course_scripts.attempt}
            workerLabel={stages.generate_course_scripts.workerLabel}
            errorCode={stages.generate_course_scripts.errorCode}
            errorMessage={stages.generate_course_scripts.errorMessage}
          />
        </View>
      </View>

      <Text style={styles.connectorLabel}>Join</Text>
      <StageCard
        label={stages.format_course_scripts.label}
        state={stages.format_course_scripts.state}
        attempt={stages.format_course_scripts.attempt}
        workerLabel={stages.format_course_scripts.workerLabel}
        errorCode={stages.format_course_scripts.errorCode}
        errorMessage={stages.format_course_scripts.errorMessage}
      />

      <Text style={styles.connectorLabel}>9-way fan-out</Text>
      <View style={styles.synthBlock}>
        <StageCard
          label={stages.synthesize_course_audio.label}
          state={stages.synthesize_course_audio.state}
          attempt={stages.synthesize_course_audio.attempt}
          workerLabel={stages.synthesize_course_audio.workerLabel}
          errorCode={stages.synthesize_course_audio.errorCode}
          errorMessage={stages.synthesize_course_audio.errorMessage}
        />

        <View style={styles.summaryRow}>
          <SummaryChip label={`Running ${audioSummary.running}/9`} />
          <SummaryChip label={`Succeeded ${audioSummary.succeeded}/9`} />
          <SummaryChip label={`Failed ${audioSummary.failed}/9`} />
        </View>

        {model.hasLegacyRootSynth ? (
          <Text style={styles.legacyNotice}>
            Legacy root synth run detected. Session-level shard breakdown is unavailable for this run.
          </Text>
        ) : (
          <View style={styles.shardGrid}>
            {COURSE_SHARD_KEYS.map((shardKey) => {
              const shard = model.audioShards[shardKey];
              const shardColor = stateColor(shard.state, theme);
              const shardError = [shard.errorCode, shard.errorMessage].filter(Boolean).join(': ');
              return (
                <View key={shardKey} style={styles.shardCard}>
                  <View style={styles.shardHeaderRow}>
                    <Text style={styles.shardTitle}>{shard.label}</Text>
                    <Text style={[styles.shardState, { color: shardColor }]}>
                      {progressStateLabel(shard.state)}
                    </Text>
                  </View>
                  <Text style={styles.shardMeta}>Session {shard.shardKey}</Text>
                  {typeof shard.attempt === 'number' && (
                    <Text style={styles.shardMeta}>Attempt {shard.attempt}</Text>
                  )}
                  {shard.workerId && (
                    <Text style={styles.shardMeta}>Worker {shard.workerId}</Text>
                  )}
                  {Boolean(shardError) && (
                    <Text style={styles.shardError}>{truncate(shardError, 90)}</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>

      <Text style={styles.connectorLabel}>Fan-in</Text>
      <StageCard
        label={stages.upload_course_audio.label}
        state={stages.upload_course_audio.state}
        attempt={stages.upload_course_audio.attempt}
        workerLabel={stages.upload_course_audio.workerLabel}
        errorCode={stages.upload_course_audio.errorCode}
        errorMessage={stages.upload_course_audio.errorMessage}
      />
      {model.uploadBlockedReason && (
        <Text style={styles.blockedText}>{model.uploadBlockedReason}</Text>
      )}

      <StageCard
        label={stages.publish_course.label}
        state={stages.publish_course.state}
        attempt={stages.publish_course.attempt}
        workerLabel={stages.publish_course.workerLabel}
        errorCode={stages.publish_course.errorCode}
        errorMessage={stages.publish_course.errorMessage}
      />
    </View>
  );
}

function SummaryChip({ label }: { label: string }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.summaryChip}>
      <Text style={styles.summaryChipText}>{label}</Text>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      gap: 12,
    },
    runLabel: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    connectorLabel: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 12,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    parallelRow: {
      flexDirection: 'row',
      gap: 8,
    },
    parallelColumn: {
      flex: 1,
      minWidth: 0,
    },
    stageCard: {
      borderWidth: 1,
      borderColor: theme.colors.gray[200],
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      padding: 10,
      gap: 6,
    },
    stageHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    },
    stageTitle: {
      flex: 1,
      fontFamily: 'DMSans-SemiBold',
      fontSize: 13,
      color: theme.colors.text,
    },
    statePill: {
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    statePillText: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 11,
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    metaText: {
      fontFamily: 'DMSans-Regular',
      fontSize: 11,
      color: theme.colors.textMuted,
    },
    errorText: {
      fontFamily: 'DMSans-Regular',
      fontSize: 11,
      color: theme.colors.error,
      lineHeight: 16,
    },
    synthBlock: {
      gap: 10,
    },
    summaryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    summaryChip: {
      backgroundColor: theme.colors.gray[100],
      borderWidth: 1,
      borderColor: theme.colors.gray[200],
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    summaryChipText: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 11,
      color: theme.colors.text,
    },
    shardGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    shardCard: {
      width: '31%',
      minWidth: 95,
      borderWidth: 1,
      borderColor: theme.colors.gray[200],
      borderRadius: 10,
      backgroundColor: theme.colors.surface,
      padding: 8,
      gap: 3,
    },
    shardHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 4,
    },
    shardTitle: {
      flex: 1,
      fontFamily: 'DMSans-SemiBold',
      fontSize: 11,
      color: theme.colors.text,
    },
    shardState: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 10,
    },
    shardMeta: {
      fontFamily: 'DMSans-Regular',
      fontSize: 10,
      color: theme.colors.textMuted,
    },
    shardError: {
      fontFamily: 'DMSans-Regular',
      fontSize: 10,
      color: theme.colors.error,
      lineHeight: 14,
    },
    blockedText: {
      fontFamily: 'DMSans-Regular',
      fontSize: 12,
      color: theme.colors.warning,
      marginTop: -4,
    },
    legacyNotice: {
      fontFamily: 'DMSans-Regular',
      fontSize: 12,
      color: theme.colors.textMuted,
      lineHeight: 18,
    },
  });
