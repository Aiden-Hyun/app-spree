import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../src/contexts/AuthContext";
import { ProtectedRoute } from "../src/components/ProtectedRoute";
import { PostCard } from "../src/components/posts/PostCard";
import { SubredditCard } from "../src/components/subreddits/SubredditCard";
import { Ionicons } from "@expo/vector-icons";
import { Post, Subreddit } from "../src/types";
import { postService } from "../src/services/postService";
import { subredditService } from "../src/services/subredditService";
import { voteService } from "../src/services/voteService";
import { savedService } from "../src/services/savedService";
import { useUserSubscriptions } from "../src/hooks/useSubreddits";

function SearchScreen() {
  const { user } = useAuth();
  const [query, setQuery] = React.useState("");
  const [searchType, setSearchType] = React.useState<"posts" | "subreddits">(
    "posts"
  );
  const [results, setResults] = React.useState<(Post | Subreddit)[]>([]);
  const [loading, setLoading] = React.useState(false);
  const { subscriptions, subscribe, unsubscribe } = useUserSubscriptions();

  const subscribedIds = React.useMemo(
    () => new Set(subscriptions.map((sub) => sub.id)),
    [subscriptions]
  );

  const handleSearch = React.useCallback(async () => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      if (searchType === "subreddits") {
        const subredditResults = await subredditService.searchSubreddits(query);
        setResults(subredditResults);
      } else {
        const postResults = await postService.searchPosts(query);
        setResults(postResults);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }, [query, searchType]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300); // Debounce search

    return () => clearTimeout(timer);
  }, [query, searchType]);

  const handleVote = async (
    postId: string,
    voteType: "upvote" | "downvote"
  ) => {
    try {
      await voteService.voteOnPost(postId, voteType);
      // Update results optimistically
      setResults((prevResults) =>
        prevResults.map((item) => {
          if ("title" in item && item.id === postId) {
            const post = item as Post;
            const currentVote = post.userVote;
            let newUpvotes = post.upvotes;
            let newDownvotes = post.downvotes;
            let newUserVote: typeof post.userVote = voteType;

            if (currentVote === "upvote") {
              newUpvotes--;
            } else if (currentVote === "downvote") {
              newDownvotes--;
            }

            if (currentVote === voteType) {
              newUserVote = null;
            } else if (voteType === "upvote") {
              newUpvotes++;
            } else {
              newDownvotes++;
            }

            return {
              ...post,
              upvotes: newUpvotes,
              downvotes: newDownvotes,
              userVote: newUserVote,
            };
          }
          return item;
        })
      );
    } catch (error) {
      console.error("Vote error:", error);
    }
  };

  const handleSave = async (postId: string) => {
    try {
      // Find the current save state
      const post = results.find((r) => "title" in r && r.id === postId) as Post;
      if (!post) return;

      // Optimistic update
      setResults((prevResults) =>
        prevResults.map((item) => {
          if ("title" in item && item.id === postId) {
            return { ...item, isSaved: !item.isSaved };
          }
          return item;
        })
      );

      // Make API call
      if (post.isSaved) {
        await savedService.unsavePost(postId);
      } else {
        await savedService.savePost(postId);
      }
    } catch (error) {
      console.error("Save error:", error);
      // Revert on error
      setResults((prevResults) =>
        prevResults.map((item) => {
          if ("title" in item && item.id === postId) {
            const post = item as Post;
            return { ...post, isSaved: !post.isSaved };
          }
          return item;
        })
      );
    }
  };

  const renderItem = ({ item }: { item: Post | Subreddit }) => {
    if ("title" in item) {
      // It's a post
      return (
        <PostCard {...(item as Post)} onVote={handleVote} onSave={handleSave} />
      );
    } else {
      // It's a subreddit
      return (
        <SubredditCard
          subreddit={item as Subreddit}
          isSubscribed={subscribedIds.has(item.id)}
          onSubscribe={subscribe}
          onUnsubscribe={unsubscribe}
        />
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${searchType}...`}
            value={query}
            onChangeText={setQuery}
            placeholderTextColor="#999"
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              searchType === "posts" && styles.typeButtonActive,
            ]}
            onPress={() => setSearchType("posts")}
          >
            <Text
              style={[
                styles.typeButtonText,
                searchType === "posts" && styles.typeButtonTextActive,
              ]}
            >
              Posts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              searchType === "subreddits" && styles.typeButtonActive,
            ]}
            onPress={() => setSearchType("subreddits")}
          >
            <Text
              style={[
                styles.typeButtonText,
                searchType === "subreddits" && styles.typeButtonTextActive,
              ]}
            >
              Communities
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {query.length < 2 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={64} color="#ddd" />
          <Text style={styles.emptyStateText}>
            Type at least 2 characters to search
          </Text>
        </View>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff4500" />
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No {searchType} found for "{query}"
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.results}
        />
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
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
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
  typeSelector: {
    flexDirection: "row",
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  typeButtonActive: {
    backgroundColor: "#ffe4dc",
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  typeButtonTextActive: {
    color: "#ff4500",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  results: {
    paddingVertical: 8,
  },
});

export default function Search() {
  return (
    <ProtectedRoute>
      <SearchScreen />
    </ProtectedRoute>
  );
}
