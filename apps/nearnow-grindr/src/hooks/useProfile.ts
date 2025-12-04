import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio?: string;
  age?: number;
  photos: string[];
  interests: string[];
  looking_for: string[];
  distance_preference: number;
  age_range_min: number;
  age_range_max: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Profile doesn't exist
          setProfile(null);
        } else {
          throw error;
        }
      } else {
        setProfile(data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return;

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      return data;
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
      throw err;
    }
  };

  const hasCompletedOnboarding = () => {
    return (
      profile &&
      profile.display_name &&
      profile.photos &&
      profile.photos.length > 0
    );
  };

  return {
    profile,
    loading,
    error,
    hasCompletedOnboarding: hasCompletedOnboarding(),
    updateProfile,
    refetch: fetchProfile,
  };
}


