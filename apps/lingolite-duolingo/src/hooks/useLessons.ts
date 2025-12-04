import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  lessonService,
  Lesson,
  LessonWithProgress,
} from "../services/lessonService";
import { progressService } from "../services/progressService";
import { languageService } from "../services/languageService";

interface UseLessonsOptions {
  languageId?: string;
  lessonType?: "vocabulary" | "grammar" | "conversation";
}

export function useLessons(options: UseLessonsOptions = {}) {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<LessonWithProgress[]>([]);
  const [nextLesson, setNextLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLessons = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      let languageId = options.languageId;

      // If no language specified, use current language
      if (!languageId) {
        const currentLang = await languageService.getCurrentLanguage(user.id);
        languageId = currentLang?.language_id;
      }

      if (!languageId) {
        setLessons([]);
        return;
      }

      const data = await lessonService.getLessonsWithProgress(
        languageId,
        user.id
      );

      // Filter by type if specified
      let filteredLessons = data;
      if (options.lessonType) {
        filteredLessons = data.filter(
          (lesson) => lesson.lesson_type === options.lessonType
        );
      }

      setLessons(filteredLessons);

      // Get next recommended lesson
      const next = await lessonService.getNextLesson(languageId, user.id);
      setNextLesson(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch lessons");
      console.error("Error fetching lessons:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, options.languageId, options.lessonType]);

  const completeLesson = useCallback(
    async (lessonId: string, score: number, timeSpentSeconds: number) => {
      if (!user?.id) return;

      try {
        // Complete the lesson
        await lessonService.completeLesson(
          user.id,
          lessonId,
          score,
          timeSpentSeconds
        );

        // Get lesson details for XP reward
        const lesson = lessons.find((l) => l.id === lessonId);
        if (lesson) {
          // Add XP
          await progressService.addXP(user.id, lesson.xp_reward);

          // Update streak
          await progressService.updateStreak(user.id);

          // Update language progress
          if (lesson.language_id) {
            await languageService.updateLanguageProgress(
              user.id,
              lesson.language_id,
              lesson.xp_reward
            );
          }
        }

        // Refresh lessons
        await fetchLessons();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to complete lesson"
        );
        throw err;
      }
    },
    [user?.id, lessons, fetchLessons]
  );

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  return {
    lessons,
    nextLesson,
    loading,
    error,
    completeLesson,
    refetch: fetchLessons,
  };
}

export function useLesson(lessonId: string) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLesson() {
      try {
        setLoading(true);
        setError(null);
        const data = await lessonService.getLessonById(lessonId);
        setLesson(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch lesson");
        console.error("Error fetching lesson:", err);
      } finally {
        setLoading(false);
      }
    }

    if (lessonId) {
      fetchLesson();
    }
  }, [lessonId]);

  return { lesson, loading, error };
}


