import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  vocabularyService,
  VocabularyWithProgress,
} from "../services/vocabularyService";
import { languageService } from "../services/languageService";

interface UseVocabularyOptions {
  languageId?: string;
  difficultyLevel?: number;
  limit?: number;
  reviewMode?: boolean;
}

export function useVocabulary(options: UseVocabularyOptions = {}) {
  const { user } = useAuth();
  const [vocabulary, setVocabulary] = useState<VocabularyWithProgress[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    learned: 0,
    mastered: 0,
    inProgress: 0,
    notStarted: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVocabulary = useCallback(async () => {
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
        setVocabulary([]);
        return;
      }

      let data: VocabularyWithProgress[];

      if (options.reviewMode) {
        // Get words for review using spaced repetition
        data = await vocabularyService.getWordsForReview(
          languageId,
          user.id,
          options.limit || 20
        );
      } else if (options.difficultyLevel !== undefined) {
        // Get vocabulary by difficulty
        const vocab = await vocabularyService.getVocabularyByDifficulty(
          languageId,
          options.difficultyLevel
        );
        // Get progress for these words
        data = await vocabularyService.getVocabularyWithProgress(
          languageId,
          user.id
        );
        // Filter to only include words of specified difficulty
        data = data.filter((v) =>
          vocab.some((vocabItem) => vocabItem.id === v.id)
        );
      } else {
        // Get all vocabulary with progress
        data = await vocabularyService.getVocabularyWithProgress(
          languageId,
          user.id
        );

        if (options.limit) {
          data = data.slice(0, options.limit);
        }
      }

      setVocabulary(data);

      // Get stats
      const vocabStats = await vocabularyService.getVocabularyStats(
        languageId,
        user.id
      );
      setStats(vocabStats);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch vocabulary"
      );
      console.error("Error fetching vocabulary:", err);
    } finally {
      setLoading(false);
    }
  }, [
    user?.id,
    options.languageId,
    options.difficultyLevel,
    options.limit,
    options.reviewMode,
  ]);

  const updateProgress = useCallback(
    async (vocabularyId: string, correct: boolean) => {
      if (!user?.id) return;

      try {
        await vocabularyService.updateVocabularyProgress(
          user.id,
          vocabularyId,
          correct
        );

        // Refresh vocabulary to update progress
        await fetchVocabulary();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update progress"
        );
        throw err;
      }
    },
    [user?.id, fetchVocabulary]
  );

  useEffect(() => {
    fetchVocabulary();
  }, [fetchVocabulary]);

  return {
    vocabulary,
    stats,
    loading,
    error,
    updateProgress,
    refetch: fetchVocabulary,
  };
}

export function useVocabularyPractice(languageId?: string) {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    total: 0,
  });

  const { vocabulary, loading, error, updateProgress } = useVocabulary({
    languageId,
    reviewMode: true,
    limit: 20,
  });

  const currentWord = vocabulary[currentIndex] || null;
  const hasMore = currentIndex < vocabulary.length - 1;
  const isComplete = vocabulary.length > 0 && currentIndex >= vocabulary.length;

  const handleAnswer = useCallback(
    async (correct: boolean) => {
      if (!currentWord) return;

      // Update progress
      await updateProgress(currentWord.id, correct);

      // Update session stats
      setSessionStats((prev) => ({
        correct: prev.correct + (correct ? 1 : 0),
        incorrect: prev.incorrect + (correct ? 0 : 1),
        total: prev.total + 1,
      }));

      // Move to next word
      if (hasMore) {
        setCurrentIndex((prev) => prev + 1);
      }
    },
    [currentWord, updateProgress, hasMore]
  );

  const reset = useCallback(() => {
    setCurrentIndex(0);
    setSessionStats({
      correct: 0,
      incorrect: 0,
      total: 0,
    });
  }, []);

  return {
    currentWord,
    currentIndex,
    totalWords: vocabulary.length,
    hasMore,
    isComplete,
    sessionStats,
    loading,
    error,
    handleAnswer,
    reset,
  };
}


