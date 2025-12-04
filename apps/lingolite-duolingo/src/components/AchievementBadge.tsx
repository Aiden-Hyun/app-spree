import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";

interface AchievementBadgeProps {
  name: string;
  description: string;
  icon: string;
  isUnlocked?: boolean;
  progress?: number; // 0-100 for locked achievements
  size?: "small" | "medium" | "large";
  showProgress?: boolean;
}

export function AchievementBadge({
  name,
  description,
  icon,
  isUnlocked = false,
  progress = 0,
  size = "medium",
  showProgress = true,
}: AchievementBadgeProps) {
  const scaleAnim = useRef(new Animated.Value(isUnlocked ? 1 : 0.9)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isUnlocked) {
      // Unlock animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    }
  }, [isUnlocked]);

  const sizeConfig = {
    small: {
      badge: 50,
      icon: 24,
      name: 12,
      description: 10,
    },
    medium: {
      badge: 70,
      icon: 32,
      name: 14,
      description: 12,
    },
    large: {
      badge: 90,
      icon: 40,
      name: 16,
      description: 14,
    },
  };

  const config = sizeConfig[size];

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.3],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.badge,
          {
            width: config.badge,
            height: config.badge,
            transform: [{ scale: scaleAnim }],
          },
          isUnlocked ? styles.unlockedBadge : styles.lockedBadge,
        ]}
      >
        {isUnlocked && (
          <Animated.View
            style={[
              styles.glowEffect,
              {
                width: config.badge * 1.4,
                height: config.badge * 1.4,
                opacity: glowOpacity,
              },
            ]}
          />
        )}

        <Text style={[styles.icon, { fontSize: config.icon }]}>{icon}</Text>

        {!isUnlocked && showProgress && progress > 0 && (
          <View style={styles.progressRing}>
            <View
              style={[
                styles.progressFill,
                {
                  width: config.badge - 8,
                  height: config.badge - 8,
                },
              ]}
            >
              <View
                style={[
                  styles.progressMask,
                  {
                    transform: [
                      { rotate: `${(progress / 100) * 360 - 180}deg` },
                    ],
                  },
                ]}
              />
            </View>
          </View>
        )}
      </Animated.View>

      {size !== "small" && (
        <View style={styles.info}>
          <Text
            style={[
              styles.name,
              { fontSize: config.name },
              !isUnlocked && styles.lockedText,
            ]}
            numberOfLines={1}
          >
            {name}
          </Text>
          {size === "large" && (
            <Text
              style={[
                styles.description,
                { fontSize: config.description },
                !isUnlocked && styles.lockedText,
              ]}
              numberOfLines={2}
            >
              {description}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  badge: {
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  unlockedBadge: {
    backgroundColor: "#00b894",
    shadowColor: "#00b894",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  lockedBadge: {
    backgroundColor: "#e0e0e0",
    borderWidth: 2,
    borderColor: "#ccc",
  },
  glowEffect: {
    position: "absolute",
    borderRadius: 70,
    backgroundColor: "#00b894",
  },
  icon: {
    zIndex: 1,
  },
  progressRing: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#00b894",
    justifyContent: "center",
    alignItems: "center",
  },
  progressFill: {
    borderRadius: 50,
    backgroundColor: "#e0e0e0",
    overflow: "hidden",
  },
  progressMask: {
    position: "absolute",
    width: "50%",
    height: "100%",
    backgroundColor: "#00b894",
    right: "50%",
  },
  info: {
    marginTop: 8,
    alignItems: "center",
  },
  name: {
    fontWeight: "600",
    color: "#2d3436",
    textAlign: "center",
  },
  description: {
    color: "#666",
    textAlign: "center",
    marginTop: 2,
  },
  lockedText: {
    color: "#999",
  },
});


