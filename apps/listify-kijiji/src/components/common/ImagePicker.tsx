import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

interface ImagePickerComponentProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImagePickerComponent({
  images,
  onImagesChange,
  maxImages = 8,
}: ImagePickerComponentProps) {
  const pickImage = async () => {
    if (images.length >= maxImages) {
      Alert.alert(
        "Limit Reached",
        `You can only add up to ${maxImages} images`
      );
      return;
    }

    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "We need camera roll permissions to upload images"
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onImagesChange([...images, result.assets[0].uri]);
    }
  };

  const takePhoto = async () => {
    if (images.length >= maxImages) {
      Alert.alert(
        "Limit Reached",
        `You can only add up to ${maxImages} images`
      );
      return;
    }

    // Request permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "We need camera permissions to take photos"
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onImagesChange([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const showImageOptions = () => {
    Alert.alert("Add Photo", "Choose how you want to add a photo", [
      { text: "Take Photo", onPress: takePhoto },
      { text: "Choose from Library", onPress: pickImage },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity style={styles.addButton} onPress={showImageOptions}>
          <MaterialCommunityIcons
            name="camera-plus"
            size={32}
            color="#7f8c8d"
          />
          <Text style={styles.addButtonText}>Add Photo</Text>
          <Text style={styles.countText}>
            {images.length}/{maxImages}
          </Text>
        </TouchableOpacity>

        {images.map((uri, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image source={{ uri }} style={styles.image} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeImage(index)}
            >
              <MaterialCommunityIcons
                name="close-circle"
                size={24}
                color="#e74c3c"
              />
            </TouchableOpacity>
            {index === 0 && (
              <View style={styles.mainBadge}>
                <Text style={styles.mainBadgeText}>Main</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
  },
  addButton: {
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
  addButtonText: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 4,
  },
  countText: {
    fontSize: 10,
    color: "#bdc3c7",
    marginTop: 2,
  },
  imageContainer: {
    width: 100,
    height: 100,
    marginRight: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  removeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "white",
    borderRadius: 12,
  },
  mainBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "#00b894",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mainBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
});
