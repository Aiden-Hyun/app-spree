import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { MeditationSession } from '../../../types';

const sessionsCollection = collection(db, 'meditation_sessions');
const usersCollection = collection(db, 'users');
const favoritesCollection = collection(db, 'user_favorites');
const listeningHistoryCollection = collection(db, 'listening_history');
const playbackProgressCollection = collection(db, 'playback_progress');
const completedContentCollection = collection(db, 'completed_content');

// ==================== SESSIONS ====================

export async function createSession(
  session: Omit<MeditationSession, 'id' | 'completed_at'>
): Promise<string> {
  const docRef = await addDoc(sessionsCollection, {
    ...session,
    completed_at: serverTimestamp(),
  });

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

    return snapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        ...data,
        completed_at:
          data.completed_at instanceof Timestamp
            ? data.completed_at.toDate().toISOString()
            : new Date().toISOString(),
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
    const userDoc = await getDoc(userRef);
    const userData = userDoc.exists() ? userDoc.data() : {};
    const currentLongest = userData.longest_streak || 0;

    const newLongestStreak = Math.max(streak, currentLongest);

    await setDoc(
      userRef,
      {
        total_meditation_minutes: totalMinutes,
        meditation_streak: streak,
        longest_streak: newLongestStreak,
        updated_at: serverTimestamp(),
      },
      { merge: true }
    );
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

    const weeklyMinutes = Array(7).fill(0);
    const monthlyMinutes = Array(30).fill(0);
    const yearlyMinutes = Array(12).fill(0);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    sessions.forEach((session) => {
      const sessionDate = new Date(session.completed_at);
      const daysDiff = Math.floor(
        (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff >= 0 && daysDiff < 7) {
        const dayOfWeek = sessionDate.getDay();
        const mondayBasedIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        weeklyMinutes[mondayBasedIndex] += session.duration_minutes;
      }

      if (daysDiff >= 0 && daysDiff < 30) {
        const monthlyIndex = 29 - daysDiff;
        monthlyMinutes[monthlyIndex] += session.duration_minutes;
      }

      const sessionMonth = sessionDate.getMonth();
      const sessionYear = sessionDate.getFullYear();
      const monthsDiff = (currentYear - sessionYear) * 12 + (currentMonth - sessionMonth);
      if (monthsDiff >= 0 && monthsDiff < 12) {
        const yearlyIndex = 11 - monthsDiff;
        yearlyMinutes[yearlyIndex] += session.duration_minutes;
      }
    });

    const timeOfDayCounts: Record<string, number> = {
      Morning: 0,
      Afternoon: 0,
      Evening: 0,
      Night: 0,
    };

    sessions.forEach((session) => {
      const hour = new Date(session.completed_at).getHours();
      if (hour >= 5 && hour < 12) {
        timeOfDayCounts.Morning++;
      } else if (hour >= 12 && hour < 17) {
        timeOfDayCounts.Afternoon++;
      } else if (hour >= 17 && hour < 21) {
        timeOfDayCounts.Evening++;
      } else {
        timeOfDayCounts.Night++;
      }
    });

    let favoriteTimeOfDay: string | undefined;
    let maxCount = 0;
    for (const [time, count] of Object.entries(timeOfDayCounts)) {
      if (count > maxCount) {
        maxCount = count;
        favoriteTimeOfDay = time;
      }
    }

    return {
      total_sessions: sessions.length,
      total_minutes: userData.total_meditation_minutes || 0,
      current_streak: userData.meditation_streak || 0,
      longest_streak:
        userData.longest_streak || userData.meditation_streak || 0,
      weekly_minutes: weeklyMinutes,
      monthly_minutes: monthlyMinutes,
      yearly_minutes: yearlyMinutes,
      favorite_time_of_day: sessions.length > 0 ? favoriteTimeOfDay : undefined,
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
      monthly_minutes: Array(30).fill(0),
      yearly_minutes: Array(12).fill(0),
      mood_improvement: 0,
    };
  }
}

// ==================== ACCOUNT DELETION ====================

export async function deleteUserAccount(userId: string): Promise<void> {
  console.log(`Starting account deletion for user: ${userId}`);

  try {
    const deleteCollection = async (
      collectionRef: ReturnType<typeof collection>,
      fieldName: string
    ) => {
      const q = query(collectionRef, where(fieldName, '==', userId));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map((docSnapshot) =>
        deleteDoc(docSnapshot.ref)
      );
      await Promise.all(deletePromises);
      console.log(`Deleted ${snapshot.docs.length} docs from ${collectionRef.path}`);
    };

    await deleteCollection(favoritesCollection, 'user_id');
    await deleteCollection(listeningHistoryCollection, 'user_id');
    await deleteCollection(sessionsCollection, 'user_id');
    await deleteCollection(playbackProgressCollection, 'user_id');
    await deleteCollection(completedContentCollection, 'user_id');

    const userDocRef = doc(usersCollection, userId);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      await deleteDoc(userDocRef);
      console.log('Deleted user document');
    }

    console.log('Account deletion complete');
  } catch (error) {
    console.error('Error deleting user account data:', error);
    throw error;
  }
}
