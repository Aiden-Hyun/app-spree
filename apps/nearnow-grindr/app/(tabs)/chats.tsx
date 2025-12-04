import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import { router } from "expo-router";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { useChats } from "../../src/hooks/useChats";
import { formatDistanceToNow } from "../../src/utils/time";

interface ChatItemProps {
  chat: {
    id: string;
    other_user: {
      id: string;
      full_name?: string;
      avatar_url?: string;
      is_online?: boolean;
    };
    last_message?: {
      content: string;
      sent_at: string;
      sender_id: string;
    };
    unread_count: number;
  };
  currentUserId: string;
}

function ChatItem({ chat, currentUserId }: ChatItemProps) {
  const handlePress = () => {
    router.push(`/chat/${chat.id}`);
  };

  const isOwnMessage = chat.last_message?.sender_id === currentUserId;

  return (
    <TouchableOpacity style={styles.chatItem} onPress={handlePress}>
      <View style={styles.avatarContainer}>
        {chat.other_user.avatar_url ? (
          <Image
            source={{ uri: chat.other_user.avatar_url }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {chat.other_user.full_name?.charAt(0)?.toUpperCase() || "?"}
            </Text>
          </View>
        )}
        {chat.other_user.is_online && <View style={styles.onlineIndicator} />}
      </View>

      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.userName} numberOfLines={1}>
            {chat.other_user.full_name || "Anonymous"}
          </Text>
          {chat.last_message && (
            <Text style={styles.timestamp}>
              {formatDistanceToNow(chat.last_message.sent_at)}
            </Text>
          )}
        </View>

        {chat.last_message && (
          <Text style={styles.lastMessage} numberOfLines={1}>
            {isOwnMessage && <Text style={styles.youPrefix}>You: </Text>}
            {chat.last_message.content}
          </Text>
        )}
      </View>

      {chat.unread_count > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadCount}>{chat.unread_count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function ChatsScreen() {
  const { chats, loading, currentUserId } = useChats();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading chats...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        renderItem={({ item }) => (
          <ChatItem chat={item} currentUserId={currentUserId} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>No chats yet</Text>
            <Text style={styles.emptySubtext}>
              Start a conversation with someone you've matched with
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#636e72",
  },
  listContent: {
    flexGrow: 1,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#e84393",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#00b894",
    borderWidth: 2,
    borderColor: "white",
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3436",
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: "#95a5a6",
    marginLeft: 8,
  },
  lastMessage: {
    fontSize: 14,
    color: "#636e72",
  },
  youPrefix: {
    color: "#95a5a6",
  },
  unreadBadge: {
    backgroundColor: "#e84393",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  unreadCount: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  separator: {
    height: 1,
    backgroundColor: "#e9ecef",
    marginLeft: 84,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#636e72",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#95a5a6",
    textAlign: "center",
  },
});

export default function Chats() {
  return (
    <ProtectedRoute>
      <ChatsScreen />
    </ProtectedRoute>
  );
}


