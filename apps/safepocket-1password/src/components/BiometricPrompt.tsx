import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from "react-native";
import { useBiometrics } from "../hooks/useBiometrics";

interface BiometricPromptProps {
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  message?: string;
}

export function BiometricPrompt({
  visible,
  onSuccess,
  onCancel,
  message,
}: BiometricPromptProps) {
  const { authenticate, biometryTypeName, isAvailable } = useBiometrics();

  const handleAuthenticate = async () => {
    if (!isAvailable) {
      Alert.alert(
        "Biometric Not Available",
        "Biometric authentication is not available on this device"
      );
      onCancel();
      return;
    }

    const success = await authenticate(message);
    if (success) {
      onSuccess();
    } else {
      onCancel();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>
              {biometryTypeName === "Face ID" ? "😊" : "👆"}
            </Text>
          </View>

          <Text style={styles.title}>Authenticate with {biometryTypeName}</Text>
          <Text style={styles.message}>
            {message || "Confirm your identity to continue"}
          </Text>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.authenticateButton}
              onPress={handleAuthenticate}
            >
              <Text style={styles.authenticateButtonText}>
                Use {biometryTypeName}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    width: "85%",
    maxWidth: 340,
    alignItems: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e3f2fd",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#636e72",
    textAlign: "center",
    marginBottom: 24,
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#636e72",
    fontWeight: "600",
  },
  authenticateButton: {
    flex: 1,
    backgroundColor: "#0984e3",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  authenticateButtonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "600",
  },
});


