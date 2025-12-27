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
  NatureSound,
  BedtimeStory,
  DailyQuote,
  UserFavorite,
  ListeningHistoryItem,
  MeditationCategory 
} from '../types';

// Collection references
const meditationsCollection = collection(db, 'guided_meditations');
const sessionsCollection = collection(db, 'meditation_sessions');
const programsCollection = collection(db, 'meditation_programs');
const breathingCollection = collection(db, 'breathing_exercises');
const bedtimeStoriesCollection = collection(db, 'bedtime_stories');
const quotesCollection = collection(db, 'daily_quotes');
const favoritesCollection = collection(db, 'user_favorites');
const listeningHistoryCollection = collection(db, 'listening_history');
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

// ==================== BEDTIME STORIES ====================

export async function getBedtimeStories(): Promise<BedtimeStory[]> {
  try {
    const q = query(bedtimeStoriesCollection, orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as BedtimeStory));
  } catch (error) {
    console.error('Error fetching bedtime stories:', error);
    return [];
  }
}

export async function getBedtimeStoryById(id: string): Promise<BedtimeStory | null> {
  try {
    const docRef = doc(db, 'bedtime_stories', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as BedtimeStory;
  } catch (error) {
    console.error('Error fetching bedtime story:', error);
    return null;
  }
}

// Legacy aliases for backward compatibility
export const getSleepStories = getBedtimeStories;
export const getSleepStoryById = getBedtimeStoryById;

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
    // Use simple query without orderBy to avoid requiring composite index
    // Sort client-side instead
    const q = query(
      favoritesCollection, 
      where('user_id', '==', userId)
    );
    const snapshot = await getDocs(q);
    
    const items = snapshot.docs.map(doc => {
      const data = doc.data();
      return { 
      id: doc.id, 
        ...data,
        favorited_at: data.favorited_at instanceof Timestamp
          ? data.favorited_at.toDate().toISOString()
          : new Date().toISOString()
      } as UserFavorite;
    });
    
    // Sort by favorited_at descending (most recent first)
    return items.sort((a, b) => 
      new Date(b.favorited_at).getTime() - new Date(a.favorited_at).getTime()
    );
  } catch (error: any) {
    console.error('Error fetching favorites:', error);
    return [];
  }
}

