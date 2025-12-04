import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Notebook, CreateNotebookInput } from "../../types";

interface NotebookModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (input: CreateNotebookInput) => Promise<void>;
  notebook?: Notebook | null; // For editing
  isFolder?: boolean;
}

const COLORS = [
  "#00b894",
  "#00cec9",
  "#6c5ce7",
  "#a29bfe",
  "#fd79a8",
  "#e17055",
  "#fdcb6e",
  "#55a3ff",
  "#48dbfb",
  "#1dd1a1",
  "#ff6b6b",
  "#4834d4",
];

const ICONS = [
  "book",
  "briefcase",
  "school",
  "heart",
  "star",
  "flag",
  "rocket",
  "bulb",
  "leaf",
  "fitness",
  "camera",
  "musical-notes",
];

export function NotebookModal({
  visible,
  onClose,
  onSave,
  notebook,
  isFolder = false,
}: NotebookModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState(isFolder ? "folder" : ICONS[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (notebook) {
      setTitle(notebook.title);
      setDescription(notebook.description || "");
      setColor(notebook.color);
      setIcon(notebook.icon);
    } else {
      // Reset form for new notebook
      setTitle("");
      setDescription("");
      setColor(COLORS[0]);
      setIcon(isFolder ? "folder" : ICONS[0]);
    }
  }, [notebook, isFolder]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }

    setLoading(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        color,
        icon,
        is_folder: isFolder,
      });
      onClose();
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to save notebook"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.backdrop} onTouchEnd={onClose} />

        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {notebook ? "Edit" : "New"} {isFolder ? "Folder" : "Notebook"}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#2c3e50" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder={`${isFolder ? "Folder" : "Notebook"} name`}
                placeholderTextColor="#95a5a6"
                autoFocus
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Add a description..."
                placeholderTextColor="#95a5a6"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Color</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.colorList}
              >
                {COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorOption,
                      { backgroundColor: c },
                      color === c && styles.colorSelected,
                    ]}
                    onPress={() => setColor(c)}
                  >
                    {color === c && (
                      <Ionicons name="checkmark" size={20} color="#fff" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {!isFolder && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Icon</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.iconList}
                >
                  {ICONS.map((i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.iconOption,
                        icon === i && styles.iconSelected,
                      ]}
                      onPress={() => setIcon(i)}
                    >
                      <Ionicons
                        name={i as any}
                        size={24}
                        color={icon === i ? color : "#7f8c8d"}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.preview}>
              <Text style={styles.previewLabel}>Preview</Text>
              <View style={[styles.previewCard, { borderLeftColor: color }]}>
                <View
                  style={[
                    styles.previewIcon,
                    { backgroundColor: color + "20" },
                  ]}
                >
                  <Ionicons name={icon as any} size={24} color={color} />
                </View>
                <View style={styles.previewContent}>
                  <Text style={styles.previewTitle}>
                    {title || `${isFolder ? "Folder" : "Notebook"} Title`}
                  </Text>
                  {description ? (
                    <Text style={styles.previewDescription} numberOfLines={2}>
                      {description}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.saveButton,
                { backgroundColor: color },
              ]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? "Saving..." : notebook ? "Update" : "Create"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2c3e50",
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#7f8c8d",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#2c3e50",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  colorList: {
    flexDirection: "row",
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  colorSelected: {
    transform: [{ scale: 1.1 }],
  },
  iconList: {
    flexDirection: "row",
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  iconSelected: {
    backgroundColor: "#ecf0f1",
    borderWidth: 2,
    borderColor: "#00b894",
  },
  preview: {
    marginTop: 20,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#7f8c8d",
    marginBottom: 8,
  },
  previewCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 4,
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  previewContent: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 4,
  },
  previewDescription: {
    fontSize: 14,
    color: "#7f8c8d",
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#ecf0f1",
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#ecf0f1",
    marginRight: 10,
  },
  saveButton: {
    marginLeft: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#7f8c8d",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});


