import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Subreddit } from "../../types";

interface SubredditCardProps {
  subreddit: Subreddit;
  isSubscribed?: boolean;
  onSubscribe?: (subredditId: string) => void;
  onUnsubscribe?: (subredditId: string) => void;
}

export function SubredditCard({
  subreddit,
  isSubscribed = false,
  onSubscribe,
  onUnsubscribe,
}: SubredditCardProps) {
  const handlePress = () => {
    router.push(`/subreddit/${subreddit.id}`);
  };

  const handleSubscribeToggle = (e: any) => {
    e.stopPropagation();
    if (isSubscribed && onUnsubscribe) {
      onUnsubscribe(subreddit.id);
    } else if (!isSubscribed && onSubscribe) {
      onSubscribe(subreddit.id);
    }
  };

  const formatSubscribers = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        {subreddit.iconUrl ? (
          <Image source={{ uri: subreddit.iconUrl }} style={styles.icon} />
        ) : (
          <View style={styles.defaultIcon}>
            <Text style={styles.defaultIconText}>
              {subreddit.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>r/{subreddit.name}</Text>
          <Text style={styles.subscribers}>
            {formatSubscribers(subreddit.subscriberCount)} members
          </Text>
        </View>

        {subreddit.description && (
          <Text style={styles.description} numberOfLines={2}>
            {subreddit.description}
          </Text>
        )}
      </View>

      {(onSubscribe || onUnsubscribe) && (
        <TouchableOpacity
          style={[
            styles.subscribeButton,
            isSubscribed && styles.subscribedButton,
          ]}
          onPress={handleSubscribeToggle}
        >
          <Text
            style={[
              styles.subscribeText,
              isSubscribed && styles.subscribedText,
            ]}
          >
            {isSubscribed ? "Joined" : "Join"}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  defaultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ff4500",
    alignItems: "center",
    justifyContent: "center",
  },
  defaultIconText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  header: {
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1b",
  },
  subscribers: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    color: "#444",
    lineHeight: 18,
  },
  subscribeButton: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#ff4500",
    marginLeft: 12,
  },
  subscribedButton: {
    backgroundColor: "#f0f0f0",
  },
  subscribeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  subscribedText: {
    color: "#1a1a1b",
  },
});


