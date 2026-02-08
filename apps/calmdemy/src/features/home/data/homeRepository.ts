import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import {
  DailyQuote,
  ListeningHistoryItem,
  UserFavorite,
} from '../../../types';
import { getEmergencyMeditationById, getCourses } from '../../meditate/data/meditateRepository';
import { getSeries, getSleepMeditationById } from '../../sleep/data/sleepRepository';
import { getAlbums } from '../../music/data/musicRepository';

const quotesCollection = collection(db, 'daily_quotes');
const favoritesCollection = collection(db, 'user_favorites');
const listeningHistoryCollection = collection(db, 'listening_history');

// ==================== DAILY QUOTES ====================

export async function getTodayQuote(): Promise<DailyQuote | null> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const q = query(quotesCollection, where('date', '==', today), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      const allQuotesSnapshot = await getDocs(quotesCollection);
      if (allQuotesSnapshot.empty) return null;

      const randomIndex = Math.floor(
        Math.random() * allQuotesSnapshot.docs.length
      );
      const docSnapshot = allQuotesSnapshot.docs[randomIndex];
      return { id: docSnapshot.id, ...docSnapshot.data() } as DailyQuote;
    }

    const docSnapshot = snapshot.docs[0];
    return { id: docSnapshot.id, ...docSnapshot.data() } as DailyQuote;
  } catch (error) {
    console.error('Error fetching daily quote:', error);
    return null;
  }
}

// ==================== FAVORITES ====================

export async function getUserFavorites(userId: string): Promise<UserFavorite[]> {
  try {
    const q = query(favoritesCollection, where('user_id', '==', userId));
    const snapshot = await getDocs(q);

    const items = snapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        ...data,
        favorited_at:
          data.favorited_at instanceof Timestamp
            ? data.favorited_at.toDate().toISOString()
            : new Date().toISOString(),
      } as UserFavorite;
    });

    return items.sort(
      (a, b) =>
        new Date(b.favorited_at).getTime() -
        new Date(a.favorited_at).getTime()
    );
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return [];
  }
}

