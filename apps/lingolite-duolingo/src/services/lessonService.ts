import { supabase } from "../supabase";

export interface Lesson {
  id: string;
  language_id: string;
  title: string;
  description: string;
  lesson_type: "vocabulary" | "grammar" | "conversation";
  difficulty_level: number;
  xp_reward: number;
  is_active: boolean;
  created_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed_at: string | null;
  score: number | null;
  time_spent_seconds: number | null;
  created_at: string;
}

export interface LessonWithProgress extends Lesson {
  user_progress?: UserProgress;
  is_completed: boolean;
  is_locked: boolean;
}

export const lessonService = {
  // Get all lessons for a language
  async getLessonsByLanguage(languageId: string): Promise<Lesson[]> {
    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .eq("language_id", languageId)
      .eq("is_active", true)
      .order("difficulty_level")
      .order("created_at");

    if (error) throw error;
    return data || [];
  },

  // Get lessons with user progress
  async getLessonsWithProgress(
    languageId: string,
    userId: string
  ): Promise<LessonWithProgress[]> {
    // Get all lessons
    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("*")
      .eq("language_id", languageId)
      .eq("is_active", true)
      .order("difficulty_level")
      .order("created_at");

    if (lessonsError) throw lessonsError;

    // Get user progress for these lessons
    const lessonIds = lessons?.map((l) => l.id) || [];
    const { data: progress, error: progressError } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", userId)
      .in("lesson_id", lessonIds);

    if (progressError) throw progressError;

    // Combine lessons with progress
    const progressMap = new Map(progress?.map((p) => [p.lesson_id, p]) || []);

    // Determine which lessons are locked
    let previousCompleted = true;
    const lessonsWithProgress: LessonWithProgress[] = (lessons || []).map(
      (lesson) => {
        const userProgress = progressMap.get(lesson.id);
        const isCompleted = !!userProgress?.completed_at;
        const isLocked = !previousCompleted && lesson.difficulty_level > 1;

        // Only lock if previous lesson in same difficulty wasn't completed
        if (lesson.difficulty_level === 1) {
          previousCompleted = true; // First level lessons are always unlocked
        } else if (isCompleted) {
          previousCompleted = true;
        }

        return {
          ...lesson,
          user_progress: userProgress,
          is_completed: isCompleted,
          is_locked: isLocked,
        };
      }
    );

    return lessonsWithProgress;
  },

  // Get a single lesson by ID
  async getLessonById(id: string): Promise<Lesson | null> {
    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  // Mark lesson as completed
  async completeLesson(
    userId: string,
    lessonId: string,
    score: number,
    timeSpentSeconds: number
  ): Promise<UserProgress> {
    const { data, error } = await supabase
      .from("user_progress")
      .upsert({
        user_id: userId,
        lesson_id: lessonId,
        completed_at: new Date().toISOString(),
        score,
        time_spent_seconds: timeSpentSeconds,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get user's completed lessons count
  async getCompletedLessonsCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from("user_progress")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .not("completed_at", "is", null);

    if (error) throw error;
    return count || 0;
  },

  // Get recommended next lesson
  async getNextLesson(
    languageId: string,
    userId: string
  ): Promise<Lesson | null> {
    const lessonsWithProgress = await this.getLessonsWithProgress(
      languageId,
      userId
    );

    // Find first incomplete, unlocked lesson
    const nextLesson = lessonsWithProgress.find(
      (lesson) => !lesson.is_completed && !lesson.is_locked
    );

    return nextLesson || null;
  },

  // Get lessons by type
  async getLessonsByType(
    languageId: string,
    lessonType: "vocabulary" | "grammar" | "conversation"
  ): Promise<Lesson[]> {
    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .eq("language_id", languageId)
      .eq("lesson_type", lessonType)
      .eq("is_active", true)
      .order("difficulty_level")
      .order("created_at");

    if (error) throw error;
    return data || [];
  },
};
