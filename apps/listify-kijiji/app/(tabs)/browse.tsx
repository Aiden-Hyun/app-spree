import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCategories } from "../../src/hooks/useCategories";
import { useRecentListings } from "../../src/hooks/useListings";
import { ListingCard } from "../../src/components/listings/ListingCard";

export default function BrowseScreen() {
  const { categories, loading, error, refreshing, refresh } = useCategories();
  const { listings: recentListings, loading: listingsLoading } =
    useRecentListings(10);

  const renderCategory = ({ item }: { item: (typeof categories)[0] }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => router.push(`/category/${item.id}`)}
    >
      <MaterialCommunityIcons
        name={(item.icon || "tag") as any}
        size={32}
        color="#00b894"
      />
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderListing = ({ item }: { item: (typeof recentListings)[0] }) => (
    <View style={styles.listingWrapper}>
      <ListingCard listing={item} variant="grid" />
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00b894" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          colors={["#00b894"]}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Listify</Text>
        <Text style={styles.subtitle}>Find great deals near you</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load categories</Text>
            <TouchableOpacity onPress={refresh} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={categories.slice(0, 8)}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id}
            numColumns={4}
            scrollEnabled={false}
            columnWrapperStyle={styles.categoryRow}
          />
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Listings</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/search")}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {listingsLoading ? (
          <View style={styles.listingsLoadingContainer}>
            <ActivityIndicator size="small" color="#00b894" />
          </View>
        ) : recentListings.length > 0 ? (
          <FlatList
            data={recentListings}
            renderItem={renderListing}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listingsList}
          />
        ) : (
          <View style={styles.emptyListings}>
            <Text style={styles.emptyListingsText}>No listings yet</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.locationBanner}>
          <MaterialCommunityIcons name="map-marker" size={20} color="#00b894" />
          <Text style={styles.locationText}>Showing items in Toronto</Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color="#00b894"
          />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  errorContainer: {
    padding: 20,
    alignItems: "center",
  },
  errorText: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: "#00b894",
    borderRadius: 20,
  },
  retryText: {
    color: "white",
    fontWeight: "600",
  },
  header: {
    padding: 20,
    backgroundColor: "#00b894",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#e0e0e0",
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2d3436",
  },
  seeAll: {
    fontSize: 14,
    color: "#00b894",
    fontWeight: "500",
  },
  categoryRow: {
    justifyContent: "space-between",
  },
  categoryCard: {
    width: "23%",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryName: {
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
    color: "#2d3436",
  },
  listingsList: {
    paddingRight: 20,
  },
  listingWrapper: {
    width: 180,
    marginRight: 12,
  },
  listingsLoadingContainer: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyListings: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ecf0f1",
    borderStyle: "dashed",
  },
  emptyListingsText: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  locationBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: "#2d3436",
  },
});
