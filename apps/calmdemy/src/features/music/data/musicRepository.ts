import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../firebase';

function normalizeAlbumTrack(track: FirestoreAlbumTrack): FirestoreAlbumTrack {
  return {
    ...track,
    // Product rule: non-course audio content is free.
    isFree: true,
  };
}

function normalizeAlbum(
  id: string,
  data: Record<string, unknown>
): FirestoreAlbum {
  const raw = {
    id,
    ...(data as Omit<FirestoreAlbum, 'id'>),
  } as FirestoreAlbum;

  return {
    ...raw,
    tracks: (raw.tracks || []).map(normalizeAlbumTrack),
  };
}

function normalizeSleepSound(
  id: string,
  data: Record<string, unknown>
): FirestoreSleepSound {
  return {
    id,
    ...(data as Omit<FirestoreSleepSound, 'id'>),
    isFree: true,
  };
}

function normalizeMusicItem(
  id: string,
  data: Record<string, unknown>
): FirestoreMusicItem {
  return {
    id,
    ...(data as Omit<FirestoreMusicItem, 'id'>),
    isFree: true,
  };
}

// ==================== ALBUMS ====================

export interface FirestoreAlbumTrack {
  id: string;
  trackNumber: number;
  title: string;
  duration_minutes: number;
  audioPath: string;
  isFree?: boolean;
}

export interface FirestoreAlbum {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  color: string;
  artist: string;
  trackCount: number;
  totalDuration: number;
  category: string;
  tracks: FirestoreAlbumTrack[];
}

export async function getAlbums(): Promise<FirestoreAlbum[]> {
  try {
    const snapshot = await getDocs(collection(db, 'albums'));
    return snapshot.docs.map(
      (docSnapshot) => normalizeAlbum(docSnapshot.id, docSnapshot.data())
    );
  } catch (error) {
    console.error('Error fetching albums:', error);
    return [];
  }
}

export async function getAlbumById(id: string): Promise<FirestoreAlbum | null> {
  try {
    const docRef = doc(db, 'albums', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return normalizeAlbum(docSnap.id, docSnap.data());
  } catch (error) {
    console.error('Error fetching album:', error);
    return null;
  }
}

// ==================== SLEEP SOUNDS ====================

export interface FirestoreSleepSound {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  audioPath: string;
  color: string;
  thumbnailUrl?: string;
  isFree?: boolean;
}

export async function getSleepSounds(): Promise<FirestoreSleepSound[]> {
  try {
    const snapshot = await getDocs(collection(db, 'sleep_sounds'));
    return snapshot.docs.map(
      (docSnapshot) => normalizeSleepSound(docSnapshot.id, docSnapshot.data())
    );
  } catch (error) {
    console.error('Error fetching sleep sounds:', error);
    return [];
  }
}

export async function getSleepSoundsByCategory(
  category: string
): Promise<FirestoreSleepSound[]> {
  try {
    if (category === 'all') return getSleepSounds();
    const q = query(collection(db, 'sleep_sounds'), where('category', '==', category));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (docSnapshot) => normalizeSleepSound(docSnapshot.id, docSnapshot.data())
    );
  } catch (error) {
    console.error('Error fetching sleep sounds by category:', error);
    return [];
  }
}

export async function getSleepSoundById(
  id: string
): Promise<FirestoreSleepSound | null> {
  try {
    const docRef = doc(db, 'sleep_sounds', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return normalizeSleepSound(docSnap.id, docSnap.data());
  } catch (error) {
    console.error('Error fetching sleep sound by id:', error);
    return null;
  }
}

// ==================== BACKGROUND SOUNDS ====================

export interface FirestoreBackgroundSound {
  id: string;
  title: string;
  icon: string;
  category: string;
  audioPath: string;
  color: string;
}

export async function getBackgroundSounds(): Promise<FirestoreBackgroundSound[]> {
  try {
    const snapshot = await getDocs(collection(db, 'background_sounds'));
    return snapshot.docs.map(
      (docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as FirestoreBackgroundSound)
    );
  } catch (error) {
    console.error('Error fetching background sounds:', error);
    return [];
  }
}

export async function getBackgroundSoundsByCategory(
  category: string
): Promise<FirestoreBackgroundSound[]> {
  try {
    const q = query(collection(db, 'background_sounds'), where('category', '==', category));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as FirestoreBackgroundSound)
    );
  } catch (error) {
    console.error('Error fetching background sounds by category:', error);
    return [];
  }
}

export async function getBackgroundSoundById(
  id: string
): Promise<FirestoreBackgroundSound | null> {
  try {
    const docRef = doc(db, 'background_sounds', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as FirestoreBackgroundSound;
  } catch (error) {
    console.error('Error fetching background sound by id:', error);
    return null;
  }
}

// ==================== WHITE NOISE / MUSIC / ASMR ====================

export interface FirestoreMusicItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  audioPath: string;
  color: string;
  duration_minutes?: number;
  thumbnailUrl?: string;
  isFree?: boolean;
}

export async function getWhiteNoise(): Promise<FirestoreMusicItem[]> {
  try {
    const snapshot = await getDocs(collection(db, 'white_noise'));
    return snapshot.docs.map(
      (docSnapshot) => normalizeMusicItem(docSnapshot.id, docSnapshot.data())
    );
  } catch (error) {
    console.error('Error fetching white noise:', error);
    return [];
  }
}

export async function getMusic(): Promise<FirestoreMusicItem[]> {
  try {
    const snapshot = await getDocs(collection(db, 'music'));
    return snapshot.docs.map(
      (docSnapshot) => normalizeMusicItem(docSnapshot.id, docSnapshot.data())
    );
  } catch (error) {
    console.error('Error fetching music:', error);
    return [];
  }
}

export async function getAsmr(): Promise<FirestoreMusicItem[]> {
  try {
    const snapshot = await getDocs(collection(db, 'asmr'));
    return snapshot.docs.map(
      (docSnapshot) => normalizeMusicItem(docSnapshot.id, docSnapshot.data())
    );
  } catch (error) {
    console.error('Error fetching asmr:', error);
    return [];
  }
}
