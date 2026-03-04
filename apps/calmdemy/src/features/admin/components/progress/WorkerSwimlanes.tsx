import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@core/providers/contexts/ThemeContext';
import { Theme } from '@/theme';
import {
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

export function WorkerSwimlanes({ model }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (model.workerLanes.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No worker timeline data available for this run.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {model.selectedRunId && (
        <Text style={styles.runLabel}>Run {model.selectedRunId}</Text>
      )}
      {model.workerLanes.map((lane) => (
        <View key={lane.workerId} style={styles.laneCard}>
          <View style={styles.laneHeader}>
            <Text style={styles.laneTitle}>{lane.workerId}</Text>
            <Text style={styles.laneMeta}>{lane.items.length} step runs</Text>
          </View>

          {lane.items.map((item) => {
            const color = stateColor(item.state, theme);
            const errorText = [item.errorCode, item.errorMessage].filter(Boolean).join(': ');
            return (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{item.stepLabel}</Text>
                  <Text style={[styles.itemState, { color }]}>
                    {progressStateLabel(item.state)}
                  </Text>
                </View>

                <View style={styles.itemMetaRow}>
                  {item.shardKey && (
                    <Text style={styles.itemMetaText}>Session {item.shardKey}</Text>
                  )}
                  {item.shardLabel && (
                    <Text style={styles.itemMetaText}>{item.shardLabel}</Text>
                  )}
                  {typeof item.attempt === 'number' && (
                    <Text style={styles.itemMetaText}>Attempt {item.attempt}</Text>
                  )}
                </View>

                {Boolean(errorText) && (
                  <Text style={styles.itemError}>{truncate(errorText, 110)}</Text>
                )}
              </View>
            );
          })}
        </View>
      ))}
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
    emptyState: {
      borderWidth: 1,
      borderColor: theme.colors.gray[200],
      borderRadius: 12,
      backgroundColor: theme.colors.gray[50],
      padding: 12,
    },
    emptyText: {
      fontFamily: 'DMSans-Regular',
      fontSize: 13,
      color: theme.colors.textMuted,
    },
    laneCard: {
      borderWidth: 1,
      borderColor: theme.colors.gray[200],
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      padding: 10,
      gap: 8,
    },
    laneHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    laneTitle: {
      fontFamily: 'DMSans-Bold',
      fontSize: 13,
      color: theme.colors.text,
    },
    laneMeta: {
      fontFamily: 'DMSans-Regular',
      fontSize: 11,
      color: theme.colors.textMuted,
    },
    itemCard: {
      borderWidth: 1,
      borderColor: theme.colors.gray[200],
      borderRadius: 10,
      backgroundColor: theme.colors.gray[50],
      padding: 8,
      gap: 4,
    },
    itemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    itemTitle: {
      flex: 1,
      fontFamily: 'DMSans-SemiBold',
      fontSize: 12,
      color: theme.colors.text,
    },
    itemState: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 11,
    },
    itemMetaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    itemMetaText: {
      fontFamily: 'DMSans-Regular',
      fontSize: 10,
      color: theme.colors.textMuted,
    },
    itemError: {
      fontFamily: 'DMSans-Regular',
      fontSize: 10,
      lineHeight: 14,
      color: theme.colors.error,
    },
  });
