import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { BedtimeStory } from '../../../types';

function normalizeBedtimeStory(
  id: string,
  data: Record<string, unknown>
): BedtimeStory {
  return {
    id,
    ...(data as Omit<BedtimeStory, 'id'>),
    // Product rule: non-course audio content is free.
    isFree: true,
  };
}

function normalizeSleepMeditation(
  id: string,
  data: Record<string, unknown>
): FirestoreSleepMeditation {
  return {
    id,
    ...(data as Omit<FirestoreSleepMeditation, 'id'>),
    isFree: true,
  };
}

function normalizeSeriesChapter(
  chapter: FirestoreSeriesChapter
): FirestoreSeriesChapter {
  return {
    ...chapter,
    isFree: true,
  };
}

function normalizeSeries(
  id: string,
  data: Record<string, unknown>
): FirestoreSeries {
  const raw = {
    id,
    ...(data as Omit<FirestoreSeries, 'id'>),
  } as FirestoreSeries;

  return {
    ...raw,
    chapters: (raw.chapters || []).map(normalizeSeriesChapter),
  };
}

// ==================== BEDTIME STORIES ====================

export async function getBedtimeStories(): Promise<BedtimeStory[]> {
  try {
    const snapshot = await getDocs(collection(db, 'bedtime_stories'));
    return snapshot.docs.map(
      (docSnapshot) => normalizeBedtimeStory(docSnapshot.id, docSnapshot.data())
    );
  } catch (error) {
    console.error('Error fetching bedtime stories:', error);
    return [];
  }
}

export async function getBedtimeStoryById(
  id: string
): Promise<BedtimeStory | null> {
  try {
    const docRef = doc(db, 'bedtime_stories', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return normalizeBedtimeStory(docSnap.id, docSnap.data());
  } catch (error) {
    console.error('Error fetching bedtime story:', error);
    return null;
  }
}

export const getSleepStories = getBedtimeStories;
export const getSleepStoryById = getBedtimeStoryById;

// ==================== SLEEP MEDITATIONS ====================

export interface FirestoreSleepMeditation {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  instructor: string;
  icon: string;
  audioPath: string;
  thumbnailUrl?: string;
  color: string;
  isFree?: boolean;
}

export async function getSleepMeditations(): Promise<FirestoreSleepMeditation[]> {
  try {
    const snapshot = await getDocs(collection(db, 'sleep_meditations'));
    return snapshot.docs.map(
      (docSnapshot) =>
        normalizeSleepMeditation(docSnapshot.id, docSnapshot.data())
    );
  } catch (error) {
    console.error('Error fetching sleep meditations:', error);
    return [];
  }
}

export async function getSleepMeditationById(
  id: string
): Promise<FirestoreSleepMeditation | null> {
  try {
    const docRef = doc(db, 'sleep_meditations', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return normalizeSleepMeditation(docSnap.id, docSnap.data());
  } catch (error) {
    console.error('Error fetching sleep meditation:', error);
    return null;
  }
}

// ==================== SERIES ====================

export interface FirestoreSeriesChapter {
  id: string;
  chapterNumber: number;
  title: string;
  description: string;
  duration_minutes: number;
  audioPath: string;
  isFree?: boolean;
}

export interface FirestoreSeries {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  color: string;
  narrator: string;
  chapterCount: number;
  totalDuration: number;
  category: string;
  chapters: FirestoreSeriesChapter[];
}

export async function getSeries(): Promise<FirestoreSeries[]> {
  try {
    const snapshot = await getDocs(collection(db, 'series'));
    return snapshot.docs.map(
      (docSnapshot) => normalizeSeries(docSnapshot.id, docSnapshot.data())
    );
  } catch (error) {
    console.error('Error fetching series:', error);
    return [];
  }
}

export async function getSeriesById(
  id: string
): Promise<FirestoreSeries | null> {
  try {
    const docRef = doc(db, 'series', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return normalizeSeries(docSnap.id, docSnap.data());
  } catch (error) {
    console.error('Error fetching series:', error);
    return null;
  }
}
