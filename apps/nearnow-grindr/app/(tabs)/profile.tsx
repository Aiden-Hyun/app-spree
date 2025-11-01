import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
} from "react-native";
import { router } from "expo-router";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { useAuth } from "../../src/contexts/AuthContext";
import { useProfile } from "../../src/hooks/useProfile";
import { useLocation } from "../../src/hooks/useLocation";
import { matchingService } from "../../src/services/matchingService";

function ProfileScreen() {
  const { user, logout } = useAuth();
  const { profile } = useProfile();
  const { hasPermission, isLoading } = useLocation();
  const [incognitoMode, setIncognitoMode] = React.useState(false);
  const [stats, setStats] = React.useState({
    likesReceived: 0,
    superLikesReceived: 0,
    matchesCount: 0,
  });

  React.useEffect(() => {
    if (user) {
      matchingService.getSwipeStats(user.id).then(setStats);
    }
  }, [user]);

  const handleEditProfile = () => {
    router.push("/edit-profile");
  };

  const handleSettings = () => {
    router.push("/settings");
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          {user?.user_metadata?.avatar_url || profile?.photos?.[0] ? (
            <Image
              source={{
                uri: user?.user_metadata?.avatar_url || profile?.photos?.[0],
              }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Text style={styles.profileImageText}>
                {profile?.display_name?.charAt(0)?.toUpperCase() ||
                  user?.email?.charAt(0)?.toUpperCase() ||
                  "?"}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}
          >
            <Text style={styles.editButtonText}>✏️</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.name}>
          {profile?.display_name || "Set your name"}
        </Text>
        {profile?.age && (
          <Text style={styles.age}>{profile.age} years old</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Settings</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>👻</Text>
            <View>
              <Text style={styles.settingLabel}>Incognito Mode</Text>
              <Text style={styles.settingDescription}>
                Browse profiles invisibly
              </Text>
            </View>
          </View>
          <Switch
            value={incognitoMode}
            onValueChange={setIncognitoMode}
            trackColor={{ false: "#ddd", true: "#e84393" }}
            thumbColor={incognitoMode ? "white" : "#f4f3f4"}
          />
        </View>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => router.push("/subscription")}
        >
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>⚡</Text>
            <View>
              <Text style={styles.settingLabel}>NearNow Premium</Text>
              <Text style={styles.settingDescription}>
                See who liked you & more
              </Text>
            </View>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Stats</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.likesReceived}</Text>
            <Text style={styles.statLabel}>Taps</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.matchesCount}</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.superLikesReceived}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity style={styles.menuItem} onPress={handleSettings}>
          <Text style={styles.menuIcon}>⚙️</Text>
          <Text style={styles.menuText}>Settings</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/privacy")}
        >
          <Text style={styles.menuIcon}>🔒</Text>
          <Text style={styles.menuText}>Privacy</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/help")}
        >
          <Text style={styles.menuIcon}>❓</Text>
          <Text style={styles.menuText}>Help & Support</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, styles.logoutItem]}
          onPress={handleLogout}
        >
          <Text style={styles.menuIcon}>🚪</Text>
          <Text style={[styles.menuText, styles.logoutText]}>Sign Out</Text>
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
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e84393",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImageText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "white",
  },
  editButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e84393",
  },
  editButtonText: {
    fontSize: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d3436",
    marginBottom: 4,
  },
  age: {
    fontSize: 16,
    color: "#636e72",
  },
  section: {
    marginTop: 16,
    backgroundColor: "white",
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#95a5a6",
    textTransform: "uppercase",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: "#2d3436",
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: "#636e72",
  },
  statsGrid: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d3436",
  },
  statLabel: {
    fontSize: 14,
    color: "#636e72",
    marginTop: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  menuText: {
    fontSize: 16,
    color: "#2d3436",
    flex: 1,
  },
  chevron: {
    fontSize: 20,
    color: "#b2bec3",
  },
  logoutItem: {
    marginTop: 8,
    borderTopWidth: 8,
    borderTopColor: "#f8f9fa",
  },
  logoutText: {
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
