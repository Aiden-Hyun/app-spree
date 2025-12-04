import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";

interface ProgressBarProps {
  progress: number; // 0-100
  total?: number;
  current?: number;
  showLabel?: boolean;
  height?: number;
  color?: string;
  backgroundColor?: string;
  animated?: boolean;
}

export function ProgressBar({
  progress,
  total,
  current,
  showLabel = false,
  height = 8,
  color = "#00b894",
  backgroundColor = "#e0e0e0",
  animated = true,
}: ProgressBarProps) {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: progress,
        duration: 500,
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(progress);
    }
  }, [progress, animated]);

  const widthInterpolate = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      <View style={[styles.progressBar, { height, backgroundColor }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: widthInterpolate,
              backgroundColor: color,
            },
          ]}
        />
      </View>
      {showLabel && (
        <Text style={styles.label}>
          {current !== undefined && total !== undefined
            ? `${current} / ${total}`
            : `${Math.round(progress)}%`}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  progressBar: {
    width: "100%",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
});


