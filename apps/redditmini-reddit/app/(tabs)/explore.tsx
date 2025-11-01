import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../../src/contexts/AuthContext";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { SubredditCard } from "../../src/components/subreddits/SubredditCard";
import {
  useSubreddits,
  useUserSubscriptions,
} from "../../src/hooks/useSubreddits";
import { subredditService } from "../../src/services/subredditService";
import { Ionicons } from "@expo/vector-icons";
import { Subreddit } from "../../src/types";

function ExploreScreen() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<Subreddit[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  const { subreddits: trendingSubreddits, loading: trendingLoading } =
    useSubreddits({
      orderBy: "subscriber_count",
    });

  const { subreddits: newSubreddits, loading: newLoading } = useSubreddits({
    orderBy: "created_at",
  });

  const { subscriptions, subscribe, unsubscribe } = useUserSubscriptions();

  const subscribedIds = React.useMemo(
    () => new Set(subscriptions.map((sub) => sub.id)),
    [subscriptions]
  );

  const categories = [
    { name: "Gaming", icon: "game-controller", color: "#9146ff" },
    { name: "Sports", icon: "football", color: "#ff6b6b" },
    { name: "Technology", icon: "hardware-chip", color: "#4dabf7" },
    { name: "Science", icon: "flask", color: "#51cf66" },
    { name: "Art", icon: "color-palette", color: "#ff8787" },
    { name: "Music", icon: "musical-notes", color: "#845ef7" },
  ];

  const handleSearch = React.useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await subredditService.searchSubreddits(query);
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const renderSubreddit = ({ item }: { item: Subreddit }) => (
    <SubredditCard
      subreddit={item}
      isSubscribed={subscribedIds.has(item.id)}
      onSubscribe={subscribe}
      onUnsubscribe={unsubscribe}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search subreddits..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {searchQuery.length >= 2 ? (
        <FlatList
          data={searchResults}
          renderItem={renderSubreddit}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            isSearching ? (
              <ActivityIndicator
                size="large"
                color="#ff4500"
                style={styles.loader}
              />
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>No subreddits found</Text>
              </View>
            )
          }
        />
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Browse by Category</Text>
            <View style={styles.categoriesGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.name}
                  style={styles.categoryCard}
                >
                  <View
                    style={[
                      styles.categoryIcon,
                      { backgroundColor: category.color },
                    ]}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={24}
                      color="#fff"
                    />
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Communities</Text>
            {trendingLoading ? (
              <ActivityIndicator
                size="small"
                color="#ff4500"
                style={styles.loader}
              />
            ) : (
              <View>
                {trendingSubreddits.slice(0, 5).map((subreddit) => (
                  <SubredditCard
                    key={subreddit.id}
                    subreddit={subreddit}
                    isSubscribed={subscribedIds.has(subreddit.id)}
                    onSubscribe={subscribe}
                    onUnsubscribe={unsubscribe}
                  />
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>New Communities</Text>
            {newLoading ? (
              <ActivityIndicator
                size="small"
                color="#ff4500"
                style={styles.loader}
              />
            ) : (
              <View>
                {newSubreddits.slice(0, 3).map((subreddit) => (
                  <SubredditCard
                    key={subreddit.id}
                    subreddit={subreddit}
                    isSubscribed={subscribedIds.has(subreddit.id)}
                    onSubscribe={subscribe}
                    onUnsubscribe={unsubscribe}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#1a1a1b",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: "#1a1a1b",
  },
  content: {
    flex: 1,
  },
  section: {
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    paddingHorizontal: 16,
    color: "#1a1a1b",
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
  },
  categoryCard: {
    width: "33.33%",
    alignItems: "center",
    paddingVertical: 16,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    color: "#1a1a1b",
    fontWeight: "500",
  },
  placeholder: {
    alignItems: "center",
    paddingVertical: 32,
  },
  placeholderText: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  loader: {
    marginVertical: 20,
  },
});

export default function Explore() {
  return (
    <ProtectedRoute>
      <ExploreScreen />
    </ProtectedRoute>
  );
}
