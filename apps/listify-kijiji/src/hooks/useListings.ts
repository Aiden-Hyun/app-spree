import { useState, useEffect } from "react";
import { listingService, Listing } from "../services/listing.service";

interface UseListingsOptions {
  categoryId?: string;
  search?: string;
  limit?: number;
  userId?: string;
}

export function useListings(options?: UseListingsOptions) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchListings = async (isRefreshing = false, loadMore = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
        setPage(0);
      } else if (!loadMore) {
        setLoading(true);
      }
      setError(null);

      const currentPage = loadMore ? page : 0;
      const { data, count } = await listingService.getListings({
        category_id: options?.categoryId,
        search: options?.search,
        limit: options?.limit || 20,
        offset: currentPage * (options?.limit || 20),
      });

      if (loadMore) {
        setListings((prev) => [...prev, ...data]);
      } else {
        setListings(data);
      }

      setHasMore(data.length === (options?.limit || 20) && data.length < count);
      if (loadMore) setPage(currentPage + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch listings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [options?.categoryId, options?.search]);

  const refresh = () => fetchListings(true);
  const loadMore = () => {
    if (hasMore && !loading && !refreshing) {
      fetchListings(false, true);
    }
  };

  return {
    listings,
    loading,
    error,
    refreshing,
    hasMore,
    refresh,
    loadMore,
  };
}

export function useUserListings(userId: string) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserListings = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await listingService.getUserListings(userId);
        setListings(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch user listings"
        );
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserListings();
    }
  }, [userId]);

  return {
    listings,
    loading,
    error,
  };
}

export function useRecentListings(limit = 10) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentListings = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await listingService.getRecentListings(limit);
        setListings(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch recent listings"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRecentListings();
  }, [limit]);

  return {
    listings,
    loading,
    error,
  };
}
