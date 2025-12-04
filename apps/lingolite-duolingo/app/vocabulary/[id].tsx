import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";

function VocabularySessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // This would be used for specific vocabulary sessions tied to lessons
  // For now, redirect to the general practice
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Vocabulary Session: {id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  text: {
    fontSize: 18,
    color: "#2d3436",
  },
});

export default function VocabularySession() {
  return (
    <ProtectedRoute>
      <VocabularySessionScreen />
    </ProtectedRoute>
  );
}


