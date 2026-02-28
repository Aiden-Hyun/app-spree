import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  limit,
  Unsubscribe,
} from 'firebase/firestore';
import { db, getCurrentUserId } from '../../../firebase';
import {
  ContentJob,
  CreateJobInput,
  JobStatus,
  WorkerControl,
  WorkerDesiredState,
  WorkerStatus,
  WorkerStackStatus,
  FactoryMetrics,
  WorkerLogTail,
  WorkerLogEntry,
} from '../types';

// Re-export subject/course utilities from meditate repository
export {
  getSubjects,
  createSubject,
  checkCourseCodeExists,
} from '../../meditate/data/meditateRepository';
export type { Subject } from '../../meditate/data/meditateRepository';

const jobsCollection = collection(db, 'content_jobs');
const usersCollection = collection(db, 'users');
const workerControlCollection = collection(db, 'worker_control');

// ==================== ADMIN CHECK ====================

export async function checkIsAdmin(uid: string): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(usersCollection, uid));
    if (!userDoc.exists()) return false;
    return userDoc.data()?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// ==================== CREATE JOB ====================

export async function createContentJob(input: CreateJobInput): Promise<string> {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  // Strip undefined values from params — Firestore rejects undefined in nested objects
  const cleanParams = Object.fromEntries(
    Object.entries(input.params).filter(([, v]) => v !== undefined)
  );

  const jobData: Record<string, any> = {
    status: 'pending' as JobStatus,
    llmBackend: input.llmBackend,
    ttsBackend: input.ttsBackend,
    contentType: input.contentType,
    params: cleanParams,
    llmModel: input.llmModel,
    ttsModel: input.ttsModel,
    ttsVoice: input.ttsVoice,
    autoPublish: input.autoPublish,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: userId,
  };

  // Only store title if admin provided one
  if (input.title?.trim()) {
    jobData.title = input.title.trim();
  }
  if (input.imagePrompt?.trim()) {
    jobData.imagePrompt = input.imagePrompt.trim();
  }

  // Course jobs get extra tracking fields
  if (input.contentType === 'course') {
    jobData.courseProgress = 'Pending';
  }

  const docRef = await addDoc(jobsCollection, jobData);
  return docRef.id;
}

// ==================== GET JOBS ====================

export async function getContentJobs(
  statusFilter?: JobStatus,
  maxLimit = 50
): Promise<ContentJob[]> {
  try {
    let q;
    if (statusFilter) {
      q = query(
        jobsCollection,
        where('status', '==', statusFilter),
        orderBy('createdAt', 'desc'),
        limit(maxLimit)
      );
    } else {
      q = query(
        jobsCollection,
        orderBy('createdAt', 'desc'),
        limit(maxLimit)
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data() as Record<string, any>;
      return { id: docSnapshot.id, ...data } as ContentJob;
    });
  } catch (error) {
    console.error('Error fetching content jobs:', error);
    return [];
  }
}

// ==================== GET SINGLE JOB ====================

export async function getContentJob(jobId: string): Promise<ContentJob | null> {
  try {
    const docSnapshot = await getDoc(doc(jobsCollection, jobId));
    if (!docSnapshot.exists()) return null;
    const data = docSnapshot.data() as Record<string, any>;
    return { id: docSnapshot.id, ...data } as ContentJob;
  } catch (error) {
    console.error('Error fetching content job:', error);
    return null;
  }
}

// ==================== REAL-TIME LISTENERS ====================

export function subscribeToJobs(
  callback: (jobs: ContentJob[]) => void,
  statusFilter?: JobStatus
): Unsubscribe {
  let q;
  if (statusFilter) {
    q = query(
      jobsCollection,
      where('status', '==', statusFilter),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  } else {
    q = query(jobsCollection, orderBy('createdAt', 'desc'), limit(50));
  }

  return onSnapshot(q, (snapshot) => {
    const jobs = snapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data() as Record<string, any>;
      return { id: docSnapshot.id, ...data } as ContentJob;
    });
    callback(jobs);
  });
}

export function subscribeToJob(
  jobId: string,
  callback: (job: ContentJob | null) => void
): Unsubscribe {
  return onSnapshot(doc(jobsCollection, jobId), (docSnapshot) => {
    if (!docSnapshot.exists()) {
      callback(null);
      return;
    }
    const data = docSnapshot.data() as Record<string, any>;
    callback({ id: docSnapshot.id, ...data } as ContentJob);
  });
}

// ==================== WORKER STATUS ====================

export function subscribeToWorkerStatus(
  workerId: 'local' | 'cloud',
  callback: (status: WorkerStatus | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, 'worker_status', workerId), (docSnapshot) => {
    if (!docSnapshot.exists()) {
      callback(null);
      return;
    }
    callback({ id: docSnapshot.id, ...docSnapshot.data() } as WorkerStatus);
  });
}

// ==================== WORKER STACKS STATUS ====================

