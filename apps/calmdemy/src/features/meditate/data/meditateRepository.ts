import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import {
  GuidedMeditation,
  MeditationProgram,
  BreathingExercise,
} from '../../../types';

const meditationsCollection = collection(db, 'guided_meditations');
const programsCollection = collection(db, 'meditation_programs');
const breathingCollection = collection(db, 'breathing_exercises');

const emergencyMeditationsCollection = collection(db, 'emergency_meditations');
const coursesCollection = collection(db, 'courses');
const courseSessionsCollection = collection(db, 'course_sessions');
const subjectsCollection = collection(db, 'subjects');

function normalizeMeditation(
  id: string,
  data: Record<string, unknown>
): GuidedMeditation {
  return {
    id,
    ...(data as Omit<GuidedMeditation, 'id'>),
    // Product rule: non-course audio content is free.
    isFree: true,
  };
}

function normalizeEmergencyMeditation(
  id: string,
  data: Record<string, unknown>
): FirestoreEmergencyMeditation {
  return {
    id,
    ...(data as Omit<FirestoreEmergencyMeditation, 'id'>),
    isFree: true,
  };
}

function normalizeCourseSession(
  id: string,
  data: Record<string, unknown>
): FirestoreCourseSession {
  return {
    id,
    ...(data as Omit<FirestoreCourseSession, 'id'>),
    // Product rule: courses are premium-only.
    isFree: false,
  };
}

// ==================== MEDITATIONS ====================

export async function getMeditations(): Promise<GuidedMeditation[]> {
  try {
    const snapshot = await getDocs(meditationsCollection);
    return snapshot.docs.map(
      (docSnapshot) => normalizeMeditation(docSnapshot.id, docSnapshot.data())
    );
  } catch (error) {
    console.error('Error fetching meditations:', error);
    return [];
  }
}

export async function getMeditationsByTheme(theme: string): Promise<GuidedMeditation[]> {
  try {
    const q = query(meditationsCollection, where('themes', 'array-contains', theme));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (docSnapshot) => normalizeMeditation(docSnapshot.id, docSnapshot.data())
    );
  } catch (error) {
    console.error('Error fetching meditations by theme:', error);
    return [];
  }
}

export async function getMeditationsByTechnique(
  technique: string
): Promise<GuidedMeditation[]> {
  try {
    const q = query(
      meditationsCollection,
      where('techniques', 'array-contains', technique)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (docSnapshot) => normalizeMeditation(docSnapshot.id, docSnapshot.data())
    );
  } catch (error) {
    console.error('Error fetching meditations by technique:', error);
    return [];
  }
}

export async function getMeditationById(
  id: string
): Promise<GuidedMeditation | null> {
  try {
    const docRef = doc(meditationsCollection, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return normalizeMeditation(docSnap.id, docSnap.data());
  } catch (error) {
    console.error('Error fetching meditation by id:', error);
    return null;
  }
}

// ==================== PROGRAMS ====================

export async function getPrograms(): Promise<MeditationProgram[]> {
  try {
    const q = query(
      programsCollection,
      where('is_active', '==', true),
      orderBy('created_at', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(
      (docSnapshot) =>
        ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        } as MeditationProgram)
    );
  } catch (error) {
    console.error('Error fetching programs:', error);
    return [];
  }
}

// ==================== BREATHING EXERCISES ====================

export async function getBreathingExercises(): Promise<BreathingExercise[]> {
  try {
    const snapshot = await getDocs(breathingCollection);
    return snapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        name: data.name,
        description: data.description,
        pattern: {
          inhale_duration: data.inhale_duration,
          hold_duration: data.hold_duration,
          exhale_duration: data.exhale_duration,
          pause_duration: data.pause_duration,
          cycles: data.cycles,
        },
        duration_minutes: Math.ceil(
          ((data.inhale_duration +
            (data.hold_duration || 0) +
            data.exhale_duration +
            (data.pause_duration || 0)) *
            data.cycles) /
            60
        ),
        difficulty_level: data.difficulty_level,
        benefits: data.benefits || [],
      } as BreathingExercise;
    });
  } catch (error) {
    console.error('Error fetching breathing exercises:', error);
    return [];
  }
}

// ==================== EMERGENCY MEDITATIONS ====================

