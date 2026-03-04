import React, { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@core/providers/contexts/ThemeContext';
import { Theme } from '@/theme';
import { CourseProgressModel } from './courseProgressModel';
import { getProgressVisual, getStatusLabel, truncateText } from './progressVisuals';

type Props = {
  model: CourseProgressModel;
};

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
      {model.selectedRunId ? (
        <View style={styles.runBadge}>
          <Ionicons name="git-branch-outline" size={12} color={theme.colors.textMuted} />
          <Text style={styles.runLabel} numberOfLines={1}>
            Run {model.selectedRunId}
          </Text>
        </View>
      ) : null}

      {model.workerLanes.map((lane) => (
        <View key={lane.workerId} style={styles.workerSection}>
          <View style={styles.workerHeader}>
            <Text style={styles.workerTitle}>{lane.workerId}</Text>
            <Text style={styles.workerMeta}>{lane.items.length} step runs</Text>
          </View>

          <View style={styles.workerRows}>
            {lane.items.map((item) => {
              const visual = getProgressVisual(item.state);
              const errorText = [item.errorCode, item.errorMessage].filter(Boolean).join(': ');
              return (
                <View
                  key={item.id}
                  style={[
                    styles.row,
                    {
                      backgroundColor: visual.rowTint,
                      borderLeftColor: visual.rail,
                    },
                  ]}
                >
                  <View style={[styles.iconCircle, { backgroundColor: visual.iconTint }]}>
                    <Ionicons name={visual.icon} size={14} color={visual.color} />
                  </View>

                  <View style={styles.rowMain}>
                    <Text style={styles.rowTitle} numberOfLines={2}>
                      {item.stepLabel}
                    </Text>
                    {item.shardLabel ? (
                      <Text style={styles.subtitleText} numberOfLines={1}>
                        {item.shardLabel}
                      </Text>
                    ) : null}
                    {item.shardKey ? (
                      <Text style={styles.metaText} numberOfLines={1}>
                        Session {item.shardKey}
                      </Text>
                    ) : null}
                    {typeof item.attempt === 'number' ? (
                      <Text style={styles.metaText} numberOfLines={1}>
                        Attempt {item.attempt}
                      </Text>
                    ) : null}
                    {Boolean(errorText) ? (
                      <Text style={styles.errorText} numberOfLines={2}>
                        {truncateText(errorText, 130)}
                      </Text>
                    ) : null}
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: visual.pillBackground,
                        borderColor: visual.pillBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.statusPillText, { color: visual.pillText }]}>
                      {getStatusLabel(item.state)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
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
    runBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.gray[200],
      backgroundColor: theme.colors.gray[100],
    },
    runLabel: {
      maxWidth: 220,
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
    workerSection: {
      borderWidth: 1,
      borderColor: theme.colors.gray[200],
      borderRadius: 14,
      backgroundColor: theme.colors.surface,
      padding: 12,
      gap: 10,
    },
    workerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    workerTitle: {
      fontFamily: 'DMSans-Bold',
      fontSize: 14,
      color: theme.colors.text,
    },
    workerMeta: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 11,
      color: theme.colors.textMuted,
    },
    workerRows: {
      gap: 10,
    },
    row: {
      borderWidth: 1,
      borderColor: theme.colors.gray[200],
      borderLeftWidth: 4,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      minWidth: 0,
    },
    iconCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    rowMain: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    rowTitle: {
      fontFamily: 'DMSans-Bold',
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.text,
    },
    subtitleText: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 12,
      lineHeight: 16,
      color: theme.colors.textMuted,
    },
    metaText: {
      fontFamily: 'DMSans-Regular',
      fontSize: 12,
      lineHeight: 16,
      color: theme.colors.textMuted,
    },
    errorText: {
      marginTop: 2,
      fontFamily: 'DMSans-Regular',
      fontSize: 12,
      lineHeight: 16,
      color: theme.colors.error,
    },
    statusPill: {
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
      alignSelf: 'center',
      marginLeft: 6,
    },
    statusPillText: {
      fontFamily: 'DMSans-Bold',
      fontSize: 11,
      lineHeight: 14,
    },
  });
