import { supabase } from "../supabase";
import { decode } from "base64-arraybuffer";

export const storageService = {
  // Upload a single image
  async uploadImage(uri: string, bucket = "listings"): Promise<string | null> {
    try {
      // Generate unique filename
      const filename = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.jpg`;

      // Read the image file
      const response = await fetch(uri);
      const blob = await response.blob();

      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = reader.result as string;
          const base64Data = base64.split(",")[1]; // Remove data:image/jpeg;base64, prefix
          resolve(base64Data);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(blob);

      const base64Data = await base64Promise;
      const arrayBuffer = decode(base64Data);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filename, arrayBuffer, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (error) {
        console.error("Error uploading image:", error);
        return null;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error("Error in uploadImage:", error);
      return null;
    }
  },

  // Upload multiple images
  async uploadImages(uris: string[], bucket = "listings"): Promise<string[]> {
    const uploadPromises = uris.map((uri) => this.uploadImage(uri, bucket));
    const results = await Promise.all(uploadPromises);
    return results.filter((url): url is string => url !== null);
  },

  // Delete an image
  async deleteImage(url: string, bucket = "listings"): Promise<boolean> {
    try {
      // Extract filename from URL
      const urlParts = url.split("/");
      const filename = urlParts[urlParts.length - 1];

      const { error } = await supabase.storage.from(bucket).remove([filename]);

      if (error) {
        console.error("Error deleting image:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in deleteImage:", error);
      return false;
    }
  },

  // Delete multiple images
  async deleteImages(urls: string[], bucket = "listings"): Promise<boolean> {
    try {
      const filenames = urls.map((url) => {
        const urlParts = url.split("/");
        return urlParts[urlParts.length - 1];
      });

      const { error } = await supabase.storage.from(bucket).remove(filenames);

      if (error) {
        console.error("Error deleting images:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in deleteImages:", error);
      return false;
    }
  },

  // Create storage bucket (admin only)
  async createBucket(bucketName: string, isPublic = true): Promise<boolean> {
    try {
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: isPublic,
        allowedMimeTypes: [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
        ],
        fileSizeLimit: 10485760, // 10MB
      });

      if (error) {
        // Bucket might already exist
        if (error.message.includes("already exists")) {
          return true;
        }
        console.error("Error creating bucket:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in createBucket:", error);
      return false;
    }
  },
};
