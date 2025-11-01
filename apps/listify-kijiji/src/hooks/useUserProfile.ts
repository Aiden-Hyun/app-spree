import { useState, useEffect } from "react";
import { userService, UserProfile } from "../services/user.service";
import { listingService } from "../services/listing.service";

export function useUserProfile(userId: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [profileData, listingsData, reviewsData] = await Promise.all([
          userService.getUserProfile(userId),
          listingService.getUserListings(userId),
          userService.getUserReviews(userId),
        ]);

        setProfile(profileData);
        setListings(listingsData);
        setReviews(reviewsData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch user data"
        );
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  return {
    profile,
    listings,
    reviews,
    loading,
    error,
  };
}