export async function toggleFavorite(
  userId: string,
  contentId: string,
  contentType:
    | 'meditation'
    | 'nature_sound'
    | 'bedtime_story'
    | 'breathing_exercise'
    | 'series_chapter'
    | 'album_track'
    | 'emergency'
    | 'course_session'
    | 'sleep_meditation'
): Promise<boolean> {
  try {
    const q = query(
      favoritesCollection,
      where('user_id', '==', userId),
      where('content_id', '==', contentId)
    );
    const existing = await getDocs(q);

    if (!existing.empty) {
      const deletePromises = existing.docs.map((docSnapshot) =>
        deleteDoc(docSnapshot.ref)
      );
      await Promise.all(deletePromises);
      return false;
    }

    await addDoc(favoritesCollection, {
      user_id: userId,
      content_id: contentId,
      content_type: contentType,
      favorited_at: serverTimestamp(),
    });
    return true;
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
  content_type:
    | 'meditation'
    | 'nature_sound'
    | 'bedtime_story'
    | 'breathing_exercise'
    | 'series_chapter'
    | 'album_track'
    | 'emergency'
    | 'course_session'
    | 'sleep_meditation';
  course_code?: string;
  session_code?: string;
}

export async function getContentById(
  contentId: string,
  contentType:
    | 'meditation'
    | 'nature_sound'
    | 'bedtime_story'
    | 'breathing_exercise'
    | 'series_chapter'
    | 'album_track'
    | 'emergency'
    | 'course_session'
    | 'sleep_meditation'
): Promise<ResolvedContent | null> {
  try {
    if (contentType === 'emergency') {
      const emergency = await getEmergencyMeditationById(contentId);
      if (emergency) {
        return {
          id: contentId,
          title: emergency.title,
          thumbnail_url: emergency.thumbnailUrl,
          duration_minutes: emergency.duration_minutes,
          content_type: contentType,
        };
      }
      return null;
    }

    if (contentType === 'series_chapter') {
      const allSeries = await getSeries();
      for (const series of allSeries) {
        const chapter = series.chapters?.find((c) => c.id === contentId);
        if (chapter) {
          return {
            id: contentId,
            title: `${series.title}: ${chapter.title}`,
            thumbnail_url: series.thumbnailUrl,
            duration_minutes: chapter.duration_minutes,
            content_type: contentType,
          };
        }
      }
      return null;
    }

    if (contentType === 'album_track') {
      const allAlbums = await getAlbums();
      for (const album of allAlbums) {
        const track = album.tracks?.find((t) => t.id === contentId);
        if (track) {
          return {
            id: contentId,
            title: `${album.title}: ${track.title}`,
            thumbnail_url: album.thumbnailUrl,
            duration_minutes: track.duration_minutes,
            content_type: contentType,
          };
        }
      }
      return null;
    }

    if (contentType === 'course_session') {
      const allCourses = await getCourses();
      for (const course of allCourses) {
        const session = course.sessions?.find((s) => s.id === contentId);
        if (session) {
          return {
            id: contentId,
            title: session.title,
            thumbnail_url: course.thumbnailUrl,
            duration_minutes: session.duration_minutes,
            content_type: contentType,
            course_code: course.code,
            session_code: session.code,
          };
        }
      }
      return null;
    }

    if (contentType === 'sleep_meditation') {
      const meditation = await getSleepMeditationById(contentId);
      if (meditation) {
        return {
          id: contentId,
          title: meditation.title,
          thumbnail_url: meditation.thumbnailUrl,
          duration_minutes: meditation.duration_minutes,
          content_type: contentType,
        };
      }
      return null;
    }

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
        collectionName = 'sleep_sounds';
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
      thumbnail_url: data.thumbnail_url || data.thumbnailUrl,
      duration_minutes: data.duration_minutes || 0,
      content_type: contentType,
    };
  } catch (error) {
    console.error('Error fetching content by id:', error);
    return null;
  }
}

export async function getFavoritesWithDetails(
  userId: string
): Promise<ResolvedContent[]> {
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
  contentType:
    | 'meditation'
    | 'nature_sound'
    | 'bedtime_story'
    | 'breathing_exercise'
    | 'series_chapter'
    | 'album_track'
    | 'emergency'
    | 'course_session'
    | 'sleep_meditation',
  contentTitle: string,
  durationMinutes: number,
  contentThumbnail?: string,
  courseCode?: string,
  sessionCode?: string
): Promise<string> {
  try {
    const docData: Record<string, any> = {
      user_id: userId,
      content_id: contentId,
      content_type: contentType,
      content_title: contentTitle,
      content_thumbnail: contentThumbnail || null,
      duration_minutes: durationMinutes,
      played_at: serverTimestamp(),
    };

    if (courseCode) {
      docData.course_code = courseCode;
    }
    if (sessionCode) {
      docData.session_code = sessionCode;
    }

    const docRef = await addDoc(listeningHistoryCollection, docData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding to listening history:', error);
    return '';
  }
}

export async function getListeningHistory(
  userId: string,
  maxLimit = 10
): Promise<ListeningHistoryItem[]> {
  try {
    const q = query(listeningHistoryCollection, where('user_id', '==', userId));
    const snapshot = await getDocs(q);

    const items = snapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        ...data,
        played_at:
          data.played_at instanceof Timestamp
            ? data.played_at.toDate().toISOString()
            : new Date().toISOString(),
      } as ListeningHistoryItem;
    });

    const sorted = items.sort(
      (a, b) =>
        new Date(b.played_at).getTime() -
        new Date(a.played_at).getTime()
    );

    const seen = new Set<string>();
    const deduplicated = sorted.filter((item) => {
      if (seen.has(item.content_id)) return false;
      seen.add(item.content_id);
      return true;
    });

    return deduplicated.slice(0, maxLimit);
  } catch (error) {
    console.error('Error fetching listening history:', error);
    return [];
  }
}
