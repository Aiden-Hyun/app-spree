import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { supabase } from "../supabase";
import { Attachment } from "../types";

export function useAttachments(noteId?: string) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);

  const uploadAttachment = useCallback(
    async (uri: string, fileName: string, fileType: string) => {
      if (!noteId) {
        throw new Error("Note ID is required to upload attachments");
      }

      setUploading(true);
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) throw new Error("User not authenticated");

        // Generate unique file path
        const fileExt = fileName.split(".").pop();
        const filePath = `${user.user.id}/${noteId}/${Date.now()}.${fileExt}`;

        // Read file as blob
        const response = await fetch(uri);
        const blob = await response.blob();

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("attachments")
          .upload(filePath, blob, {
            contentType: fileType,
          });

        if (uploadError) throw uploadError;

        // Get file size
        const fileSize = blob.size;

        // Generate thumbnail for images
        let thumbnailPath: string | undefined;
        if (fileType.startsWith("image/")) {
          // TODO: Implement thumbnail generation
          thumbnailPath = undefined;
        }

        // Save attachment metadata to database
        const { data: attachment, error: dbError } = await supabase
          .from("attachments")
          .insert({
            note_id: noteId,
            user_id: user.user.id,
            file_name: fileName,
            file_type: fileType,
            file_size: fileSize,
            storage_path: filePath,
            thumbnail_path: thumbnailPath,
            metadata: {},
          })
          .select()
          .single();

        if (dbError) throw dbError;

        setAttachments((prev) => [...prev, attachment]);
        return attachment;
      } catch (error) {
        console.error("Error uploading attachment:", error);
        throw error;
      } finally {
        setUploading(false);
      }
    },
    [noteId]
  );

  const deleteAttachment = useCallback(
    async (attachmentId: string) => {
      try {
        const attachment = attachments.find((a) => a.id === attachmentId);
        if (!attachment) return;

        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from("attachments")
          .remove([attachment.storage_path]);

        if (storageError) {
          console.error("Error deleting from storage:", storageError);
        }

        // Delete from database
        const { error: dbError } = await supabase
          .from("attachments")
          .delete()
          .eq("id", attachmentId);

        if (dbError) throw dbError;

        setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      } catch (error) {
        console.error("Error deleting attachment:", error);
        throw error;
      }
    },
    [attachments]
  );

  const getAttachmentUrl = useCallback((storagePath: string): string => {
    const { data } = supabase.storage
      .from("attachments")
      .getPublicUrl(storagePath);
    return data.publicUrl;
  }, []);

  const loadAttachments = useCallback(async () => {
    if (!noteId) return;

    try {
      const { data, error } = await supabase
        .from("attachments")
        .select("*")
        .eq("note_id", noteId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAttachments(data || []);
    } catch (error) {
      console.error("Error loading attachments:", error);
    }
  }, [noteId]);

  return {
    attachments,
    uploading,
    uploadAttachment,
    deleteAttachment,
    getAttachmentUrl,
    loadAttachments,
  };
}


