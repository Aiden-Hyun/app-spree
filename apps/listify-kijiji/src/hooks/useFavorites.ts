import { useState, useEffect } from "react";
import { favoritesService } from "../services/favorites.service";
import { Listing } from "../services/listing.service";

export function useFavorites() {
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavorites = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await favoritesService.getUserFavorites();
      setFavorites(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch favorites"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const refresh = () => fetchFavorites(true);

  return {
    favorites,
    loading,
    error,
    refreshing,
    refresh,
  };
}

export function useFavoriteStatus(listingId: string) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFavorite = async () => {
      try {
        setLoading(true);
        const status = await favoritesService.isFavorite(listingId);
        setIsFavorite(status);
      } catch (err) {
        console.error("Error checking favorite status:", err);
      } finally {
        setLoading(false);
      }
    };

    if (listingId) {
      checkFavorite();
    }
  }, [listingId]);

  const toggleFavorite = async () => {
    try {
      const newStatus = await favoritesService.toggleFavorite(listingId);
      setIsFavorite(newStatus);
      return newStatus;
    } catch (err) {
      console.error("Error toggling favorite:", err);
      throw err;
    }
  };

  return {
    isFavorite,
    loading,
    toggleFavorite,
  };
}
