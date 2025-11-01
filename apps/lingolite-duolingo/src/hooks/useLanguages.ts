import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  languageService,
  Language,
  UserLanguage,
} from "../services/languageService";

export function useLanguages() {
  const { user } = useAuth();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLanguages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await languageService.getLanguages();
      setLanguages(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch languages"
      );
      console.error("Error fetching languages:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLanguages();
  }, [fetchLanguages]);

  return {
    languages,
    loading,
    error,
    refetch: fetchLanguages,
  };
}

export function useUserLanguages() {
  const { user } = useAuth();
  const [userLanguages, setUserLanguages] = useState<UserLanguage[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState<UserLanguage | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserLanguages = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await languageService.getUserLanguages(user.id);
      setUserLanguages(data);

      // Set current language
      const current = await languageService.getCurrentLanguage(user.id);
      setCurrentLanguage(current);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch user languages"
      );
      console.error("Error fetching user languages:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const startLearning = useCallback(
    async (languageId: string) => {
      if (!user?.id) return;

      try {
        setError(null);
        await languageService.startLearningLanguage(user.id, languageId);
        await fetchUserLanguages();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to start learning language"
        );
        throw err;
      }
    },
    [user?.id, fetchUserLanguages]
  );

  const stopLearning = useCallback(
    async (languageId: string) => {
      if (!user?.id) return;

      try {
        setError(null);
        await languageService.stopLearningLanguage(user.id, languageId);
        await fetchUserLanguages();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to stop learning language"
        );
        throw err;
      }
    },
    [user?.id, fetchUserLanguages]
  );

  useEffect(() => {
    fetchUserLanguages();
  }, [fetchUserLanguages]);

  return {
    userLanguages,
    currentLanguage,
    loading,
    error,
    startLearning,
    stopLearning,
    refetch: fetchUserLanguages,
  };
}
