import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { listingService, Listing } from "../../src/services/listing.service";
import { useAuth } from "../../src/contexts/AuthContext";
import { useFavoriteStatus } from "../../src/hooks/useFavorites";

const { width: screenWidth } = Dimensions.get("window");

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { isFavorite, toggleFavorite } = useFavoriteStatus(id as string);

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      setLoading(true);
      const data = await listingService.getListingById(id as string);
      setListing(data);
    } catch (error) {
      console.error("Error fetching listing:", error);
      Alert.alert("Error", "Failed to load listing");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!listing) return;

    try {
      await Share.share({
        message: `Check out ${listing.title} for $${listing.price} on Listify!`,
        title: listing.title,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleContact = () => {
    if (!listing) return;
    router.push(`/chat/${listing.user_id}?listingId=${listing.id}`);
  };

  const handleFavorite = async () => {
    try {
      await toggleFavorite();
    } catch (error) {
      Alert.alert("Error", "Failed to update favorite");
    }
  };

  const getConditionLabel = (condition: string) => {
    return condition
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00b894" />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="alert-circle" size={48} color="#e74c3c" />
        <Text style={styles.errorText}>Listing not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwnListing = user?.id === listing.user_id;

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleShare}
                style={styles.headerButton}
              >
                <MaterialCommunityIcons
                  name="share-variant"
                  size={24}
                  color="#2d3436"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleFavorite}
                style={styles.headerButton}
              >
                <MaterialCommunityIcons
                  name={isFavorite ? "heart" : "heart-outline"}
                  size={24}
                  color={isFavorite ? "#e74c3c" : "#2d3436"}
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView style={styles.container}>
        {/* Image Gallery */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(
              event.nativeEvent.contentOffset.x / screenWidth
            );
            setCurrentImageIndex(newIndex);
          }}
        >
          {listing.images.length > 0 ? (
            listing.images.map((image, index) => (
              <Image key={index} source={{ uri: image }} style={styles.image} />
            ))
          ) : (
            <View style={styles.placeholderImage}>
              <MaterialCommunityIcons name="image" size={80} color="#bdc3c7" />
            </View>
          )}
        </ScrollView>

        {listing.images.length > 1 && (
          <View style={styles.imageIndicator}>
            <Text style={styles.indicatorText}>
              {currentImageIndex + 1} / {listing.images.length}
            </Text>
          </View>
        )}

        {/* Listing Info */}
        <View style={styles.infoSection}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>${listing.price}</Text>
            <View style={styles.condition}>
              <Text style={styles.conditionText}>
                {getConditionLabel(listing.condition)}
              </Text>
            </View>
          </View>

          <Text style={styles.title}>{listing.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons
                name="map-marker"
                size={16}
                color="#7f8c8d"
              />
              <Text style={styles.metaText}>
                {listing.location_name || "No location"}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="eye" size={16} color="#7f8c8d" />
              <Text style={styles.metaText}>{listing.views_count} views</Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={16}
                color="#7f8c8d"
              />
              <Text style={styles.metaText}>
                {new Date(listing.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {listing.category && (
            <TouchableOpacity
              style={styles.categoryBadge}
              onPress={() => router.push(`/category/${listing.category.id}`)}
            >
              <MaterialCommunityIcons
                name={(listing.category.icon || "tag") as any}
                size={16}
                color="#00b894"
              />
              <Text style={styles.categoryText}>{listing.category.name}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Description */}
        {listing.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>
        )}

        {/* Seller Info */}
        <View style={styles.sellerSection}>
          <Text style={styles.sectionTitle}>Seller</Text>
          <TouchableOpacity
            style={styles.sellerCard}
            onPress={() => router.push(`/user/${listing.user_id}`)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {listing.user?.email?.substring(0, 2).toUpperCase() || "U"}
              </Text>
            </View>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>
                {listing.user?.full_name ||
                  listing.user?.email?.split("@")[0] ||
                  "User"}
              </Text>
              <View style={styles.ratingRow}>
                <MaterialCommunityIcons name="star" size={16} color="#f1c40f" />
                <Text style={styles.ratingText}>
                  {listing.user?.rating || 0} rating
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color="#7f8c8d"
            />
          </TouchableOpacity>
        </View>

        {/* Safety Tips */}
        <View style={styles.safetySection}>
          <Text style={styles.sectionTitle}>Safety Tips</Text>
          <View style={styles.safetyItem}>
            <MaterialCommunityIcons
              name="shield-check"
              size={16}
              color="#00b894"
            />
            <Text style={styles.safetyText}>
              Meet in a safe, public location
            </Text>
          </View>
          <View style={styles.safetyItem}>
            <MaterialCommunityIcons name="cash" size={16} color="#00b894" />
            <Text style={styles.safetyText}>Check the item before payment</Text>
          </View>
          <View style={styles.safetyItem}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={16}
              color="#00b894"
            />
            <Text style={styles.safetyText}>
              Be cautious of unrealistic prices
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Contact Button */}
      {!isOwnListing && listing.status === "active" && (
        <View style={styles.contactContainer}>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleContact}
          >
            <MaterialCommunityIcons
              name="message-text"
              size={20}
              color="white"
            />
            <Text style={styles.contactButtonText}>Contact Seller</Text>
          </TouchableOpacity>
        </View>
      )}

      {isOwnListing && (
        <View style={styles.contactContainer}>
          <TouchableOpacity
            style={[styles.contactButton, styles.editButton]}
            onPress={() => router.push(`/listing/edit/${listing.id}`)}
          >
            <MaterialCommunityIcons name="pencil" size={20} color="white" />
            <Text style={styles.contactButtonText}>Edit Listing</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#7f8c8d",
    marginTop: 12,
  },
  backButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#00b894",
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
  },
  headerButton: {
    marginLeft: 16,
  },
  image: {
    width: screenWidth,
    height: screenWidth * 0.75,
  },
  placeholderImage: {
    width: screenWidth,
    height: screenWidth * 0.75,
    backgroundColor: "#ecf0f1",
    justifyContent: "center",
    alignItems: "center",
  },
  imageIndicator: {
    position: "absolute",
    top: screenWidth * 0.75 - 40,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  indicatorText: {
    color: "white",
    fontSize: 12,
  },
  infoSection: {
    backgroundColor: "white",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  price: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#00b894",
  },
  condition: {
    backgroundColor: "#e8f8f5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  conditionText: {
    fontSize: 14,
    color: "#00b894",
    fontWeight: "500",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: "#7f8c8d",
    marginLeft: 4,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  categoryText: {
    fontSize: 14,
    color: "#2d3436",
    marginLeft: 6,
  },
  descriptionSection: {
    backgroundColor: "white",
    padding: 20,
    marginTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: "#2d3436",
    lineHeight: 24,
  },
  sellerSection: {
    backgroundColor: "white",
    padding: 20,
    marginTop: 12,
  },
  sellerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#00b894",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 14,
    color: "#7f8c8d",
    marginLeft: 4,
  },
  safetySection: {
    backgroundColor: "white",
    padding: 20,
    marginTop: 12,
    marginBottom: 100,
  },
  safetyItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  safetyText: {
    fontSize: 14,
    color: "#7f8c8d",
    marginLeft: 12,
  },
  contactContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#ecf0f1",
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00b894",
    padding: 16,
    borderRadius: 12,
  },
  contactButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: "#3498db",
  },
});
