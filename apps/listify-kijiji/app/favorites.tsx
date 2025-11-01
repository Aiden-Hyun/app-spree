import React from "react";
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFavorites } from "../../src/hooks/useFavorites";
import { ListingGrid } from "../../src/components/listings/ListingGrid";

export default function FavoritesScreen() {
  const { favorites, loading, refreshing, refresh } = useFavorites();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Favorites</Text>
        <Text style={styles.subtitle}>
          {favorites.length} {favorites.length === 1 ? "item" : "items"} saved
        </Text>
      </View>

      <ListingGrid
        listings={favorites}
        loading={loading}
        refreshing={refreshing}
        onRefresh={refresh}
        variant="grid"
        emptyMessage="No favorites yet. Start saving listings you're interested in!"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "white",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d3436",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#7f8c8d",
  },
});
