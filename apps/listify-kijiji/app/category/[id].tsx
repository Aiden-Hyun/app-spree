import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCategory } from "../../src/hooks/useCategories";
import { useListings } from "../../src/hooks/useListings";
import { ListingGrid } from "../../src/components/listings/ListingGrid";

export default function CategoryScreen() {
  const { id } = useLocalSearchParams();
  const {
    category,
    loading: categoryLoading,
    error: categoryError,
  } = useCategory(id as string);
  const {
    listings,
    loading: listingsLoading,
    error: listingsError,
    refreshing,
    refresh,
    loadMore,
    hasMore,
  } = useListings({ categoryId: id as string });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("date");

  if (categoryLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00b894" />
      </View>
    );
  }

  if (categoryError || !category) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="alert-circle" size={48} color="#e74c3c" />
        <Text style={styles.errorText}>Category not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const Header = () => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.categoryHeader}>
          <MaterialCommunityIcons
            name={(category.icon as any) || "tag"}
            size={32}
            color="#00b894"
          />
          <Text style={styles.categoryName}>{category.name}</Text>
        </View>
        <Text style={styles.itemCount}>{listings.length} items</Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.sortContainer}>
          <TouchableOpacity style={styles.sortButton}>
            <MaterialCommunityIcons name="sort" size={20} color="#7f8c8d" />
            <Text style={styles.sortText}>Sort: Newest</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.viewButton,
              viewMode === "grid" && styles.viewButtonActive,
            ]}
            onPress={() => setViewMode("grid")}
          >
            <MaterialCommunityIcons
              name="view-grid"
              size={20}
              color={viewMode === "grid" ? "#00b894" : "#7f8c8d"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewButton,
              viewMode === "list" && styles.viewButtonActive,
            ]}
            onPress={() => setViewMode("list")}
          >
            <MaterialCommunityIcons
              name="view-list"
              size={20}
              color={viewMode === "list" ? "#00b894" : "#7f8c8d"}
            />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <ListingGrid
        listings={listings}
        loading={listingsLoading}
        refreshing={refreshing}
        onRefresh={refresh}
        onEndReached={loadMore}
        hasMore={hasMore}
        variant={viewMode}
        emptyMessage={`No listings in ${category.name} yet`}
        header={<Header />}
      />
    </View>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d3436",
    marginLeft: 12,
  },
  itemCount: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  sortContainer: {
    flex: 1,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#7f8c8d",
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 4,
  },
  viewButton: {
    padding: 8,
    borderRadius: 6,
  },
  viewButtonActive: {
    backgroundColor: "white",
  },
});
