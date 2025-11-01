import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import MapView, { Marker, Region } from "react-native-maps";

interface LocationData {
  latitude: number;
  longitude: number;
  name: string;
}

interface LocationPickerProps {
  location: LocationData | null;
  onLocationChange: (location: LocationData) => void;
}

export function LocationPicker({
  location,
  onLocationChange,
}: LocationPickerProps) {
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(false);
  const [region, setRegion] = useState<Region>({
    latitude: location?.latitude || 43.6532,
    longitude: location?.longitude || -79.3832,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [searchQuery, setSearchQuery] = useState("");

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "We need location permissions to get your current location"
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;

      // Get location name from coordinates
      const [address] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      const locationName = address
        ? `${address.city || address.district}, ${address.region}`
        : "Current Location";

      const newLocation = {
        latitude,
        longitude,
        name: locationName,
      };

      onLocationChange(newLocation);
      setRegion({
        ...region,
        latitude,
        longitude,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to get current location");
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;

    // Get location name from coordinates
    Location.reverseGeocodeAsync({ latitude, longitude })
      .then(([address]) => {
        const locationName = address
          ? `${address.city || address.district}, ${address.region}`
          : "Selected Location";

        onLocationChange({
          latitude,
          longitude,
          name: locationName,
        });
      })
      .catch(() => {
        onLocationChange({
          latitude,
          longitude,
          name: "Selected Location",
        });
      });
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const results = await Location.geocodeAsync(searchQuery);

      if (results.length > 0) {
        const { latitude, longitude } = results[0];

        const newLocation = {
          latitude,
          longitude,
          name: searchQuery,
        };

        onLocationChange(newLocation);
        setRegion({
          ...region,
          latitude,
          longitude,
        });
      } else {
        Alert.alert(
          "Not Found",
          "Location not found. Please try another search."
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to search location");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.locationButton}
        onPress={() => setShowMap(true)}
      >
        <MaterialCommunityIcons name="map-marker" size={20} color="#00b894" />
        <Text style={styles.locationText}>
          {location?.name || "Select Location"}
        </Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color="#7f8c8d"
        />
      </TouchableOpacity>

      {location && (
        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={getCurrentLocation}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#00b894" />
          ) : (
            <>
              <MaterialCommunityIcons
                name="crosshairs-gps"
                size={16}
                color="#00b894"
              />
              <Text style={styles.currentLocationText}>
                Use Current Location
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      <Modal
        visible={showMap}
        animationType="slide"
        onRequestClose={() => setShowMap(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowMap(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#2d3436" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Location</Text>
            <TouchableOpacity
              onPress={() => {
                setShowMap(false);
              }}
            >
              <Text style={styles.doneButton}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color="#7f8c8d" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search location..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={searchLocation}
            />
            <TouchableOpacity onPress={getCurrentLocation}>
              <MaterialCommunityIcons
                name="crosshairs-gps"
                size={20}
                color="#00b894"
              />
            </TouchableOpacity>
          </View>

          <MapView
            style={styles.map}
            region={region}
            onRegionChangeComplete={setRegion}
            onPress={handleMapPress}
            showsUserLocation
            showsMyLocationButton={false}
          >
            {location && (
              <Marker
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                title={location.name}
              />
            )}
          </MapView>

          <View style={styles.locationInfo}>
            <MaterialCommunityIcons
              name="map-marker"
              size={20}
              color="#00b894"
            />
            <Text style={styles.locationInfoText}>
              {location?.name || "Tap on map to select location"}
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
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
  currentLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingVertical: 8,
  },
  currentLocationText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#00b894",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d3436",
  },
  doneButton: {
    fontSize: 16,
    color: "#00b894",
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 16,
    color: "#2d3436",
  },
  map: {
    flex: 1,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#ecf0f1",
  },
  locationInfoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: "#2d3436",
  },
});
