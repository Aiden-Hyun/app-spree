import { useState, useEffect, useCallback } from "react";
import { subredditService } from "../services/subredditService";
import { Subreddit } from "../types";

interface UseSubredditsOptions {
  orderBy?: "subscriber_count" | "created_at" | "name";
}

export function useSubreddits(options: UseSubredditsOptions = {}) {
  const [subreddits, setSubreddits] = useState<Subreddit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchSubreddits = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
          setOffset(0);
        } else {
          setLoading(true);
        }

        const newSubreddits = await subredditService.fetchSubreddits({
          ...options,
          offset: isRefresh ? 0 : offset,
          limit: 20,
        });

        if (isRefresh) {
          setSubreddits(newSubreddits);
          setOffset(20);
          setHasMore(newSubreddits.length === 20);
        } else {
          setSubreddits((prev) => [...prev, ...newSubreddits]);
          setOffset((prev) => prev + 20);
          setHasMore(newSubreddits.length === 20);
        }

        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch subreddits"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [options, offset]
  );

  const refresh = useCallback(() => {
    fetchSubreddits(true);
  }, [fetchSubreddits]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchSubreddits(false);
    }
  }, [loading, hasMore, fetchSubreddits]);

  useEffect(() => {
    fetchSubreddits(true);
  }, [options.orderBy]);

  return {
    subreddits,
    loading,
    refreshing,
    hasMore,
    error,
    refresh,
    loadMore,
  };
}

export function useUserSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subreddit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await subredditService.getUserSubscriptions();
      setSubscriptions(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch subscriptions"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const subscribe = useCallback(async (subredditId: string) => {
    try {
      await subredditService.subscribe(subredditId);
      // Optimistically update UI
      const subreddit = await subredditService.getSubreddit(subredditId);
      setSubscriptions((prev) => [...prev, subreddit]);
    } catch (err) {
      throw err;
    }
  }, []);

  const unsubscribe = useCallback(async (subredditId: string) => {
    try {
      await subredditService.unsubscribe(subredditId);
      // Optimistically update UI
      setSubscriptions((prev) => prev.filter((sub) => sub.id !== subredditId));
    } catch (err) {
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  return {
    subscriptions,
    loading,
    error,
    subscribe,
    unsubscribe,
    refresh: fetchSubscriptions,
  };
}


