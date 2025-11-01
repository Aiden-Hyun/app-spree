import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";
import { calculateDistance } from "../utils/distance";

interface FavoriteUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  age?: number;
  location_lat?: number;
  location_lng?: number;
  last_seen?: string;
  is_online?: boolean;
  distance?: number;
  favorited_at: string;
}

export function useFavorites(userLat: number | null, userLon: number | null) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch favorites (using swipes table with super_like type)
      const { data, error: fetchError } = await supabase
        .from("swipes")
        .select(
          `
          swiped_at,
          users!swipes_swiped_id_fkey (
            id,
            email,
            full_name,
            avatar_url,
            bio,
            age,
            location_lat,
            location_lng,
            last_seen,
            is_online
          )
        `
        )
        .eq("swiper_id", user.id)
        .eq("swipe_type", "super_like")
        .order("swiped_at", { ascending: false });

      if (fetchError) throw fetchError;

      if (!data) {
        setFavorites([]);
        return;
      }

      // Format favorites with distance
      const formattedFavorites = data.map((item) => {
        const favoriteUser = item.users as any;
        let distance: number | undefined;

        if (
          userLat &&
          userLon &&
          favoriteUser.location_lat &&
          favoriteUser.location_lng
        ) {
          distance = calculateDistance(
            userLat,
            userLon,
            favoriteUser.location_lat,
            favoriteUser.location_lng
          );
        }

        return {
          ...favoriteUser,
          distance,
          favorited_at: item.swiped_at,
        };
      });

      setFavorites(formattedFavorites);
    } catch (err: any) {
      setError(err.message || "Failed to load favorites");
    } finally {
      setLoading(false);
    }
  }, [user, userLat, userLon]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("favorites")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "swipes",
          filter: `swiper_id=eq.${user.id}`,
        },
        (payload) => {
          // Refetch when favorites change
          if (
            payload.new?.swipe_type === "super_like" ||
            payload.old?.swipe_type === "super_like"
          ) {
            fetchFavorites();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchFavorites]);

  // Fetch favorites on mount
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const toggleFavorite = async (targetUserId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Check if already favorited
      const { data: existing } = await supabase
        .from("swipes")
        .select("*")
        .eq("swiper_id", user.id)
        .eq("swiped_id", targetUserId)
        .single();

      if (existing?.swipe_type === "super_like") {
        // Remove favorite
        const { error } = await supabase
          .from("swipes")
          .delete()
          .eq("id", existing.id);

        if (error) throw error;
        return false;
      } else if (existing) {
        // Update to super_like
        const { error } = await supabase
          .from("swipes")
          .update({ swipe_type: "super_like" })
          .eq("id", existing.id);

        if (error) throw error;
        return true;
      } else {
        // Create new super_like
        const { error } = await supabase.from("swipes").insert({
          swiper_id: user.id,
          swiped_id: targetUserId,
          swipe_type: "super_like",
        });

        if (error) throw error;
        return true;
      }
    } catch (err: any) {
      console.error("Error toggling favorite:", err);
      throw err;
    }
  };

  const isFavorite = (targetUserId: string): boolean => {
    return favorites.some((fav) => fav.id === targetUserId);
  };

  return {
    favorites,
    loading,
    error,
    refetch: fetchFavorites,
    toggleFavorite,
    isFavorite,
  };
}
