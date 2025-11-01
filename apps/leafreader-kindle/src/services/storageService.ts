import { supabase } from "../supabase";
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";

export interface BookFile {
  uri: string;
  name: string;
  size: number;
  mimeType?: string;
}

export const storageService = {
  // Upload book file to Supabase Storage
  async uploadBookFile(file: BookFile, userId: string): Promise<string> {
    try {
      // Create a unique file name
      const timestamp = Date.now();
      const fileExtension = file.name.split(".").pop() || "epub";
      const fileName = `${userId}/${timestamp}.${fileExtension}`;

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to ArrayBuffer
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("books")
        .upload(fileName, bytes.buffer, {
          contentType: file.mimeType || "application/octet-stream",
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("books").getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading book:", error);
      throw error;
    }
  },

  // Download book file for offline reading
  async downloadBookFile(url: string, bookId: string): Promise<string> {
    try {
      const localUri = `${FileSystem.documentDirectory}books/${bookId}.epub`;

      // Create directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(
        `${FileSystem.documentDirectory}books`
      );
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(
          `${FileSystem.documentDirectory}books`,
          {
            intermediates: true,
          }
        );
      }

      // Download file
      const downloadResult = await FileSystem.downloadAsync(url, localUri);
      return downloadResult.uri;
    } catch (error) {
      console.error("Error downloading book:", error);
      throw error;
    }
  },

  // Check if book is downloaded locally
  async isBookDownloaded(bookId: string): Promise<boolean> {
    try {
      const localUri = `${FileSystem.documentDirectory}books/${bookId}.epub`;
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      return fileInfo.exists;
    } catch (error) {
      return false;
    }
  },

  // Get local book file URI
  async getLocalBookUri(bookId: string): Promise<string | null> {
    try {
      const localUri = `${FileSystem.documentDirectory}books/${bookId}.epub`;
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      return fileInfo.exists ? localUri : null;
    } catch (error) {
      return null;
    }
  },

  // Delete local book file
  async deleteLocalBook(bookId: string): Promise<void> {
    try {
      const localUri = `${FileSystem.documentDirectory}books/${bookId}.epub`;
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(localUri);
      }
    } catch (error) {
      console.error("Error deleting local book:", error);
    }
  },

  // Delete book from Supabase Storage
  async deleteBookFromStorage(filePath: string): Promise<void> {
    try {
      const { error } = await supabase.storage.from("books").remove([filePath]);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting book from storage:", error);
      throw error;
    }
  },

  // Pick book file from device
  async pickBookFile(): Promise<BookFile | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/epub+zip", "application/pdf", "text/plain"],
        copyToCacheDirectory: true,
      });

      if (result.type === "success") {
        return {
          uri: result.uri,
          name: result.name,
          size: result.size || 0,
          mimeType: result.mimeType,
        };
      }

      return null;
    } catch (error) {
      console.error("Error picking file:", error);
      throw error;
    }
  },

  // Get total cache size
  async getCacheSize(): Promise<number> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(
        `${FileSystem.documentDirectory}books`
      );
      if (!dirInfo.exists) return 0;

      const files = await FileSystem.readDirectoryAsync(
        `${FileSystem.documentDirectory}books`
      );
      let totalSize = 0;

      for (const file of files) {
        const fileInfo = await FileSystem.getInfoAsync(
          `${FileSystem.documentDirectory}books/${file}`
        );
        if (fileInfo.exists && "size" in fileInfo) {
          totalSize += fileInfo.size;
        }
      }

      return totalSize;
    } catch (error) {
      return 0;
    }
  },

  // Clear cache
  async clearCache(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(
        `${FileSystem.documentDirectory}books`
      );
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(`${FileSystem.documentDirectory}books`, {
          idempotent: true,
        });
      }
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  },

  // Format file size for display
  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },
};
