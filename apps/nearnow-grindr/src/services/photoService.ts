import * as ImagePicker from "expo-image-picker";
import { supabase } from "../supabase";
import { Alert } from "react-native";

export interface Photo {
  uri: string;
  id?: string;
  isUploaded?: boolean;
}

export class PhotoService {
  private static instance: PhotoService;

  private constructor() {}

  static getInstance(): PhotoService {
    if (!PhotoService.instance) {
      PhotoService.instance = new PhotoService();
    }
    return PhotoService.instance;
  }

  async pickImageFromLibrary(): Promise<Photo | null> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return {
          uri: result.assets[0].uri,
          id: `photo_${Date.now()}`,
          isUploaded: false,
        };
      }

      return null;
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image from library");
      return null;
    }
  }

  async takePhoto(): Promise<Photo | null> {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return {
          uri: result.assets[0].uri,
          id: `photo_${Date.now()}`,
          isUploaded: false,
        };
      }

      return null;
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
      return null;
    }
  }

  async uploadPhoto(userId: string, photo: Photo): Promise<string | null> {
    try {
      const fileExt = photo.uri.split(".").pop() || "jpg";
      const fileName = `${userId}/${photo.id}.${fileExt}`;

      // Convert URI to blob
      const response = await fetch(photo.uri);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("profile-photos")
        .upload(fileName, blob, {
          contentType: `image/${fileExt}`,
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-photos").getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      console.error("Error uploading photo:", error);
      Alert.alert("Upload Failed", error.message || "Failed to upload photo");
      return null;
    }
  }

  async uploadMultiplePhotos(
    userId: string,
    photos: Photo[]
  ): Promise<string[]> {
    const uploadPromises = photos.map((photo) =>
      this.uploadPhoto(userId, photo)
    );
    const results = await Promise.all(uploadPromises);
    return results.filter((url): url is string => url !== null);
  }

  async deletePhoto(userId: string, photoUrl: string): Promise<boolean> {
    try {
      // Extract file path from URL
      const urlParts = photoUrl.split("/");
      const fileName = urlParts.slice(-2).join("/");

      const { error } = await supabase.storage
        .from("profile-photos")
        .remove([fileName]);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error("Error deleting photo:", error);
      return false;
    }
  }

  async createStorageBucket(): Promise<void> {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();

      if (!buckets?.find((bucket) => bucket.name === "profile-photos")) {
        const { error } = await supabase.storage.createBucket(
          "profile-photos",
          {
            public: true,
            allowedMimeTypes: [
              "image/jpeg",
              "image/jpg",
              "image/png",
              "image/webp",
            ],
            fileSizeLimit: 5242880, // 5MB
          }
        );

        if (error && !error.message.includes("already exists")) {
          throw error;
        }
      }
    } catch (error) {
      console.error("Error creating storage bucket:", error);
    }
  }
}

export const photoService = PhotoService.getInstance();
