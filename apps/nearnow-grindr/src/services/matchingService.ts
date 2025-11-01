import { supabase } from "../supabase";

export interface SwipeData {
  swiper_id: string;
  swiped_id: string;
  swipe_type: "like" | "pass" | "super_like";
}

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  matched_at: string;
  is_active: boolean;
}

export class MatchingService {
  private static instance: MatchingService;

  private constructor() {}

  static getInstance(): MatchingService {
    if (!MatchingService.instance) {
      MatchingService.instance = new MatchingService();
    }
    return MatchingService.instance;
  }

  async createSwipe(
    swiperId: string,
    swipedId: string,
    swipeType: SwipeData["swipe_type"]
  ): Promise<{ isMatch: boolean; matchId?: string }> {
    try {
      // Create or update the swipe
      const { error: swipeError } = await supabase.from("swipes").upsert(
        {
          swiper_id: swiperId,
          swiped_id: swipedId,
          swipe_type: swipeType,
        },
        {
          onConflict: "swiper_id,swiped_id",
        }
      );

      if (swipeError) throw swipeError;

      // Only check for match if it's a like or super_like
      if (swipeType === "like" || swipeType === "super_like") {
        return await this.checkAndCreateMatch(swiperId, swipedId);
      }

      return { isMatch: false };
    } catch (error) {
      console.error("Error creating swipe:", error);
      throw error;
    }
  }

  async checkAndCreateMatch(
    userId1: string,
    userId2: string
  ): Promise<{ isMatch: boolean; matchId?: string }> {
    try {
      // Check if the other user has also liked/super_liked us
      const { data: reciprocalSwipe } = await supabase
        .from("swipes")
        .select("*")
        .eq("swiper_id", userId2)
        .eq("swiped_id", userId1)
        .in("swipe_type", ["like", "super_like"])
        .single();

      if (!reciprocalSwipe) {
        return { isMatch: false };
      }

      // Check if match already exists
      const { data: existingMatch } = await supabase
        .from("matches")
        .select("*")
        .or(
          `and(user1_id.eq.${userId1},user2_id.eq.${userId2}),and(user1_id.eq.${userId2},user2_id.eq.${userId1})`
        )
        .single();

      if (existingMatch) {
        // Reactivate match if it was deactivated
        if (!existingMatch.is_active) {
          await supabase
            .from("matches")
            .update({ is_active: true })
            .eq("id", existingMatch.id);
        }
        return { isMatch: true, matchId: existingMatch.id };
      }

      // Create new match (ensure consistent ordering)
      const [user1, user2] = [userId1, userId2].sort();
      const { data: newMatch, error: matchError } = await supabase
        .from("matches")
        .insert({
          user1_id: user1,
          user2_id: user2,
        })
        .select()
        .single();

      if (matchError) throw matchError;

      return { isMatch: true, matchId: newMatch.id };
    } catch (error) {
      console.error("Error checking/creating match:", error);
      return { isMatch: false };
    }
  }

  async getMatches(userId: string): Promise<Match[]> {
    try {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq("is_active", true)
        .order("matched_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching matches:", error);
      return [];
    }
  }

  async unmatch(matchId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("matches")
        .update({ is_active: false })
        .eq("id", matchId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error unmatching:", error);
      return false;
    }
  }

  async hasLiked(swiperId: string, swipedId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from("swipes")
        .select("*")
        .eq("swiper_id", swiperId)
        .eq("swiped_id", swipedId)
        .in("swipe_type", ["like", "super_like"])
        .single();

      return !!data;
    } catch (error) {
      return false;
    }
  }

  async getSwipeStats(userId: string): Promise<{
    likesReceived: number;
    superLikesReceived: number;
    matchesCount: number;
  }> {
    try {
      // Count likes received
      const { count: likesReceived } = await supabase
        .from("swipes")
        .select("*", { count: "exact", head: true })
        .eq("swiped_id", userId)
        .eq("swipe_type", "like");

      // Count super likes received
      const { count: superLikesReceived } = await supabase
        .from("swipes")
        .select("*", { count: "exact", head: true })
        .eq("swiped_id", userId)
        .eq("swipe_type", "super_like");

      // Count active matches
      const { count: matchesCount } = await supabase
        .from("matches")
        .select("*", { count: "exact", head: true })
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq("is_active", true);

      return {
        likesReceived: likesReceived || 0,
        superLikesReceived: superLikesReceived || 0,
        matchesCount: matchesCount || 0,
      };
    } catch (error) {
      console.error("Error fetching swipe stats:", error);
      return {
        likesReceived: 0,
        superLikesReceived: 0,
        matchesCount: 0,
      };
    }
  }
}

export const matchingService = MatchingService.getInstance();