export interface FirestoreEmergencyMeditation {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  icon: string;
  color: string;
  audioPath: string;
  narrator?: string;
  thumbnailUrl?: string;
  isFree?: boolean;
}

export async function getEmergencyMeditations(): Promise<FirestoreEmergencyMeditation[]> {
  try {
    const snapshot = await getDocs(emergencyMeditationsCollection);
    return snapshot.docs.map(
      (docSnapshot) =>
        normalizeEmergencyMeditation(docSnapshot.id, docSnapshot.data())
    );
  } catch (error) {
    console.error('Error fetching emergency meditations:', error);
    return [];
  }
}

export async function getEmergencyMeditationById(
  id: string
): Promise<FirestoreEmergencyMeditation | null> {
  try {
    const docRef = doc(db, 'emergency_meditations', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return normalizeEmergencyMeditation(docSnap.id, docSnap.data());
  } catch (error) {
    console.error('Error fetching emergency meditation:', error);
    return null;
  }
}

// ==================== COURSES ====================

export interface FirestoreCourseSession {
  id: string;
  courseId: string;
  code?: string;
  dayNumber?: number;
  title: string;
  description: string;
  duration_minutes: number;
  audioPath: string;
  order: number;
  isFree?: boolean;
}

export interface FirestoreCourse {
  id: string;
  code?: string;
  title: string;
  subtitle?: string;
  description: string;
  thumbnailUrl?: string;
  color: string;
  icon?: string;
  duration_minutes?: number;
  totalDuration?: number;
  difficulty?: string;
  session_count?: number;
  sessionCount: number;
  instructor: string;
  sessions: FirestoreCourseSession[];
}

async function getCourseSessionsByCourseId(
  courseId: string
): Promise<FirestoreCourseSession[]> {
  try {
    const q = query(courseSessionsCollection, where('courseId', '==', courseId));
    const snapshot = await getDocs(q);
    const sessions = snapshot.docs.map(
      (docSnapshot) => normalizeCourseSession(docSnapshot.id, docSnapshot.data())
    );
    return sessions.sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (error) {
    console.error('Error fetching course sessions:', error);
    return [];
  }
}

export async function getCourseSessionById(
  id: string
): Promise<FirestoreCourseSession | null> {
  try {
    const docRef = doc(courseSessionsCollection, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return normalizeCourseSession(docSnap.id, docSnap.data());
  } catch (error) {
    console.error('Error fetching course session by id:', error);
    return null;
  }
}

export async function getCourses(): Promise<FirestoreCourse[]> {
  try {
    const snapshot = await getDocs(coursesCollection);
    const courses = snapshot.docs.map(
      (docSnapshot) =>
        ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
          sessions: [],
          sessionCount: 0,
        } as FirestoreCourse)
    );

    for (const course of courses) {
      course.sessions = await getCourseSessionsByCourseId(course.id);
      course.sessionCount = course.sessions.length;
    }

    return courses;
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
}

export async function getCourseById(id: string): Promise<FirestoreCourse | null> {
  try {
    const docRef = doc(coursesCollection, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;

    const course = {
      id: docSnap.id,
      ...docSnap.data(),
      sessions: [],
      sessionCount: 0,
    } as FirestoreCourse;

    course.sessions = await getCourseSessionsByCourseId(id);
    course.sessionCount = course.sessions.length;

    return course;
  } catch (error) {
    console.error('Error fetching course:', error);
    return null;
  }
}

// ==================== SUBJECTS ====================

export interface Subject {
  id: string;
  label: string;
  fullName: string;
  icon: string;
  color: string;
  description?: string;
}

export async function getSubjects(): Promise<Subject[]> {
  try {
    const snapshot = await getDocs(subjectsCollection);
    return snapshot.docs.map(
      (docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as Subject)
    );
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return [];
  }
}

export async function createSubject(subject: Omit<Subject, 'id'> & { id: string }): Promise<string> {
  const docRef = doc(subjectsCollection, subject.id);
  await setDoc(docRef, {
    label: subject.label,
    fullName: subject.fullName,
    icon: subject.icon,
    color: subject.color,
    description: subject.description || '',
  });
  return subject.id;
}

export async function checkCourseCodeExists(code: string): Promise<boolean> {
  try {
    const q = query(coursesCollection, where('code', '==', code));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking course code:', error);
    return false;
  }
}
