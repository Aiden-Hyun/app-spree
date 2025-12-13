import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface DropdownOption {
  label: string;
  value: string | null;
  color?: string;
}

interface DropdownProps {
  label: string;
  value: string | null;
  placeholder?: string;
  options: DropdownOption[];
  onSelect: (value: string | null) => void;
  disabled?: boolean;
}

export function Dropdown({
  label,
  value,
  placeholder = "Select...",
  options,
  onSelect,
  disabled = false,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption?.label || placeholder;

  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setIsOpen(false);
    });
  };

  const handleSelect = (optionValue: string | null) => {
    onSelect(optionValue);
    handleClose();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.trigger,
          disabled && styles.triggerDisabled,
          isOpen && styles.triggerOpen,
        ]}
        onPress={handleOpen}
        activeOpacity={0.7}
        disabled={disabled}
      >
        {selectedOption?.color && (
          <View
            style={[styles.colorDot, { backgroundColor: selectedOption.color }]}
          />
        )}
        <Text
          style={[
            styles.triggerText,
            !selectedOption && styles.triggerPlaceholder,
            disabled && styles.triggerTextDisabled,
          ]}
        >
          {displayText}
        </Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={20}
          color={disabled ? "#ccc" : "#666"}
        />
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="none" onRequestClose={handleClose}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        >
          <Animated.View
            style={[styles.menuContainer, { opacity: fadeAnim }]}
          >
            <TouchableOpacity activeOpacity={1}>
              <View style={styles.menu}>
                <ScrollView style={styles.menuScroll} nestedScrollEnabled>
                  {options.map((option, index) => {
                    const isSelected = option.value === value;
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.menuItem,
                          isSelected && styles.menuItemSelected,
                        ]}
                        onPress={() => handleSelect(option.value)}
                        activeOpacity={0.7}
                      >
                        {option.color && (
                          <View
                            style={[
                              styles.colorDot,
                              { backgroundColor: option.color },
                            ]}
                          />
                        )}
                        <Text
                          style={[
                            styles.menuItemText,
                            isSelected && styles.menuItemTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                        {isSelected && (
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color="#6c5ce7"
                            style={styles.checkmark}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  triggerOpen: {
    borderColor: "#6c5ce7",
  },
  triggerDisabled: {
    backgroundColor: "#f5f5f5",
    opacity: 0.6,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  triggerText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  triggerPlaceholder: {
    color: "#999",
  },
  triggerTextDisabled: {
    color: "#999",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContainer: {
    width: "85%",
    maxHeight: "70%",
  },
  menu: {
    backgroundColor: "white",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuScroll: {
    maxHeight: 400,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuItemSelected: {
    backgroundColor: "#f8f9fa",
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  menuItemTextSelected: {
    color: "#6c5ce7",
    fontWeight: "600",
  },
  checkmark: {
    marginLeft: 8,
  },
});

