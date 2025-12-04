import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useUserProfile } from "../../src/hooks/useUserProfile";
import { ListingCard } from "../../src/components/listings/ListingCard";
import { useAuth } from "../../src/contexts/AuthContext";

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { profile, listings, reviews, loading, error } = useUserProfile(
    id as string
  );

  const isOwnProfile = user?.id === id;

  const renderReview = ({ item }: { item: any }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewerInfo}>
          <View style={styles.smallAvatar}>
            <Text style={styles.smallAvatarText}>
              {item.reviewer?.email?.substring(0, 2).toUpperCase() || "U"}
            </Text>
          </View>
          <Text style={styles.reviewerName}>
            {item.reviewer?.full_name ||
              item.reviewer?.email?.split("@")[0] ||
              "User"}
          </Text>
        </View>
        <View style={styles.ratingStars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <MaterialCommunityIcons
              key={star}
              name={star <= item.rating ? "star" : "star-outline"}
              size={16}
              color="#f1c40f"
            />
          ))}
        </View>
      </View>
      {item.comment && <Text style={styles.reviewComment}>{item.comment}</Text>}
      {item.listing && (
        <Text style={styles.reviewListing}>For: {item.listing.title}</Text>
      )}
      <Text style={styles.reviewDate}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00b894" />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="alert-circle" size={48} color="#e74c3c" />
        <Text style={styles.errorText}>User not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile.email?.substring(0, 2).toUpperCase() || "U"}
          </Text>
        </View>
        <Text style={styles.userName}>
          {profile.full_name || profile.email?.split("@")[0] || "User"}
        </Text>
        {profile.location_name && (
          <View style={styles.locationRow}>
            <MaterialCommunityIcons
              name="map-marker"
              size={16}
              color="#7f8c8d"
            />
            <Text style={styles.locationText}>{profile.location_name}</Text>
          </View>
        )}
        <View style={styles.ratingContainer}>
          <MaterialCommunityIcons name="star" size={20} color="#f1c40f" />
          <Text style={styles.ratingText}>
            {profile.rating.toFixed(1)} ({profile.total_reviews} reviews)
          </Text>
        </View>
        <Text style={styles.memberSince}>
          Member since {new Date(profile.created_at).toLocaleDateString()}
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{listings.length}</Text>
          <Text style={styles.statLabel}>Listings</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{profile.total_reviews}</Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{profile.rating.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      {/* Contact Button */}
      {!isOwnProfile && (
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => router.push(`/chat/${profile.id}`)}
          >
            <MaterialCommunityIcons
              name="message-text"
              size={20}
              color="white"
            />
            <Text style={styles.contactButtonText}>Send Message</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Active Listings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {isOwnProfile ? "My Listings" : "Active Listings"}
        </Text>
        {listings.length > 0 ? (
          <View style={styles.listingsGrid}>
            {listings.slice(0, 6).map((listing) => (
              <View key={listing.id} style={styles.listingWrapper}>
                <ListingCard listing={listing} variant="grid" />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="tag-off" size={48} color="#bdc3c7" />
            <Text style={styles.emptyText}>No active listings</Text>
          </View>
        )}
        {listings.length > 6 && (
          <TouchableOpacity style={styles.seeAllButton}>
            <Text style={styles.seeAllText}>
              See all {listings.length} listings
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color="#00b894"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Reviews */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reviews</Text>
        {reviews.length > 0 ? (
          <FlatList
            data={reviews}
            renderItem={renderReview}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="star-outline"
              size={48}
              color="#bdc3c7"
            />
            <Text style={styles.emptyText}>No reviews yet</Text>
          </View>
        )}
      </View>
    </ScrollView>
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
  header: {
    backgroundColor: "white",
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#00b894",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
  userName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: "#7f8c8d",
    marginLeft: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 16,
    color: "#2d3436",
    marginLeft: 8,
  },
  memberSince: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    padding: 20,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#00b894",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#ecf0f1",
    marginHorizontal: 20,
  },
  actionSection: {
    backgroundColor: "white",
    padding: 16,
    marginBottom: 12,
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
  section: {
    backgroundColor: "white",
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 16,
  },
  listingsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  listingWrapper: {
    width: "48%",
    marginBottom: 12,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    color: "#7f8c8d",
    marginTop: 12,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    padding: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: "#00b894",
    fontWeight: "500",
    marginRight: 4,
  },
  reviewCard: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#00b894",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  smallAvatarText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2d3436",
  },
  ratingStars: {
    flexDirection: "row",
  },
  reviewComment: {
    fontSize: 14,
    color: "#2d3436",
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewListing: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: "#7f8c8d",
  },
});


