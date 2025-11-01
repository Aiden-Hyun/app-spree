import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ReaderControlsProps {
  fontSize: number;
  theme: "light" | "dark" | "sepia";
  onFontSizeChange: (size: number) => void;
  onThemeChange: (theme: "light" | "dark" | "sepia") => void;
  onSettingsPress: () => void;
  color: string;
}

export function ReaderControls({
  fontSize,
  theme,
  onFontSizeChange,
  onThemeChange,
  onSettingsPress,
  color,
}: ReaderControlsProps) {
  const handleFontSizeChange = (change: number) => {
    const newSize = fontSize + change;
    if (newSize >= 12 && newSize <= 32) {
      onFontSizeChange(newSize);
    }
  };

  return (
    <View style={styles.container}>
      {/* Font Size Controls */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color }]}>Font Size</Text>
        <View style={styles.fontSizeControls}>
          <TouchableOpacity
            style={styles.fontButton}
            onPress={() => handleFontSizeChange(-2)}
          >
            <Text style={[styles.fontButtonText, { color }]}>A-</Text>
          </TouchableOpacity>
          <Text style={[styles.fontSizeLabel, { color }]}>{fontSize}</Text>
          <TouchableOpacity
            style={styles.fontButton}
            onPress={() => handleFontSizeChange(2)}
          >
            <Text style={[styles.fontButtonText, { color }]}>A+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Theme Selector */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color }]}>Theme</Text>
        <View style={styles.themeSelector}>
          <TouchableOpacity
            style={[
              styles.themeButton,
              styles.lightTheme,
              theme === "light" && styles.selectedTheme,
            ]}
            onPress={() => onThemeChange("light")}
          >
            <Text style={styles.themeLabel}>Light</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.themeButton,
              styles.sepiaTheme,
              theme === "sepia" && styles.selectedTheme,
            ]}
            onPress={() => onThemeChange("sepia")}
          >
            <Text style={[styles.themeLabel, { color: "#5c4b37" }]}>Sepia</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.themeButton,
              styles.darkTheme,
              theme === "dark" && styles.selectedTheme,
            ]}
            onPress={() => onThemeChange("dark")}
          >
            <Text style={[styles.themeLabel, { color: "#e0e0e0" }]}>Dark</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* More Settings */}
      <TouchableOpacity style={styles.moreButton} onPress={onSettingsPress}>
        <Ionicons name="settings-outline" size={24} color={color} />
        <Text style={[styles.moreButtonText, { color }]}>More Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  fontSizeControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  fontButton: {
    padding: 12,
  },
  fontButtonText: {
    fontSize: 20,
    fontWeight: "600",
  },
  fontSizeLabel: {
    fontSize: 18,
    minWidth: 30,
    textAlign: "center",
  },
  themeSelector: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  themeButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
    minWidth: 80,
    alignItems: "center",
  },
  lightTheme: {
    backgroundColor: "#ffffff",
    borderColor: "#ddd",
  },
  sepiaTheme: {
    backgroundColor: "#f4ecd8",
  },
  darkTheme: {
    backgroundColor: "#1a1a1a",
  },
  selectedTheme: {
    borderColor: "#3498db",
  },
  themeLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  moreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  moreButtonText: {
    fontSize: 16,
  },
});
