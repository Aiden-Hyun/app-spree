import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../src/contexts/AuthContext";
import { router } from "expo-router";

const MENU_ITEMS = [
  { id: "listings", title: "My Listings", icon: "tag-multiple", count: 3 },
  { id: "favorites", title: "Favorites", icon: "heart-outline", count: 12 },
  {
    id: "purchases",
    title: "My Purchases",
    icon: "shopping-outline",
    count: 0,
  },
  { id: "sales", title: "My Sales", icon: "cash-multiple", count: 2 },
  { id: "reviews", title: "Reviews", icon: "star-outline", count: 5 },
];

const SETTINGS_ITEMS = [
  { id: "edit-profile", title: "Edit Profile", icon: "account-edit-outline" },
  { id: "location", title: "Location Settings", icon: "map-marker-outline" },
  { id: "notifications", title: "Notifications", icon: "bell-outline" },
  { id: "privacy", title: "Privacy & Security", icon: "shield-check-outline" },
  { id: "help", title: "Help & Support", icon: "help-circle-outline" },
  { id: "about", title: "About", icon: "information-outline" },
];

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleMenuPress = (itemId: string) => {
    if (itemId === "favorites") {
      router.push("/favorites");
    } else {
      // TODO: Implement other menu items
      Alert.alert("Coming Soon", `${itemId} feature will be implemented`);
    }
  };

  const handleSettingsPress = (itemId: string) => {
    if (itemId === "edit-profile") {
      // TODO: Navigate to edit profile screen
      Alert.alert("Coming Soon", "Edit profile feature will be implemented");
    } else {
      router.push("/settings");
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.email?.substring(0, 2).toUpperCase() || "U"}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {user?.email?.split("@")[0] || "User"}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.ratingContainer}>
              <MaterialCommunityIcons name="star" size={16} color="#f1c40f" />
              <Text style={styles.ratingText}>4.8 (23 reviews)</Text>
            </View>
          </View>
        </View>
        <Text style={styles.memberSince}>Member since November 2023</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>Listed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>8</Text>
          <Text style={styles.statLabel}>Sold</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>4.8</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity</Text>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => handleMenuPress(item.id)}
          >
            <MaterialCommunityIcons
              name={item.icon as any}
              size={24}
              color="#00b894"
            />
            <Text style={styles.menuItemText}>{item.title}</Text>
            <View style={styles.menuItemRight}>
              {item.count > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.count}</Text>
                </View>
              )}
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color="#7f8c8d"
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        {SETTINGS_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => handleSettingsPress(item.id)}
          >
            <MaterialCommunityIcons
              name={item.icon as any}
              size={24}
              color="#7f8c8d"
            />
            <Text style={styles.menuItemText}>{item.title}</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color="#7f8c8d"
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <MaterialCommunityIcons name="logout" size={20} color="#e74c3c" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
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
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#00b894",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 14,
    color: "#7f8c8d",
    marginLeft: 4,
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
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
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
  section: {
    backgroundColor: "white",
    marginBottom: 12,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3436",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: "#2d3436",
    marginLeft: 16,
  },
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  badge: {
    backgroundColor: "#00b894",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    marginBottom: 20,
    paddingVertical: 16,
  },
  logoutText: {
    fontSize: 16,
    color: "#e74c3c",
    fontWeight: "600",
    marginLeft: 8,
  },
});
