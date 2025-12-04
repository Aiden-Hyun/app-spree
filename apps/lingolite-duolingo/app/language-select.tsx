import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useAuth } from "../src/contexts/AuthContext";
import { ProtectedRoute } from "../src/components/ProtectedRoute";
import { router } from "expo-router";
import { supabase } from "../src/supabase";

interface Language {
  id: string;
  code: string;
  name: string;
  flag_emoji: string;
  is_active: boolean;
}

interface UserLanguage {
  id: string;
  language_id: string;
  level: number;
  xp: number;
  is_learning: boolean;
}

function LanguageSelectScreen() {
  const { user } = useAuth();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [userLanguages, setUserLanguages] = useState<UserLanguage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLanguages();
    fetchUserLanguages();
  }, []);

  const fetchLanguages = async () => {
    try {
      const { data, error } = await supabase
        .from("languages")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setLanguages(data || []);
    } catch (error) {
      console.error("Error fetching languages:", error);
      Alert.alert("Error", "Failed to load languages");
    }
  };

  const fetchUserLanguages = async () => {
    try {
      const { data, error } = await supabase
        .from("user_languages")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_learning", true);

      if (error) throw error;
      setUserLanguages(data || []);
    } catch (error) {
      console.error("Error fetching user languages:", error);
    } finally {
      setLoading(false);
    }
  };

  const isLearning = (languageId: string) => {
    return userLanguages.some((ul) => ul.language_id === languageId);
  };

  const handleSelectLanguage = async (language: Language) => {
    if (isLearning(language.id)) {
      // Language already being learned, just go back
      router.back();
      return;
    }

    try {
      // Add language to user's learning list
      const { error } = await supabase.from("user_languages").insert({
        user_id: user?.id,
        language_id: language.id,
        level: 1,
        xp: 0,
        is_learning: true,
      });

      if (error) throw error;

      Alert.alert("Success!", `You've started learning ${language.name}! 🎉`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Error selecting language:", error);
      Alert.alert("Error", "Failed to add language");
    }
  };

  const handleRemoveLanguage = async (language: Language) => {
    Alert.alert(
      "Remove Language",
      `Are you sure you want to stop learning ${language.name}? Your progress will be saved.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("user_languages")
                .update({ is_learning: false })
                .eq("user_id", user?.id)
                .eq("language_id", language.id);

              if (error) throw error;
              await fetchUserLanguages();
            } catch (error) {
              console.error("Error removing language:", error);
              Alert.alert("Error", "Failed to remove language");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading languages...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Language</Text>
        <Text style={styles.subtitle}>
          Select a language to start learning or manage your current languages
        </Text>
      </View>

      {userLanguages.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Currently Learning</Text>
          {languages
            .filter((lang) => isLearning(lang.id))
            .map((language) => {
              const userLang = userLanguages.find(
                (ul) => ul.language_id === language.id
              );
              return (
                <TouchableOpacity
                  key={language.id}
                  style={[styles.languageCard, styles.activeLanguageCard]}
                  onPress={() => router.back()}
                >
                  <Text style={styles.languageFlag}>{language.flag_emoji}</Text>
                  <View style={styles.languageInfo}>
                    <Text style={styles.languageName}>{language.name}</Text>
                    <Text style={styles.languageProgress}>
                      Level {userLang?.level} • {userLang?.xp} XP
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveLanguage(language)}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Languages</Text>
        {languages
          .filter((lang) => !isLearning(lang.id))
          .map((language) => (
            <TouchableOpacity
              key={language.id}
              style={styles.languageCard}
              onPress={() => handleSelectLanguage(language)}
            >
              <Text style={styles.languageFlag}>{language.flag_emoji}</Text>
              <View style={styles.languageInfo}>
                <Text style={styles.languageName}>{language.name}</Text>
                <Text style={styles.languageStatus}>Tap to start learning</Text>
              </View>
              <Text style={styles.selectArrow}>›</Text>
            </TouchableOpacity>
          ))}
      </View>

      {languages.filter((lang) => !lang.is_active).length > 0 && (
        <View style={styles.comingSoonSection}>
          <Text style={styles.comingSoonTitle}>Coming Soon</Text>
          <Text style={styles.comingSoonText}>
            Japanese, Korean, and Chinese will be available in future updates!
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d3436",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    lineHeight: 22,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 16,
  },
  languageCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeLanguageCard: {
    borderWidth: 2,
    borderColor: "#00b894",
  },
  languageFlag: {
    fontSize: 40,
    marginRight: 16,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 4,
  },
  languageStatus: {
    fontSize: 14,
    color: "#666",
  },
  languageProgress: {
    fontSize: 14,
    color: "#00b894",
    fontWeight: "500",
  },
  selectArrow: {
    fontSize: 24,
    color: "#00b894",
    fontWeight: "300",
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#fee",
  },
  removeButtonText: {
    color: "#e74c3c",
    fontSize: 14,
    fontWeight: "600",
  },
  comingSoonSection: {
    padding: 20,
    paddingTop: 0,
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: "#999",
    lineHeight: 20,
  },
});

export default function LanguageSelect() {
  return (
    <ProtectedRoute>
      <LanguageSelectScreen />
    </ProtectedRoute>
  );
}


