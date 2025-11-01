import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCategories } from "../../src/hooks/useCategories";
import { ImagePickerComponent } from "../../src/components/common/ImagePicker";
import { LocationPicker } from "../../src/components/common/LocationPicker";
import { listingService } from "../../src/services/listing.service";
import { storageService } from "../../src/services/storage.service";

const CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"];

export default function CreateListingScreen() {
  const { categories } = useCategories();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [condition, setCondition] = useState<
    "new" | "like_new" | "good" | "fair" | "poor"
  >("good");
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    name: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title || !price || !selectedCategory) {
      Alert.alert("Missing Information", "Please fill in all required fields");
      return;
    }

    if (images.length === 0) {
      Alert.alert(
        "No Images",
        "Please add at least one image for your listing"
      );
      return;
    }

    setSubmitting(true);
    try {
      // Upload images first
      const uploadedImageUrls = await storageService.uploadImages(images);

      if (uploadedImageUrls.length === 0) {
        throw new Error("Failed to upload images");
      }

      // Create listing
      const listing = await listingService.createListing({
        title,
        description,
        price: parseFloat(price),
        category_id: selectedCategory,
        condition,
        images: uploadedImageUrls,
        location_name: location?.name,
        location_lat: location?.latitude,
        location_lng: location?.longitude,
      });

      if (listing) {
        Alert.alert("Success", "Your listing has been created!", [
          {
            text: "OK",
            onPress: () => router.replace(`/listing/${listing.id}`),
          },
        ]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to create listing. Please try again.");
      console.error("Error creating listing:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Create New Listing</Text>
          <Text style={styles.subtitle}>
            Sell your items quickly and easily
          </Text>
        </View>

        <View style={styles.form}>
          {/* Images Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <Text style={styles.sectionHint}>Add up to 8 photos</Text>
            <ImagePickerComponent
              images={images}
              onImagesChange={setImages}
              maxImages={8}
            />
          </View>

          {/* Title Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="What are you selling?"
              value={title}
              onChangeText={setTitle}
              maxLength={80}
            />
            <Text style={styles.charCount}>{title.length}/80</Text>
          </View>

          {/* Category Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoryList}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryItem,
                      selectedCategory === category.id &&
                        styles.categoryItemActive,
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <MaterialCommunityIcons
                      name={(category.icon || "tag") as any}
                      size={24}
                      color={
                        selectedCategory === category.id ? "white" : "#00b894"
                      }
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        selectedCategory === category.id &&
                          styles.categoryTextActive,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Price Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price *</Text>
            <View style={styles.priceInput}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.priceField}
                placeholder="0.00"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Condition Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Condition</Text>
            <View style={styles.conditionList}>
              {CONDITIONS.map((cond) => (
                <TouchableOpacity
                  key={cond}
                  style={[
                    styles.conditionItem,
                    condition === cond.toLowerCase().replace(" ", "_") &&
                      styles.conditionItemActive,
                  ]}
                  onPress={() =>
                    setCondition(cond.toLowerCase().replace(" ", "_") as any)
                  }
                >
                  <Text
                    style={[
                      styles.conditionText,
                      condition === cond.toLowerCase().replace(" ", "_") &&
                        styles.conditionTextActive,
                    ]}
                  >
                    {cond}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your item (condition, features, reason for selling)"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={1000}
            />
            <Text style={styles.charCount}>{description.length}/1000</Text>
          </View>

          {/* Location Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <LocationPicker
              location={location}
              onLocationChange={setLocation}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              submitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Post Listing</Text>
            )}
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
  header: {
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d3436",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  form: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ecf0f1",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#2d3436",
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    color: "#7f8c8d",
    textAlign: "right",
    marginTop: 4,
  },
  imageButton: {
    width: 100,
    height: 100,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#ecf0f1",
    borderStyle: "dashed",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  imageButtonText: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 4,
  },
  imagePreview: {
    width: 100,
    height: 100,
    backgroundColor: "#ecf0f1",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  categoryList: {
    flexDirection: "row",
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ecf0f1",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  categoryItemActive: {
    backgroundColor: "#00b894",
    borderColor: "#00b894",
  },
  categoryText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#2d3436",
  },
  categoryTextActive: {
    color: "white",
  },
  priceInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ecf0f1",
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 20,
    color: "#00b894",
    marginRight: 8,
  },
  priceField: {
    flex: 1,
    fontSize: 20,
    paddingVertical: 16,
    color: "#2d3436",
  },
  conditionList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  conditionItem: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ecf0f1",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  conditionItemActive: {
    backgroundColor: "#00b894",
    borderColor: "#00b894",
  },
  conditionText: {
    fontSize: 14,
    color: "#2d3436",
  },
  conditionTextActive: {
    color: "white",
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ecf0f1",
    borderRadius: 12,
    padding: 16,
  },
  locationText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#2d3436",
  },
  submitButton: {
    backgroundColor: "#00b894",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButtonDisabled: {
    backgroundColor: "#95a5a6",
  },
});
