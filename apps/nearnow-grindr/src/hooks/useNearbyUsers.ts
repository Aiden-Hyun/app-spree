import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";
import { sortByDistance, isWithinRadius } from "../utils/distance";
import { useProfile } from "./useProfile";

interface NearbyUser {
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
}

export function useNearbyUsers(userLat: number | null, userLon: number | null) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNearbyUsers = useCallback(async () => {
    if (!userLat || !userLon || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get user's distance preference (default to 25km)
      const maxDistance = profile?.distance_preference || 25;

      // Fetch all users with location data
      const { data, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .not("id", "eq", user.id)
        .not("location_lat", "is", null)
        .not("location_lng", "is", null)
        .order("last_seen", { ascending: false });

      if (fetchError) throw fetchError;

      if (!data) {
        setUsers([]);
        return;
      }

      // Filter users within radius and sort by distance
      const nearbyUsers = data.filter(
        (u) =>
          u.location_lat &&
          u.location_lng &&
          isWithinRadius(
            userLat,
            userLon,
            u.location_lat,
            u.location_lng,
            maxDistance
          )
      );

      const sortedUsers = sortByDistance(nearbyUsers, userLat, userLon);
      setUsers(sortedUsers);
    } catch (err: any) {
      setError(err.message || "Failed to load nearby users");
    } finally {
      setLoading(false);
    }
  }, [userLat, userLon, user, profile?.distance_preference]);

  // Set up real-time subscription for user updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("nearby_users")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "users",
          filter: `id=neq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setUsers((prev) => {
              const updatedUsers = prev.map((u) =>
                u.id === payload.new.id ? { ...u, ...payload.new } : u
              );

              // Re-sort if location changed
              if (
                payload.new.location_lat &&
                payload.new.location_lng &&
                userLat &&
                userLon
              ) {
                return sortByDistance(updatedUsers, userLat, userLon);
              }

              return updatedUsers;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userLat, userLon]);

  // Fetch users when location changes
  useEffect(() => {
    fetchNearbyUsers();
  }, [fetchNearbyUsers]);

  // Refresh function
  const refetch = useCallback(async () => {
    await fetchNearbyUsers();
  }, [fetchNearbyUsers]);

  return {
    users,
    loading,
    error,
    refetch,
  };
}


