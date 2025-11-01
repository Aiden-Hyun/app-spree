import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { highlightService } from "../../services/highlightService";

interface HighlightMenuProps {
  visible: boolean;
  onClose: () => void;
  selection: {
    text: string;
    start: number;
    end: number;
  };
  bookId: string;
  pageNumber: number;
  onHighlightCreated: () => void;
}

export function HighlightMenu({
  visible,
  onClose,
  selection,
  bookId,
  pageNumber,
  onHighlightCreated,
}: HighlightMenuProps) {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [note, setNote] = useState("");
  const [selectedColor, setSelectedColor] = useState("yellow");

  const colors = highlightService.getHighlightColors();

  const handleCreateHighlight = async () => {
    try {
      await highlightService.createHighlight({
        book_id: bookId,
        page_number: pageNumber,
        start_position: selection.start,
        end_position: selection.end,
        text_content: selection.text,
        color: selectedColor,
        note: note.trim() || undefined,
      });

      onHighlightCreated();
      resetAndClose();
    } catch (error) {
      console.error("Error creating highlight:", error);
    }
  };

  const resetAndClose = () => {
    setShowNoteInput(false);
    setNote("");
    setSelectedColor("yellow");
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={resetAndClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={resetAndClose}
      >
        <View style={styles.container} onStartShouldSetResponder={() => true}>
          {!showNoteInput ? (
            <>
              {/* Color Selection */}
              <View style={styles.colorSection}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.colorList}
                >
                  {colors.map((color) => (
                    <TouchableOpacity
                      key={color.value}
                      style={[
                        styles.colorButton,
                        selectedColor === color.value &&
                          styles.colorButtonActive,
                      ]}
                      onPress={() => setSelectedColor(color.value)}
                    >
                      <View
                        style={[
                          styles.colorCircle,
                          { backgroundColor: color.hex },
                        ]}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Action Buttons */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setShowNoteInput(true)}
                >
                  <Ionicons name="create-outline" size={20} color="#2d3436" />
                  <Text style={styles.actionText}>Add Note</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.highlightButton]}
                  onPress={handleCreateHighlight}
                >
                  <Ionicons name="color-palette" size={20} color="white" />
                  <Text style={[styles.actionText, styles.highlightButtonText]}>
                    Highlight
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {/* Note Input */}
              <View style={styles.noteSection}>
                <Text style={styles.noteTitle}>Add a note</Text>
                <TextInput
                  style={styles.noteInput}
                  placeholder="Type your note here..."
                  value={note}
                  onChangeText={setNote}
                  multiline
                  autoFocus
                />
              </View>

              {/* Note Actions */}
              <View style={styles.noteActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowNoteInput(false);
                    setNote("");
                  }}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleCreateHighlight}
                >
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Selected Text Preview */}
          <View style={styles.preview}>
            <Text style={styles.previewText} numberOfLines={2}>
              "{selection.text}"
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "90%",
    maxWidth: 400,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  colorSection: {
    marginBottom: 20,
  },
  colorList: {
    flexDirection: "row",
    paddingVertical: 10,
  },
  colorButton: {
    padding: 8,
    marginHorizontal: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorButtonActive: {
    borderColor: "#2d3436",
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f0f3f7",
    gap: 8,
  },
  highlightButton: {
    backgroundColor: "#2d3436",
  },
  actionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3436",
  },
  highlightButtonText: {
    color: "white",
  },
  noteSection: {
    marginBottom: 20,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 12,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  noteActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelButton: {
    padding: 12,
    paddingHorizontal: 24,
  },
  cancelText: {
    fontSize: 16,
    color: "#666",
  },
  saveButton: {
    backgroundColor: "#2d3436",
    padding: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  saveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  preview: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  previewText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
});
