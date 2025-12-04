import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useAuth } from "../../src/contexts/AuthContext";
import { router } from "expo-router";
import { isValidEmail } from "../../src/utils/validators";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Weak Password",
        "Password must be at least 6 characters long"
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password);
      Alert.alert(
        "Registration Successful",
        "Please check your email to verify your account.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert(
        "Registration Failed",
        error.message || "Failed to create account"
      );
    } finally {
      setLoading(false);
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up for SafePocket</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#999"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <View style={styles.passwordInfo}>
            <Text style={styles.infoText}>
              • Password must be at least 6 characters
            </Text>
            <Text style={styles.infoText}>
              • You'll create a separate master password for your vault
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.authButton, loading && styles.authButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.authButtonText}>
              {loading ? "Creating account..." : "Sign Up"}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.back()} disabled={loading}>
              <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
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
  },
  header: {
    padding: 40,
    alignItems: "center",
    backgroundColor: "#2d3436",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#e0e0e0",
  },
  form: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  input: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  passwordInfo: {
    backgroundColor: "#e3f2fd",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  authButton: {
    backgroundColor: "#2d3436",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  authButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  authButtonDisabled: {
    opacity: 0.7,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  footerText: {
    color: "#666",
    fontSize: 14,
    marginRight: 5,
  },
  linkText: {
    color: "#0984e3",
    fontSize: 14,
    fontWeight: "600",
  },
});


