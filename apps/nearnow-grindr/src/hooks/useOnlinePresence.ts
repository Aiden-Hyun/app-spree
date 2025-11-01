import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";
import { locationService } from "../services/locationService";

export function useOnlinePresence() {
  const { user } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!user) return;

    const updateOnlineStatus = async (isOnline: boolean) => {
      try {
        const now = Date.now();
        // Throttle updates to once per minute
        if (now - lastUpdateRef.current < 60000 && isOnline) {
          return;
        }

        lastUpdateRef.current = now;

        const { error } = await supabase
          .from("users")
          .update({
            is_online: isOnline,
            last_seen: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (error) {
          console.error("Error updating online status:", error);
        }
      } catch (error) {
        console.error("Error updating online status:", error);
      }
    };

    // Set initial online status
    updateOnlineStatus(true);

    // Update online status periodically
    intervalRef.current = setInterval(() => {
      updateOnlineStatus(true);
    }, 5 * 60 * 1000); // Every 5 minutes

    // Handle app state changes
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        updateOnlineStatus(true);
      } else if (nextAppState === "background" || nextAppState === "inactive") {
        updateOnlineStatus(false);
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    // Subscribe to presence channel
    const presenceChannel = supabase
      .channel(`presence:${user.id}`)
      .on("presence", { event: "sync" }, () => {
        // Handle presence sync
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        // Handle user joining
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        // Handle user leaving
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      subscription.remove();

      // Set offline status when component unmounts
      updateOnlineStatus(false);

      // Unsubscribe from presence channel
      presenceChannel.untrack().then(() => {
        supabase.removeChannel(presenceChannel);
      });
    };
  }, [user]);

  // Function to manually update online status
  const updateStatus = async (isOnline: boolean) => {
    if (!user) return;

    try {
      await supabase
        .from("users")
        .update({
          is_online: isOnline,
          last_seen: new Date().toISOString(),
        })
        .eq("id", user.id);
    } catch (error) {
      console.error("Error updating online status:", error);
    }
  };

  return {
    updateStatus,
  };
}
