import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMessages } from "../../src/hooks/useMessages";
import { useAuth } from "../../src/contexts/AuthContext";
import { listingService } from "../../src/services/listing.service";

export default function ChatScreen() {
  const { id, listingId } = useLocalSearchParams();
  const { user } = useAuth();
  const [messageText, setMessageText] = useState("");
  const [listing, setListing] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);

  const { messages, loading, error, sending, sendMessage } = useMessages(
    listingId as string,
    id as string
  );

  useEffect(() => {
    // Fetch listing details for header
    if (listingId) {
      listingService.getListingById(listingId as string).then((data) => {
        setListing(data);
      });
    }
  }, [listingId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!messageText.trim() || sending) return;

    try {
      await sendMessage(messageText);
      setMessageText("");
    } catch (error) {
      Alert.alert("Error", "Failed to send message");
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isOwnMessage = item.sender_id === user?.id;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownBubble : styles.otherBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isOwnMessage ? styles.ownText : styles.otherText,
            ]}
          >
            {item.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isOwnMessage ? styles.ownTime : styles.otherTime,
            ]}
          >
            {new Date(item.sent_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  if (loading && messages.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00b894" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: listing?.title || "Chat",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push(`/listing/${listingId}`)}
              style={styles.headerButton}
            >
              <MaterialCommunityIcons
                name="information-outline"
                size={24}
                color="#2d3436"
              />
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={100}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="message-outline"
                size={64}
                color="#bdc3c7"
              />
              <Text style={styles.emptyText}>
                No messages yet. Start the conversation!
              </Text>
            </View>
          }
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, sending && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={sending || !messageText.trim()}
          >
            {sending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <MaterialCommunityIcons name="send" size={24} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
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
  headerButton: {
    marginRight: 16,
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: "80%",
  },
  ownMessage: {
    alignSelf: "flex-end",
  },
  otherMessage: {
    alignSelf: "flex-start",
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: "#00b894",
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: "white",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  ownText: {
    color: "white",
  },
  otherText: {
    color: "#2d3436",
  },
  messageTime: {
    fontSize: 11,
  },
  ownTime: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  otherTime: {
    color: "#7f8c8d",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: "#7f8c8d",
    marginTop: 16,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#ecf0f1",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 48,
    height: 48,
    backgroundColor: "#00b894",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#95a5a6",
  },
});


