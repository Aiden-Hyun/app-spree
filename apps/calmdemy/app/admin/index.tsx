import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@core/providers/contexts/ThemeContext';
import {
  useJobQueue,
  useDrafts,
  useWorkerControl,
  useWorkerStatus,
} from '@features/admin/hooks/useJobQueue';
import { JobCard } from '@features/admin/components/JobCard';
import {
  ContentDraft,
  CONTENT_TYPE_LABELS,
  JobStatus,
  WorkerRuntimeState,
  WorkerStatus,
} from '@features/admin/types';
import { Theme } from '@/theme';

const FILTER_OPTIONS: { label: string; value: JobStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Pending', value: 'pending' },
  { label: 'TTS Pending', value: 'tts_pending' },
  { label: 'Active', value: 'llm_generating' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [filter, setFilter] = useState<JobStatus | undefined>(undefined);
  const [optimisticState, setOptimisticState] = useState<LocalUiState | null>(null);
  const [restartInProgress, setRestartInProgress] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(true);
  const { jobs, isLoading } = useJobQueue(filter);
  const { drafts, deleteDraft } = useDrafts();
  const { status: localWorker } = useWorkerStatus('local');
  const { status: cloudWorker } = useWorkerStatus('cloud');
  const {
    control: localControl,
    setDesiredState: setLocalDesiredState,
    setIdleTimeout: setLocalIdleTimeout,
  } = useWorkerControl('local');

  const activeCount = jobs.filter(
    (j) =>
      j.status !== 'completed' &&
      j.status !== 'failed' &&
      j.status !== 'pending' &&
      j.status !== 'tts_pending'
  ).length;
  const pendingCount = jobs.filter(
    (j) => j.status === 'pending' || j.status === 'tts_pending'
  ).length;

  const localState = getLocalWorkerState(localWorker, localControl, theme, optimisticState);
  const cloudState = getWorkerState(cloudWorker, theme);
  const autoMode = localControl?.desiredState === 'auto';
  const idleTimeoutMin = localControl?.idleTimeoutMin ?? 10;
  const controlStateLabel = getControlStateLabel(localControl?.currentState, optimisticState);
  const lastAction = localControl?.lastAction ?? '—';
  const lastError = localControl?.lastError;
  const controlsDisabled = restartInProgress;

  React.useEffect(() => {
    if (!optimisticState || !localControl?.currentState) return;
    if (optimisticState === 'start_clicked') {
      if (localControl.currentState === 'starting' || localControl.currentState === 'running') {
        setOptimisticState(null);
      }
      return;
    }
    if (optimisticState === 'stop_clicked') {
      if (localControl.currentState === 'stopping' || localControl.currentState === 'stopped') {
        setOptimisticState(null);
      }
      return;
    }
    if (localControl.currentState !== optimisticState) {
      setOptimisticState(null);
    }
  }, [optimisticState, localControl?.currentState]);

  const handleRestart = async () => {
    if (restartInProgress) return;
    const wasAuto = autoMode;
    setRestartInProgress(true);
    try {
      setOptimisticState('stop_clicked');
      await setLocalDesiredState('stopped');
      await new Promise((resolve) => setTimeout(resolve, 9000));
      setOptimisticState('start_clicked');
      await setLocalDesiredState(wasAuto ? 'auto' : 'running');
    } catch {
      setOptimisticState(null);
    } finally {
      setRestartInProgress(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Overview (Foldable) */}
      <View style={styles.overviewCard}>
        <Pressable
          style={({ pressed }) => [
            styles.overviewHeader,
            pressed && { opacity: 0.85 },
          ]}
          onPress={() => setOverviewOpen((prev) => !prev)}
        >
          <View style={styles.overviewTitleRow}>
            <Ionicons name="grid-outline" size={18} color={theme.colors.text} />
            <Text style={styles.overviewTitle}>Factory Overview</Text>
          </View>
          <Ionicons
            name={overviewOpen ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={theme.colors.textMuted}
          />
        </Pressable>

        {overviewOpen ? (
          <>
            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: `${theme.colors.primary}15` }]}>
                <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
                  {pendingCount}
                </Text>
                <Text style={styles.statLabel}>Queued</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: `${theme.colors.warning}15` }]}>
                <Text style={[styles.statNumber, { color: theme.colors.warning }]}>
                  {activeCount}
                </Text>
                <Text style={styles.statLabel}>Processing</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: `${theme.colors.success}15` }]}>
                <Text style={[styles.statNumber, { color: theme.colors.success }]}>
                  {jobs.filter((j) => j.status === 'completed').length}
                </Text>
                <Text style={styles.statLabel}>Done</Text>
              </View>
            </View>

            {/* Worker Status */}
            <View style={styles.workerRow}>
              <View style={[styles.workerCard, { borderColor: localState.color }]}>
                <View style={styles.workerHeader}>
                  <Ionicons name="laptop-outline" size={18} color={localState.color} />
                  <Text style={styles.workerTitle}>Local Worker</Text>
                </View>
                <Text style={[styles.workerStatus, { color: localState.color }]}>
                  {localState.label}
                </Text>
                <Text style={styles.workerMeta}>{localState.meta}</Text>
              </View>
              <View style={[styles.workerCard, { borderColor: cloudState.color }]}>
                <View style={styles.workerHeader}>
                  <Ionicons name="cloud-outline" size={18} color={cloudState.color} />
                  <Text style={styles.workerTitle}>Cloud Worker</Text>
                </View>
                <Text style={[styles.workerStatus, { color: cloudState.color }]}>
                  {cloudState.label}
                </Text>
                <Text style={styles.workerMeta}>{cloudState.meta}</Text>
              </View>
            </View>

            {/* Local Worker Controls */}
            <View style={styles.controlCard}>
              <View style={styles.controlHeader}>
                <Ionicons name="settings-outline" size={18} color={theme.colors.text} />
                <Text style={styles.controlTitle}>Local Worker Controls</Text>
              </View>

              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleLabel}>Auto mode</Text>
                  <Text style={styles.toggleDescription}>
                    Start when queued jobs exist, stop after idle
                  </Text>
                </View>
                <Switch
                  value={autoMode}
                  onValueChange={(next) => {
                    if (!next) setOptimisticState('stop_clicked');
                    setLocalDesiredState(next ? 'auto' : 'stopped').catch(() => {
                      setOptimisticState(null);
                    });
                  }}
                  trackColor={{ false: theme.colors.gray[300], true: `${theme.colors.primary}80` }}
                  thumbColor={autoMode ? theme.colors.primary : theme.colors.gray[400]}
                />
              </View>

              <View style={styles.controlActionsRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.controlButton,
                    { backgroundColor: theme.colors.success },
                    pressed && { opacity: 0.85 },
                    controlsDisabled && { opacity: 0.6 },
                  ]}
                  disabled={controlsDisabled}
                  onPress={async () => {
                    setOptimisticState('start_clicked');
                    try {
                      await setLocalDesiredState('running');
                    } catch {
                      setOptimisticState(null);
                    }
                  }}
                >
                  <Text style={styles.controlButtonText}>Start Now</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.controlButton,
                    { backgroundColor: theme.colors.error },
                    pressed && { opacity: 0.85 },
                    controlsDisabled && { opacity: 0.6 },
                  ]}
                  disabled={controlsDisabled}
                  onPress={async () => {
                    setOptimisticState('stop_clicked');
                    try {
                      await setLocalDesiredState('stopped');
                    } catch {
                      setOptimisticState(null);
                    }
                  }}
                >
                  <Text style={styles.controlButtonText}>Stop Now</Text>
                </Pressable>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.controlButton,
                  styles.controlButtonFull,
                  styles.controlButtonRow,
                  { backgroundColor: theme.colors.info },
                  pressed && { opacity: 0.85 },
                  controlsDisabled && { opacity: 0.6 },
                ]}
                disabled={controlsDisabled}
                onPress={handleRestart}
              >
                <Ionicons name="refresh" size={16} color="#fff" />
                <Text style={styles.controlButtonText}>
                  {restartInProgress ? 'Restarting...' : 'Restart Worker'}
                </Text>
              </Pressable>

              <View style={styles.idleRow}>
                <Text style={styles.idleLabel}>Idle Timeout</Text>
                <View style={styles.idleChips}>
                  {[5, 10, 30].map((min) => (
                    <Pressable
                      key={min}
                      style={[
                        styles.idleChip,
                        idleTimeoutMin === min && styles.idleChipActive,
                      ]}
                      onPress={() => setLocalIdleTimeout(min)}
                    >
                      <Text
                        style={[
                          styles.idleChipText,
                          idleTimeoutMin === min && styles.idleChipTextActive,
                        ]}
                      >
                        {min}m
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.controlMeta}>
                <Text style={styles.metaText}>State: {controlStateLabel}</Text>
                <Text style={styles.metaText}>Last action: {lastAction}</Text>
                {lastError ? (
                  <Text style={[styles.metaText, styles.metaError]}>
                    Error: {lastError}
                  </Text>
                ) : null}
              </View>
            </View>
          </>
        ) : (
          <View style={styles.overviewCollapsedMeta}>
            <Text style={styles.overviewCollapsedText}>
              {pendingCount} queued · {activeCount} processing · {jobs.filter((j) => j.status === 'completed').length} done
            </Text>
          </View>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filtersRow}>
        {FILTER_OPTIONS.map((opt) => (
          <Pressable
            key={opt.label}
            style={[
              styles.filterChip,
              filter === opt.value && styles.filterChipActive,
            ]}
            onPress={() => setFilter(opt.value)}
          >
            <Text
              style={[
                styles.filterText,
                filter === opt.value && styles.filterTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {drafts.length > 0 && (
        <View style={styles.draftsSection}>
          <View style={styles.draftsHeader}>
            <Text style={styles.draftsTitle}>Drafts</Text>
            <Text style={styles.draftsCount}>{drafts.length}</Text>
          </View>
          <View style={styles.draftsList}>
            {drafts.map((draft) => (
              <Pressable
                key={draft.id}
                style={({ pressed }) => [
                  styles.draftCard,
                  pressed && { opacity: 0.85 },
                ]}
                onPress={() =>
                  router.push({
                    pathname: '/admin/create',
                    params: { draftId: draft.id },
                  })
                }
              >
                <View style={styles.draftRow}>
                  <View style={styles.draftBadge}>
                    <Text style={styles.draftBadgeText}>Draft</Text>
                  </View>
                  <Pressable
                    onPress={(event) => {
                      event.stopPropagation();
                      deleteDraft(draft.id);
                    }}
                    style={({ pressed }) => [
                      styles.draftDelete,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
                  </Pressable>
                </View>
                <Text style={styles.draftLabel} numberOfLines={2}>
                  {getDraftLabel(draft)}
                </Text>
                <Text style={styles.draftMeta}>
                  Updated {formatDraftTime(draft.updatedAt)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Job List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : jobs.length === 0 && drafts.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="flask-outline" size={48} color={theme.colors.textMuted} />
          <Text style={styles.emptyText}>No jobs yet</Text>
          <Text style={styles.emptySubtext}>
            Tap + to create your first content
          </Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <JobCard
              job={item}
              onPress={() => router.push(`/admin/job/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: theme.colors.primary },
          pressed && { opacity: 0.85 },
        ]}
        onPress={() => router.push('/admin/create')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

function getWorkerState(status: WorkerStatus | null, theme: Theme) {
  if (!status || !status.lastHeartbeat) {
    return {
      label: 'Offline',
      color: theme.colors.error,
      meta: 'No heartbeat',
    };
  }

  const last = status.lastHeartbeat.toDate
    ? status.lastHeartbeat.toDate().getTime()
    : new Date(status.lastHeartbeat as any).getTime();

  const ageSec = Math.max(0, (Date.now() - last) / 1000);
  const interval = status.pollIntervalSec ?? 15;

  if (ageSec <= interval * 2) {
    return {
      label: 'Online',
      color: theme.colors.success,
      meta: `Updated ${formatAge(ageSec)}`,
    };
  }
  if (ageSec <= interval * 6) {
    return {
      label: 'Stale',
      color: theme.colors.warning,
      meta: `Updated ${formatAge(ageSec)}`,
    };
  }
  return {
    label: 'Offline',
    color: theme.colors.error,
    meta: `Last seen ${formatAge(ageSec)}`,
  };
}

function formatAge(ageSec: number): string {
  if (ageSec < 10) return 'just now';
  if (ageSec < 60) return `${Math.floor(ageSec)}s ago`;
  const minutes = Math.floor(ageSec / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

type LocalUiState = WorkerRuntimeState | 'start_clicked' | 'stop_clicked';

function getControlStateLabel(
  state?: WorkerRuntimeState,
  optimisticState?: LocalUiState | null
): string {
  const effective = optimisticState ?? state;
  if (!effective) return 'Unknown';
  if (effective === 'start_clicked') return 'Start now clicked';
  if (effective === 'stop_clicked') return 'Stop now clicked';
  if (effective === 'running') return 'Running';
  if (effective === 'starting') return 'Starting';
  if (effective === 'stopping') return 'Stopping';
  return 'Stopped';
}

function getLocalWorkerState(
  status: WorkerStatus | null,
  control: { currentState?: WorkerRuntimeState } | null,
  theme: Theme,
  optimisticState?: LocalUiState | null
) {
  const heartbeat = getWorkerState(status, theme);
  const effectiveState = optimisticState ?? control?.currentState;

  if (!effectiveState) {
    return heartbeat;
  }

  if (effectiveState === 'start_clicked') {
    return {
      label: 'Start now clicked',
      color: theme.colors.warning,
      meta: 'Waiting for companion...',
    };
  }

  if (effectiveState === 'stop_clicked') {
    return {
      label: 'Stop now clicked',
      color: theme.colors.warning,
      meta: 'Waiting for companion...',
    };
  }

  if (effectiveState === 'stopped') {
    return {
      label: 'Stopped',
      color: theme.colors.textMuted,
      meta: 'Stopped by control',
    };
  }
  if (effectiveState === 'starting') {
    return {
      label: 'Starting',
      color: theme.colors.warning,
      meta: 'Starting worker...',
    };
  }
  if (effectiveState === 'stopping') {
    return {
      label: 'Stopping',
      color: theme.colors.warning,
      meta: 'Stopping worker...',
    };
  }
  if (effectiveState === 'running') {
    if (heartbeat.label === 'Online') {
      return { label: 'Running', color: theme.colors.success, meta: heartbeat.meta };
    }
    if (heartbeat.label === 'Stale') {
      return { label: 'Running (stale)', color: theme.colors.warning, meta: heartbeat.meta };
    }
    return { label: 'Running (no heartbeat)', color: theme.colors.error, meta: heartbeat.meta };
  }

  return heartbeat;
}

function getDraftLabel(draft: ContentDraft): string {
  const base =
    draft.contentType === 'course'
      ? (draft.courseTitle || draft.topic)
      : (draft.title || draft.topic);
  const typeLabel = CONTENT_TYPE_LABELS[draft.contentType] || 'Content';
  if (base) {
    return `${typeLabel}: ${base}`;
  }
  return `${typeLabel} Draft`;
}

function formatDraftTime(updatedAt: number): string {
  if (!updatedAt) return 'unknown';
  return new Date(updatedAt).toLocaleString();
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    statsRow: {
      flexDirection: 'row',
      paddingTop: 8,
      paddingBottom: 8,
      gap: 10,
    },
    workerRow: {
      flexDirection: 'row',
      paddingBottom: 8,
      gap: 10,
    },
    workerCard: {
      flex: 1,
      borderRadius: 14,
      padding: 12,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
    },
    workerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 6,
    },
    workerTitle: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    workerStatus: {
      fontFamily: 'DMSans-Bold',
      fontSize: 16,
    },
    workerMeta: {
      fontFamily: 'DMSans-Regular',
      fontSize: 11,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    controlCard: {
      borderRadius: 14,
      padding: 12,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.gray[200],
      minHeight: 280,
    },
    controlHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 10,
    },
    controlTitle: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 13,
      color: theme.colors.text,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    toggleInfo: {
      flex: 1,
      marginRight: 16,
    },
    toggleLabel: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 14,
      color: theme.colors.text,
    },
    toggleDescription: {
      fontFamily: 'DMSans-Regular',
      fontSize: 11,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    controlActionsRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 12,
    },
    controlButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center',
    },
    controlButtonRow: {
      flexDirection: 'row',
      gap: 6,
      justifyContent: 'center',
    },
    controlButtonFull: {
      marginTop: 10,
    },
    controlButtonText: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 13,
      color: '#fff',
    },
    idleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 12,
    },
    idleLabel: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    idleChips: {
      flexDirection: 'row',
      gap: 6,
    },
    idleChip: {
      borderRadius: 10,
      paddingVertical: 6,
      paddingHorizontal: 10,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.gray[200],
    },
    idleChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    idleChipText: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 11,
      color: theme.colors.textMuted,
    },
    idleChipTextActive: {
      color: '#fff',
    },
    controlMeta: {
      marginTop: 12,
      gap: 4,
    },
    metaText: {
      fontFamily: 'DMSans-Regular',
      fontSize: 11,
      color: theme.colors.textMuted,
    },
    metaError: {
      color: theme.colors.error,
    },
    overviewCard: {
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 8,
      borderRadius: 16,
      padding: 12,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.gray[200],
    },
    overviewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    overviewTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    overviewTitle: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 15,
      color: theme.colors.text,
    },
    overviewCollapsedMeta: {
      marginTop: 8,
    },
    overviewCollapsedText: {
      fontFamily: 'DMSans-Regular',
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    statCard: {
      flex: 1,
      borderRadius: 14,
      padding: 14,
      alignItems: 'center',
    },
    statNumber: {
      fontFamily: 'DMSans-Bold',
      fontSize: 24,
    },
    statLabel: {
      fontFamily: 'DMSans-Regular',
      fontSize: 12,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    filtersRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
    draftsSection: {
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    draftsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    draftsTitle: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 16,
      color: theme.colors.text,
    },
    draftsCount: {
      fontFamily: 'DMSans-Regular',
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    draftsList: {
      gap: 10,
    },
    draftCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      padding: 14,
    },
    draftRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    draftBadge: {
      backgroundColor: `${theme.colors.warning}25`,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
    },
    draftBadgeText: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 11,
      color: theme.colors.warning,
    },
    draftDelete: {
      padding: 4,
    },
    draftLabel: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 20,
    },
    draftMeta: {
      fontFamily: 'DMSans-Regular',
      fontSize: 12,
      color: theme.colors.textMuted,
      marginTop: 6,
    },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
    },
    filterChipActive: {
      backgroundColor: theme.colors.primary,
    },
    filterText: {
      fontFamily: 'DMSans-Medium',
      fontSize: 13,
      color: theme.colors.textMuted,
    },
    filterTextActive: {
      color: '#fff',
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
      fontSize: 14,
      color: theme.colors.textMuted,
    },
    list: {
      padding: 16,
      paddingBottom: 100,
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 32,
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
  });
