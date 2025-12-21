import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  setDoc,
  deleteDoc,
  query, 
  where, 
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  GuidedMeditation, 
  MeditationSession, 
  MeditationProgram,
  BreathingExercise,
  SleepStory,
  DailyQuote,
  UserFavorite,
  MeditationCategory 
} from '../types';

// Collection references
const meditationsCollection = collection(db, 'guided_meditations');
const sessionsCollection = collection(db, 'meditation_sessions');
const programsCollection = collection(db, 'meditation_programs');
const breathingCollection = collection(db, 'breathing_exercises');
const sleepStoriesCollection = collection(db, 'sleep_stories');
const quotesCollection = collection(db, 'daily_quotes');
const favoritesCollection = collection(db, 'user_favorites');
const usersCollection = collection(db, 'users');

// ==================== MEDITATIONS ====================

export async function getMeditations(category?: MeditationCategory): Promise<GuidedMeditation[]> {
  try {
    let q = category 
      ? query(meditationsCollection, where('category', '==', category), orderBy('created_at', 'desc'))
      : query(meditationsCollection, orderBy('created_at', 'desc'));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as GuidedMeditation));
  } catch (error) {
    console.error('Error fetching meditations:', error);
    return [];
  }
}

export async function getMeditationById(id: string): Promise<GuidedMeditation | null> {
  try {
    const docRef = doc(db, 'guided_meditations', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as GuidedMeditation;
  } catch (error) {
    console.error('Error fetching meditation:', error);
    return null;
  }
}

// ==================== SESSIONS ====================

export async function createSession(
  session: Omit<MeditationSession, 'id' | 'completed_at'>
): Promise<string> {
  const docRef = await addDoc(sessionsCollection, {
    ...session,
    completed_at: serverTimestamp()
  });
  
  // Update user stats
  await updateUserStats(session.user_id);
  
  return docRef.id;
}

export async function getUserSessions(
  userId: string, 
  maxLimit = 30
): Promise<MeditationSession[]> {
  try {
    const q = query(
      sessionsCollection, 
      where('user_id', '==', userId), 
      orderBy('completed_at', 'desc'),
      limit(maxLimit)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        completed_at: data.completed_at instanceof Timestamp 
          ? data.completed_at.toDate().toISOString() 
          : new Date().toISOString()
      } as MeditationSession;
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
}

// ==================== USER STATS ====================

async function updateUserStats(userId: string) {
  try {
    const sessions = await getUserSessions(userId, 1000);
    
    const totalMinutes = sessions.reduce(
      (sum, session) => sum + session.duration_minutes, 
      0
    );
    
    const streak = calculateStreak(sessions);
    
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      total_meditation_minutes: totalMinutes,
      meditation_streak: streak,
      updated_at: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
}

function calculateStreak(sessions: MeditationSession[]): number {
  if (sessions.length === 0) return 0;
  
  let streak = 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastSession = new Date(sessions[0].completed_at);
  lastSession.setHours(0, 0, 0, 0);
  
  const dayDiff = Math.floor(
    (today.getTime() - lastSession.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (dayDiff > 1) return 0;
  
  for (let i = 1; i < sessions.length; i++) {
    const currentDate = new Date(sessions[i - 1].completed_at);
    const previousDate = new Date(sessions[i].completed_at);
    
    currentDate.setHours(0, 0, 0, 0);
    previousDate.setHours(0, 0, 0, 0);
    
    const diff = Math.floor(
      (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (diff === 1) {
      streak++;
    } else if (diff > 1) {
      break;
    }
  }
  
  return streak;
}

export async function getUserStats(userId: string) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const sessions = await getUserSessions(userId, 1000);
    
    const userData = userDoc.exists() ? userDoc.data() : {};
    
    // Calculate weekly minutes
    const weeklyMinutes = Array(7).fill(0);
    const today = new Date();
    
    sessions.forEach(session => {
      const sessionDate = new Date(session.completed_at);
      const daysDiff = Math.floor(
        (today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff < 7) {
        weeklyMinutes[6 - daysDiff] += session.duration_minutes;
      }
    });
    
    return {
      total_sessions: sessions.length,
      total_minutes: userData.total_meditation_minutes || 0,
      current_streak: userData.meditation_streak || 0,
      longest_streak: userData.longest_streak || userData.meditation_streak || 0,
      weekly_minutes: weeklyMinutes,
      mood_improvement: 0,
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return {
      total_sessions: 0,
      total_minutes: 0,
      current_streak: 0,
      longest_streak: 0,
      weekly_minutes: Array(7).fill(0),
      mood_improvement: 0,
    };
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
    
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as MeditationProgram));
  } catch (error) {
    console.error('Error fetching programs:', error);
    return [];
  }
}

// ==================== BREATHING EXERCISES ====================

export async function getBreathingExercises(): Promise<BreathingExercise[]> {
  try {
    const snapshot = await getDocs(breathingCollection);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
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
          ((data.inhale_duration + (data.hold_duration || 0) + 
            data.exhale_duration + (data.pause_duration || 0)) * data.cycles) / 60
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

// ==================== SLEEP STORIES ====================

export async function getSleepStories(): Promise<SleepStory[]> {
  try {
    const q = query(sleepStoriesCollection, orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as SleepStory));
  } catch (error) {
    console.error('Error fetching sleep stories:', error);
    return [];
  }
}

export async function getSleepStoryById(id: string): Promise<SleepStory | null> {
  try {
    const docRef = doc(db, 'sleep_stories', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as SleepStory;
  } catch (error) {
    console.error('Error fetching sleep story:', error);
    return null;
  }
}

// ==================== DAILY QUOTES ====================

export async function getTodayQuote(): Promise<DailyQuote | null> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const q = query(quotesCollection, where('date', '==', today), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // Get a random quote if no quote for today
      const allQuotesSnapshot = await getDocs(quotesCollection);
      if (allQuotesSnapshot.empty) return null;
      
      const randomIndex = Math.floor(Math.random() * allQuotesSnapshot.docs.length);
      const doc = allQuotesSnapshot.docs[randomIndex];
      return { id: doc.id, ...doc.data() } as DailyQuote;
    }
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as DailyQuote;
  } catch (error) {
    console.error('Error fetching daily quote:', error);
    return null;
  }
}

// ==================== FAVORITES ====================

export async function getUserFavorites(userId: string): Promise<UserFavorite[]> {
  try {
    const q = query(
      favoritesCollection, 
      where('user_id', '==', userId), 
      orderBy('favorited_at', 'desc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as UserFavorite));
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return [];
  }
}

export async function toggleFavorite(
  userId: string, 
  contentId: string, 
  contentType: 'meditation' | 'sleep_story' | 'breathing_exercise'
): Promise<boolean> {
  try {
    const q = query(
      favoritesCollection,
      where('user_id', '==', userId),
      where('content_id', '==', contentId),
      where('content_type', '==', contentType)
    );
    const existing = await getDocs(q);
    
    if (!existing.empty) {
      // Remove favorite
      await deleteDoc(existing.docs[0].ref);
      return false;
    } else {
      // Add favorite
      await addDoc(favoritesCollection, {
        user_id: userId,
        content_id: contentId,
        content_type: contentType,
        favorited_at: serverTimestamp()
      });
      return true;
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return false;
  }
}

export async function isFavorite(
  userId: string, 
  contentId: string
): Promise<boolean> {
  try {
    const q = query(
      favoritesCollection,
      where('user_id', '==', userId),
      where('content_id', '==', contentId)
    );
    const snapshot = await getDocs(q);
    
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking favorite:', error);
    return false;
  }
}
