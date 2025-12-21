import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Clipboard,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useVault } from "../../src/contexts/VaultContext";
import { useAuth } from "../../src/contexts/AuthContext";
import { PasswordForm } from "../../src/components/PasswordForm";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { passwordService } from "../../src/services/passwordService";
import { calculatePasswordStrength } from "../../src/utils/passwordStrength";

function PasswordDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { passwords, categories, updatePassword, deletePassword } = useVault();

  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const password = passwords.find((p) => p.id === id);
  const category = password?.categoryId
    ? categories.find((c) => c.id === password.categoryId)
    : null;

  useEffect(() => {
    if (password && user) {
      // Log password access
      passwordService.logPasswordUsage(password.id, user.uid);
    }
  }, [password, user]);

  if (!password) {
    return (
      <View style={styles.container}>
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>Password not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const passwordStrength = calculatePasswordStrength(password.password);

  const handleCopyPassword = async () => {
    await Clipboard.setString(password.password);
    Alert.alert("Copied", "Password copied to clipboard", [
      { text: "OK", style: "default" },
    ]);

    // Auto-clear clipboard after 30 seconds
    setTimeout(() => {
      Clipboard.setString("");
    }, 30000);
  };

  const handleCopyUsername = async () => {
    if (password.username) {
      await Clipboard.setString(password.username);
      Alert.alert("Copied", "Username copied to clipboard");
    }
  };

  const handleUpdate = async (data: Parameters<typeof updatePassword>[1]) => {
    setLoading(true);
    try {
      await updatePassword(password.id, data);
      setIsEditing(false);
    } catch (error: any) {
      Alert.alert(
        "Update Failed",
        error.message || "Failed to update password"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Password",
      `Are you sure you want to delete "${password.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePassword(password.id);
              router.back();
            } catch (error: any) {
              Alert.alert(
                "Delete Failed",
                error.message || "Failed to delete password"
              );
            }
          },
        },
      ]
    );
  };

  const handleOpenWebsite = () => {
    if (password.website) {
      // In a real app, you would use Linking.openURL
      Alert.alert("Open Website", `Would open: ${password.website}`);
    }
  };

  const getTimeSinceUpdate = () => {
    const updated = new Date(password.updatedAt);
    const now = new Date();
    const days = Math.floor(
      (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (days === 0) return "Updated today";
    if (days === 1) return "Updated yesterday";
    if (days < 7) return `Updated ${days} days ago`;
    if (days < 30) return `Updated ${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `Updated ${Math.floor(days / 30)} months ago`;
    return `Updated ${Math.floor(days / 365)} years ago`;
  };

  if (isEditing) {
    return (
      <View style={styles.container}>
        <PasswordForm
          initialData={password}
          categories={categories}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditing(false)}
          submitButtonText="Update Password"
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: category?.color || "#2d3436" },
          ]}
        >
          <Text style={styles.avatarText}>
            {password.title.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.title}>{password.title}</Text>
        {category && (
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: category.color + "20" },
            ]}
          >
            <Text style={[styles.categoryText, { color: category.color }]}>
              {category.name}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        {password.username && (
          <TouchableOpacity style={styles.field} onPress={handleCopyUsername}>
            <Text style={styles.fieldLabel}>Username</Text>
            <View style={styles.fieldValue}>
              <Text style={styles.fieldText}>{password.username}</Text>
              <Text style={styles.copyIcon}>📋</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Password</Text>
          <TouchableOpacity
            style={styles.fieldValue}
            onPress={handleCopyPassword}
          >
            <Text style={[styles.fieldText, styles.passwordText]}>
              {showPassword ? password.password : "••••••••••••"}
            </Text>
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              <Text style={styles.icon}>{showPassword ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
            <Text style={styles.copyIcon}>📋</Text>
          </TouchableOpacity>

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
              style={[styles.strengthText, { color: passwordStrength.color }]}
            >
              {passwordStrength.label}
            </Text>
          </View>
        </View>

        {password.website && (
          <TouchableOpacity style={styles.field} onPress={handleOpenWebsite}>
            <Text style={styles.fieldLabel}>Website</Text>
            <View style={styles.fieldValue}>
              <Text
                style={[styles.fieldText, styles.linkText]}
                numberOfLines={1}
              >
                {password.website}
              </Text>
              <Text style={styles.icon}>🔗</Text>
            </View>
          </TouchableOpacity>
        )}

        {password.notes && (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Notes</Text>
            <Text style={styles.notesText}>{password.notes}</Text>
          </View>
        )}
      </View>

      <View style={styles.metadata}>
        <Text style={styles.metadataText}>
          Created: {new Date(password.createdAt).toLocaleDateString()}
        </Text>
        <Text style={styles.metadataText}>{getTimeSinceUpdate()}</Text>
        {password.lastUsed && (
          <Text style={styles.metadataText}>
            Last used: {new Date(password.lastUsed).toLocaleDateString()}
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(true)}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notFoundText: {
    fontSize: 18,
    color: "#636e72",
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: "#2d3436",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    color: "white",
    fontSize: 36,
    fontWeight: "bold",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d3436",
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    backgroundColor: "white",
    marginTop: 16,
    paddingVertical: 8,
  },
  field: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  fieldLabel: {
    fontSize: 14,
    color: "#636e72",
    marginBottom: 4,
  },
  fieldValue: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fieldText: {
    fontSize: 16,
    color: "#2d3436",
    flex: 1,
  },
  passwordText: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  linkText: {
    color: "#0984e3",
  },
  notesText: {
    fontSize: 16,
    color: "#2d3436",
    lineHeight: 24,
  },
  icon: {
    fontSize: 20,
    marginLeft: 8,
  },
  copyIcon: {
    fontSize: 18,
    marginLeft: 8,
    opacity: 0.6,
  },
  eyeButton: {
    padding: 4,
  },
  strengthContainer: {
    marginTop: 8,
  },
  strengthBar: {
    height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 4,
  },
  strengthFill: {
    height: "100%",
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: "600",
  },
  metadata: {
    padding: 20,
  },
  metadataText: {
    fontSize: 14,
    color: "#636e72",
    marginBottom: 4,
  },
  actions: {
    flexDirection: "row",
    padding: 20,
    paddingTop: 0,
  },
  editButton: {
    flex: 1,
    backgroundColor: "#2d3436",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginRight: 8,
  },
  editButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#e74c3c",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginLeft: 8,
  },
  deleteButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default function PasswordDetail() {
  return (
    <ProtectedRoute>
      <PasswordDetailScreen />
    </ProtectedRoute>
  );
}
