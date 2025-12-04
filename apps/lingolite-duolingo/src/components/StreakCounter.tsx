import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";

interface StreakCounterProps {
  count: number;
  size?: "small" | "medium" | "large";
  showFlame?: boolean;
  animated?: boolean;
}

export function StreakCounter({
  count,
  size = "medium",
  showFlame = true,
  animated = true,
}: StreakCounterProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated && count > 0) {
      // Pulse animation when streak increases
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Subtle rotation for the flame
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: -1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [count, animated]);

  const rotate = rotateAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-5deg", "5deg"],
  });

  const sizeStyles = {
    small: {
      container: styles.smallContainer,
      flame: styles.smallFlame,
      count: styles.smallCount,
    },
    medium: {
      container: styles.mediumContainer,
      flame: styles.mediumFlame,
      count: styles.mediumCount,
    },
    large: {
      container: styles.largeContainer,
      flame: styles.largeFlame,
      count: styles.largeCount,
    },
  };

  const currentSize = sizeStyles[size];
  const isActive = count > 0;

  return (
    <Animated.View
      style={[
        styles.container,
        currentSize.container,
        { transform: [{ scale: scaleAnim }] },
        !isActive && styles.inactiveContainer,
      ]}
    >
      {showFlame && (
        <Animated.Text
          style={[
            currentSize.flame,
            { transform: [{ rotate }] },
            !isActive && styles.inactiveFlame,
          ]}
        >
          🔥
        </Animated.Text>
      )}
      <Text style={[currentSize.count, !isActive && styles.inactiveCount]}>
        {count}
      </Text>
      {size !== "small" && (
        <Text style={[styles.label, !isActive && styles.inactiveLabel]}>
          {count === 1 ? "day" : "days"}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inactiveContainer: {
    backgroundColor: "#f5f5f5",
  },
  // Small size
  smallContainer: {
    flexDirection: "row",
    padding: 8,
    borderRadius: 8,
  },
  smallFlame: {
    fontSize: 16,
    marginRight: 4,
  },
  smallCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ff6b6b",
  },
  // Medium size
  mediumContainer: {
    padding: 16,
  },
  mediumFlame: {
    fontSize: 24,
    marginBottom: 4,
  },
  mediumCount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ff6b6b",
  },
  // Large size
  largeContainer: {
    padding: 24,
    borderRadius: 16,
  },
  largeFlame: {
    fontSize: 40,
    marginBottom: 8,
  },
  largeCount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ff6b6b",
  },
  label: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  inactiveFlame: {
    opacity: 0.3,
  },
  inactiveCount: {
    color: "#999",
  },
  inactiveLabel: {
    color: "#999",
  },
});


