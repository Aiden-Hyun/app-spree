import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { validateMasterPassword } from "../../src/utils/validators";
import { calculatePasswordStrength } from "../../src/utils/passwordStrength";
import { useBiometrics } from "../../src/hooks/useBiometrics";

export default function MasterPasswordScreen() {
  const router = useRouter();
  const { initializeMasterPassword, hasMasterPassword, unlockVault } =
    useAuth();
  const { isAvailable, isEnabled, authenticate, biometryTypeName } =
    useBiometrics();

  const [masterPassword, setMasterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isSetupMode = !hasMasterPassword;
  const passwordStrength = calculatePasswordStrength(masterPassword);
  const validation = validateMasterPassword(masterPassword);

  useEffect(() => {
    // Try biometric authentication on mount if available and not in setup mode
    if (!isSetupMode && isAvailable && isEnabled) {
      handleBiometricUnlock();
    }
  }, [isSetupMode, isAvailable, isEnabled]);

  const handleBiometricUnlock = async () => {
    const success = await authenticate("Unlock your vault");
    if (success) {
      // For biometric unlock, we need to have stored the master password securely
      // In a real app, you would store an encrypted version that can be decrypted with biometric
      // For now, we'll just unlock the vault
      router.replace("/home");
    }
  };

  const handleSubmit = async () => {
    if (loading) return;

    if (isSetupMode) {
      // Setup mode - validate and create master password
      if (!validation.isValid) {
        Alert.alert("Invalid Password", validation.errors.join("\n"));
        return;
      }

      if (masterPassword !== confirmPassword) {
        Alert.alert("Password Mismatch", "Passwords do not match");
        return;
      }

      setLoading(true);
      try {
        await initializeMasterPassword(masterPassword);
        router.replace("/home");
      } catch (error: any) {
        Alert.alert(
          "Setup Failed",
          error.message || "Failed to set up master password"
        );
      } finally {
        setLoading(false);
      }
    } else {
      // Unlock mode - verify master password
      if (!masterPassword) {
        Alert.alert("Password Required", "Please enter your master password");
        return;
      }

      setLoading(true);
      try {
        const success = await unlockVault(masterPassword);
        if (success) {
          router.replace("/home");
        } else {
          Alert.alert("Incorrect Password", "Invalid master password");
        }
      } catch (error: any) {
        Alert.alert("Unlock Failed", error.message || "Failed to unlock vault");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            {isSetupMode ? "Create Master Password" : "Unlock Your Vault"}
          </Text>
          <Text style={styles.subtitle}>
            {isSetupMode
              ? "This password will protect all your stored passwords"
              : "Enter your master password to access your passwords"}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Master Password"
              placeholderTextColor="#999"
              value={masterPassword}
              onChangeText={setMasterPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.eyeText}>{showPassword ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </View>

          {isSetupMode && (
            <>
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBar}>
                  <View
                    style={[
                      styles.strengthFill,
                      {
                        width: `${(passwordStrength.score / 4) * 100}%`,
                        backgroundColor: passwordStrength.color,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.strengthText,
                    { color: passwordStrength.color },
                  ]}
                >
                  {passwordStrength.label}
                </Text>
              </View>

              {passwordStrength.suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {passwordStrength.suggestions.map((suggestion, index) => (
                    <Text key={index} style={styles.suggestion}>
                      • {suggestion}
                    </Text>
                  ))}
                </View>
              )}

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.requirementsContainer}>
                <Text style={styles.requirementsTitle}>
                  Password Requirements:
                </Text>
                <Text style={styles.requirement}>• At least 8 characters</Text>
                <Text style={styles.requirement}>• One uppercase letter</Text>
                <Text style={styles.requirement}>• One lowercase letter</Text>
                <Text style={styles.requirement}>• One number</Text>
                <Text style={styles.requirement}>• One special character</Text>
              </View>
            </>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading
                ? "Processing..."
                : isSetupMode
                ? "Set Master Password"
                : "Unlock Vault"}
            </Text>
          </TouchableOpacity>

          {!isSetupMode && (
            <>
              {isAvailable && isEnabled && (
                <TouchableOpacity
                  style={styles.biometricButton}
                  onPress={handleBiometricUnlock}
                >
                  <Text style={styles.biometricButtonText}>
                    Unlock with {biometryTypeName}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.forgotButton}
                onPress={() =>
                  Alert.alert(
                    "Forgot Password",
                    "Password recovery coming soon"
                  )
                }
              >
                <Text style={styles.forgotButtonText}>
                  Forgot Master Password?
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2d3436",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#636e72",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    position: "relative",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#2d3436",
  },
  eyeButton: {
    position: "absolute",
    right: 16,
    top: 16,
  },
  eyeText: {
    fontSize: 20,
  },
  strengthContainer: {
    marginBottom: 16,
  },
  strengthBar: {
    height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 8,
  },
  strengthFill: {
    height: "100%",
    borderRadius: 2,
    transition: "width 0.3s ease",
  },
  strengthText: {
    fontSize: 14,
    fontWeight: "600",
  },
  suggestionsContainer: {
    backgroundColor: "#fff9c4",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  suggestion: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  requirementsContainer: {
    backgroundColor: "#e3f2fd",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 8,
  },
  requirement: {
    fontSize: 14,
    color: "#636e72",
    marginBottom: 4,
  },
  submitButton: {
    backgroundColor: "#2d3436",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  biometricButton: {
    backgroundColor: "#0984e3",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  biometricButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  forgotButton: {
    alignItems: "center",
    padding: 12,
  },
  forgotButtonText: {
    color: "#0984e3",
    fontSize: 16,
  },
});
