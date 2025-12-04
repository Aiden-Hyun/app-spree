import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

export interface PickedFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

export async function pickImage(): Promise<PickedFile | null> {
  try {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "We need camera roll permissions to attach images."
      );
      return null;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      return {
        uri: asset.uri,
        name: asset.fileName || `image_${Date.now()}.jpg`,
        type: asset.type || "image/jpeg",
      };
    }

    return null;
  } catch (error) {
    console.error("Error picking image:", error);
    Alert.alert("Error", "Failed to pick image");
    return null;
  }
}

export async function pickDocument(): Promise<PickedFile | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
    });

    if (result.type === "success") {
      return {
        uri: result.uri,
        name: result.name,
        type: result.mimeType || "application/octet-stream",
        size: result.size,
      };
    }

    return null;
  } catch (error) {
    console.error("Error picking document:", error);
    Alert.alert("Error", "Failed to pick document");
    return null;
  }
}

export async function takePhoto(): Promise<PickedFile | null> {
  try {
    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "We need camera permissions to take photos."
      );
      return null;
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      return {
        uri: asset.uri,
        name: `photo_${Date.now()}.jpg`,
        type: "image/jpeg",
      };
    }

    return null;
  } catch (error) {
    console.error("Error taking photo:", error);
    Alert.alert("Error", "Failed to take photo");
    return null;
  }
}

export function showAttachmentOptions(
  onImagePicked: (file: PickedFile) => void,
  onDocumentPicked: (file: PickedFile) => void,
  onPhotoCaptured: (file: PickedFile) => void
) {
  Alert.alert(
    "Add Attachment",
    "Choose an option",
    [
      {
        text: "Take Photo",
        onPress: async () => {
          const file = await takePhoto();
          if (file) onPhotoCaptured(file);
        },
      },
      {
        text: "Choose Image",
        onPress: async () => {
          const file = await pickImage();
          if (file) onImagePicked(file);
        },
      },
      {
        text: "Choose Document",
        onPress: async () => {
          const file = await pickDocument();
          if (file) onDocumentPicked(file);
        },
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ],
    { cancelable: true }
  );
}


