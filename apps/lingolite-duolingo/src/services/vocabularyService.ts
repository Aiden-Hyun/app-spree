import { supabase } from "../supabase";

export interface Vocabulary {
  id: string;
  language_id: string;
  word: string;
  translation: string;
  pronunciation: string | null;
  difficulty_level: number;
  is_active: boolean;
}

export interface UserVocabularyProgress {
  id: string;
  user_id: string;
  vocabulary_id: string;
  mastery_level: number; // 0-5 scale
  last_reviewed: string;
  review_count: number;
}

export interface VocabularyWithProgress extends Vocabulary {
  user_progress?: UserVocabularyProgress;
}

export const vocabularyService = {
  // Get vocabulary for a language
  async getVocabularyByLanguage(
    languageId: string,
    limit?: number
  ): Promise<Vocabulary[]> {
    let query = supabase
      .from("vocabulary")
      .select("*")
      .eq("language_id", languageId)
      .eq("is_active", true)
      .order("difficulty_level")
      .order("word");

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  // Get vocabulary with user progress
  async getVocabularyWithProgress(
    languageId: string,
    userId: string
  ): Promise<VocabularyWithProgress[]> {
    // Get vocabulary
    const { data: vocabulary, error: vocabError } = await supabase
      .from("vocabulary")
      .select("*")
      .eq("language_id", languageId)
      .eq("is_active", true)
      .order("difficulty_level")
      .order("word");

    if (vocabError) throw vocabError;

    // Get user progress
    const vocabIds = vocabulary?.map((v) => v.id) || [];
    const { data: progress, error: progressError } = await supabase
      .from("user_vocabulary_progress")
      .select("*")
      .eq("user_id", userId)
      .in("vocabulary_id", vocabIds);

    if (progressError) throw progressError;

    // Combine vocabulary with progress
    const progressMap = new Map(
      progress?.map((p) => [p.vocabulary_id, p]) || []
    );

    const vocabularyWithProgress: VocabularyWithProgress[] = (
      vocabulary || []
    ).map((vocab) => ({
      ...vocab,
      user_progress: progressMap.get(vocab.id),
    }));

    return vocabularyWithProgress;
  },

  // Get words for review (spaced repetition)
  async getWordsForReview(
    languageId: string,
    userId: string,
    limit: number = 20
  ): Promise<VocabularyWithProgress[]> {
    // Get vocabulary with progress
    const vocabWithProgress = await this.getVocabularyWithProgress(
      languageId,
      userId
    );

    // Sort by review priority
    const now = new Date();
    const sorted = vocabWithProgress.sort((a, b) => {
      // Prioritize unreviewed words
      if (!a.user_progress && b.user_progress) return -1;
      if (a.user_progress && !b.user_progress) return 1;
      if (!a.user_progress && !b.user_progress) return 0;

      // Calculate review intervals based on mastery level
      const getReviewInterval = (masteryLevel: number): number => {
        const intervals = [0, 1, 3, 7, 14, 30]; // Days
        return intervals[Math.min(masteryLevel, 5)];
      };

      const aLastReview = new Date(a.user_progress!.last_reviewed);
      const bLastReview = new Date(b.user_progress!.last_reviewed);

      const aDaysSinceReview = Math.floor(
        (now.getTime() - aLastReview.getTime()) / (1000 * 60 * 60 * 24)
      );
      const bDaysSinceReview = Math.floor(
        (now.getTime() - bLastReview.getTime()) / (1000 * 60 * 60 * 24)
      );

      const aInterval = getReviewInterval(a.user_progress!.mastery_level);
      const bInterval = getReviewInterval(b.user_progress!.mastery_level);

      const aOverdue = aDaysSinceReview - aInterval;
      const bOverdue = bDaysSinceReview - bInterval;

      return bOverdue - aOverdue;
    });

    return sorted.slice(0, limit);
  },

  // Update vocabulary progress
  async updateVocabularyProgress(
    userId: string,
    vocabularyId: string,
    correct: boolean
  ): Promise<UserVocabularyProgress> {
    // Get current progress
    const { data: current, error: fetchError } = await supabase
      .from("user_vocabulary_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("vocabulary_id", vocabularyId)
      .single();

    let masteryLevel = 0;
    let reviewCount = 0;

    if (current) {
      masteryLevel = current.mastery_level;
      reviewCount = current.review_count;

      // Update mastery level based on response
      if (correct) {
        masteryLevel = Math.min(masteryLevel + 1, 5);
      } else {
        masteryLevel = Math.max(masteryLevel - 1, 0);
      }
    } else if (correct) {
      masteryLevel = 1;
    }

    // Upsert progress
    const { data, error } = await supabase
      .from("user_vocabulary_progress")
      .upsert({
        user_id: userId,
        vocabulary_id: vocabularyId,
        mastery_level: masteryLevel,
        last_reviewed: new Date().toISOString(),
        review_count: reviewCount + 1,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get vocabulary statistics
  async getVocabularyStats(languageId: string, userId: string) {
    const vocabWithProgress = await this.getVocabularyWithProgress(
      languageId,
      userId
    );

    const stats = {
      total: vocabWithProgress.length,
      learned: 0,
      mastered: 0,
      inProgress: 0,
      notStarted: 0,
    };

    vocabWithProgress.forEach((vocab) => {
      if (!vocab.user_progress) {
        stats.notStarted++;
      } else if (vocab.user_progress.mastery_level >= 5) {
        stats.mastered++;
        stats.learned++;
      } else if (vocab.user_progress.mastery_level >= 3) {
        stats.learned++;
        stats.inProgress++;
      } else {
        stats.inProgress++;
      }
    });

    return stats;
  },

  // Get vocabulary by difficulty level
  async getVocabularyByDifficulty(
    languageId: string,
    difficultyLevel: number
  ): Promise<Vocabulary[]> {
    const { data, error } = await supabase
      .from("vocabulary")
      .select("*")
      .eq("language_id", languageId)
      .eq("difficulty_level", difficultyLevel)
      .eq("is_active", true)
      .order("word");

    if (error) throw error;
    return data || [];
  },
};


