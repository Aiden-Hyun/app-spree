import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";

interface VocabularyCardProps {
  word: string;
  translation: string;
  pronunciation?: string;
  onKnow?: () => void;
  onDontKnow?: () => void;
  showAnswer?: boolean;
}

const { width: screenWidth } = Dimensions.get("window");

export function VocabularyCard({
  word,
  translation,
  pronunciation,
  onKnow,
  onDontKnow,
  showAnswer = false,
}: VocabularyCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = new Animated.Value(0);

  const flipCard = () => {
    const toValue = isFlipped ? 0 : 1;
    Animated.spring(flipAnim, {
      toValue,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={flipCard}
        style={styles.cardContainer}
      >
        <Animated.View
          style={[styles.card, styles.cardFront, frontAnimatedStyle]}
        >
          <Text style={styles.wordText}>{word}</Text>
          {pronunciation && (
            <Text style={styles.pronunciationText}>{pronunciation}</Text>
          )}
          <Text style={styles.tapHint}>Tap to flip</Text>
        </Animated.View>

        <Animated.View
          style={[styles.card, styles.cardBack, backAnimatedStyle]}
        >
          <Text style={styles.translationText}>{translation}</Text>
          <Text style={styles.tapHint}>Tap to flip</Text>
        </Animated.View>
      </TouchableOpacity>

      {(showAnswer || isFlipped) && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.dontKnowButton]}
            onPress={onDontKnow}
          >
            <Text style={styles.actionButtonText}>❌ Don't Know</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.knowButton]}
            onPress={onKnow}
          >
            <Text style={styles.actionButtonText}>✅ Know</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 20,
  },
  cardContainer: {
    width: screenWidth - 40,
    height: 250,
    marginBottom: 20,
  },
  card: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    backfaceVisibility: "hidden",
  },
  cardFront: {
    backgroundColor: "#00b894",
  },
  cardBack: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#00b894",
  },
  wordText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 12,
  },
  pronunciationText: {
    fontSize: 18,
    color: "#e0f7fa",
    textAlign: "center",
    marginBottom: 20,
  },
  translationText: {
    fontSize: 28,
    fontWeight: "600",
    color: "#2d3436",
    textAlign: "center",
  },
  tapHint: {
    position: "absolute",
    bottom: 20,
    fontSize: 14,
    color: "#999",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 16,
    marginTop: 20,
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 140,
    alignItems: "center",
  },
  dontKnowButton: {
    backgroundColor: "#fee",
    borderWidth: 1,
    borderColor: "#fcc",
  },
  knowButton: {
    backgroundColor: "#e8f8f5",
    borderWidth: 1,
    borderColor: "#c8e8e3",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3436",
  },
});


