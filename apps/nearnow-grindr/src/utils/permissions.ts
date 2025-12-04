import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import { Alert, Linking, Platform } from "react-native";

export async function checkLocationPermission(): Promise<boolean> {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status === "granted";
}

export async function checkBackgroundLocationPermission(): Promise<boolean> {
  const { status } = await Location.getBackgroundPermissionsAsync();
  return status === "granted";
}

export async function checkCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.getCameraPermissionsAsync();
  return status === "granted";
}

export async function checkMediaLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
  return status === "granted";
}

export async function checkNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    showPermissionAlert(
      "Location Permission Required",
      "NearNow needs access to your location to show you people nearby. Please enable location services in your device settings.",
      "location"
    );
    return false;
  }
  return true;
}

export async function requestBackgroundLocationPermission(): Promise<boolean> {
  const foregroundGranted = await checkLocationPermission();
  if (!foregroundGranted) {
    await requestLocationPermission();
  }

  const { status } = await Location.requestBackgroundPermissionsAsync();
  if (status !== "granted") {
    showPermissionAlert(
      "Background Location Required",
      'To keep your location updated and show you to other users even when the app is in the background, please enable "Always Allow" location access.',
      "location"
    );
    return false;
  }
  return true;
}

export async function requestCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") {
    showPermissionAlert(
      "Camera Permission Required",
      "NearNow needs access to your camera to take profile photos.",
      "camera"
    );
    return false;
  }
  return true;
}

export async function requestMediaLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    showPermissionAlert(
      "Photo Library Permission Required",
      "NearNow needs access to your photo library to upload profile photos.",
      "photos"
    );
    return false;
  }
  return true;
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") {
    showPermissionAlert(
      "Notification Permission Required",
      "Enable notifications to receive messages and match alerts.",
      "notifications"
    );
    return false;
  }
  return true;
}

function showPermissionAlert(title: string, message: string, type: string) {
  Alert.alert(
    title,
    message,
    [
      { text: "Cancel", style: "cancel" },
      { text: "Open Settings", onPress: () => openAppSettings() },
    ],
    { cancelable: false }
  );
}

function openAppSettings() {
  if (Platform.OS === "ios") {
    Linking.openURL("app-settings:");
  } else {
    Linking.openSettings();
  }
}

// Check all required permissions
export async function checkAllPermissions(): Promise<{
  location: boolean;
  backgroundLocation: boolean;
  camera: boolean;
  mediaLibrary: boolean;
  notifications: boolean;
}> {
  const [location, backgroundLocation, camera, mediaLibrary, notifications] =
    await Promise.all([
      checkLocationPermission(),
      checkBackgroundLocationPermission(),
      checkCameraPermission(),
      checkMediaLibraryPermission(),
      checkNotificationPermission(),
    ]);

  return {
    location,
    backgroundLocation,
    camera,
    mediaLibrary,
    notifications,
  };
}

// Request all permissions (used during onboarding)
export async function requestAllPermissions(): Promise<{
  location: boolean;
  backgroundLocation: boolean;
  camera: boolean;
  mediaLibrary: boolean;
  notifications: boolean;
}> {
  const location = await requestLocationPermission();
  const backgroundLocation = await requestBackgroundLocationPermission();
  const camera = await requestCameraPermission();
  const mediaLibrary = await requestMediaLibraryPermission();
  const notifications = await requestNotificationPermission();

  return {
    location,
    backgroundLocation,
    camera,
    mediaLibrary,
    notifications,
  };
}


