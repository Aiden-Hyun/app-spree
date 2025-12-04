import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { PostList } from "../../src/components/posts/PostList";
import { usePosts } from "../../src/hooks/usePosts";
import { subredditService } from "../../src/services/subredditService";
import { Ionicons } from "@expo/vector-icons";
import { Subreddit } from "../../src/types";

function SubredditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [subreddit, setSubreddit] = React.useState<Subreddit | null>(null);
  const [isSubscribed, setIsSubscribed] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [sortBy, setSortBy] = React.useState<"hot" | "new" | "top">("hot");

  const {
    posts,
    loading: postsLoading,
    refreshing,
    hasMore,
    refresh,
    loadMore,
    handleVote,
    handleSave,
  } = usePosts({ subredditId: id, sortBy });

  React.useEffect(() => {
    fetchSubreddit();
    checkSubscription();
  }, [id]);

  const fetchSubreddit = async () => {
    try {
      setLoading(true);
      const data = await subredditService.getSubreddit(id);
      setSubreddit(data);
    } catch (error) {
      console.error("Failed to fetch subreddit:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkSubscription = async () => {
    try {
      const subscribed = await subredditService.isSubscribed(id);
      setIsSubscribed(subscribed);
    } catch (error) {
      console.error("Failed to check subscription:", error);
    }
  };

  const handleSubscribeToggle = async () => {
    try {
      if (isSubscribed) {
        await subredditService.unsubscribe(id);
        setIsSubscribed(false);
        if (subreddit) {
          setSubreddit({
            ...subreddit,
            subscriberCount: Math.max(0, subreddit.subscriberCount - 1),
          });
        }
      } else {
        await subredditService.subscribe(id);
        setIsSubscribed(true);
        if (subreddit) {
          setSubreddit({
            ...subreddit,
            subscriberCount: subreddit.subscriberCount + 1,
          });
        }
      }
    } catch (error) {
      console.error("Failed to toggle subscription:", error);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff4500" />
      </View>
    );
  }

  if (!subreddit) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Subreddit not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {subreddit.bannerUrl && (
          <Image source={{ uri: subreddit.bannerUrl }} style={styles.banner} />
        )}
        <View style={styles.headerContent}>
          <View style={styles.headerInfo}>
            <View style={styles.iconContainer}>
              {subreddit.iconUrl ? (
                <Image
                  source={{ uri: subreddit.iconUrl }}
                  style={styles.icon}
                />
              ) : (
                <View style={styles.defaultIcon}>
                  <Text style={styles.defaultIconText}>
                    {subreddit.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.displayName}>{subreddit.displayName}</Text>
              <Text style={styles.name}>r/{subreddit.name}</Text>
            </View>
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
          </View>

          <Text style={styles.subscribers}>
            {formatSubscribers(subreddit.subscriberCount)} members
          </Text>

          {subreddit.description && (
            <Text style={styles.description}>{subreddit.description}</Text>
          )}
        </View>

        <View style={styles.sortButtons}>
          <TouchableOpacity
            style={[
              styles.sortButton,
              sortBy === "hot" && styles.sortButtonActive,
            ]}
            onPress={() => setSortBy("hot")}
          >
            <Ionicons
              name="flame"
              size={16}
              color={sortBy === "hot" ? "#ff4500" : "#666"}
            />
            <Text
              style={[
                styles.sortButtonText,
                sortBy === "hot" && styles.sortButtonTextActive,
              ]}
            >
              Hot
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sortButton,
              sortBy === "new" && styles.sortButtonActive,
            ]}
            onPress={() => setSortBy("new")}
          >
            <Ionicons
              name="sparkles"
              size={16}
              color={sortBy === "new" ? "#ff4500" : "#666"}
            />
            <Text
              style={[
                styles.sortButtonText,
                sortBy === "new" && styles.sortButtonTextActive,
              ]}
            >
              New
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sortButton,
              sortBy === "top" && styles.sortButtonActive,
            ]}
            onPress={() => setSortBy("top")}
          >
            <Ionicons
              name="trending-up"
              size={16}
              color={sortBy === "top" ? "#ff4500" : "#666"}
            />
            <Text
              style={[
                styles.sortButtonText,
                sortBy === "top" && styles.sortButtonTextActive,
              ]}
            >
              Top
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <PostList
        posts={posts}
        loading={postsLoading}
        refreshing={refreshing}
        onRefresh={refresh}
        onLoadMore={loadMore}
        onVote={handleVote}
        onSave={handleSave}
        hasMore={hasMore}
        emptyMessage={`No posts in r/${subreddit.name} yet`}
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: "#ff4500",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  header: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  banner: {
    width: "100%",
    height: 100,
    resizeMode: "cover",
  },
  headerContent: {
    padding: 16,
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  defaultIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ff4500",
    alignItems: "center",
    justifyContent: "center",
  },
  defaultIconText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  titleContainer: {
    flex: 1,
  },
  displayName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1b",
  },
  name: {
    fontSize: 14,
    color: "#666",
  },
  subscribeButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#ff4500",
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
  subscribers: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
  },
  sortButtons: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    gap: 4,
  },
  sortButtonActive: {
    backgroundColor: "#ffe4dc",
  },
  sortButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  sortButtonTextActive: {
    color: "#ff4500",
  },
});

export default function SubredditDetail() {
  return (
    <ProtectedRoute>
      <SubredditScreen />
    </ProtectedRoute>
  );
}


