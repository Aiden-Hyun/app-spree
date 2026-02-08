import { useCallback, useEffect, useState } from 'react';
import {
  subscribeToJobs,
  subscribeToJob,
  createContentJob,
  retryJob,
  cancelJob,
} from '../data/adminRepository';
import { ContentJob, CreateJobInput, JobStatus } from '../types';

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

  return { job, isLoading, retry, cancel };
}
