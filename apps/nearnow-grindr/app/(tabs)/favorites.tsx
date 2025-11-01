import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl } from "react-native";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { UserCard } from "../../src/components/UserCard";
import { useFavorites } from "../../src/hooks/useFavorites";
import { useLocation } from "../../src/hooks/useLocation";

function FavoritesScreen() {
  const { latitude, longitude } = useLocation();
  const { favorites, loading, refetch } = useFavorites(latitude, longitude);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (loading && favorites.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading favorites...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={favorites}
        renderItem={({ item }) => <UserCard user={item} />}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#e84393"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>⭐</Text>
            <Text style={styles.emptyText}>No favorites yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the star on profiles you want to save
            </Text>
          </View>
        }
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
  loadingText: {
    fontSize: 16,
    color: "#636e72",
  },
  grid: {
    padding: 4,
    flexGrow: 1,
  },
  row: {
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#636e72",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#95a5a6",
    textAlign: "center",
    paddingHorizontal: 40,
  },
});

export default function Favorites() {
  return (
    <ProtectedRoute>
      <FavoritesScreen />
    </ProtectedRoute>
  );
}
