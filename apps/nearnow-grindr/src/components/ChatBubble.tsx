import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { formatTime } from "../utils/time";

interface ChatBubbleProps {
  message: {
    id: string;
    content: string;
    sender_id: string;
    sent_at: string;
    read_at?: string;
    message_type: "text" | "image" | "location";
  };
  isOwnMessage: boolean;
  showTime?: boolean;
  onImagePress?: (imageUrl: string) => void;
}

export function ChatBubble({
  message,
  isOwnMessage,
  showTime = false,
  onImagePress,
}: ChatBubbleProps) {
  const renderContent = () => {
    switch (message.message_type) {
      case "image":
        return (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onImagePress?.(message.content)}
          >
            <Image source={{ uri: message.content }} style={styles.image} />
          </TouchableOpacity>
        );

      case "location":
        const [lat, lng] = message.content.split(",");
        return (
          <View style={styles.locationContainer}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={[styles.locationText, isOwnMessage && styles.ownText]}>
              Location shared
            </Text>
          </View>
        );

      default:
        return (
          <Text style={[styles.messageText, isOwnMessage && styles.ownText]}>
            {message.content}
          </Text>
        );
    }
  };

  return (
    <View
      style={[
        styles.container,
        isOwnMessage ? styles.ownContainer : styles.otherContainer,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble,
          message.message_type === "image" && styles.imageBubble,
        ]}
      >
        {renderContent()}
      </View>

      {showTime && (
        <Text
          style={[
            styles.time,
            isOwnMessage ? styles.ownTime : styles.otherTime,
          ]}
        >
          {formatTime(message.sent_at)}
          {isOwnMessage && message.read_at && " · Read"}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 16,
  },
  ownContainer: {
    alignItems: "flex-end",
  },
  otherContainer: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  ownBubble: {
    backgroundColor: "#e84393",
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: "#f0f0f0",
    borderBottomLeftRadius: 4,
  },
  imageBubble: {
    padding: 4,
  },
  messageText: {
    fontSize: 16,
    color: "#2d3436",
    lineHeight: 20,
  },
  ownText: {
    color: "white",
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 14,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  locationText: {
    fontSize: 16,
    color: "#2d3436",
  },
  time: {
    fontSize: 12,
    marginTop: 4,
    marginHorizontal: 4,
  },
  ownTime: {
    color: "#95a5a6",
    textAlign: "right",
  },
  otherTime: {
    color: "#95a5a6",
    textAlign: "left",
  },
});
