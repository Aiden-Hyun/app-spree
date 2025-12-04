import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
} from "react-native";
import { PasswordEntry, Category } from "../contexts/VaultContext";
import { validatePasswordEntry } from "../utils/validators";
import {
  calculatePasswordStrength,
  generatePassword,
  passwordPresets,
} from "../utils/passwordStrength";

interface PasswordFormProps {
  initialData?: Partial<PasswordEntry>;
  categories: Category[];
  onSubmit: (
    data: Omit<PasswordEntry, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  onCancel: () => void;
  submitButtonText?: string;
}

export function PasswordForm({
  initialData,
  categories,
  onSubmit,
  onCancel,
  submitButtonText = "Save Password",
}: PasswordFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [username, setUsername] = useState(initialData?.username || "");
  const [password, setPassword] = useState(initialData?.password || "");
  const [website, setWebsite] = useState(initialData?.website || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || "");
  const [isFavorite, setIsFavorite] = useState(
    initialData?.isFavorite || false
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [loading, setLoading] = useState(false);

  // Password generator state
  const [genLength, setGenLength] = useState(16);
  const [genOptions, setGenOptions] = useState({
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: false,
    excludeAmbiguous: false,
  });

  const passwordStrength = calculatePasswordStrength(password);
  const validation = validatePasswordEntry({ title, username, website, notes });

  const handleGeneratePassword = () => {
    const newPassword = generatePassword({
      length: genLength,
      ...genOptions,
    });
    setPassword(newPassword);
    setShowPassword(true);
  };

  const applyPreset = (presetName: keyof typeof passwordPresets) => {
    const preset = passwordPresets[presetName];
    setGenLength(preset.length);
    setGenOptions({
      includeUppercase: preset.includeUppercase,
      includeLowercase: preset.includeLowercase,
      includeNumbers: preset.includeNumbers,
      includeSymbols: preset.includeSymbols,
      excludeSimilar: preset.excludeSimilar,
      excludeAmbiguous: preset.excludeAmbiguous,
    });
  };

  const handleSubmit = async () => {
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      Alert.alert("Validation Error", firstError || "Please check your input");
      return;
    }

    if (!password) {
      Alert.alert("Password Required", "Please enter a password");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        title,
        username,
        password,
        website,
        notes,
        categoryId: categoryId || undefined,
        isFavorite,
      });
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save password");
    } finally {
      setLoading(false);
    }
  };

  const formatUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `https://${url}`;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={[
                styles.input,
                validation.errors.title && styles.inputError,
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Google Account"
              autoCapitalize="words"
            />
            {validation.errors.title && (
              <Text style={styles.errorText}>{validation.errors.title}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username / Email</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="e.g., john@example.com"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeIcon}>{showPassword ? "🙈" : "👁️"}</Text>
              </TouchableOpacity>
            </View>

            {password && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBar}>
                  <View
                    style={[
                      styles.strengthFill,
                      {
                        width: `${(passwordStrength.score / 4) * 100}%`,
                        backgroundColor: passwordStrength.color,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.strengthText,
                    { color: passwordStrength.color },
                  ]}
                >
                  {passwordStrength.label}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.generateButton}
              onPress={() => setShowGenerator(!showGenerator)}
            >
              <Text style={styles.generateButtonText}>
                {showGenerator ? "Hide Generator" : "Generate Password"}
              </Text>
            </TouchableOpacity>

            {showGenerator && (
              <View style={styles.generatorContainer}>
                <View style={styles.presetRow}>
                  <TouchableOpacity
                    style={styles.presetButton}
                    onPress={() => applyPreset("memorable")}
                  >
                    <Text style={styles.presetButtonText}>Memorable</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.presetButton}
                    onPress={() => applyPreset("strong")}
                  >
                    <Text style={styles.presetButtonText}>Strong</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.presetButton}
                    onPress={() => applyPreset("maximum")}
                  >
                    <Text style={styles.presetButtonText}>Maximum</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.lengthControl}>
                  <Text style={styles.lengthLabel}>Length: {genLength}</Text>
                  <View style={styles.lengthButtons}>
                    <TouchableOpacity
                      style={styles.lengthButton}
                      onPress={() => setGenLength(Math.max(4, genLength - 1))}
                    >
                      <Text style={styles.lengthButtonText}>-</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.lengthButton}
                      onPress={() => setGenLength(Math.min(64, genLength + 1))}
                    >
                      <Text style={styles.lengthButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.optionsContainer}>
                  <View style={styles.option}>
                    <Text style={styles.optionLabel}>Uppercase (A-Z)</Text>
                    <Switch
                      value={genOptions.includeUppercase}
                      onValueChange={(value) =>
                        setGenOptions({
                          ...genOptions,
                          includeUppercase: value,
                        })
                      }
                    />
                  </View>
                  <View style={styles.option}>
                    <Text style={styles.optionLabel}>Lowercase (a-z)</Text>
                    <Switch
                      value={genOptions.includeLowercase}
                      onValueChange={(value) =>
                        setGenOptions({
                          ...genOptions,
                          includeLowercase: value,
                        })
                      }
                    />
                  </View>
                  <View style={styles.option}>
                    <Text style={styles.optionLabel}>Numbers (0-9)</Text>
                    <Switch
                      value={genOptions.includeNumbers}
                      onValueChange={(value) =>
                        setGenOptions({ ...genOptions, includeNumbers: value })
                      }
                    />
                  </View>
                  <View style={styles.option}>
                    <Text style={styles.optionLabel}>Symbols (!@#$)</Text>
                    <Switch
                      value={genOptions.includeSymbols}
                      onValueChange={(value) =>
                        setGenOptions({ ...genOptions, includeSymbols: value })
                      }
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.generateNowButton}
                  onPress={handleGeneratePassword}
                >
                  <Text style={styles.generateNowButtonText}>Generate</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Website</Text>
            <TextInput
              style={styles.input}
              value={website}
              onChangeText={setWebsite}
              placeholder="e.g., google.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              onBlur={() => setWebsite(formatUrl(website))}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  !categoryId && styles.categoryChipActive,
                ]}
                onPress={() => setCategoryId("")}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    !categoryId && styles.categoryChipTextActive,
                  ]}
                >
                  None
                </Text>
              </TouchableOpacity>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    categoryId === category.id && styles.categoryChipActive,
                    categoryId === category.id && {
                      backgroundColor: category.color,
                    },
                  ]}
                  onPress={() => setCategoryId(category.id)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      categoryId === category.id &&
                        styles.categoryChipTextActive,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional information..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.favoriteContainer}>
            <Text style={styles.label}>Mark as Favorite</Text>
            <Switch value={isFavorite} onValueChange={setIsFavorite} />
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? "Saving..." : submitButtonText}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContent: {
    flexGrow: 1,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#2d3436",
  },
  inputError: {
    borderColor: "#e74c3c",
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 12,
    marginTop: 4,
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: "absolute",
    right: 16,
    top: 16,
  },
  eyeIcon: {
    fontSize: 20,
  },
  strengthContainer: {
    marginTop: 8,
  },
  strengthBar: {
    height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 4,
  },
  strengthFill: {
    height: "100%",
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: "600",
  },
  generateButton: {
    backgroundColor: "#0984e3",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  generateButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  generatorContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  presetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  presetButton: {
    flex: 1,
    backgroundColor: "#e3f2fd",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 4,
  },
  presetButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0984e3",
  },
  lengthControl: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  lengthLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2d3436",
  },
  lengthButtons: {
    flexDirection: "row",
  },
  lengthButton: {
    backgroundColor: "#2d3436",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  lengthButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  optionsContainer: {
    marginBottom: 16,
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  optionLabel: {
    fontSize: 14,
    color: "#2d3436",
  },
  generateNowButton: {
    backgroundColor: "#2d3436",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  generateNowButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  categoryChip: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: "#2d3436",
    borderColor: "#2d3436",
  },
  categoryChipText: {
    fontSize: 14,
    color: "#636e72",
  },
  categoryChipTextActive: {
    color: "white",
  },
  notesInput: {
    minHeight: 80,
    paddingTop: 12,
  },
  favoriteContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  actions: {
    flexDirection: "row",
    padding: 20,
    paddingTop: 0,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#636e72",
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#2d3436",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginLeft: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});


