import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { useLocation } from "../../src/hooks/useLocation";
import { LocationPermission } from "../../src/components/LocationPermission";
import { UserCard } from "../../src/components/UserCard";
import { useNearbyUsers } from "../../src/hooks/useNearbyUsers";

function DiscoverScreen() {
  const {
    latitude,
    longitude,
    hasPermission,
    requestPermissions,
    isLoading: locationLoading,
  } = useLocation();
  const { users, loading, error, refetch } = useNearbyUsers(
    latitude,
    longitude
  );
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (!hasPermission) {
    return <LocationPermission onPermissionGranted={requestPermissions} />;
  }

  if (locationLoading || !latitude || !longitude) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#e84393" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading users</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
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
            <Text style={styles.emptyText}>No users nearby</Text>
            <Text style={styles.emptySubtext}>
              Try expanding your search radius in settings
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
    marginTop: 16,
    fontSize: 16,
    color: "#636e72",
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#e74c3c",
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: "#636e72",
    textAlign: "center",
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
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#636e72",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#95a5a6",
  },
});

export default function Discover() {
  return (
    <ProtectedRoute>
      <DiscoverScreen />
    </ProtectedRoute>
  );
}
