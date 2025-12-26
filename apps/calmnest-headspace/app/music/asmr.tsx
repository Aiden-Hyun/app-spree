import React, { useMemo } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { AnimatedView } from "../../src/components/AnimatedView";
import { AnimatedPressable } from "../../src/components/AnimatedPressable";
import { useTheme } from "../../src/contexts/ThemeContext";
import { asmrData } from "../../src/constants/musicData";
import { Theme } from "../../src/theme";

function ASMRScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleSoundPress = (soundId: string) => {
    router.push(`/music/${soundId}`);
  };

  const renderItem = ({ item, index }: { item: typeof asmrData[0]; index: number }) => (
    <AnimatedView delay={index * 50} duration={400}>
      <AnimatedPressable
        onPress={() => handleSoundPress(item.id)}
        style={styles.soundCard}
      >
        <View
          style={[
            styles.soundIconContainer,
            { backgroundColor: `${item.color}25` },
          ]}
        >
          <Ionicons
            name={`${item.icon}-outline` as keyof typeof Ionicons.glyphMap}
            size={28}
            color={item.color}
          />
        </View>
        <View style={styles.soundInfo}>
          <Text style={styles.soundTitle}>{item.title}</Text>
          <Text style={styles.soundDescription}>{item.description}</Text>
        </View>
        <Ionicons name="play-circle-outline" size={32} color={theme.colors.sleepTextMuted} />
      </AnimatedPressable>
    </AnimatedView>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.gradients.sleepyNight as [string, string]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <AnimatedPressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={theme.colors.sleepText} />
            </AnimatedPressable>
            <Text style={styles.headerTitle}>ASMR</Text>
            <View style={styles.headerSpacer} />
          </View>

          <FlatList
            data={asmrData}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="ear-outline" size={48} color={theme.colors.sleepTextMuted} />
                <Text style={styles.emptyText}>No ASMR available yet</Text>
              </View>
            }
          />
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    gradient: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.sleepSurface,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontFamily: theme.fonts.display.semiBold,
      fontSize: 20,
      color: theme.colors.sleepText,
    },
    headerSpacer: {
      width: 40,
    },
    listContent: {
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    soundCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.sleepSurface,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.md,
    },
    soundIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      marginRight: theme.spacing.md,
    },
    soundInfo: {
      flex: 1,
    },
    soundTitle: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 16,
      color: theme.colors.sleepText,
      marginBottom: 4,
    },
    soundDescription: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 13,
      color: theme.colors.sleepTextMuted,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: theme.spacing.xxl,
      gap: theme.spacing.md,
    },
    emptyText: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 16,
      color: theme.colors.sleepTextMuted,
    },
  });

export default function ASMR() {
  return (
    <ProtectedRoute>
      <ASMRScreen />
    </ProtectedRoute>
  );
}
