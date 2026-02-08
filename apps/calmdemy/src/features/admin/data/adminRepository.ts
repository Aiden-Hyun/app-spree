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
  updateDoc,
  where,
  limit,
  Unsubscribe,
} from 'firebase/firestore';
import { db, getCurrentUserId } from '../../../firebase';
import { ContentJob, CreateJobInput, JobStatus } from '../types';

const jobsCollection = collection(db, 'content_jobs');
const usersCollection = collection(db, 'users');

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

  const jobData = {
    status: 'pending' as JobStatus,
    llmBackend: input.llmBackend,
    ttsBackend: input.ttsBackend,
    contentType: input.contentType,
    params: input.params,
    llmModel: input.llmModel,
    ttsModel: input.ttsModel,
    ttsVoice: input.ttsVoice,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: userId,
  };

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
    return snapshot.docs.map(
      (docSnapshot) =>
        ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        } as ContentJob)
    );
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
    return { id: docSnapshot.id, ...docSnapshot.data() } as ContentJob;
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
    const jobs = snapshot.docs.map(
      (docSnapshot) =>
        ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        } as ContentJob)
    );
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
    callback({ id: docSnapshot.id, ...docSnapshot.data() } as ContentJob);
  });
}

// ==================== RETRY JOB ====================

export async function retryJob(jobId: string): Promise<void> {
  await updateDoc(doc(jobsCollection, jobId), {
    status: 'pending',
    error: null,
    updatedAt: serverTimestamp(),
    startedAt: null,
    completedAt: null,
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
