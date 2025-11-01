import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { bookService } from "../services/bookService";
import { storageService } from "../services/storageService";
import { supabase } from "../supabase";

interface ImportProgress {
  status:
    | "idle"
    | "picking"
    | "uploading"
    | "processing"
    | "complete"
    | "error";
  progress: number;
  message: string;
}

export function useBookImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress>({
    status: "idle",
    progress: 0,
    message: "",
  });

  const importFromDevice = useCallback(async () => {
    try {
      setIsImporting(true);
      setProgress({
        status: "picking",
        progress: 0,
        message: "Select a book file...",
      });

      // Pick file from device
      const file = await storageService.pickBookFile();
      if (!file) {
        setProgress({ status: "idle", progress: 0, message: "" });
        setIsImporting(false);
        return null;
      }

      // Extract basic metadata from filename
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      const parts = nameWithoutExt.split(" - ");
      const title = parts[0] || nameWithoutExt;
      const author = parts[1] || "Unknown Author";

      // Upload file
      setProgress({
        status: "uploading",
        progress: 30,
        message: "Uploading book...",
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const fileUrl = await storageService.uploadBookFile(file, user.id);

      // Create book record
      setProgress({
        status: "processing",
        progress: 70,
        message: "Processing book...",
      });

      // TODO: In a real app, you would parse EPUB/PDF here to extract metadata
      const bookData = {
        title,
        author,
        cover_url: undefined, // Would extract from EPUB/PDF
        total_pages: 300, // Would calculate from actual content
        genre: "Unknown",
        publication_year: new Date().getFullYear(),
      };

      const book = await bookService.createBook(bookData);

      // Download for offline reading
      setProgress({
        status: "processing",
        progress: 90,
        message: "Preparing for offline reading...",
      });
      await storageService.downloadBookFile(fileUrl, book.id);

      setProgress({
        status: "complete",
        progress: 100,
        message: "Book imported successfully!",
      });

      setTimeout(() => {
        setProgress({ status: "idle", progress: 0, message: "" });
      }, 2000);

      return book;
    } catch (error) {
      console.error("Import error:", error);
      setProgress({
        status: "error",
        progress: 0,
        message: error instanceof Error ? error.message : "Import failed",
      });

      Alert.alert(
        "Import Failed",
        error instanceof Error ? error.message : "Failed to import book",
        [{ text: "OK" }]
      );

      return null;
    } finally {
      setIsImporting(false);
    }
  }, []);

  const importFromUrl = useCallback(async (url: string) => {
    try {
      setIsImporting(true);
      setProgress({
        status: "uploading",
        progress: 0,
        message: "Downloading book...",
      });

      // Extract filename from URL
      const urlParts = url.split("/");
      const filename = urlParts[urlParts.length - 1] || "book.epub";
      const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
      const title = nameWithoutExt.replace(/-/g, " ");

      // Create book record with URL
      setProgress({
        status: "processing",
        progress: 50,
        message: "Processing book...",
      });

      const bookData = {
        title,
        author: "Unknown Author",
        cover_url: undefined,
        total_pages: 300, // Would calculate from actual content
        genre: "Unknown",
        publication_year: new Date().getFullYear(),
      };

      const book = await bookService.createBook(bookData);

      // Download for offline reading
      setProgress({
        status: "processing",
        progress: 80,
        message: "Preparing for offline reading...",
      });
      await storageService.downloadBookFile(url, book.id);

      setProgress({
        status: "complete",
        progress: 100,
        message: "Book imported successfully!",
      });

      setTimeout(() => {
        setProgress({ status: "idle", progress: 0, message: "" });
      }, 2000);

      return book;
    } catch (error) {
      console.error("Import error:", error);
      setProgress({
        status: "error",
        progress: 0,
        message: error instanceof Error ? error.message : "Import failed",
      });

      Alert.alert(
        "Import Failed",
        error instanceof Error ? error.message : "Failed to import book",
        [{ text: "OK" }]
      );

      return null;
    } finally {
      setIsImporting(false);
    }
  }, []);

  const resetProgress = useCallback(() => {
    setProgress({ status: "idle", progress: 0, message: "" });
  }, []);

  return {
    isImporting,
    progress,
    importFromDevice,
    importFromUrl,
    resetProgress,
  };
}
