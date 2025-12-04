import { useState, useEffect, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import { locationService } from "../services/locationService";
import {
  checkLocationPermission,
  checkBackgroundLocationPermission,
} from "../utils/permissions";
import { useAuth } from "../contexts/AuthContext";

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  timestamp: number | null;
  hasPermission: boolean;
  hasBackgroundPermission: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useLocation() {
  const { user } = useAuth();
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    timestamp: null,
    hasPermission: false,
    hasBackgroundPermission: false,
    isLoading: true,
    error: null,
  });

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, []);

  // Start location updates when user is authenticated and has permission
  useEffect(() => {
    if (user && state.hasPermission) {
      startTracking();
    }

    return () => {
      if (user) {
        stopTracking();
      }
    };
  }, [user, state.hasPermission]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (user) {
        if (nextAppState === "active") {
          // App is coming to foreground
          startTracking();
        } else {
          // App is going to background
          // Background tracking will continue if permission is granted
          locationService.setUserOffline(user.id);
        }
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription.remove();
  }, [user]);

  const checkPermissions = async () => {
    try {
      const [hasLocation, hasBackground] = await Promise.all([
        checkLocationPermission(),
        checkBackgroundLocationPermission(),
      ]);

      setState((prev) => ({
        ...prev,
        hasPermission: hasLocation,
        hasBackgroundPermission: hasBackground,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: "Failed to check permissions",
        isLoading: false,
      }));
    }
  };

  const startTracking = async () => {
    if (!user) return;

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Get initial location
      const lastKnown = await locationService.getLastKnownLocation();
      if (lastKnown) {
        setState((prev) => ({
          ...prev,
          latitude: lastKnown.latitude,
          longitude: lastKnown.longitude,
          accuracy: lastKnown.accuracy,
          timestamp: lastKnown.timestamp,
        }));
      }

      // Start continuous updates
      await locationService.startLocationUpdates(user.id);

      // Poll for location updates
      const interval = setInterval(() => {
        const current = locationService.getCurrentLocation();
        if (current) {
          setState((prev) => ({
            ...prev,
            latitude: current.latitude,
            longitude: current.longitude,
            accuracy: current.accuracy,
            timestamp: current.timestamp,
            isLoading: false,
          }));
        }
      }, 1000);

      // Store interval ID for cleanup
      (window as any).__locationInterval = interval;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error.message || "Failed to start location tracking",
        isLoading: false,
      }));
    }
  };

  const stopTracking = async () => {
    try {
      await locationService.stopLocationUpdates();

      // Clear interval
      if ((window as any).__locationInterval) {
        clearInterval((window as any).__locationInterval);
        delete (window as any).__locationInterval;
      }

      if (user) {
        await locationService.setUserOffline(user.id);
      }
    } catch (error) {
      console.error("Error stopping location tracking:", error);
    }
  };

  const requestPermissions = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      const hasPermission = await locationService.requestPermissions();

      setState((prev) => ({
        ...prev,
        hasPermission,
        hasBackgroundPermission: hasPermission,
        isLoading: false,
      }));

      return hasPermission;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error.message || "Failed to request permissions",
        isLoading: false,
      }));
      return false;
    }
  }, []);

  const refresh = useCallback(async () => {
    await checkPermissions();
    if (state.hasPermission && user) {
      await startTracking();
    }
  }, [state.hasPermission, user]);

  return {
    ...state,
    requestPermissions,
    refresh,
  };
}


