import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { ProtectedRoute } from "../src/components/ProtectedRoute";
import { SecurityScore } from "../src/components/SecurityScore";
import { PasswordItem } from "../src/components/PasswordItem";
import { useSecurity } from "../src/contexts/SecurityContext";
import { useVault } from "../src/contexts/VaultContext";

type TabType = "overview" | "weak" | "reused" | "old";

function SecurityDashboard() {
  const router = useRouter();
  const {
    securityStats,
    loading,
    refreshSecurityData,
    getWeakPasswords,
    getReusedPasswords,
    getOldPasswords,
  } = useSecurity();
  const { categories, toggleFavorite, deletePassword } = useVault();

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshSecurityData();
    setRefreshing(false);
  };

  const getCategoryForPassword = (categoryId?: string) => {
    if (!categoryId) return undefined;
    return categories.find((cat) => cat.id === categoryId);
  };

  const getPasswordsForTab = () => {
    switch (activeTab) {
      case "weak":
        return getWeakPasswords();
      case "reused":
        return getReusedPasswords();
      case "old":
        return getOldPasswords();
      default:
        return [];
    }
  };

  const renderTab = (tab: TabType, label: string, count?: number) => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity
        style={[styles.tab, isActive && styles.activeTab]}
        onPress={() => setActiveTab(tab)}
      >
        <Text style={[styles.tabText, isActive && styles.activeTabText]}>
          {label}
        </Text>
        {count !== undefined && count > 0 && (
          <View style={[styles.badge, isActive && styles.activeBadge]}>
            <Text
              style={[styles.badgeText, isActive && styles.activeBadgeText]}
            >
              {count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2d3436" />
        <Text style={styles.loadingText}>Analyzing your security...</Text>
      </View>
    );
  }

  if (!securityStats) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No security data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#2d3436"]}
          />
        }
      >
        {activeTab === "overview" ? (
          <>
            <SecurityScore stats={securityStats} />

            <View style={styles.actionsSection}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>

              {securityStats.weakPasswords > 0 && (
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => setActiveTab("weak")}
                >
                  <View style={styles.actionIcon}>
                    <Text style={styles.actionIconText}>⚠️</Text>
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>Fix Weak Passwords</Text>
                    <Text style={styles.actionDescription}>
                      {securityStats.weakPasswords} passwords need strengthening
                    </Text>
                  </View>
                  <Text style={styles.actionArrow}>›</Text>
                </TouchableOpacity>
              )}

              {securityStats.reusedPasswords > 0 && (
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => setActiveTab("reused")}
                >
                  <View style={styles.actionIcon}>
                    <Text style={styles.actionIconText}>♻️</Text>
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>
                      Replace Reused Passwords
                    </Text>
                    <Text style={styles.actionDescription}>
                      {securityStats.reusedPasswords} passwords are duplicated
                    </Text>
                  </View>
                  <Text style={styles.actionArrow}>›</Text>
                </TouchableOpacity>
              )}

              {securityStats.oldPasswords > 0 && (
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => setActiveTab("old")}
                >
                  <View style={styles.actionIcon}>
                    <Text style={styles.actionIconText}>📅</Text>
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>Update Old Passwords</Text>
                    <Text style={styles.actionDescription}>
                      {securityStats.oldPasswords} passwords haven't been
                      changed in 90+ days
                    </Text>
                  </View>
                  <Text style={styles.actionArrow}>›</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        ) : (
          <FlatList
            data={getPasswordsForTab()}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <PasswordItem
                password={item}
                onToggleFavorite={toggleFavorite}
                onDelete={deletePassword}
                category={getCategoryForPassword(item.categoryId)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyListContainer}>
                <Text style={styles.emptyListText}>No passwords found</Text>
              </View>
            }
          />
        )}
      </ScrollView>

      <View style={styles.tabBar}>
        {renderTab("overview", "Overview")}
        {renderTab("weak", "Weak", securityStats.weakPasswords)}
        {renderTab("reused", "Reused", securityStats.reusedPasswords)}
        {renderTab("old", "Old", securityStats.oldPasswords)}
      </View>
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#636e72",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    color: "#636e72",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
  },
  activeTab: {
    borderTopWidth: 3,
    borderTopColor: "#0984e3",
  },
  tabText: {
    fontSize: 14,
    color: "#636e72",
  },
  activeTabText: {
    color: "#0984e3",
    fontWeight: "600",
  },
  badge: {
    backgroundColor: "#e0e0e0",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 4,
  },
  activeBadge: {
    backgroundColor: "#0984e3",
  },
  badgeText: {
    fontSize: 12,
    color: "#636e72",
    fontWeight: "600",
  },
  activeBadgeText: {
    color: "white",
  },
  actionsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  actionIconText: {
    fontSize: 24,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: "#636e72",
  },
  actionArrow: {
    fontSize: 24,
    color: "#b2bec3",
  },
  emptyListContainer: {
    flex: 1,
    padding: 40,
    alignItems: "center",
  },
  emptyListText: {
    fontSize: 16,
    color: "#636e72",
  },
});

export default function Security() {
  return (
    <ProtectedRoute>
      <SecurityDashboard />
    </ProtectedRoute>
  );
}


