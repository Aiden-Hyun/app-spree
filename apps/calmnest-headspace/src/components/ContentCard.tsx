import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AnimatedPressable } from "./AnimatedPressable";
import { useTheme } from "../contexts/ThemeContext";
import { Theme } from "../theme";

// Helper to convert hex color to rgba with opacity
function hexToRgba(hex: string, opacity: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export interface ContentCardProps {
  title: string;
  thumbnailUrl?: string;
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
  fallbackColor?: string;
  meta?: string; // e.g., "10 min" or "3 tracks"
  onPress: () => void;
  // For sleep page only (uses sleep-specific colors)
  darkMode?: boolean;
}

export function ContentCard({
  title,
  thumbnailUrl,
  fallbackIcon = "musical-notes",
  fallbackColor,
  meta,
  onPress,
  darkMode = false,
}: ContentCardProps) {
  const { theme, isDark } = useTheme();

  // darkMode prop = Sleep page (always use sleep colors)
  // isDark = system/app dark mode (use regular dark colors)
  const isSleepPage = darkMode;
  const isRegularDark = isDark && !darkMode;

  const styles = React.useMemo(
    () => createStyles(theme, isSleepPage, isRegularDark),
    [theme, isSleepPage, isRegularDark]
  );

  const accentColor = fallbackColor || theme.colors.primary;

  // Card background with subtle color tint
  let cardBgColor: string;
  if (isSleepPage) {
    // Sleep page: use sleep surface color
    cardBgColor = theme.colors.sleepSurface;
  } else if (isRegularDark) {
    // Other pages in dark mode: use regular surface with subtle tint
    cardBgColor = theme.colors.surface;
  } else {
    // Light mode: subtle accent color tint (7% opacity)
    cardBgColor = hexToRgba(accentColor, 0.07);
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: cardBgColor }]}
    >
      <View style={styles.thumbnailContainer}>
        {thumbnailUrl ? (
          <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} />
        ) : (
          <View
            style={[
              styles.thumbnail,
              styles.thumbnailPlaceholder,
              { backgroundColor: hexToRgba(accentColor, 0.125) },
            ]}
          >
            <Ionicons name={fallbackIcon} size={40} color={accentColor} />
          </View>
        )}
      </View>
      <Text style={styles.title}>
        {title}
      </Text>
      <Text style={styles.meta} numberOfLines={1}>
        {meta || " "}
      </Text>
    </AnimatedPressable>
  );
}

// 50% larger than previous (140 → 210)
const CARD_WIDTH = 190;
const THUMBNAIL_HEIGHT = 130;

const createStyles = (
  theme: Theme,
  isSleepPage: boolean,
  isRegularDark: boolean
) =>
  StyleSheet.create({
    card: {
      width: CARD_WIDTH,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.md,
      alignItems: "center",
      flexShrink: 0,
      ...theme.shadows.sm,
    },
    thumbnailContainer: {
      width: "100%",
      height: THUMBNAIL_HEIGHT,
      borderRadius: theme.borderRadius.lg,
      overflow: "hidden",
    },
    thumbnail: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },
    thumbnailPlaceholder: {
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 15,
      lineHeight: 20,
      color: isSleepPage
        ? theme.colors.sleepText
        : isRegularDark
        ? theme.colors.text
        : theme.colors.text,
      textAlign: "center",
      marginTop: theme.spacing.md,
    },
    meta: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 13,
      color: isSleepPage
        ? theme.colors.sleepTextMuted
        : isRegularDark
        ? theme.colors.textLight
        : theme.colors.textLight,
      textAlign: "center",
      marginTop: 4,
    },
  });
