import React from "react";
import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Search books, authors...",
}: SearchBarProps) {
  const handleClear = () => {
    onChangeText("");
  };

  return (
    <View style={styles.container}>
      <Ionicons
        name="search"
        size={20}
        color="#666"
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#999"
        returnKeyType="search"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <Ionicons name="close-circle" size={20} color="#999" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#2d3436",
  },
  clearButton: {
    marginLeft: 8,
  },
});


