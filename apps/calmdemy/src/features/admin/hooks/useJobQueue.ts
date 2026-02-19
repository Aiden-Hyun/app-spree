import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  subscribeToJobs,
  subscribeToJob,
  subscribeToWorkerControl,
  subscribeToWorkerStatus,
  createContentJob,
  retryJob,
  cancelJob,
  requestDeleteJob,
  setWorkerDesiredState,
  setWorkerIdleTimeout,
} from '../data/adminRepository';
import {
  ContentJob,
  ContentDraft,
  CreateJobInput,
  JobStatus,
  WorkerControl,
  WorkerDesiredState,
  WorkerStatus,
} from '../types';
import { getDrafts, deleteDraft as removeDraft } from '../data/draftRepository';

// ==================== JOB LIST HOOK ====================

export function useJobQueue(statusFilter?: JobStatus) {
  const [jobs, setJobs] = useState<ContentJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToJobs((updatedJobs) => {
      setJobs(updatedJobs);
      setIsLoading(false);
    }, statusFilter);

    return unsubscribe;
  }, [statusFilter]);

  const createJob = useCallback(async (input: CreateJobInput) => {
    return createContentJob(input);
  }, []);

  return { jobs, isLoading, createJob };
}

// ==================== SINGLE JOB HOOK ====================

export function useJobDetail(jobId: string) {
  const [job, setJob] = useState<ContentJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;

    setIsLoading(true);
    const unsubscribe = subscribeToJob(jobId, (updatedJob) => {
      setJob(updatedJob);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [jobId]);

  const retry = useCallback(async () => {
    if (!jobId) return;
    await retryJob(jobId);
  }, [jobId]);

  const cancel = useCallback(async () => {
    if (!jobId) return;
    await cancelJob(jobId);
  }, [jobId]);

  const requestDelete = useCallback(async () => {
    if (!jobId) return;
    await requestDeleteJob(jobId);
  }, [jobId]);

  return { job, isLoading, retry, cancel, requestDelete };
}

// ==================== WORKER STATUS HOOK ====================

export function useWorkerStatus(workerId: 'local' | 'cloud') {
  const [status, setStatus] = useState<WorkerStatus | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToWorkerStatus(workerId, (next) => {
      setStatus(next);
    });
    return unsubscribe;
  }, [workerId]);

  return { status };
}

// ==================== WORKER CONTROL HOOK ====================

export function useWorkerControl(workerId: 'local' | 'cloud') {
  const [control, setControl] = useState<WorkerControl | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToWorkerControl(workerId, (next) => {
      setControl(next);
    });
    return unsubscribe;
  }, [workerId]);

  const setDesiredState = useCallback(
    async (state: WorkerDesiredState) => {
      await setWorkerDesiredState(workerId, state);
    },
    [workerId]
  );

  const setIdleTimeout = useCallback(
    async (minutes: number) => {
      await setWorkerIdleTimeout(workerId, minutes);
    },
    [workerId]
  );

  return { control, setDesiredState, setIdleTimeout };
}

// ==================== DRAFTS HOOK ====================

export function useDrafts() {
  const [drafts, setDrafts] = useState<ContentDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const next = await getDrafts();
    setDrafts(next);
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const deleteDraft = useCallback(async (id: string) => {
    await removeDraft(id);
    await refresh();
  }, [refresh]);

  return { drafts, isLoading, refresh, deleteDraft };
}
