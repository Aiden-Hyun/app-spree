import { useState, useEffect } from "react";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";

const BIOMETRIC_ENABLED_KEY = "biometric_enabled";

export function useBiometrics() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [biometryType, setBiometryType] =
    useState<LocalAuthentication.AuthenticationType | null>(null);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (compatible && enrolled) {
        setIsAvailable(true);

        // Get the type of biometry available
        const supportedTypes =
          await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (
          supportedTypes.includes(
            LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
          )
        ) {
          setBiometryType(
            LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
          );
        } else if (
          supportedTypes.includes(
            LocalAuthentication.AuthenticationType.FINGERPRINT
          )
        ) {
          setBiometryType(LocalAuthentication.AuthenticationType.FINGERPRINT);
        }

        // Check if biometric is enabled for this app
        const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
        setIsEnabled(enabled === "true");
      } else {
        setIsAvailable(false);
        setIsEnabled(false);
      }
    } catch (error) {
      console.error("Error checking biometric availability:", error);
      setIsAvailable(false);
    }
  };

  const authenticate = async (reason?: string): Promise<boolean> => {
    if (!isAvailable) {
      return false;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason || "Authenticate to access your vault",
        fallbackLabel: "Use Master Password",
        disableDeviceFallback: false,
        cancelLabel: "Cancel",
      });

      return result.success;
    } catch (error) {
      console.error("Biometric authentication error:", error);
      return false;
    }
  };

  const enableBiometric = async (): Promise<boolean> => {
    if (!isAvailable) {
      Alert.alert(
        "Biometric Not Available",
        "Your device does not support biometric authentication or it's not configured."
      );
      return false;
    }

    // First authenticate to enable
    const authenticated = await authenticate(
      "Authenticate to enable biometric unlock"
    );

    if (authenticated) {
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "true");
      setIsEnabled(true);
      return true;
    }

    return false;
  };

  const disableBiometric = async (): Promise<boolean> => {
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "false");
    setIsEnabled(false);
    return true;
  };

  const getBiometryTypeName = (): string => {
    switch (biometryType) {
      case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
        return "Face ID";
      case LocalAuthentication.AuthenticationType.FINGERPRINT:
        return "Touch ID";
      default:
        return "Biometric";
    }
  };

  return {
    isAvailable,
    isEnabled,
    biometryType,
    biometryTypeName: getBiometryTypeName(),
    authenticate,
    enableBiometric,
    disableBiometric,
    checkBiometricAvailability,
  };
}
