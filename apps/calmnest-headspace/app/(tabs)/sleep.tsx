import React, { useState, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { AnimatedView } from "../../src/components/AnimatedView";
import { AnimatedPressable } from "../../src/components/AnimatedPressable";
import { Skeleton } from "../../src/components/Skeleton";
import { getBedtimeStories } from "../../src/services/firestoreService";
import { useTheme } from "../../src/contexts/ThemeContext";
import { Theme } from "../../src/theme";
import { BedtimeStory } from "../../src/types";
import {
  sleepMeditationsData,
  SleepMeditation,
} from "../../src/constants/sleepMeditationsData";

function SleepScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [bedtimeStories, setBedtimeStories] = useState<BedtimeStory[]>([]);
  const [loading, setLoading] = useState(true);

  const styles = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    loadSleepContent();
  }, []);

  const loadSleepContent = async () => {
    try {
      setLoading(true);
      const stories = await getBedtimeStories();
      setBedtimeStories(stories);
    } catch (error) {
      console.error("Failed to load sleep content:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 21 || hour < 5) return "Sweet dreams await";
    if (hour >= 17) return "Wind down and relax";
    return "Rest when you need it";
  };

  const getCategoryIcon = (
    category: string
  ): keyof typeof Ionicons.glyphMap => {
    switch (category) {
      case "nature":
        return "leaf";
      case "fantasy":
        return "planet";
      case "travel":
        return "airplane";
      case "thriller":
        return "skull";
      case "fiction":
        return "book";
      default:
        return "book";
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.gradients.sleepyNight as [string, string]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <AnimatedView delay={0} duration={500}>
              <View style={styles.header}>
                <View style={styles.moonContainer}>
                  <Ionicons
                    name="moon"
                    size={48}
                    color={theme.colors.sleepAccent}
                  />
                </View>
                <Text style={styles.title}>Ready for Rest</Text>
                <Text style={styles.subtitle}>{getTimeGreeting()}</Text>
              </View>
            </AnimatedView>

            {/* Bedtime Stories */}
            <View style={styles.section}>
              <AnimatedView delay={100} duration={400}>
                <AnimatedPressable
                  onPress={() => router.push("/sleep/bedtime-stories")}
                  style={styles.sectionHeader}
                >
                  <Text style={styles.sectionTitle}>Bedtime Stories</Text>
                  <View style={styles.seeAllContainer}>
                    <Text style={styles.seeAllText}>See all</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={theme.colors.sleepTextMuted}
                    />
                  </View>
                </AnimatedPressable>
              </AnimatedView>

              {loading ? (
                <AnimatedView delay={150} duration={400}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.storiesScroll}
                  >
                    {[0, 1, 2].map((i) => (
                      <View key={i} style={styles.storyCard}>
                        <Skeleton
                          height={90}
                          borderRadius={theme.borderRadius.lg}
                          style={{ marginBottom: theme.spacing.sm }}
                        />
                        <Skeleton
                          height={14}
                          width="80%"
                          style={{ marginBottom: 4 }}
                        />
                        <Skeleton height={12} width="50%" />
                      </View>
                    ))}
                  </ScrollView>
                </AnimatedView>
              ) : (
                <AnimatedView delay={150} duration={400}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.storiesScroll}
                  >
                    {bedtimeStories.map((story) => (
                      <AnimatedPressable
                        key={story.id}
                        onPress={() => router.push(`/sleep/${story.id}`)}
                        style={styles.storyCard}
                      >
                        {story.thumbnail_url ? (
                          <Image
                            source={{ uri: story.thumbnail_url }}
                            style={styles.storyImage}
                          />
                        ) : (
                          <View style={styles.storyIcon}>
                            <Ionicons
                              name={getCategoryIcon(story.category)}
                              size={24}
                              color={theme.colors.sleepAccent}
                            />
                          </View>
                        )}
                        <Text style={styles.storyTitle} numberOfLines={2}>
                          {story.title}
                        </Text>
                        <Text style={styles.storyMeta}>
                          {story.duration_minutes} min
                        </Text>
                      </AnimatedPressable>
                    ))}
                  </ScrollView>
                </AnimatedView>
              )}
            </View>

            {/* Sleep Meditations */}
            <View style={styles.section}>
              <AnimatedView delay={200} duration={400}>
                <AnimatedPressable
                  onPress={() => router.push("/sleep/sleep-meditations")}
                  style={styles.sectionHeader}
                >
                  <Text style={styles.sectionTitle}>Sleep Meditations</Text>
                  <View style={styles.seeAllContainer}>
                    <Text style={styles.seeAllText}>See all</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={theme.colors.sleepTextMuted}
                    />
                  </View>
                </AnimatedPressable>
              </AnimatedView>

              <AnimatedView delay={250} duration={400}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.storiesScroll}
                >
                  {sleepMeditationsData.slice(0, 6).map((meditation) => (
                    <AnimatedPressable
                      key={meditation.id}
                      onPress={() => router.push("/sleep/sleep-meditations")}
                      style={styles.meditationCard}
                    >
                      <View
                        style={[
                          styles.meditationIcon,
                          { backgroundColor: `${meditation.color}20` },
                        ]}
                      >
                        <Ionicons
                          name={
                            meditation.icon as keyof typeof Ionicons.glyphMap
                          }
                          size={24}
                          color={meditation.color}
                        />
                      </View>
                      <Text style={styles.meditationTitle} numberOfLines={2}>
                        {meditation.title}
                      </Text>
                      <Text style={styles.meditationMeta}>
                        {meditation.duration_minutes} min
                      </Text>
                    </AnimatedPressable>
                  ))}
                </ScrollView>
              </AnimatedView>
            </View>
          </ScrollView>
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
    scrollContent: {
      paddingBottom: theme.spacing.xxl,
    },
    header: {
      alignItems: "center",
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.lg,
    },
    moonContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: "rgba(201, 184, 150, 0.1)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing.md,
    },
    title: {
      fontFamily: theme.fonts.display.semiBold,
      fontSize: 28,
      color: theme.colors.sleepText,
      letterSpacing: -0.3,
    },
    subtitle: {
      fontFamily: theme.fonts.body.italic,
      fontSize: 15,
      color: theme.colors.sleepTextMuted,
      marginTop: 4,
    },
    section: {
      marginTop: theme.spacing.xl,
      paddingHorizontal: theme.spacing.lg,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: theme.spacing.md,
    },
    sectionTitle: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 18,
      color: theme.colors.sleepText,
    },
    seeAllContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    seeAllText: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 14,
      color: theme.colors.sleepTextMuted,
    },
    storiesScroll: {
      gap: theme.spacing.md,
    },
    storyCard: {
      width: 150,
      backgroundColor: theme.colors.sleepSurface,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.md,
    },
    storyImage: {
      width: "100%",
      height: 90,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.sm,
      resizeMode: "cover",
    },
    storyIcon: {
      width: "100%",
      height: 90,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: "rgba(201, 184, 150, 0.1)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing.sm,
    },
    storyTitle: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 14,
      color: theme.colors.sleepText,
      marginBottom: 4,
    },
    storyMeta: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 12,
      color: theme.colors.sleepTextMuted,
    },
    meditationCard: {
      width: 130,
      backgroundColor: theme.colors.sleepSurface,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.md,
      alignItems: "center",
    },
    meditationIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing.sm,
    },
    meditationTitle: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 14,
      color: theme.colors.sleepText,
      textAlign: "center",
      marginBottom: 4,
    },
    meditationMeta: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 12,
      color: theme.colors.sleepTextMuted,
    },
  });

export default function Sleep() {
  return (
    <ProtectedRoute>
      <SleepScreen />
    </ProtectedRoute>
  );
}
