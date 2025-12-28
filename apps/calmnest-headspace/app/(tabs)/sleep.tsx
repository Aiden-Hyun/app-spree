import React, { useState, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { AnimatedView } from "../../src/components/AnimatedView";
import { AnimatedPressable } from "../../src/components/AnimatedPressable";
import { ContentCard } from "../../src/components/ContentCard";
import { Skeleton } from "../../src/components/Skeleton";
import { getBedtimeStories } from "../../src/services/firestoreService";
import { useTheme } from "../../src/contexts/ThemeContext";
import { Theme } from "../../src/theme";
import { BedtimeStory } from "../../src/types";
import {
  sleepMeditationsData,
} from "../../src/constants/sleepMeditationsData";
import { seriesData, Series } from "../../src/constants/seriesData";

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

  const handleSeriesPress = (series: Series) => {
    router.push(`/series/${series.id}`);
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

            {/* Series */}
            <View style={styles.section}>
              <AnimatedView delay={100} duration={400}>
                <View style={styles.sectionHeaderNoLink}>
                  <Text style={styles.sectionTitle}>Series</Text>
                  <Text style={styles.sectionSubtitle}>
                    Multi-chapter story collections
                  </Text>
                </View>
              </AnimatedView>

              <AnimatedView delay={150} duration={400}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.cardsScroll}
                >
                  {seriesData.map((series) => (
                    <ContentCard
                      key={series.id}
                      title={series.title}
                      thumbnailUrl={series.thumbnailUrl}
                      fallbackIcon={getCategoryIcon(series.category)}
                      fallbackColor={series.color}
                      meta={`${series.chapterCount} chapters`}
                      onPress={() => handleSeriesPress(series)}
                      darkMode
                    />
                  ))}
                </ScrollView>
              </AnimatedView>
            </View>

            {/* Bedtime Stories */}
            <View style={styles.section}>
              <AnimatedView delay={200} duration={400}>
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
                <AnimatedView delay={250} duration={400}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.cardsScroll}
                  >
                    {[0, 1, 2].map((i) => (
                      <View key={i} style={styles.skeletonCard}>
                        <Skeleton
                          height={120}
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
                <AnimatedView delay={250} duration={400}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.cardsScroll}
                  >
                    {bedtimeStories.map((story) => (
                      <ContentCard
                        key={story.id}
                        title={story.title}
                        thumbnailUrl={story.thumbnail_url}
                        fallbackIcon={getCategoryIcon(story.category)}
                        fallbackColor={theme.colors.sleepAccent}
                        meta={`${story.duration_minutes} min`}
                        onPress={() => router.push(`/sleep/${story.id}`)}
                        darkMode
                      />
                    ))}
                  </ScrollView>
                </AnimatedView>
              )}
            </View>

            {/* Sleep Meditations */}
            <View style={styles.section}>
              <AnimatedView delay={300} duration={400}>
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

              <AnimatedView delay={350} duration={400}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.cardsScroll}
                >
                  {sleepMeditationsData.slice(0, 6).map((meditation) => (
                    <ContentCard
                      key={meditation.id}
                      title={meditation.title}
                      fallbackIcon={meditation.icon as keyof typeof Ionicons.glyphMap}
                      fallbackColor={meditation.color}
                      meta={`${meditation.duration_minutes} min`}
                      onPress={() => router.push("/sleep/sleep-meditations")}
                      darkMode
                    />
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
    sectionHeaderNoLink: {
      marginBottom: theme.spacing.md,
    },
    sectionTitle: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 18,
      color: theme.colors.sleepText,
    },
    sectionSubtitle: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 13,
      color: theme.colors.sleepTextMuted,
      marginTop: 4,
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
    cardsScroll: {
      gap: theme.spacing.md,
    },
    skeletonCard: {
      width: 150,
    },
  });

export default function Sleep() {
  return (
    <ProtectedRoute>
      <SleepScreen />
    </ProtectedRoute>
  );
}
