import React from "react";
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Text,
} from "react-native";
import { ListingCard } from "./ListingCard";
import { Listing } from "../../services/listing.service";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface ListingGridProps {
  listings: Listing[];
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  hasMore?: boolean;
  variant?: "grid" | "list";
  emptyMessage?: string;
  header?: React.ReactElement;
}

export function ListingGrid({
  listings,
  loading = false,
  refreshing = false,
  onRefresh,
  onEndReached,
  hasMore = false,
  variant = "grid",
  emptyMessage = "No listings found",
  header,
}: ListingGridProps) {
  const renderListing = ({ item }: { item: Listing }) => (
    <ListingCard listing={item} variant={variant} />
  );

  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="tag-off" size={64} color="#bdc3c7" />
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!hasMore || !listings.length) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#00b894" />
      </View>
    );
  };

  if (loading && !refreshing && !listings.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00b894" />
      </View>
    );
  }

  return (
    <FlatList
      data={listings}
      renderItem={renderListing}
      keyExtractor={(item) => item.id}
      numColumns={variant === "grid" ? 2 : 1}
      key={variant} // Force re-render when variant changes
      columnWrapperStyle={variant === "grid" ? styles.gridRow : undefined}
      contentContainerStyle={styles.content}
      ItemSeparatorComponent={
        variant === "list" ? () => <View style={styles.separator} /> : undefined
      }
      ListEmptyComponent={renderEmpty}
      ListHeaderComponent={header}
      ListFooterComponent={renderFooter}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#00b894"]}
          />
        ) : undefined
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    flexGrow: 1,
  },
  gridRow: {
    justifyContent: "space-between",
  },
  separator: {
    height: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: "#7f8c8d",
    marginTop: 16,
    textAlign: "center",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
});