export function subscribeToStacksStatus(
  callback: (stacks: WorkerStackStatus[]) => void
): Unsubscribe {
  const stacksDoc = doc(db, 'worker_stacks_status', 'local');
  return onSnapshot(stacksDoc, (docSnapshot) => {
    if (!docSnapshot.exists()) {
      callback([]);
      return;
    }
    const data = docSnapshot.data() as Record<string, any>;
    const stacks = (data.stacks || []) as any[];
    const mapped: WorkerStackStatus[] = stacks.map((s: Record<string, any>) => ({
      id: String(s.id || 'unknown'),
      role: s.role,
      venv: s.venv,
      enabled: s.enabled,
      pid: s.pid,
      logPath: s.logPath,
      lastUpdatedAt: s.lastUpdatedAt,
    }));
    callback(mapped);
  });
}

// ==================== WORKER LOG TAILS ====================

export function subscribeToWorkerLogTail(
  stackId: string,
  callback: (tail: WorkerLogTail | null) => void
): Unsubscribe {
  if (!stackId) {
    callback(null);
    return () => undefined;
  }

  const tailDoc = doc(db, 'worker_log_tails', stackId);
  return onSnapshot(tailDoc, (docSnapshot) => {
    if (!docSnapshot.exists()) {
      callback(null);
      return;
    }
    const data = docSnapshot.data() as Record<string, any>;
    const linesRaw = Array.isArray(data.lines) ? data.lines : [];
    const lines: WorkerLogEntry[] = linesRaw.map((line: Record<string, any>) => ({
      timestamp: line.timestamp,
      level: line.level,
      logger: line.logger,
      message: String(line.message || ''),
      raw: line.raw,
      job_id: line.job_id,
      stage: line.stage,
      content_type: line.content_type,
      model_id: line.model_id,
      error: line.error,
    }));
    callback({
      id: docSnapshot.id,
      stackId: String(data.stackId || docSnapshot.id),
      stackRole: data.stackRole,
      pid: data.pid ?? null,
      source: data.source,
      lineCount: data.lineCount,
      lines,
      updatedAt: data.updatedAt,
    } as WorkerLogTail);
  });
}

// ==================== WORKER CONTROL ====================

export function subscribeToWorkerControl(
  workerId: 'local' | 'cloud',
  callback: (control: WorkerControl | null) => void
): Unsubscribe {
  return onSnapshot(doc(workerControlCollection, workerId), (docSnapshot) => {
    if (!docSnapshot.exists()) {
      callback(null);
      return;
    }
    callback({ id: docSnapshot.id, ...docSnapshot.data() } as WorkerControl);
  });
}

export async function setWorkerDesiredState(
  workerId: 'local' | 'cloud',
  desiredState: WorkerDesiredState
): Promise<void> {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  await setDoc(
    doc(workerControlCollection, workerId),
    {
      desiredState,
      requestedBy: userId,
      requestedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function setWorkerIdleTimeout(
  workerId: 'local' | 'cloud',
  idleTimeoutMin: number
): Promise<void> {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  await setDoc(
    doc(workerControlCollection, workerId),
    {
      idleTimeoutMin,
      requestedBy: userId,
      requestedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// ==================== RETRY JOB ====================

export async function retryJob(jobId: string): Promise<void> {
  await updateDoc(doc(jobsCollection, jobId), {
    status: 'pending',
    error: null,
    updatedAt: serverTimestamp(),
    startedAt: null,
    completedAt: null,
    failedStage: null,
  });
}

// ==================== CANCEL JOB ====================

export async function cancelJob(jobId: string): Promise<void> {
  await updateDoc(doc(jobsCollection, jobId), {
    status: 'failed',
    error: 'Cancelled by admin',
    updatedAt: serverTimestamp(),
  });
}

// ==================== DELETE JOB ====================

export async function requestDeleteJob(jobId: string): Promise<void> {
  await updateDoc(doc(jobsCollection, jobId), {
    deleteRequested: true,
    deleteRequestedAt: serverTimestamp(),
    deleteInProgress: false,
    deleteError: null,
    updatedAt: serverTimestamp(),
  });
}

// ==================== PUBLISH COMPLETED JOB ====================

export async function publishCompletedJob(jobId: string): Promise<void> {
  // Set the job status to 'pending_publish' so the worker picks it up
  // and runs only the publishing step.
  await updateDoc(doc(jobsCollection, jobId), {
    status: 'publishing',
    autoPublish: true,
    updatedAt: serverTimestamp(),
  });
}

// ==================== FACTORY METRICS ====================

export function subscribeToFactoryMetrics(
  callback: (metrics: FactoryMetrics | null) => void
): Unsubscribe {
  const dateKey = new Date().toISOString().slice(0, 10);
  const metricsDoc = doc(db, 'factory_metrics', dateKey);
  return onSnapshot(metricsDoc, (docSnapshot) => {
    if (!docSnapshot.exists()) {
      callback(null);
      return;
    }
    const data = docSnapshot.data() as Record<string, any>;
    callback({ id: docSnapshot.id, ...data } as FactoryMetrics);
  });
}
