import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../src/contexts/AuthContext";
import { useProfile } from "../src/hooks/useProfile";
import { supabase } from "../src/supabase";
import { photoService } from "../src/services/photoService";
import * as ImagePicker from "expo-image-picker";
import {
  requestCameraPermission,
  requestMediaLibraryPermission,
} from "../src/utils/permissions";

export default function EditProfileScreen() {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [age, setAge] = useState("");
  const [interests, setInterests] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [distancePreference, setDistancePreference] = useState(25);
  const [ageRangeMin, setAgeRangeMin] = useState(18);
  const [ageRangeMax, setAgeRangeMax] = useState(99);
  const [showDistance, setShowDistance] = useState(true);
  const [showAge, setShowAge] = useState(true);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setBio(profile.bio || "");
      setAge(profile.age?.toString() || "");
      setInterests(profile.interests?.join(", ") || "");
      setPhotos(profile.photos || []);
      setDistancePreference(profile.distance_preference || 25);
      setAgeRangeMin(profile.age_range_min || 18);
      setAgeRangeMax(profile.age_range_max || 99);
      setIsActive(profile.is_active);
    }
  }, [profile]);

  const handlePhotoChange = async (index: number) => {
    Alert.alert("Change Photo", "Choose a source", [
      {
        text: "Camera",
        onPress: async () => {
          const hasPermission = await requestCameraPermission();
          if (!hasPermission) return;

          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.8,
          });

          if (!result.canceled && result.assets[0]) {
            await uploadNewPhoto(result.assets[0].uri, index);
          }
        },
      },
      {
        text: "Library",
        onPress: async () => {
          const hasPermission = await requestMediaLibraryPermission();
          if (!hasPermission) return;

          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.8,
          });

          if (!result.canceled && result.assets[0]) {
            await uploadNewPhoto(result.assets[0].uri, index);
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const uploadNewPhoto = async (uri: string, index: number) => {
    if (!user) return;

    setLoading(true);
    try {
      const photoUrl = await photoService.uploadPhoto(user.id, {
        uri,
        id: `photo_${Date.now()}`,
        isUploaded: false,
      });

      if (photoUrl) {
        const newPhotos = [...photos];
        if (index < newPhotos.length) {
          // Delete old photo if replacing
          await photoService.deletePhoto(user.id, newPhotos[index]);
          newPhotos[index] = photoUrl;
        } else {
          newPhotos.push(photoUrl);
        }
        setPhotos(newPhotos);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to upload photo");
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePhoto = async (index: number) => {
    Alert.alert("Remove Photo", "Are you sure you want to remove this photo?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          if (!user) return;

          try {
            await photoService.deletePhoto(user.id, photos[index]);
            setPhotos(photos.filter((_, i) => i !== index));
          } catch (error) {
            Alert.alert("Error", "Failed to remove photo");
          }
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    if (!displayName.trim() || !age.trim()) {
      Alert.alert("Missing Information", "Please fill in required fields.");
      return;
    }

    const parsedAge = parseInt(age);
    if (isNaN(parsedAge) || parsedAge < 18 || parsedAge > 120) {
      Alert.alert("Invalid Age", "Please enter a valid age (18-120).");
      return;
    }

    setLoading(true);
    try {
      // Update profile
      await updateProfile({
        display_name: displayName.trim(),
        bio: bio.trim(),
        age: parsedAge,
        interests: interests
          .split(",")
          .map((i) => i.trim())
          .filter((i) => i),
        photos,
        distance_preference: distancePreference,
        age_range_min: ageRangeMin,
        age_range_max: ageRangeMax,
        is_active: isActive,
      });

      // Update user record
      await supabase
        .from("users")
        .update({
          full_name: displayName.trim(),
          bio: bio.trim(),
          age: parsedAge,
          avatar_url: photos[0] || null,
          preferences: {
            show_distance: showDistance,
            show_age: showAge,
          },
        })
        .eq("id", user.id);

      Alert.alert("Success", "Profile updated successfully!");
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photos</Text>
        <View style={styles.photoGrid}>
          {[...Array(6)].map((_, index) => (
            <TouchableOpacity
              key={index}
              style={styles.photoSlot}
              onPress={() => handlePhotoChange(index)}
              onLongPress={() =>
                index < photos.length && handleRemovePhoto(index)
              }
            >
              {photos[index] ? (
                <>
                  <Image source={{ uri: photos[index] }} style={styles.photo} />
                  {index === 0 && (
                    <Text style={styles.primaryLabel}>Primary</Text>
                  )}
                </>
              ) : (
                <Text style={styles.addPhotoText}>+</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Info</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Display Name *</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            maxLength={30}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Age *</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            placeholder="Your age"
            keyboardType="number-pad"
            maxLength={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell people about yourself..."
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
            value={interests}
            onChangeText={setInterests}
            placeholder="Movies, hiking, coffee... (comma separated)"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Discovery Preferences</Text>

        <View style={styles.preferenceItem}>
          <Text style={styles.preferenceLabel}>
            Maximum Distance: {distancePreference} km
          </Text>
          <TextInput
            style={styles.preferenceInput}
            value={distancePreference.toString()}
            onChangeText={(text) => setDistancePreference(parseInt(text) || 25)}
            keyboardType="number-pad"
            maxLength={3}
          />
        </View>

        <View style={styles.preferenceItem}>
          <Text style={styles.preferenceLabel}>Age Range</Text>
          <View style={styles.ageRange}>
            <TextInput
              style={styles.ageInput}
              value={ageRangeMin.toString()}
              onChangeText={(text) => setAgeRangeMin(parseInt(text) || 18)}
              keyboardType="number-pad"
              maxLength={2}
            />
            <Text style={styles.rangeSeparator}>-</Text>
            <TextInput
              style={styles.ageInput}
              value={ageRangeMax.toString()}
              onChangeText={(text) => setAgeRangeMax(parseInt(text) || 99)}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy Settings</Text>

        <View style={styles.switchItem}>
          <View style={styles.switchLabel}>
            <Text style={styles.switchTitle}>Show My Distance</Text>
            <Text style={styles.switchDescription}>
              Others can see how far away you are
            </Text>
          </View>
          <Switch
            value={showDistance}
            onValueChange={setShowDistance}
            trackColor={{ false: "#ddd", true: "#e84393" }}
            thumbColor={showDistance ? "white" : "#f4f3f4"}
          />
        </View>

        <View style={styles.switchItem}>
          <View style={styles.switchLabel}>
            <Text style={styles.switchTitle}>Show My Age</Text>
            <Text style={styles.switchDescription}>
              Display your age on your profile
            </Text>
          </View>
          <Switch
            value={showAge}
            onValueChange={setShowAge}
            trackColor={{ false: "#ddd", true: "#e84393" }}
            thumbColor={showAge ? "white" : "#f4f3f4"}
          />
        </View>

        <View style={styles.switchItem}>
          <View style={styles.switchLabel}>
            <Text style={styles.switchTitle}>Active Profile</Text>
            <Text style={styles.switchDescription}>
              Show your profile to other users
            </Text>
          </View>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{ false: "#ddd", true: "#e84393" }}
            thumbColor={isActive ? "white" : "#f4f3f4"}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.saveButtonText}>Save Changes</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() =>
          Alert.alert("Delete Profile", "This action cannot be undone")
        }
      >
        <Text style={styles.deleteButtonText}>Delete Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  section: {
    backgroundColor: "white",
    marginTop: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#95a5a6",
    textTransform: "uppercase",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
  },
  photoSlot: {
    width: "30%",
    aspectRatio: 3 / 4,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  addPhotoText: {
    fontSize: 32,
    color: "#b2bec3",
  },
  primaryLabel: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 11,
    color: "white",
    fontWeight: "600",
  },
  inputGroup: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
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
  preferenceItem: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  preferenceLabel: {
    fontSize: 16,
    color: "#2d3436",
    marginBottom: 8,
  },
  preferenceInput: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
    width: 80,
  },
  ageRange: {
    flexDirection: "row",
    alignItems: "center",
  },
  ageInput: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
    width: 60,
  },
  rangeSeparator: {
    fontSize: 18,
    color: "#636e72",
    marginHorizontal: 12,
  },
  switchItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  switchLabel: {
    flex: 1,
    marginRight: 16,
  },
  switchTitle: {
    fontSize: 16,
    color: "#2d3436",
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 13,
    color: "#636e72",
  },
  saveButton: {
    backgroundColor: "#e84393",
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  deleteButton: {
    margin: 20,
    marginTop: 0,
    padding: 16,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#e74c3c",
    fontSize: 16,
    fontWeight: "600",
  },
});


