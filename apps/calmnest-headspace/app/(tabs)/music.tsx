import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { AnimatedView } from "../../src/components/AnimatedView";
import { AnimatedPressable } from "../../src/components/AnimatedPressable";
import { ContentCard } from "../../src/components/ContentCard";
import { useTheme } from "../../src/contexts/ThemeContext";
import { sleepSoundsData } from "../../src/constants/sleepSoundsData";
import { whiteNoiseData, musicData, asmrData, MusicItem } from "../../src/constants/musicData";
import { albumsData, Album } from "../../src/constants/albumsData";
import { Theme } from "../../src/theme";

// Featured items for each section (show first 6)
const featuredNatureSounds = sleepSoundsData.slice(0, 6);
const featuredWhiteNoise = whiteNoiseData.slice(0, 6);
const featuredMusic = musicData.slice(0, 6);
const featuredASMR = asmrData.slice(0, 6);

function MusicScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const handleSoundPress = (soundId: string) => {
    router.push(`/music/${soundId}`);
  };

  const handleAlbumPress = (album: Album) => {
    router.push(`/album/${album.id}`);
  };

  const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
    switch (category) {
      case "ambient":
        return "planet";
      case "piano":
        return "musical-notes";
      case "nature":
        return "leaf";
      case "classical":
        return "musical-note";
      case "lofi":
        return "headset";
      default:
        return "disc";
    }
  };

  const renderSoundSection = (
    title: string,
    sounds: Array<MusicItem & { thumbnailUrl?: string }>,
    route: string,
    baseDelay: number
  ) => (
    <View style={styles.section}>
      <AnimatedView delay={baseDelay} duration={400}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <AnimatedPressable
            onPress={() => router.push(route as any)}
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsScroll}
      >
        {sounds.map((sound, index) => (
          <AnimatedView
            key={sound.id}
            delay={baseDelay + 50 + index * 40}
            duration={400}
          >
            <ContentCard
              title={sound.title}
              thumbnailUrl={sound.thumbnailUrl}
              fallbackIcon={`${sound.icon}-outline` as keyof typeof Ionicons.glyphMap}
              fallbackColor={sound.color}
              meta={sound.duration_minutes ? `${sound.duration_minutes} min` : undefined}
              onPress={() => handleSoundPress(sound.id)}
            />
          </AnimatedView>
        ))}
      </ScrollView>
    </View>
  );

  const renderNatureSoundsSection = (
    title: string,
    sounds: typeof featuredNatureSounds,
    route: string,
    baseDelay: number
  ) => (
    <View style={styles.section}>
      <AnimatedView delay={baseDelay} duration={400}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <AnimatedPressable
            onPress={() => router.push(route as any)}
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsScroll}
      >
        {sounds.map((sound, index) => (
          <AnimatedView
            key={sound.id}
            delay={baseDelay + 50 + index * 40}
            duration={400}
          >
            <ContentCard
              title={sound.title}
              thumbnailUrl={sound.thumbnailUrl}
              fallbackIcon={`${sound.icon}-outline` as keyof typeof Ionicons.glyphMap}
              fallbackColor={sound.color}
              onPress={() => handleSoundPress(sound.id)}
            />
          </AnimatedView>
        ))}
      </ScrollView>
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
                  <Text style={styles.sectionTitle}>Albums</Text>
                  <Text style={styles.sectionSubtitle}>Curated music collections</Text>
                </View>
              </AnimatedView>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsScroll}
              >
                {albumsData.map((album, index) => (
                  <AnimatedView
                    key={album.id}
                    delay={150 + index * 40}
                    duration={400}
                  >
                <ContentCard
                  title={album.title}
                  thumbnailUrl={album.thumbnailUrl}
                  fallbackIcon={getCategoryIcon(album.category)}
                  fallbackColor={album.color}
                  meta={`${album.trackCount} tracks`}
                      onPress={() => handleAlbumPress(album)}
                />
                  </AnimatedView>
                ))}
              </ScrollView>
            </View>

            {/* White Noise Section */}
        {renderSoundSection("White Noise", featuredWhiteNoise, "/music/white-noise", 300)}

            {/* Nature Sounds Section */}
        {renderNatureSoundsSection("Nature Sounds", featuredNatureSounds, "/music/nature-sounds", 500)}

            {/* Music Section */}
        {renderSoundSection("Music", featuredMusic, "/music/music", 700)}

            {/* ASMR Section */}
        {renderSoundSection("ASMR", featuredASMR, "/music/asmr", 900)}

            {/* Bottom spacing */}
            <View style={{ height: 40 }} />
          </ScrollView>
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
      gap: theme.spacing.md,
    },
  });

export default function Music() {
  return (
    <ProtectedRoute>
      <MusicScreen />
    </ProtectedRoute>
  );
}
