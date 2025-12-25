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

function SleepScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [bedtimeStories, setBedtimeStories] = useState<BedtimeStory[]>([]);
  const [featuredStory, setFeaturedStory] = useState<BedtimeStory | null>(null);
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
      if (stories.length > 0) {
        setFeaturedStory(stories[0]);
      }
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

            {/* Featured Story */}
            <View style={styles.section}>
              <AnimatedView delay={100} duration={400}>
                <Text style={styles.sectionTitle}>Tonight's Story</Text>
              </AnimatedView>

              {loading ? (
                <AnimatedView delay={150} duration={400}>
                  <View style={styles.featuredSkeleton}>
                    <Skeleton
                      height={200}
                      borderRadius={theme.borderRadius.xl}
                    />
                  </View>
                </AnimatedView>
              ) : featuredStory ? (
                <AnimatedView delay={150} duration={400}>
                  <AnimatedPressable
                    onPress={() => router.push(`/sleep/${featuredStory.id}`)}
                    style={styles.featuredCard}
                  >
                    {featuredStory.thumbnail_url ? (
                      <Image
                        source={{ uri: featuredStory.thumbnail_url }}
                        style={styles.featuredImage}
                      />
                    ) : null}
                    <LinearGradient
                      colors={
                        featuredStory.thumbnail_url
                          ? ["transparent", "rgba(26, 29, 41, 0.9)"]
                          : ["#3D4158", "#2A2D3E"]
                      }
                      style={[
                        styles.featuredGradient,
                        featuredStory.thumbnail_url &&
                          styles.featuredGradientOverlay,
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                    >
                      <View style={styles.featuredStars}>
                        <Ionicons
                          name="sparkles"
                          size={24}
                          color={theme.colors.sleepAccent}
                        />
                      </View>
                      <Text style={styles.featuredTitle}>
                        {featuredStory.title}
                      </Text>
                      <Text
                        style={styles.featuredDescription}
                        numberOfLines={2}
                      >
                        {featuredStory.description}
                      </Text>
                      <View style={styles.featuredMeta}>
                        <View style={styles.metaItem}>
                          <Ionicons
                            name="time-outline"
                            size={14}
                            color={theme.colors.sleepTextMuted}
                          />
                          <Text style={styles.metaText}>
                            {featuredStory.duration_minutes} min
                          </Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons
                            name="mic-outline"
                            size={14}
                            color={theme.colors.sleepTextMuted}
                          />
                          <Text style={styles.metaText}>
                            {featuredStory.narrator}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.playButton}>
                        <Ionicons
                          name="play"
                          size={24}
                          color={theme.colors.sleepBackground}
                        />
                        <Text style={styles.playButtonText}>Play Story</Text>
                      </View>
                    </LinearGradient>
                  </AnimatedPressable>
                </AnimatedView>
              ) : null}
            </View>

            {/* Bedtime Stories */}
            <View style={styles.section}>
              <AnimatedView delay={550} duration={400}>
                <Text style={styles.sectionTitle}>Bedtime Stories</Text>
              </AnimatedView>

              {loading ? (
                <AnimatedView delay={600} duration={400}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.storiesScroll}
                  >
                    {[0, 1, 2].map((i) => (
                      <View key={i} style={styles.storyCard}>
                        <Skeleton
                          height={80}
                          borderRadius={theme.borderRadius.md}
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
                <AnimatedView delay={600} duration={400}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.storiesScroll}
                  >
                    {bedtimeStories.map((story, index) => (
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
                              name={
                                story.category === "nature"
                                  ? "leaf"
                                  : story.category === "fantasy"
                                  ? "planet"
                                  : story.category === "travel"
                                  ? "airplane"
                                  : story.category === "thriller"
                                  ? "skull"
                                  : story.category === "fiction"
                                  ? "book"
                                  : "book"
                              }
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

            {/* Sleep Tips */}
            <View style={styles.section}>
              <AnimatedView delay={700} duration={400}>
                <Text style={styles.sectionTitle}>Sleep Better</Text>
              </AnimatedView>

              <AnimatedView delay={750} duration={400}>
                <View style={styles.tipsCard}>
                  {[
                    {
                      icon: "thermometer-outline" as const,
                      title: "Cool room",
                      text: "65-68°F is ideal for sleep",
                      color: "#7B9BAE",
                    },
                    {
                      icon: "phone-portrait-outline" as const,
                      title: "Screen-free",
                      text: "30 min before bed",
                      color: "#A8B4C4",
                    },
                    {
                      icon: "time-outline" as const,
                      title: "Consistent schedule",
                      text: "Same time each night",
                      color: "#C4A77D",
                    },
                  ].map((tip, index) => (
                    <React.Fragment key={tip.title}>
                      {index > 0 && <View style={styles.tipDivider} />}
                      <View style={styles.tipItem}>
                        <View
                          style={[
                            styles.tipIconContainer,
                            { backgroundColor: `${tip.color}20` },
                          ]}
                        >
                          <Ionicons
                            name={tip.icon}
                            size={24}
                            color={tip.color}
                          />
                        </View>
                        <View style={styles.tipContent}>
                          <Text style={styles.tipTitle}>{tip.title}</Text>
                          <Text style={styles.tipText}>{tip.text}</Text>
                        </View>
                      </View>
                    </React.Fragment>
                  ))}
                </View>
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
    sectionTitle: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 18,
      color: theme.colors.sleepText,
      marginBottom: theme.spacing.md,
    },
    featuredSkeleton: {
      backgroundColor: theme.colors.sleepSurface,
      borderRadius: theme.borderRadius.xl,
      overflow: "hidden",
    },
    featuredCard: {
      borderRadius: theme.borderRadius.xl,
      overflow: "hidden",
      position: "relative",
    },
    featuredImage: {
      position: "absolute",
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },
    featuredGradient: {
      padding: theme.spacing.xl,
    },
    featuredGradientOverlay: {
      paddingTop: 120,
    },
    featuredStars: {
      marginBottom: theme.spacing.md,
    },
    featuredTitle: {
      fontFamily: theme.fonts.display.semiBold,
      fontSize: 24,
      color: theme.colors.sleepText,
      marginBottom: theme.spacing.xs,
    },
    featuredDescription: {
      fontFamily: theme.fonts.body.regular,
      fontSize: 15,
      color: theme.colors.sleepTextMuted,
      lineHeight: 22,
      marginBottom: theme.spacing.md,
    },
    featuredMeta: {
      flexDirection: "row",
      gap: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    metaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    metaText: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 13,
      color: theme.colors.sleepTextMuted,
    },
    playButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.sleepAccent,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      gap: 8,
    },
    playButtonText: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 16,
      color: theme.colors.sleepBackground,
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
    tipsCard: {
      backgroundColor: theme.colors.sleepSurface,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
    },
    tipItem: {
      flexDirection: "row",
      alignItems: "center",
    },
    tipIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      marginRight: theme.spacing.md,
    },
    tipContent: {
      flex: 1,
    },
    tipTitle: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 15,
      color: theme.colors.sleepText,
    },
    tipText: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 13,
      color: theme.colors.sleepTextMuted,
      marginTop: 2,
    },
    tipDivider: {
      height: 1,
      backgroundColor: "rgba(255,255,255,0.08)",
      marginVertical: theme.spacing.md,
      marginLeft: 64,
    },
  });

export default function Sleep() {
  return (
    <ProtectedRoute>
      <SleepScreen />
    </ProtectedRoute>
  );
}
