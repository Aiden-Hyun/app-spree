import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useConversations } from "../../src/hooks/useMessages";

export default function MessagesScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const { conversations, loading, refreshing, refresh } = useConversations();

  const renderConversation = ({ item }: { item: any }) => {
    const userName =
      item.otherUser?.full_name ||
      item.otherUser?.email?.split("@")[0] ||
      "User";
    const userAvatar =
      (item.otherUser?.full_name || item.otherUser?.email)
        ?.substring(0, 2)
        .toUpperCase() || "U";
    const timeAgo = getTimeAgo(item.lastMessage?.sent_at);

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() =>
          router.push(`/chat/${item.otherUser.id}?listingId=${item.listing.id}`)
        }
      >
        <View
          style={[styles.avatar, item.unreadCount > 0 && styles.avatarUnread]}
        >
          <Text style={styles.avatarText}>{userAvatar}</Text>
        </View>
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text
              style={[
                styles.userName,
                item.unreadCount > 0 && styles.unreadText,
              ]}
            >
              {userName}
            </Text>
            <Text
              style={[
                styles.timestamp,
                item.unreadCount > 0 && styles.unreadTimestamp,
              ]}
            >
              {timeAgo}
            </Text>
          </View>
          <Text style={styles.listingTitle}>{item.listing?.title}</Text>
          <Text
            style={[
              styles.lastMessage,
              item.unreadCount > 0 && styles.unreadText,
            ]}
            numberOfLines={1}
          >
            {item.lastMessage?.content}
          </Text>
        </View>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 172800) return "Yesterday";
    return date.toLocaleDateString();
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.otherUser?.full_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      conv.otherUser?.email
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      conv.listing?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage?.content
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00b894" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color="#7f8c8d" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {filteredConversations.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="message-text-outline"
            size={64}
            color="#bdc3c7"
          />
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyText}>
            When you contact a seller or someone contacts you, your
            conversations will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              colors={["#00b894"]}
            />
          }
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
    backgroundColor: "white",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d3436",
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#2d3436",
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ecf0f1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarUnread: {
    backgroundColor: "#00b894",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#7f8c8d",
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3436",
  },
  timestamp: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  unreadTimestamp: {
    color: "#00b894",
  },
  listingTitle: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  unreadText: {
    fontWeight: "600",
    color: "#2d3436",
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#00b894",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  separator: {
    height: 1,
    backgroundColor: "#ecf0f1",
    marginLeft: 84,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d3436",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#7f8c8d",
    textAlign: "center",
    lineHeight: 20,
  },
});
