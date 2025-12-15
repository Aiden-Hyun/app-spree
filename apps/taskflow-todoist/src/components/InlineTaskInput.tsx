import React, { useEffect, useRef, useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface InlineTaskInputProps {
  onSubmit: (title: string) => Promise<void>;
  onCancel: () => void;
  placeholder?: string;
}

export function InlineTaskInput({
  onSubmit,
  onCancel,
  placeholder = "New Task",
}: InlineTaskInputProps) {
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Auto-focus on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleBlur = async () => {
    // If already submitted via onSubmitEditing, don't submit again
    if (submitted) {
      return;
    }

    // If empty or whitespace-only, just cancel
    if (!title.trim()) {
      onCancel();
      return;
    }

    // Otherwise, save the task
    setSaving(true);
    try {
      await onSubmit(title.trim());
      // Parent will handle hiding this component and showing success
    } catch (error) {
      // On error, keep the input visible so user can retry
      setSaving(false);
      // Re-focus after a brief delay
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleSubmitEditing = async () => {
    if (!title.trim()) {
      onCancel();
      return;
    }

    // Mark as submitted to prevent handleBlur from also submitting
    setSubmitted(true);
    setSaving(true);
    try {
      await onSubmit(title.trim());
    } catch (error) {
      setSaving(false);
      setSubmitted(false); // Reset on error so user can retry
    }
  };

  return (
    <View style={styles.container}>
      {/* Empty checkbox for visual consistency */}
      <View style={styles.checkbox}>
        <View style={styles.checkboxInner} />
      </View>

      {/* Input field */}
      <View style={styles.content}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          onBlur={handleBlur}
          onSubmitEditing={handleSubmitEditing}
          placeholder={placeholder}
          placeholderTextColor="#999"
          editable={!saving}
          blurOnSubmit
          returnKeyType="done"
        />
      </View>

      {/* Trailing area with loading indicator */}
      <View style={styles.trailing}>
        {saving && <ActivityIndicator size="small" color="#6c5ce7" />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  checkbox: {
    marginRight: 12,
  },
  checkboxInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ddd",
  },
  content: {
    flex: 1,
  },
  input: {
    fontSize: 16,
    color: "#333",
    padding: 0,
    margin: 0,
  },
  trailing: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
});

