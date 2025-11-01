import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Listing } from "../../services/listing.service";

interface ListingCardProps {
  listing: Listing;
  variant?: "grid" | "list";
}

export function ListingCard({ listing, variant = "grid" }: ListingCardProps) {
  const handlePress = () => {
    router.push(`/listing/${listing.id}`);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("en-US", {
      style: "currency",
      currency: listing.currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const getConditionLabel = (condition: string) => {
    return condition
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (variant === "list") {
    return (
      <TouchableOpacity style={styles.listContainer} onPress={handlePress}>
        {listing.images.length > 0 ? (
          <Image source={{ uri: listing.images[0] }} style={styles.listImage} />
        ) : (
          <View style={styles.listImagePlaceholder}>
            <MaterialCommunityIcons name="image" size={32} color="#bdc3c7" />
          </View>
        )}
        <View style={styles.listContent}>
          <Text style={styles.title} numberOfLines={1}>
            {listing.title}
          </Text>
          <Text style={styles.condition}>
            {getConditionLabel(listing.condition)}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.price}>{formatPrice(listing.price)}</Text>
            <Text style={styles.location}>
              {listing.location_name || "No location"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.gridContainer} onPress={handlePress}>
      {listing.images.length > 0 ? (
        <Image source={{ uri: listing.images[0] }} style={styles.gridImage} />
      ) : (
        <View style={styles.gridImagePlaceholder}>
          <MaterialCommunityIcons name="image" size={40} color="#bdc3c7" />
        </View>
      )}
      {listing.is_featured && (
        <View style={styles.featuredBadge}>
          <MaterialCommunityIcons name="star" size={12} color="white" />
          <Text style={styles.featuredText}>Featured</Text>
        </View>
      )}
      <View style={styles.gridContent}>
        <Text style={styles.title} numberOfLines={2}>
          {listing.title}
        </Text>
        <Text style={styles.price}>{formatPrice(listing.price)}</Text>
        <Text style={styles.location} numberOfLines={1}>
          <MaterialCommunityIcons name="map-marker" size={12} color="#7f8c8d" />{" "}
          {listing.location_name || "No location"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Grid styles
  gridContainer: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gridImage: {
    width: "100%",
    height: 140,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  gridImagePlaceholder: {
    width: "100%",
    height: 140,
    backgroundColor: "#ecf0f1",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  gridContent: {
    padding: 12,
  },
  featuredBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f39c12",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featuredText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 2,
  },

  // List styles
  listContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  listImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: "#ecf0f1",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  listContent: {
    flex: 1,
    justifyContent: "space-between",
  },

  // Common styles
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#00b894",
    marginBottom: 4,
  },
  location: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  condition: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
