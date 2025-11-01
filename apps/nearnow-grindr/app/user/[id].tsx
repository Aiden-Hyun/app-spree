import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "../../src/supabase";
import { useAuth } from "../../src/contexts/AuthContext";
import { useFavorites } from "../../src/hooks/useFavorites";
import { useLocation } from "../../src/hooks/useLocation";
import { formatDistance, calculateDistance } from "../../src/utils/distance";
import { formatDistanceToNow } from "../../src/utils/time";
import { matchingService } from "../../src/services/matchingService";

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  age?: number;
  location_lat?: number;
  location_lng?: number;
  last_seen?: string;
  is_online?: boolean;
  user_profiles?: {
    display_name: string;
    bio?: string;
    age?: number;
    photos: string[];
    interests: string[];
    looking_for: string[];
  };
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const { latitude, longitude } = useLocation();
  const { toggleFavorite, isFavorite } = useFavorites(latitude, longitude);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  useEffect(() => {
    if (id) {
      fetchUserProfile();
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      setIsFavorited(isFavorite(id));
    }
  }, [id, isFavorite]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("users")
        .select(
          `
          *,
          user_profiles (
            display_name,
            bio,
            age,
            photos,
            interests,
            looking_for
          )
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      Alert.alert("Error", "Failed to load profile");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleTap = async () => {
    if (!currentUser || !profile) return;

    try {
      const { isMatch, matchId } = await matchingService.createSwipe(
        currentUser.id,
        profile.id,
        "like"
      );

      if (isMatch) {
        Alert.alert(
          "It's a Match! 🎉",
          `You and ${
            profile.user_profiles?.display_name ||
            profile.full_name ||
            "this user"
          } have liked each other!`,
          [
            { text: "Keep Browsing", style: "cancel" },
            {
              text: "Start Chatting",
              onPress: () => router.push(`/chat/${matchId}`),
            },
          ]
        );
      } else {
        Alert.alert(
          "Tap Sent!",
          `You tapped ${
            profile.user_profiles?.display_name ||
            profile.full_name ||
            "this user"
          }`
        );
      }
    } catch (error: any) {
      Alert.alert("Error", "Failed to send tap");
    }
  };

  const handleFavorite = async () => {
    if (!profile) return;

    try {
      const newState = await toggleFavorite(profile.id);
      setIsFavorited(newState);
    } catch (error) {
      Alert.alert("Error", "Failed to update favorite");
    }
  };

  const handleChat = async () => {
    if (!currentUser || !profile) return;

    try {
      // Check if there's an existing match
      const { data: match } = await supabase
        .from("matches")
        .select("id")
        .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
        .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
        .single();

      if (match) {
        router.push(`/chat/${match.id}`);
      } else {
        Alert.alert(
          "No Match",
          "You need to match with this user before you can chat"
        );
      }
    } catch (error) {
      Alert.alert(
        "No Match",
        "You need to match with this user before you can chat"
      );
    }
  };

  const handleBlock = async () => {
    if (!currentUser || !profile) return;

    Alert.alert(
      "Block User",
      `Are you sure you want to block ${
        profile.user_profiles?.display_name || profile.full_name || "this user"
      }? They won't be able to see your profile or contact you.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.from("blocked_users").insert({
                blocker_id: currentUser.id,
                blocked_id: profile.id,
              });

              if (error) throw error;

              Alert.alert("User Blocked", "This user has been blocked.");
              router.back();
            } catch (error: any) {
              Alert.alert("Error", "Failed to block user");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e84393" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Profile not found</Text>
      </View>
    );
  }

  const displayName =
    profile.user_profiles?.display_name || profile.full_name || "Anonymous";
  const age = profile.user_profiles?.age || profile.age;
  const bio = profile.user_profiles?.bio || profile.bio;
  const photos =
    profile.user_profiles?.photos ||
    (profile.avatar_url ? [profile.avatar_url] : []);
  const interests = profile.user_profiles?.interests || [];
  const lookingFor = profile.user_profiles?.looking_for || [];

  const distance =
    latitude && longitude && profile.location_lat && profile.location_lng
      ? formatDistance(
          calculateDistance(
            latitude,
            longitude,
            profile.location_lat,
            profile.location_lng
          )
        )
      : null;

  return (
    <ScrollView style={styles.container}>
      {/* Photo Gallery */}
      <View style={styles.photoContainer}>
        {photos.length > 0 ? (
          <Image
            source={{ uri: photos[selectedPhotoIndex] }}
            style={styles.mainPhoto}
          />
        ) : (
          <View style={styles.noPhoto}>
            <Text style={styles.noPhotoText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        {photos.length > 1 && (
          <View style={styles.photoIndicators}>
            {photos.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.photoIndicator,
                  selectedPhotoIndex === index && styles.photoIndicatorActive,
                ]}
                onPress={() => setSelectedPhotoIndex(index)}
              />
            ))}
          </View>
        )}

        {/* Status badges */}
        <View style={styles.statusBadges}>
          {profile.is_online && (
            <View style={styles.onlineBadge}>
              <Text style={styles.onlineText}>Online</Text>
            </View>
          )}
          {distance && (
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>{distance}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Profile Info */}
      <View style={styles.profileInfo}>
        <View style={styles.nameSection}>
          <Text style={styles.name}>{displayName}</Text>
          {age && <Text style={styles.age}>, {age}</Text>}
        </View>

        {!profile.is_online && profile.last_seen && (
          <Text style={styles.lastSeen}>
            Last seen {formatDistanceToNow(profile.last_seen)} ago
          </Text>
        )}

        {bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bio}>{bio}</Text>
          </View>
        )}

        {lookingFor.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Looking For</Text>
            <View style={styles.tags}>
              {lookingFor.map((item, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {interests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.tags}>
              {interests.map((interest, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleTap}>
          <Text style={styles.actionIcon}>👋</Text>
          <Text style={styles.actionText}>Tap</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            isFavorited && styles.actionButtonActive,
          ]}
          onPress={handleFavorite}
        >
          <Text style={styles.actionIcon}>⭐</Text>
          <Text style={styles.actionText}>Favorite</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleChat}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleBlock}>
          <Text style={styles.actionIcon}>🚫</Text>
          <Text style={styles.actionText}>Block</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#636e72",
  },
  photoContainer: {
    position: "relative",
    height: 400,
    backgroundColor: "#e9ecef",
  },
  mainPhoto: {
    width: "100%",
    height: "100%",
  },
  noPhoto: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e84393",
    justifyContent: "center",
    alignItems: "center",
  },
  noPhotoText: {
    fontSize: 120,
    fontWeight: "bold",
    color: "white",
  },
  photoIndicators: {
    position: "absolute",
    top: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
  },
  photoIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 2,
  },
  photoIndicatorActive: {
    backgroundColor: "white",
  },
  statusBadges: {
    position: "absolute",
    bottom: 16,
    left: 16,
    flexDirection: "row",
    gap: 8,
  },
  onlineBadge: {
    backgroundColor: "#00b894",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  onlineText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  distanceBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  distanceText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  profileInfo: {
    padding: 20,
  },
  nameSection: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2d3436",
  },
  age: {
    fontSize: 24,
    color: "#636e72",
  },
  lastSeen: {
    fontSize: 14,
    color: "#95a5a6",
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    color: "#636e72",
    lineHeight: 22,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  tagText: {
    fontSize: 14,
    color: "#636e72",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  actionButton: {
    alignItems: "center",
    padding: 12,
  },
  actionButtonActive: {
    opacity: 1,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 12,
    color: "#636e72",
  },
});