export async function toggleFavorite(
  userId: string, 
  contentId: string, 
  contentType: 'meditation' | 'nature_sound' | 'bedtime_story' | 'breathing_exercise' | 'series_chapter' | 'album_track' | 'emergency'
): Promise<boolean> {
  try {
    // Query ALL favorites for this content (any type) to handle legacy data
    const q = query(
      favoritesCollection,
      where('user_id', '==', userId),
      where('content_id', '==', contentId)
    );
    const existing = await getDocs(q);
    
    if (!existing.empty) {
      // Remove ALL favorites for this content (handles legacy entries with wrong type)
      const deletePromises = existing.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      return false;
    } else {
      // Add favorite with correct content type
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

// ==================== CONTENT RESOLVER ====================

export interface ResolvedContent {
  id: string;
  title: string;
  thumbnail_url?: string;
  duration_minutes: number;
  content_type: 'meditation' | 'nature_sound' | 'bedtime_story' | 'breathing_exercise';
}

export async function getContentById(
  contentId: string,
  contentType: 'meditation' | 'nature_sound' | 'bedtime_story' | 'breathing_exercise' | 'series_chapter' | 'album_track' | 'emergency'
): Promise<ResolvedContent | null> {
  try {
    // Handle emergency meditations (local data)
    if (contentType === 'emergency') {
      const { emergencyMeditationsData } = await import('../constants/emergencyMeditationsData');
      const emergency = emergencyMeditationsData.find(e => e.id === contentId);
      if (emergency) {
        return {
          id: contentId,
          title: emergency.title,
          thumbnail_url: undefined,
          duration_minutes: emergency.duration_minutes,
          content_type: contentType
        };
      }
      return null;
    }

    // Handle local data types (series_chapter, album_track)
    if (contentType === 'series_chapter') {
      const { seriesData } = await import('../constants/seriesData');
      for (const series of seriesData) {
        const chapter = series.chapters.find(c => c.id === contentId);
        if (chapter) {
          return {
            id: contentId,
            title: `${series.title}: ${chapter.title}`,
            thumbnail_url: series.thumbnailUrl,
            duration_minutes: chapter.duration_minutes,
            content_type: contentType
          };
        }
      }
      return null;
    }
    
    if (contentType === 'album_track') {
      const { albumsData } = await import('../constants/albumsData');
      for (const album of albumsData) {
        const track = album.tracks.find(t => t.id === contentId);
        if (track) {
          return {
            id: contentId,
            title: `${album.title}: ${track.title}`,
            thumbnail_url: album.thumbnailUrl,
            duration_minutes: track.duration_minutes,
            content_type: contentType
          };
        }
      }
      return null;
    }

    // Handle Firestore-stored types
    let collectionName: string;
    switch (contentType) {
      case 'meditation':
        collectionName = 'guided_meditations';
        break;
      case 'bedtime_story':
        collectionName = 'bedtime_stories';
        break;
      case 'breathing_exercise':
        collectionName = 'breathing_exercises';
        break;
      case 'nature_sound':
        collectionName = 'nature_sounds';
        break;
      default:
        return null;
    }

    const docRef = doc(db, collectionName, contentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    const data = docSnap.data();
    return {
      id: docSnap.id,
      title: data.title || data.name || 'Untitled',
      thumbnail_url: data.thumbnail_url,
      duration_minutes: data.duration_minutes || 0,
      content_type: contentType
    };
  } catch (error) {
    console.error('Error fetching content by id:', error);
    return null;
  }
}

export async function getFavoritesWithDetails(userId: string): Promise<ResolvedContent[]> {
  try {
    const favorites = await getUserFavorites(userId);
    const resolvedContent: ResolvedContent[] = [];
    
    for (const fav of favorites) {
      const content = await getContentById(fav.content_id, fav.content_type);
      if (content) {
        resolvedContent.push(content);
      }
    }
    
    return resolvedContent;
  } catch (error) {
    console.error('Error fetching favorites with details:', error);
    return [];
  }
}

// ==================== LISTENING HISTORY ====================

export async function addToListeningHistory(
  userId: string,
  contentId: string,
  contentType: 'meditation' | 'nature_sound' | 'bedtime_story' | 'breathing_exercise' | 'series_chapter' | 'album_track' | 'emergency',
  contentTitle: string,
  durationMinutes: number,
  contentThumbnail?: string
): Promise<string> {
  try {
    const docRef = await addDoc(listeningHistoryCollection, {
      user_id: userId,
      content_id: contentId,
      content_type: contentType,
      content_title: contentTitle,
      content_thumbnail: contentThumbnail || null,
      duration_minutes: durationMinutes,
      played_at: serverTimestamp()
    });
    return docRef.id;
  } catch (error: any) {
    console.error('Error adding to listening history:', error);
    return '';
  }
}

export async function getListeningHistory(
  userId: string,
  maxLimit = 10
): Promise<ListeningHistoryItem[]> {
  try {
    // Use simple query without orderBy to avoid requiring composite index
    // Sort client-side instead
    const q = query(
      listeningHistoryCollection,
      where('user_id', '==', userId)
    );
    const snapshot = await getDocs(q);
    
    const items = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        played_at: data.played_at instanceof Timestamp
          ? data.played_at.toDate().toISOString()
          : new Date().toISOString()
      } as ListeningHistoryItem;
    });
    
    // Sort by played_at descending (most recent first)
    const sorted = items.sort((a, b) => 
      new Date(b.played_at).getTime() - new Date(a.played_at).getTime()
    );
    
    // Deduplicate by content_id, keeping only the most recent play
    const seen = new Set<string>();
    const deduplicated = sorted.filter(item => {
      if (seen.has(item.content_id)) return false;
      seen.add(item.content_id);
      return true;
    });
    
    return deduplicated.slice(0, maxLimit);
  } catch (error: any) {
    console.error('Error fetching listening history:', error);
    return [];
  }
}
