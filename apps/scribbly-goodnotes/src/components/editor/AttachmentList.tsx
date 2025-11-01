import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Attachment } from "../../types";

interface AttachmentListProps {
  attachments: Attachment[];
  onDelete?: (attachmentId: string) => void;
  onPress?: (attachment: Attachment) => void;
  getAttachmentUrl: (storagePath: string) => string;
}

export function AttachmentList({
  attachments,
  onDelete,
  onPress,
  getAttachmentUrl,
}: AttachmentListProps) {
  if (attachments.length === 0) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (fileType: string): string => {
    if (fileType.startsWith("image/")) return "image";
    if (fileType.startsWith("video/")) return "videocam";
    if (fileType.startsWith("audio/")) return "musical-notes";
    if (fileType.includes("pdf")) return "document";
    if (fileType.includes("word") || fileType.includes("doc"))
      return "document-text";
    if (fileType.includes("sheet") || fileType.includes("excel")) return "grid";
    return "attach";
  };

  const handleDelete = (attachment: Attachment) => {
    Alert.alert(
      "Delete Attachment",
      `Are you sure you want to delete "${attachment.file_name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete?.(attachment.id),
        },
      ]
    );
  };

  const renderAttachment = (attachment: Attachment) => {
    const isImage = attachment.file_type.startsWith("image/");
    const url = getAttachmentUrl(attachment.storage_path);

    return (
      <TouchableOpacity
        key={attachment.id}
        style={styles.attachmentCard}
        onPress={() => onPress?.(attachment)}
      >
        <View style={styles.attachmentContent}>
          {isImage && attachment.thumbnail_path ? (
            <Image
              source={{ uri: getAttachmentUrl(attachment.thumbnail_path) }}
              style={styles.thumbnail}
            />
          ) : isImage ? (
            <Image source={{ uri: url }} style={styles.thumbnail} />
          ) : (
            <View style={styles.iconContainer}>
              <Ionicons
                name={getFileIcon(attachment.file_type) as any}
                size={24}
                color="#00b894"
              />
            </View>
          )}

          <View style={styles.attachmentInfo}>
            <Text style={styles.fileName} numberOfLines={1}>
              {attachment.file_name}
            </Text>
            <Text style={styles.fileSize}>
              {formatFileSize(attachment.file_size)}
            </Text>
          </View>

          {onDelete && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(attachment)}
            >
              <Ionicons name="close-circle" size={20} color="#e74c3c" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attachments</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        {attachments.map(renderAttachment)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7f8c8d",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  scrollView: {
    paddingHorizontal: 16,
  },
  attachmentCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    width: 200,
  },
  attachmentContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: "#fff",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  attachmentInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2c3e50",
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: "#95a5a6",
  },
  deleteButton: {
    padding: 4,
  },
});
