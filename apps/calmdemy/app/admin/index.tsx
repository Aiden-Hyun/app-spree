import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@core/providers/contexts/ThemeContext';
import {
  useJobQueue,
  useDrafts,
  useWorkerControl,
  useWorkerStatus,
} from '@features/admin/hooks/useJobQueue';
import { JobStatus } from '@features/admin/types';
import { Theme } from '@/theme';
import {
  FactoryOverview,
  LocalUiState,
  getControlStateLabel,
  getLocalWorkerState,
  getWorkerState,
} from '@features/admin/components/FactoryOverview';
import { FiltersRow } from '@features/admin/components/FiltersRow';
import { DraftsSection } from '@features/admin/components/DraftsSection';
import { JobList } from '@features/admin/components/JobList';

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
  const completedCount = jobs.filter((j) => j.status === 'completed').length;

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

  return (
    <View style={styles.container}>
      <FactoryOverview
        pendingCount={pendingCount}
        activeCount={activeCount}
        completedCount={completedCount}
        localState={localState}
        cloudState={cloudState}
        autoMode={autoMode}
        idleTimeoutMin={idleTimeoutMin}
        controlStateLabel={controlStateLabel}
        lastAction={lastAction}
        lastError={lastError}
        controlsDisabled={controlsDisabled}
        restartInProgress={restartInProgress}
        isOpen={overviewOpen}
        onToggle={() => setOverviewOpen((prev) => !prev)}
        onAutoModeChange={handleAutoModeChange}
        onStartNow={handleStartNow}
        onStopNow={handleStopNow}
        onRestart={handleRestart}
        onIdleTimeoutChange={setLocalIdleTimeout}
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

      <JobList
        jobs={jobs}
        isLoading={isLoading}
        hasDrafts={drafts.length > 0}
        onJobSelect={(jobId) => router.push(`/admin/job/${jobId}`)}
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
  });
