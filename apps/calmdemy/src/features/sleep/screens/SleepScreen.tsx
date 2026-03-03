import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { AnimatedView } from "@shared/ui/AnimatedView";
import { AnimatedPressable } from "@shared/ui/AnimatedPressable";
import { ContentCard } from "@shared/ui/ContentCard";
import { Skeleton } from "@shared/ui/Skeleton";
import { PaywallModal } from "@shared/ui/PaywallModal";
import { Theme } from "../../../theme";
import { useSleepViewModel } from "@features/sleep/hooks/useSleepViewModel";

export function SleepScreen() {
  const {
    theme,
    hasSubscription,
    bedtimeStories,
    sleepMeditations,
    series,
    showPaywall,
    setShowPaywall,
    getTimeGreeting,
    getCategoryIcon,
    handleSeriesPress,
    handleStoryPress,
    handleMeditationPress,
    navigateToBedtimeStories,
    navigateToSleepMeditations,
  } = useSleepViewModel();

  const styles = useMemo(() => createStyles(theme), [theme]);

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
                  <View style={styles.titleRow}>
                    <Text style={styles.sectionTitle}>Series</Text>
                    {!hasSubscription && <Text style={styles.freeBadge}>Free</Text>}
                  </View>
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
                  {series.map((seriesItem) => (
                    <ContentCard
                      key={seriesItem.id}
                      title={seriesItem.title}
                      thumbnailUrl={seriesItem.thumbnailUrl}
                      fallbackIcon={getCategoryIcon(seriesItem.category)}
                      fallbackColor={seriesItem.color}
                      meta={`${seriesItem.chapterCount} chapters`}
                      isFree={true}
                      onPress={() => handleSeriesPress(seriesItem)}
                      darkMode
                    />
                  ))}
                </ScrollView>
              </AnimatedView>
            </View>

            {/* Bedtime Stories */}
            <View style={styles.section}>
              <AnimatedView delay={200} duration={400}>
                <AnimatedPressable onPress={navigateToBedtimeStories} style={styles.sectionHeader}>
                  <View style={styles.titleRow}>
                    <Text style={styles.sectionTitle}>Bedtime Stories</Text>
                    {!hasSubscription && <Text style={styles.freeBadge}>Free</Text>}
                  </View>
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
                      isFree={story.isFree}
                      onPress={() => handleStoryPress(story)}
                      darkMode
                    />
                  ))}
                </ScrollView>
              </AnimatedView>
            </View>

            {/* Sleep Meditations */}
            <View style={styles.section}>
              <AnimatedView delay={300} duration={400}>
                <AnimatedPressable onPress={navigateToSleepMeditations} style={styles.sectionHeader}>
                  <View style={styles.titleRow}>
                    <Text style={styles.sectionTitle}>Sleep Meditations</Text>
                    {!hasSubscription && <Text style={styles.freeBadge}>Free</Text>}
                  </View>
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
                  {sleepMeditations.slice(0, 6).map((meditation) => (
                    <ContentCard
                      key={meditation.id}
                      title={meditation.title}
                      thumbnailUrl={meditation.thumbnailUrl}
                      fallbackIcon={meditation.icon as keyof typeof Ionicons.glyphMap}
                      fallbackColor={meditation.color}
                      meta={`${meditation.duration_minutes} min`}
                      isFree={meditation.isFree}
                      onPress={() => handleMeditationPress(meditation)}
                      darkMode
                    />
                  ))}
                </ScrollView>
              </AnimatedView>
            </View>
          </ScrollView>

          {/* Paywall Modal */}
          <PaywallModal
            visible={showPaywall}
            onClose={() => setShowPaywall(false)}
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
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    sectionTitle: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 18,
      color: theme.colors.sleepText,
    },
    freeBadge: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 11,
      color: theme.colors.sleepAccent,
      backgroundColor: "rgba(201, 184, 150, 0.16)",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.full,
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
