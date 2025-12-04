import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { formatDistance } from "../utils/distance";

const { width } = Dimensions.get("window");
const cardWidth = (width - 24) / 3; // 3 columns with padding

interface UserCardProps {
  user: {
    id: string;
    full_name?: string;
    avatar_url?: string;
    age?: number;
    distance?: number;
    is_online?: boolean;
    last_seen?: string;
  };
}

export function UserCard({ user }: UserCardProps) {
  const handlePress = () => {
    router.push(`/user/${user.id}`);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.imageContainer}>
        {user.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              {user.full_name?.charAt(0)?.toUpperCase() || "?"}
            </Text>
          </View>
        )}

        {user.is_online && <View style={styles.onlineIndicator} />}

        {user.distance !== undefined && (
          <View style={styles.distanceContainer}>
            <Text style={styles.distanceText}>
              {formatDistance(user.distance)}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {user.full_name || "Anonymous"}
      </Text>

      {user.age && <Text style={styles.age}>{user.age}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    marginBottom: 8,
  },
  imageContainer: {
    width: cardWidth - 8,
    height: cardWidth - 8,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#e9ecef",
    marginBottom: 4,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e84393",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
  onlineIndicator: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#00b894",
    borderWidth: 2,
    borderColor: "white",
  },
  distanceContainer: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  distanceText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2d3436",
    paddingHorizontal: 4,
  },
  age: {
    fontSize: 12,
    color: "#636e72",
    paddingHorizontal: 4,
  },
});


