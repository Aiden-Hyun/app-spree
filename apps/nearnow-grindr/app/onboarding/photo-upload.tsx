import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { photoService, Photo } from "../../src/services/photoService";
import { supabase } from "../../src/supabase";
import {
  requestCameraPermission,
  requestMediaLibraryPermission,
} from "../../src/utils/permissions";

export default function PhotoUploadScreen() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const maxPhotos = 6;

  useEffect(() => {
    // Create storage bucket if it doesn't exist
    photoService.createStorageBucket();
  }, []);

  const handleAddPhoto = async (source: "camera" | "library") => {
    if (photos.length >= maxPhotos) {
      Alert.alert(
        "Maximum Photos",
        `You can only upload up to ${maxPhotos} photos.`
      );
      return;
    }

    let hasPermission = false;
    if (source === "camera") {
      hasPermission = await requestCameraPermission();
    } else {
      hasPermission = await requestMediaLibraryPermission();
    }

    if (!hasPermission) return;

    const photo =
      source === "camera"
        ? await photoService.takePhoto()
        : await photoService.pickImageFromLibrary();

    if (photo) {
      setPhotos((prev) => [...prev, photo]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFinish = async () => {
    if (photos.length === 0) {
      Alert.alert(
        "No Photos",
        "Add at least one photo to complete your profile.",
        [
          { text: "Add Photo", onPress: () => {} },
          {
            text: "Skip",
            onPress: () => router.replace("/home"),
            style: "destructive",
          },
        ]
      );
      return;
    }

    setUploading(true);
    try {
      // Upload all photos
      const uploadedUrls = await photoService.uploadMultiplePhotos(
        user!.id,
        photos
      );

      if (uploadedUrls.length === 0) {
        throw new Error("Failed to upload photos");
      }

      // Update user profile with photo URLs
      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({
          photos: uploadedUrls,
        })
        .eq("user_id", user!.id);

      if (profileError) throw profileError;

      // Update user avatar with first photo
      const { error: userError } = await supabase
        .from("users")
        .update({
          avatar_url: uploadedUrls[0],
        })
        .eq("id", user!.id);

      if (userError) throw userError;

      // Navigate to home
      router.replace("/home");
    } catch (error: any) {
      Alert.alert("Upload Failed", error.message || "Failed to upload photos");
    } finally {
      setUploading(false);
    }
  };

  const renderPhotoSlot = (index: number) => {
    const photo = photos[index];

    if (photo) {
      return (
        <TouchableOpacity
          style={styles.photoSlot}
          onPress={() => handleRemovePhoto(index)}
        >
          <Image source={{ uri: photo.uri }} style={styles.photo} />
          <View style={styles.removeButton}>
            <Text style={styles.removeButtonText}>×</Text>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.photoSlot, styles.emptySlot]}
        onPress={() => {
          Alert.alert("Add Photo", "Choose a source", [
            { text: "Camera", onPress: () => handleAddPhoto("camera") },
            { text: "Library", onPress: () => handleAddPhoto("library") },
            { text: "Cancel", style: "cancel" },
          ]);
        }}
      >
        <Text style={styles.addIcon}>+</Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Add Photos</Text>
        <Text style={styles.subtitle}>
          Add up to {maxPhotos} photos to your profile
        </Text>
      </View>

      <View style={styles.photoGrid}>
        {[...Array(6)].map((_, index) => (
          <View key={index} style={styles.photoSlotContainer}>
            {renderPhotoSlot(index)}
            {index === 0 && photos[0] && (
              <Text style={styles.primaryLabel}>Primary</Text>
            )}
          </View>
        ))}
      </View>

      <View style={styles.tips}>
        <Text style={styles.tipsTitle}>Photo Tips</Text>
        <Text style={styles.tip}>• Use clear, recent photos of yourself</Text>
        <Text style={styles.tip}>• Show your face in your primary photo</Text>
        <Text style={styles.tip}>
          • Variety helps - different angles and settings
        </Text>
        <Text style={styles.tip}>• Avoid group photos as your primary</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, uploading && styles.buttonDisabled]}
        onPress={handleFinish}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>
            {photos.length === 0 ? "Skip for Now" : "Finish"}
          </Text>
        )}
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
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  photoSlotContainer: {
    width: "31%",
    marginBottom: 16,
  },
  photoSlot: {
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  emptySlot: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderStyle: "dashed",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  addIcon: {
    fontSize: 32,
    color: "#b2bec3",
  },
  removeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    lineHeight: 20,
  },
  primaryLabel: {
    fontSize: 12,
    color: "#e84393",
    fontWeight: "600",
    textAlign: "center",
    marginTop: 4,
  },
  tips: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 8,
  },
  tip: {
    fontSize: 14,
    color: "#636e72",
    marginBottom: 4,
  },
  button: {
    backgroundColor: "#e84393",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: "auto",
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
