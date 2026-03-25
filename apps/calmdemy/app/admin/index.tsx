import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@core/providers/contexts/ThemeContext';
import {
  useJobQueue,
  useDrafts,
  useWorkerControl,
  useWorkerStatus,
  useWorkerStacks,
  useFactoryMetrics,
  useActiveJobWorkers,
} from '@features/admin/hooks/useJobQueue';
import { JobStatus } from '@features/admin/types';
import { Theme } from '@/theme';
import {
  FactoryOverview,
  LocalUiState,
  getControlStateLabel,
  getLocalWorkerState,
} from '@features/admin/components/FactoryOverview';
import { FiltersRow } from '@features/admin/components/FiltersRow';
import { DraftsSection } from '@features/admin/components/DraftsSection';
import { JobList } from '@features/admin/components/JobList';
import { FactoryMetrics } from '@features/admin/types';
import { WorkerLogsPanel } from '@features/admin/components/WorkerLogsPanel';
import { publishCompletedJob } from '@features/admin/data/adminRepository';
import { ContentJob } from '@features/admin/types';

export default function AdminDashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [filter, setFilter] = useState<JobStatus | undefined>(undefined);
  const [optimisticState, setOptimisticState] = useState<LocalUiState | null>(null);
  const [restartInProgress, setRestartInProgress] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(true);
  const [logsOpen, setLogsOpen] = useState(false);
  const { jobs, isLoading } = useJobQueue(filter);
  const { workersByJobId } = useActiveJobWorkers(jobs.map((job) => job.id));
  const { drafts, deleteDraft } = useDrafts();
  const { status: localWorker } = useWorkerStatus('local');
  const { stacks } = useWorkerStacks();
  const { metrics } = useFactoryMetrics();
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
      j.status !== 'paused' &&
      j.status !== 'tts_pending'
  ).length;
  const pendingCount = jobs.filter(
    (j) => j.status === 'pending' || j.status === 'tts_pending'
  ).length;
  const pausedCount = jobs.filter((j) => j.status === 'paused').length;
  const completedCount = jobs.filter((j) => j.status === 'completed').length;

  const localState = getLocalWorkerState(localWorker, localControl, theme, optimisticState);
  const autoMode = localControl?.desiredState === 'auto';
  const idleTimeoutMin = localControl?.idleTimeoutMin ?? 10;
  const controlStateLabel = getControlStateLabel(localControl?.currentState, optimisticState);
  const lastAction = localControl?.lastAction ?? '—';
  const lastError = localControl?.lastError;
  const controlsDisabled = restartInProgress;
  const controlRef = React.useRef(localControl);

  React.useEffect(() => {
    controlRef.current = localControl;
  }, [localControl]);

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

  const waitForState = async (
    predicate: (ctrl: typeof localControl) => boolean,
    timeoutMs = 12000
  ) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (predicate(controlRef.current)) return true;
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
    return false;
  };

  const handleRestart = async () => {
    if (restartInProgress) return;
    const wasAuto = autoMode;
    setRestartInProgress(true);
    try {
      setOptimisticState('stop_clicked');
      await setLocalDesiredState('stopped');
      await waitForState((ctrl) => ctrl?.currentState === 'stopped');
      setOptimisticState('start_clicked');
      await setLocalDesiredState(wasAuto ? 'auto' : 'running');
      await waitForState((ctrl) => ctrl?.currentState === 'running');
    } catch {
      setOptimisticState(null);
    } finally {
      setRestartInProgress(false);
    }
  };

  const handleAutoModeChange = (next: boolean) => {
    if (!next) setOptimisticState('stop_clicked');
    setLocalDesiredState(next ? 'auto' : 'stopped').catch(() => {
      setOptimisticState(null);
    });
  };

  const handleStartNow = async () => {
    setOptimisticState('start_clicked');
    try {
      await setLocalDesiredState('running');
    } catch {
      setOptimisticState(null);
    }
  };

  const handleStopNow = async () => {
    setOptimisticState('stop_clicked');
    try {
      await setLocalDesiredState('stopped');
    } catch {
      setOptimisticState(null);
    }
  };

  const confirmAction = (message: string) => {
    if (Platform.OS !== 'web') {
      return Promise.resolve(true);
    }

    const webConfirm = (
      globalThis as typeof globalThis & { confirm?: (value?: string) => boolean }
    ).confirm;
    return Promise.resolve(typeof webConfirm === 'function' ? webConfirm(message) : true);
  };

  const startPublish = async (job: ContentJob) => {
    await publishCompletedJob(job.id);
  };

  const handlePublishJob = async (job: ContentJob) => {
    const message = 'This will make the content visible to users. Continue?';

    if (Platform.OS === 'web') {
      const confirmed = await confirmAction(message);
      if (!confirmed) {
        return;
      }
      await startPublish(job);
      return;
    }

    Alert.alert('Publish Content', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Publish',
        onPress: async () => {
          await startPublish(job);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <JobList
        jobs={jobs}
        activeWorkersByJobId={workersByJobId}
        isLoading={isLoading}
        hasDrafts={drafts.length > 0}
        onJobSelect={(jobId) => router.push(`/admin/job/${jobId}`)}
        onJobPublish={(job) => {
          void handlePublishJob(job);
        }}
        headerComponent={
          <>
            <FactoryOverview
              pendingCount={pendingCount}
              activeCount={activeCount}
              pausedCount={pausedCount}
              completedCount={completedCount}
              localState={localState}
              autoMode={autoMode}
              idleTimeoutMin={idleTimeoutMin}
              controlStateLabel={controlStateLabel}
              lastAction={lastAction}
              lastError={lastError}
              controlsDisabled={controlsDisabled}
              restartInProgress={restartInProgress}
              isOpen={overviewOpen}
              stacks={stacks}
              logsOpen={logsOpen}
              onToggle={() => setOverviewOpen((prev) => !prev)}
              onViewLogs={() => setLogsOpen((prev) => !prev)}
              onAutoModeChange={handleAutoModeChange}
              onStartNow={handleStartNow}
              onStopNow={handleStopNow}
              onRestart={handleRestart}
              onIdleTimeoutChange={setLocalIdleTimeout}
            />

            <WorkerLogsPanel
              stacks={stacks}
              isOpen={logsOpen}
              onToggle={() => setLogsOpen((prev) => !prev)}
            />

            <FiltersRow
              selectedFilter={filter}
              onFilterChange={setFilter}
            />

            <DraftsSection
              drafts={drafts}
              onDelete={deleteDraft}
              onSelect={(draftId) =>
                router.push({
                  pathname: '/admin/create',
                  params: { draftId },
                })
              }
            />
          </>
        }
        footerComponent={<MetricsCard metrics={metrics} />}
      />

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

function MetricsCard({ metrics }: { metrics: FactoryMetrics | null }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const completed = metrics?.completed_total ?? 0;
  const failed = metrics?.failed_total ?? 0;
  const lastError = metrics?.last_error;
  const averageExactElapsedSec =
    typeof metrics?.effective_elapsed_sec_count === 'number' &&
    metrics.effective_elapsed_sec_count > 0 &&
    typeof metrics.effective_elapsed_sec_sum === 'number'
      ? metrics.effective_elapsed_sec_sum / metrics.effective_elapsed_sec_count
      : null;
  const averageWorkerEffortSec =
    typeof metrics?.effective_worker_sec_count === 'number' &&
    metrics.effective_worker_sec_count > 0 &&
    typeof metrics.effective_worker_sec_sum === 'number'
      ? metrics.effective_worker_sec_sum / metrics.effective_worker_sec_count
      : null;

  return (
    <View style={styles.metricsCard}>
      <View style={styles.metricsHeader}>
        <Ionicons name="stats-chart-outline" size={18} color={theme.colors.text} />
        <Text style={styles.metricsTitle}>Factory Metrics (today)</Text>
      </View>
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={[styles.metricNumber, { color: theme.colors.success }]}>{completed}</Text>
          <Text style={styles.metricLabel}>Completed</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={[styles.metricNumber, { color: theme.colors.error }]}>{failed}</Text>
          <Text style={styles.metricLabel}>Failed</Text>
        </View>
      </View>
      {(averageExactElapsedSec !== null || averageWorkerEffortSec !== null) && (
        <View style={[styles.metricsRow, { marginTop: 10 }]}>
          <View style={styles.metricItem}>
            <Text style={styles.metricNumberSecondary}>
              {averageExactElapsedSec !== null
                ? formatMetricSeconds(averageExactElapsedSec)
                : '—'}
            </Text>
            <Text style={styles.metricLabel}>Avg Exact Time</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricNumberSecondary}>
              {averageWorkerEffortSec !== null
                ? formatMetricSeconds(averageWorkerEffortSec)
                : '—'}
            </Text>
            <Text style={styles.metricLabel}>Avg Worker Effort</Text>
          </View>
        </View>
      )}
      {lastError ? (
        <Text style={styles.metricError}>Last error: {lastError}</Text>
      ) : null}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
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
    metricsCard: {
      marginHorizontal: 16,
      marginTop: 10,
      marginBottom: 20,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.gray[200],
      padding: 12,
      backgroundColor: theme.colors.surface,
    },
    metricsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    metricsTitle: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 14,
      color: theme.colors.text,
    },
    metricsRow: {
      flexDirection: 'row',
      gap: 16,
    },
    metricItem: {
      flex: 1,
    },
    metricNumber: {
      fontFamily: 'DMSans-Bold',
      fontSize: 20,
    },
    metricNumberSecondary: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 16,
      color: theme.colors.text,
    },
    metricLabel: {
      fontFamily: 'DMSans-Regular',
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    metricError: {
      marginTop: 8,
      fontFamily: 'DMSans-Regular',
      fontSize: 12,
      color: theme.colors.error,
    },
  });

function formatMetricSeconds(seconds: number) {
  const roundedSeconds = Math.max(0, Math.round(seconds));
  if (roundedSeconds < 60) {
    return `${roundedSeconds}s`;
  }
  const minutes = Math.floor(roundedSeconds / 60);
  const remainingSeconds = roundedSeconds % 60;
  if (minutes < 60) {
    if (remainingSeconds === 0) {
      return `${minutes}m`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
}
