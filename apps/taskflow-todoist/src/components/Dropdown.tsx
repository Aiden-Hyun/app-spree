import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
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

  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption?.label || placeholder;

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  const handleSelect = (optionValue: string | null) => {
    onSelect(optionValue);
    setIsOpen(false);
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
        onPress={handleToggle}
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

      {isOpen && (
        <View style={styles.menu}>
          <ScrollView 
            style={styles.menuScroll} 
            nestedScrollEnabled
            showsVerticalScrollIndicator={true}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isLastItem = index === options.length - 1;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.menuItem,
                    isSelected && styles.menuItemSelected,
                    isLastItem && styles.menuItemLast,
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    zIndex: 1000,
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
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
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
  menu: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#6c5ce7",
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginTop: -1,
    overflow: "hidden",
  },
  menuScroll: {
    maxHeight: 300,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "white",
  },
  menuItemLast: {
    borderBottomWidth: 0,
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

