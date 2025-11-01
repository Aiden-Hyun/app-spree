import React, { useState } from "react";
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
  Text,
} from "react-native";

const { width, height } = Dimensions.get("window");

interface ProfilePhotosProps {
  photos: string[];
  editable?: boolean;
  onPhotosChange?: (photos: string[]) => void;
}

export function ProfilePhotos({
  photos,
  editable = false,
  onPhotosChange,
}: ProfilePhotosProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [fullScreenVisible, setFullScreenVisible] = useState(false);

  const handlePhotoPress = (index: number) => {
    setSelectedPhotoIndex(index);
    setFullScreenVisible(true);
  };

  const renderThumbnails = () => {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.thumbnailContainer}
      >
        {photos.map((photo, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setSelectedPhotoIndex(index)}
          >
            <Image
              source={{ uri: photo }}
              style={[
                styles.thumbnail,
                selectedPhotoIndex === index && styles.thumbnailActive,
              ]}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  if (photos.length === 0) {
    return (
      <View style={styles.noPhotos}>
        <Text style={styles.noPhotosText}>No photos</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => handlePhotoPress(selectedPhotoIndex)}
        >
          <Image
            source={{ uri: photos[selectedPhotoIndex] }}
            style={styles.mainPhoto}
          />
        </TouchableOpacity>

        {photos.length > 1 && (
          <>
            <View style={styles.indicators}>
              {photos.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    selectedPhotoIndex === index && styles.indicatorActive,
                  ]}
                />
              ))}
            </View>
            {renderThumbnails()}
          </>
        )}
      </View>

      <Modal
        visible={fullScreenVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullScreenVisible(false)}
      >
        <View style={styles.fullScreenContainer}>
          <TouchableOpacity
            style={styles.fullScreenTouchable}
            activeOpacity={1}
            onPress={() => setFullScreenVisible(false)}
          >
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const newIndex = Math.round(
                  event.nativeEvent.contentOffset.x / width
                );
                setSelectedPhotoIndex(newIndex);
              }}
              contentOffset={{ x: selectedPhotoIndex * width, y: 0 }}
            >
              {photos.map((photo, index) => (
                <Image
                  key={index}
                  source={{ uri: photo }}
                  style={styles.fullScreenPhoto}
                  resizeMode="contain"
                />
              ))}
            </ScrollView>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setFullScreenVisible(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.fullScreenIndicators}>
            <Text style={styles.photoCounter}>
              {selectedPhotoIndex + 1} / {photos.length}
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  mainPhoto: {
    width: "100%",
    height: 400,
    backgroundColor: "#e9ecef",
  },
  noPhotos: {
    width: "100%",
    height: 400,
    backgroundColor: "#e9ecef",
    justifyContent: "center",
    alignItems: "center",
  },
  noPhotosText: {
    fontSize: 18,
    color: "#95a5a6",
  },
  indicators: {
    position: "absolute",
    top: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
  },
  indicator: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 2,
  },
  indicatorActive: {
    backgroundColor: "white",
  },
  thumbnailContainer: {
    padding: 8,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    opacity: 0.7,
  },
  thumbnailActive: {
    opacity: 1,
    borderWidth: 2,
    borderColor: "#e84393",
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  fullScreenTouchable: {
    flex: 1,
  },
  fullScreenPhoto: {
    width,
    height,
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  fullScreenIndicators: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  photoCounter: {
    color: "white",
    fontSize: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
});
