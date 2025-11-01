import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface VoteButtonsProps {
  upvotes: number;
  downvotes: number;
  userVote?: "upvote" | "downvote" | null;
  onUpvote: () => void;
  onDownvote: () => void;
  horizontal?: boolean;
}

export function VoteButtons({
  upvotes,
  downvotes,
  userVote,
  onUpvote,
  onDownvote,
  horizontal = false,
}: VoteButtonsProps) {
  const score = upvotes - downvotes;

  const formatScore = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return num.toString();
  };

  return (
    <View style={[styles.container, horizontal && styles.containerHorizontal]}>
      <TouchableOpacity
        onPress={onUpvote}
        style={styles.voteButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name={
            userVote === "upvote"
              ? "arrow-up-circle"
              : "arrow-up-circle-outline"
          }
          size={24}
          color={userVote === "upvote" ? "#ff4500" : "#666"}
        />
      </TouchableOpacity>

      <Text
        style={[
          styles.score,
          userVote === "upvote" && styles.scoreUpvoted,
          userVote === "downvote" && styles.scoreDownvoted,
        ]}
      >
        {formatScore(score)}
      </Text>

      <TouchableOpacity
        onPress={onDownvote}
        style={styles.voteButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name={
            userVote === "downvote"
              ? "arrow-down-circle"
              : "arrow-down-circle-outline"
          }
          size={24}
          color={userVote === "downvote" ? "#5a75cc" : "#666"}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  containerHorizontal: {
    flexDirection: "row",
    gap: 8,
  },
  voteButton: {
    padding: 4,
  },
  score: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1b",
    marginVertical: 2,
  },
  scoreUpvoted: {
    color: "#ff4500",
  },
  scoreDownvoted: {
    color: "#5a75cc",
  },
});
