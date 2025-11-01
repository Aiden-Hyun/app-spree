import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../src/contexts/AuthContext";
import { useVault } from "../src/contexts/VaultContext";
import { ProtectedRoute } from "../src/components/ProtectedRoute";
import { PasswordItem } from "../src/components/PasswordItem";
import { SearchBar } from "../src/components/SearchBar";

function HomeScreen() {
  const router = useRouter();
  const { user, lockVault } = useAuth();
  const {
    passwords,
    categories,
    loading,
    error,
    refreshVault,
    toggleFavorite,
    deletePassword,
    searchPasswords,
    getFavoritePasswords,
  } = useVault();

  const [searchQuery, setSearchQuery] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshVault();
    setRefreshing(false);
  };

  const getFilteredPasswords = () => {
    let filtered = passwords;

    if (showFavoritesOnly) {
      filtered = getFavoritePasswords();
    }

    if (searchQuery) {
      filtered = searchPasswords(searchQuery);
    }

    return filtered;
  };

  const getCategoryForPassword = (categoryId?: string) => {
    if (!categoryId) return undefined;
    return categories.find((cat) => cat.id === categoryId);
  };

  const handleDeletePassword = async (id: string) => {
    try {
      await deletePassword(id);
    } catch (err: any) {
      Alert.alert("Delete Failed", err.message || "Failed to delete password");
    }
  };

  const handleAddPassword = () => {
    router.push("/password/new");
  };

  const handleSettings = () => {
    router.push("/settings");
  };

  const handleLockVault = () => {
    Alert.alert("Lock Vault", "Are you sure you want to lock your vault?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Lock",
        style: "destructive",
        onPress: () => {
          lockVault();
          router.replace("/");
        },
      },
    ]);
  };

  const filteredPasswords = getFilteredPasswords();

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2d3436" />
        <Text style={styles.loadingText}>Loading vault...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleSettings}
              style={styles.headerButton}
            >
              <Text style={styles.headerIcon}>⚙️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLockVault}
              style={styles.headerButton}
            >
              <Text style={styles.headerIcon}>🔒</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.userEmail}>{user?.email}</Text>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{passwords.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {getFavoritePasswords().length}
            </Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{categories.length}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
        </View>
      </View>

      <View style={styles.controls}>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              showFavoritesOnly && styles.filterButtonActive,
            ]}
            onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            <Text
              style={[
                styles.filterButtonText,
                showFavoritesOnly && styles.filterButtonTextActive,
              ]}
            >
              ⭐ Favorites
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddPassword}
          >
            <Text style={styles.addButtonText}>+ Add Password</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={filteredPasswords}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PasswordItem
            password={item}
            onToggleFavorite={toggleFavorite}
            onDelete={handleDeletePassword}
            category={getCategoryForPassword(item.categoryId)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#2d3436"]}
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔐</Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? "No passwords found"
                : showFavoritesOnly
                ? "No favorite passwords"
                : "No passwords yet"}
            </Text>
            <Text style={styles.emptySubtext}>
              {!searchQuery &&
                !showFavoritesOnly &&
                "Tap the + button to add your first password"}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#636e72",
  },
  header: {
    backgroundColor: "#2d3436",
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  headerIcon: {
    fontSize: 20,
  },
  userEmail: {
    fontSize: 14,
    color: "#b2bec3",
    marginBottom: 16,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  statLabel: {
    fontSize: 12,
    color: "#b2bec3",
    marginTop: 4,
  },
  controls: {
    paddingBottom: 8,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 8,
  },
  filterButton: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  filterButtonActive: {
    backgroundColor: "#2d3436",
    borderColor: "#2d3436",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#636e72",
  },
  filterButtonTextActive: {
    color: "white",
  },
  addButton: {
    backgroundColor: "#0984e3",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  errorContainer: {
    backgroundColor: "#ff7675",
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  errorText: {
    color: "white",
    fontSize: 14,
    textAlign: "center",
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#636e72",
  },
});

export default function Home() {
  return (
    <ProtectedRoute>
      <HomeScreen />
    </ProtectedRoute>
  );
}
