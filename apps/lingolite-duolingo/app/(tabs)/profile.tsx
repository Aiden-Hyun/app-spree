import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useAuth } from "../../src/contexts/AuthContext";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { router } from "expo-router";
import { useProgress } from "../../src/hooks/useProgress";

function ProfileScreen() {
  const { user, logout } = useAuth();
  const { stats, achievements } = useProgress();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const handleNavigate = (route: string) => {
    router.push(route);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileCircle}>
          <Text style={styles.profileInitial}>
            {user?.email?.charAt(0).toUpperCase() || "U"}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.email}</Text>
        <Text style={styles.memberSince}>Member since 2025</Text>
      </View>

      <View style={styles.statsSection}>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.level || 1}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.total_xp || 0}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{achievements.length}</Text>
            <Text style={styles.statLabel}>Achievements</Text>
          </View>
        </View>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Learning</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleNavigate("/language-select")}
        >
          <Text style={styles.menuIcon}>🌍</Text>
          <Text style={styles.menuText}>My Languages</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleNavigate("/stats")}
        >
          <Text style={styles.menuIcon}>📊</Text>
          <Text style={styles.menuText}>Detailed Statistics</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleNavigate("/achievements")}
        >
          <Text style={styles.menuIcon}>🏆</Text>
          <Text style={styles.menuText}>Achievements</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleNavigate("/settings")}
        >
          <Text style={styles.menuIcon}>⚙️</Text>
          <Text style={styles.menuText}>App Settings</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>🔔</Text>
          <Text style={styles.menuText}>Notifications</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>📱</Text>
          <Text style={styles.menuText}>About</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
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
  header: {
    backgroundColor: "#fff",
    padding: 30,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  profileCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#00b894",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  profileInitial: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  userName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    color: "#666",
  },
  statsSection: {
    backgroundColor: "#fff",
    marginTop: 12,
    padding: 20,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#00b894",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#e0e0e0",
  },
  menuSection: {
    marginTop: 12,
    backgroundColor: "#fff",
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: "#2d3436",
  },
  menuArrow: {
    fontSize: 20,
    color: "#ccc",
  },
  logoutButton: {
    margin: 20,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e74c3c",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e74c3c",
  },
});

export default function Profile() {
  return (
    <ProtectedRoute>
      <ProfileScreen />
    </ProtectedRoute>
  );
}
