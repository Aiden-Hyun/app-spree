import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { supabase } from "../supabase";

const LOCATION_TASK_NAME = "background-location-task";
const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export class LocationService {
  private static instance: LocationService;
  private currentLocation: LocationData | null = null;
  private locationSubscription: Location.LocationSubscription | null = null;

  private constructor() {}

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } =
        await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== "granted") {
        return false;
      }

      const { status: backgroundStatus } =
        await Location.requestBackgroundPermissionsAsync();
      return backgroundStatus === "granted";
    } catch (error) {
      console.error("Error requesting location permissions:", error);
      return false;
    }
  }

  async startLocationUpdates(userId: string) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error("Location permission not granted");
      }

      // Start foreground location updates
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: UPDATE_INTERVAL,
          distanceInterval: 100, // Update every 100 meters
        },
        async (location) => {
          await this.updateLocation(userId, location);
        }
      );

      // Start background location updates
      await this.startBackgroundLocationUpdates(userId);
    } catch (error) {
      console.error("Error starting location updates:", error);
      throw error;
    }
  }

  async stopLocationUpdates() {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }

    const isTaskDefined = await TaskManager.isTaskDefined(LOCATION_TASK_NAME);
    if (isTaskDefined) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
  }

  private async startBackgroundLocationUpdates(userId: string) {
    const isTaskDefined = await TaskManager.isTaskDefined(LOCATION_TASK_NAME);

    if (!isTaskDefined) {
      // Define the background task
      TaskManager.defineTask(
        LOCATION_TASK_NAME,
        async ({ data, error }: any) => {
          if (error) {
            console.error("Background location task error:", error);
            return;
          }

          if (data) {
            const { locations } = data;
            const location = locations[0];

            if (location) {
              await this.updateLocationInBackground(userId, location);
            }
          }
        }
      );
    }

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: UPDATE_INTERVAL,
      distanceInterval: 100,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: "NearNow is using your location",
        notificationBody: "To help you discover people nearby",
      },
    });
  }

  private async updateLocation(
    userId: string,
    location: Location.LocationObject
  ) {
    try {
      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        timestamp: location.timestamp,
      };

      // Update location in database
      const { error } = await supabase
        .from("users")
        .update({
          location_lat: location.coords.latitude,
          location_lng: location.coords.longitude,
          last_seen: new Date().toISOString(),
          is_online: true,
        })
        .eq("id", userId);

      if (error) {
        console.error("Error updating location in database:", error);
      }
    } catch (error) {
      console.error("Error updating location:", error);
    }
  }

  private async updateLocationInBackground(userId: string, location: any) {
    try {
      // In background, we need to use a different approach
      // since we can't use the supabase client directly
      const locationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        timestamp: location.timestamp,
      };

      // Store location for later sync when app comes to foreground
      // In a real app, you might want to use AsyncStorage or similar
      console.log("Background location update:", locationData);
    } catch (error) {
      console.error("Error updating location in background:", error);
    }
  }

  getCurrentLocation(): LocationData | null {
    return this.currentLocation;
  }

  async getLastKnownLocation(): Promise<LocationData | null> {
    try {
      const location = await Location.getLastKnownPositionAsync();
      if (location) {
        return {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || 0,
          timestamp: location.timestamp,
        };
      }
      return null;
    } catch (error) {
      console.error("Error getting last known location:", error);
      return null;
    }
  }

  async setUserOffline(userId: string) {
    try {
      const { error } = await supabase
        .from("users")
        .update({
          is_online: false,
          last_seen: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        console.error("Error setting user offline:", error);
      }
    } catch (error) {
      console.error("Error setting user offline:", error);
    }
  }
}

export const locationService = LocationService.getInstance();


