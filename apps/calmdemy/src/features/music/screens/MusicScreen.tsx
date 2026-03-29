import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AnimatedView } from "@shared/ui/AnimatedView";
import { AnimatedPressable } from "@shared/ui/AnimatedPressable";
import { ContentCard } from "@shared/ui/ContentCard";
import { PaywallModal } from "@shared/ui/PaywallModal";
import { Theme } from "../../../theme";
import type {
  FirestoreSleepSound,
  FirestoreMusicItem,
  FirestoreAlbum,
} from "../data/musicRepository";
import { useMusicViewModel } from "@features/music/hooks/useMusicViewModel";

export function MusicScreen() {
  const {
    theme,
    isDark,
    hasSubscription,
    sleepSounds,
    whiteNoise,
    music,
    asmr,
    albums,
    showPaywall,
    setShowPaywall,
    handleSoundPress,
    handleAlbumPress,
    getCategoryIcon,
    navigateToRoute,
  } = useMusicViewModel();

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const renderSoundSection = (
    title: string,
    sounds: Array<FirestoreMusicItem>,
    route: string,
    baseDelay: number
  ) => (
    <View style={styles.section}>
      <AnimatedView delay={baseDelay} duration={400}>
        <View style={styles.sectionHeader}>
          <View style={styles.titleRow}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {!hasSubscription && <Text style={styles.freeBadge}>Free</Text>}
          </View>
          <AnimatedPressable
            onPress={() => navigateToRoute(route)}
            style={styles.seeAllButton}
          >
            <Text style={styles.seeAllText}>See all</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={theme.colors.textLight}
            />
          </AnimatedPressable>
        </View>
      </AnimatedView>

      <FlatList
        horizontal
        data={sounds}
        keyExtractor={(sound) => sound.id}
        renderItem={({ item: sound }) => (
          <ContentCard
            title={sound.title}
            thumbnailUrl={sound.thumbnailUrl}
            fallbackIcon={`${sound.icon}-outline` as keyof typeof Ionicons.glyphMap}
            fallbackColor={sound.color}
            meta={sound.duration_minutes ? `${sound.duration_minutes} min` : undefined}
            isFree={sound.isFree}
            onPress={() => handleSoundPress(sound)}
            animatePress={false}
          />
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsScroll}
        ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
      />
    </View>
  );

  const renderNatureSoundsSection = (
    title: string,
    sounds: FirestoreSleepSound[],
    route: string,
    baseDelay: number
  ) => (
    <View style={styles.section}>
      <AnimatedView delay={baseDelay} duration={400}>
        <View style={styles.sectionHeader}>
          <View style={styles.titleRow}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {!hasSubscription && <Text style={styles.freeBadge}>Free</Text>}
          </View>
          <AnimatedPressable
            onPress={() => navigateToRoute(route)}
            style={styles.seeAllButton}
          >
            <Text style={styles.seeAllText}>See all</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={theme.colors.textLight}
            />
          </AnimatedPressable>
        </View>
      </AnimatedView>

      <FlatList
        horizontal
        data={sounds}
        keyExtractor={(sound) => sound.id}
        renderItem={({ item: sound }) => (
          <ContentCard
            title={sound.title}
            thumbnailUrl={sound.thumbnailUrl}
            fallbackIcon={`${sound.icon}-outline` as keyof typeof Ionicons.glyphMap}
            fallbackColor={sound.color}
            isFree={sound.isFree}
            onPress={() => handleSoundPress(sound)}
            animatePress={false}
          />
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsScroll}
        ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
      />
    </View>
  );

  return (
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <AnimatedView delay={0} duration={500}>
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="musical-notes"
                    size={48}
                color={theme.colors.primary}
                  />
                </View>
                <Text style={styles.title}>Sounds & Music</Text>
                <Text style={styles.subtitle}>Find your perfect ambience</Text>
              </View>
            </AnimatedView>

            {/* Albums Section */}
            <View style={styles.section}>
              <AnimatedView delay={100} duration={400}>
                <View style={styles.sectionHeaderNoLink}>
                  <View style={styles.titleRow}>
                    <Text style={styles.sectionTitle}>Albums</Text>
                    {!hasSubscription && <Text style={styles.freeBadge}>Free</Text>}
                  </View>
                  <Text style={styles.sectionSubtitle}>Curated music collections</Text>
                </View>
              </AnimatedView>

              <FlatList
                horizontal
                data={albums}
                keyExtractor={(album) => album.id}
                renderItem={({ item: album }) => (
                  <ContentCard
                    title={album.title}
                    thumbnailUrl={album.thumbnailUrl}
                    fallbackIcon={getCategoryIcon(album.category)}
                    fallbackColor={album.color}
                    meta={`${album.trackCount} tracks`}
                    isFree={true}
                    onPress={() => handleAlbumPress(album)}
                    animatePress={false}
                  />
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsScroll}
                ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
                initialNumToRender={4}
                maxToRenderPerBatch={4}
                windowSize={5}
              />
            </View>

            {/* White Noise Section */}
        {renderSoundSection("White Noise", whiteNoise.slice(0, 6), "/music/white-noise", 300)}

            {/* Nature Sounds Section */}
        {renderNatureSoundsSection("Nature Sounds", sleepSounds.slice(0, 6), "/music/nature-sounds", 500)}

            {/* Music Section */}
        {renderSoundSection("Music", music.slice(0, 6), "/music/music", 700)}

            {/* ASMR Section */}
        {renderSoundSection("ASMR", asmr.slice(0, 6), "/music/asmr", 900)}

            {/* Bottom spacing */}
            <View style={{ height: 40 }} />
          </ScrollView>

          {/* Paywall Modal */}
          <PaywallModal
            visible={showPaywall}
            onClose={() => setShowPaywall(false)}
          />
        </SafeAreaView>
  );
}

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingBottom: theme.spacing.xxl,
    },
    header: {
      alignItems: "center",
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.lg,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: isDark ? theme.colors.gray[100] : `${theme.colors.primary}15`,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing.md,
    },
    title: {
      fontFamily: theme.fonts.display.semiBold,
      fontSize: 28,
      color: theme.colors.text,
      letterSpacing: -0.3,
    },
    subtitle: {
      fontFamily: theme.fonts.body.italic,
      fontSize: 15,
      color: theme.colors.textLight,
      marginTop: 4,
    },
    section: {
      marginTop: theme.spacing.xl,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    sectionTitle: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 18,
      color: theme.colors.text,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    freeBadge: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 11,
      color: theme.colors.primary,
      backgroundColor: isDark ? theme.colors.gray[200] : `${theme.colors.primary}18`,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.full,
    },
    sectionHeaderNoLink: {
      paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    sectionSubtitle: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 13,
      color: theme.colors.textLight,
      marginTop: 4,
    },
    seeAllButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    seeAllText: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 14,
      color: theme.colors.textLight,
    },
    cardsScroll: {
      paddingHorizontal: theme.spacing.lg,
    },
    cardSeparator: {
      width: theme.spacing.md,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
