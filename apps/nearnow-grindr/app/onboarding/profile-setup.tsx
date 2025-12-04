import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { supabase } from "../../src/supabase";

export default function ProfileSetupScreen() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [age, setAge] = useState("");
  const [interests, setInterests] = useState("");
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const lookingForOptions = [
    { id: "chat", label: "Chat", emoji: "💬" },
    { id: "dates", label: "Dates", emoji: "🍷" },
    { id: "friends", label: "Friends", emoji: "👥" },
    { id: "networking", label: "Networking", emoji: "🤝" },
    { id: "relationship", label: "Relationship", emoji: "❤️" },
    { id: "right_now", label: "Right Now", emoji: "⚡" },
  ];

  const toggleLookingFor = (id: string) => {
    setLookingFor((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!displayName.trim() || !age.trim()) {
      Alert.alert(
        "Missing Information",
        "Please fill in your display name and age."
      );
      return;
    }

    const parsedAge = parseInt(age);
    if (isNaN(parsedAge) || parsedAge < 18 || parsedAge > 120) {
      Alert.alert("Invalid Age", "Please enter a valid age (18-120).");
      return;
    }

    setSaving(true);
    try {
      // Create user profile
      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert({
          user_id: user?.id,
          display_name: displayName.trim(),
          bio: bio.trim(),
          age: parsedAge,
          interests: interests
            .split(",")
            .map((i) => i.trim())
            .filter((i) => i),
          looking_for: lookingFor,
        });

      if (profileError) throw profileError;

      // Update user record
      const { error: userError } = await supabase
        .from("users")
        .update({
          full_name: displayName.trim(),
          bio: bio.trim(),
          age: parsedAge,
        })
        .eq("id", user?.id);

      if (userError) throw userError;

      router.push("/onboarding/photo-upload");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Create Your Profile</Text>
        <Text style={styles.subtitle}>Tell us a bit about yourself</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            placeholder="How others will see you"
            value={displayName}
            onChangeText={setDisplayName}
            maxLength={30}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            placeholder="Your age"
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
            maxLength={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell people about yourself..."
            value={bio}
            onChangeText={setBio}
            multiline
            maxLength={500}
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{bio.length}/500</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Interests</Text>
          <TextInput
            style={styles.input}
            placeholder="Movies, hiking, coffee... (comma separated)"
            value={interests}
            onChangeText={setInterests}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Looking For</Text>
          <View style={styles.chips}>
            {lookingForOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.chip,
                  lookingFor.includes(option.id) && styles.chipSelected,
                ]}
                onPress={() => toggleLookingFor(option.id)}
              >
                <Text style={styles.chipEmoji}>{option.emoji}</Text>
                <Text
                  style={[
                    styles.chipText,
                    lookingFor.includes(option.id) && styles.chipTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.buttonText}>
          {saving ? "Saving..." : "Continue"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  contentContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginTop: 40,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2d3436",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#636e72",
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  textArea: {
    minHeight: 100,
    paddingTop: 16,
  },
  charCount: {
    fontSize: 12,
    color: "#95a5a6",
    textAlign: "right",
    marginTop: 4,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e9ecef",
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: "#e84393",
    borderColor: "#e84393",
  },
  chipEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  chipText: {
    fontSize: 14,
    color: "#636e72",
  },
  chipTextSelected: {
    color: "white",
    fontWeight: "500",
  },
  button: {
    backgroundColor: "#e84393",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});


