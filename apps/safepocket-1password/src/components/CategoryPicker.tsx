import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
  Alert,
} from "react-native";
import { Category } from "../contexts/VaultContext";
import { validateCategoryName } from "../utils/validators";

interface CategoryPickerProps {
  visible: boolean;
  categories: Category[];
  selectedCategoryId?: string;
  onSelect: (categoryId: string | undefined) => void;
  onClose: () => void;
  onCreateCategory?: (
    category: Omit<Category, "id" | "createdAt">
  ) => Promise<void>;
}

const PRESET_COLORS = [
  "#0984e3", // Blue
  "#00b894", // Green
  "#fdcb6e", // Yellow
  "#e17055", // Orange
  "#a29bfe", // Purple
  "#fd79a8", // Pink
  "#636e72", // Gray
  "#2d3436", // Dark Gray
];

export function CategoryPicker({
  visible,
  categories,
  selectedCategoryId,
  onSelect,
  onClose,
  onCreateCategory,
}: CategoryPickerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [creating, setCreating] = useState(false);

  const handleCreateCategory = async () => {
    const error = validateCategoryName(newCategoryName);
    if (error) {
      Alert.alert("Invalid Name", error);
      return;
    }

    if (!onCreateCategory) return;

    setCreating(true);
    try {
      await onCreateCategory({
        name: newCategoryName,
        color: selectedColor,
      });
      setNewCategoryName("");
      setSelectedColor(PRESET_COLORS[0]);
      setShowCreateForm(false);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create category");
    } finally {
      setCreating(false);
    }
  };

  const renderCategory = ({ item }: { item: Category | null }) => {
    const isSelected = item?.id === selectedCategoryId;

    if (item === null) {
      // "None" option
      return (
        <TouchableOpacity
          style={[
            styles.categoryItem,
            !selectedCategoryId && styles.selectedItem,
          ]}
          onPress={() => {
            onSelect(undefined);
            onClose();
          }}
        >
          <View style={[styles.categoryColor, { backgroundColor: "#ddd" }]} />
          <Text style={styles.categoryName}>None</Text>
          {!selectedCategoryId && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.categoryItem, isSelected && styles.selectedItem]}
        onPress={() => {
          onSelect(item.id);
          onClose();
        }}
      >
        <View style={[styles.categoryColor, { backgroundColor: item.color }]} />
        <Text style={styles.categoryName}>{item.name}</Text>
        {isSelected && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
    );
  };

  const allItems = [null, ...categories]; // null represents "None" option

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Category</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {!showCreateForm ? (
            <>
              <FlatList
                data={allItems}
                keyExtractor={(item) => item?.id || "none"}
                renderItem={renderCategory}
                style={styles.list}
              />

              {onCreateCategory && (
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => setShowCreateForm(true)}
                >
                  <Text style={styles.createButtonText}>
                    + Create New Category
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.createForm}>
              <Text style={styles.formLabel}>Category Name</Text>
              <TextInput
                style={styles.input}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholder="Enter category name"
                autoFocus
              />

              <Text style={styles.formLabel}>Color</Text>
              <View style={styles.colorGrid}>
                {PRESET_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.selectedColor,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  />
                ))}
              </View>

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowCreateForm(false);
                    setNewCategoryName("");
                    setSelectedColor(PRESET_COLORS[0]);
                  }}
                  disabled={creating}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    creating && styles.saveButtonDisabled,
                  ]}
                  onPress={handleCreateCategory}
                  disabled={creating}
                >
                  <Text style={styles.saveButtonText}>
                    {creating ? "Creating..." : "Create"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2d3436",
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 24,
    color: "#636e72",
  },
  list: {
    maxHeight: 400,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  selectedItem: {
    backgroundColor: "#f8f9fa",
  },
  categoryColor: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 16,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    color: "#2d3436",
  },
  checkmark: {
    fontSize: 18,
    color: "#0984e3",
  },
  createButton: {
    margin: 20,
    padding: 16,
    backgroundColor: "#0984e3",
    borderRadius: 12,
    alignItems: "center",
  },
  createButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  createForm: {
    padding: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "transparent",
  },
  selectedColor: {
    borderColor: "#2d3436",
  },
  formButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#636e72",
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#2d3436",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "600",
  },
});
