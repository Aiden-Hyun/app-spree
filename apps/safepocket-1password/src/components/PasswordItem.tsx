import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Clipboard,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { PasswordEntry } from "../contexts/VaultContext";
import { passwordService } from "../services/passwordService";
import { useAuth } from "../contexts/AuthContext";

interface PasswordItemProps {
  password: PasswordEntry;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  category?: { name: string; color: string };
}

export function PasswordItem({
  password,
  onToggleFavorite,
  onDelete,
  category,
}: PasswordItemProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const handleCopyPassword = async () => {
    await Clipboard.setString(password.password);
    Alert.alert("Copied", "Password copied to clipboard", [
      { text: "OK", style: "default" },
    ]);

    // Log usage
    if (user) {
      passwordService.logPasswordUsage(password.id, user.id);
    }

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

  const handleDelete = () => {
    Alert.alert(
      "Delete Password",
      `Are you sure you want to delete "${password.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(password.id),
        },
      ]
    );
  };

  const getInitial = () => {
    return password.title.charAt(0).toUpperCase();
  };

  const getDomainFromUrl = (url?: string) => {
    if (!url) return null;
    try {
      const domain = new URL(url.startsWith("http") ? url : `https://${url}`)
        .hostname;
      return domain.replace("www.", "");
    } catch {
      return null;
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push(`/password/${password.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: category?.color || "#2d3436" },
          ]}
        >
          <Text style={styles.avatarText}>{getInitial()}</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {password.title}
          </Text>

          {password.username && (
            <TouchableOpacity onPress={handleCopyUsername}>
              <Text style={styles.username} numberOfLines={1}>
                {password.username}
              </Text>
            </TouchableOpacity>
          )}

          {password.website && (
            <Text style={styles.website} numberOfLines={1}>
              {getDomainFromUrl(password.website)}
            </Text>
          )}

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

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.actionIcon}>{showPassword ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCopyPassword}
          >
            <Text style={styles.actionIcon}>📋</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onToggleFavorite(password.id)}
          >
            <Text style={styles.actionIcon}>
              {password.isFavorite ? "⭐" : "☆"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {showPassword && (
        <View style={styles.passwordContainer}>
          <Text style={styles.passwordText} selectable>
            {password.password}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    color: "#636e72",
    marginBottom: 2,
  },
  website: {
    fontSize: 12,
    color: "#b2bec3",
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  actionIcon: {
    fontSize: 20,
  },
  passwordContainer: {
    padding: 16,
    paddingTop: 0,
  },
  passwordText: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 14,
    color: "#2d3436",
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
  },
});
