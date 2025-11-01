import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useRealtimeChat } from "../../src/hooks/useRealtimeChat";
import { ChatBubble } from "../../src/components/ChatBubble";
import { useAuth } from "../../src/contexts/AuthContext";
import { useLocation } from "../../src/hooks/useLocation";
import * as ImagePicker from "expo-image-picker";
import {
  requestCameraPermission,
  requestMediaLibraryPermission,
} from "../../src/utils/permissions";

export default function ChatScreen() {
  const { id: matchId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { latitude, longitude } = useLocation();
  const {
    messages,
    loading,
    sending,
    otherUser,
    isTyping,
    sendMessage,
    sendImage,
    sendLocation,
    loadMoreMessages,
    sendTypingIndicator,
  } = useRealtimeChat(matchId || "");

  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    // Set navigation header
    if (otherUser) {
      router.setParams({ title: otherUser.full_name || "Chat" });
    }
  }, [otherUser]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const text = inputText;
    setInputText("");
    await sendMessage(text);
  };

  const handleTyping = (text: string) => {
    setInputText(text);
    sendTypingIndicator(true);
  };

  const handleImagePicker = async (source: "camera" | "library") => {
    let hasPermission = false;
    if (source === "camera") {
      hasPermission = await requestCameraPermission();
    } else {
      hasPermission = await requestMediaLibraryPermission();
    }

    if (!hasPermission) return;

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
          });

    if (!result.canceled && result.assets[0]) {
      await sendImage(result.assets[0].uri);
    }

    setShowActions(false);
  };

  const handleSendLocation = async () => {
    if (latitude && longitude) {
      await sendLocation(latitude, longitude);
      setShowActions(false);
    } else {
      Alert.alert(
        "Location Unavailable",
        "Please enable location services to share your location."
      );
    }
  };

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const isOwnMessage = item.sender_id === user?.id;
    const showTime =
      index === 0 ||
      new Date(item.sent_at).getTime() -
        new Date(messages[index - 1]?.sent_at).getTime() >
        300000; // 5 minutes

    return (
      <ChatBubble
        message={item}
        isOwnMessage={isOwnMessage}
        showTime={showTime}
        onImagePress={(imageUrl) => {
          // Handle image press (could open in full screen)
          console.log("Image pressed:", imageUrl);
        }}
      />
    );
  };

  const renderHeader = () => {
    if (!otherUser) return null;

    return (
      <TouchableOpacity
        style={styles.header}
        onPress={() => router.push(`/user/${otherUser.id}`)}
      >
        {otherUser.avatar_url ? (
          <Image source={{ uri: otherUser.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {otherUser.full_name?.charAt(0)?.toUpperCase() || "?"}
            </Text>
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>
            {otherUser.full_name || "Anonymous"}
          </Text>
          {otherUser.is_online ? (
            <Text style={styles.onlineStatus}>Online</Text>
          ) : otherUser.last_seen ? (
            <Text style={styles.onlineStatus}>
              Last seen {new Date(otherUser.last_seen).toLocaleTimeString()}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && messages.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e84393" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      {renderHeader()}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onEndReached={loadMoreMessages}
        onEndReachedThreshold={0.1}
        inverted={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Start a conversation!</Text>
          </View>
        }
      />

      {isTyping && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>
            {otherUser?.full_name || "User"} is typing...
          </Text>
        </View>
      )}

      {showActions && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleImagePicker("camera")}
          >
            <Text style={styles.actionIcon}>📸</Text>
            <Text style={styles.actionText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleImagePicker("library")}
          >
            <Text style={styles.actionIcon}>🖼️</Text>
            <Text style={styles.actionText}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSendLocation}
          >
            <Text style={styles.actionIcon}>📍</Text>
            <Text style={styles.actionText}>Location</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.attachButton}
          onPress={() => setShowActions(!showActions)}
        >
          <Text style={styles.attachIcon}>+</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={handleTyping}
          placeholder="Type a message..."
          multiline
          maxLength={1000}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            !inputText.trim() && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.sendIcon}>➤</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e84393",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3436",
  },
  onlineStatus: {
    fontSize: 12,
    color: "#95a5a6",
    marginTop: 2,
  },
  messagesList: {
    paddingVertical: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: "#95a5a6",
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f0f0f0",
  },
  typingText: {
    fontSize: 14,
    color: "#636e72",
    fontStyle: "italic",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  actionButton: {
    alignItems: "center",
    padding: 12,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 12,
    color: "#636e72",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  attachIcon: {
    fontSize: 24,
    color: "#636e72",
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    backgroundColor: "#f0f0f0",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    marginRight: 12,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e84393",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendIcon: {
    fontSize: 20,
    color: "white",
    marginLeft: 2,
  },
});
