import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { AnimatedView } from "../../src/components/AnimatedView";
import { AnimatedPressable } from "../../src/components/AnimatedPressable";
import { useTheme } from "../../src/contexts/ThemeContext";
import { sleepSoundsData } from "../../src/constants/sleepSoundsData";
import { whiteNoiseData, musicData, asmrData } from "../../src/constants/musicData";
import { albumsData, Album } from "../../src/constants/albumsData";
import { Theme } from "../../src/theme";

// Featured items for each section (show first 6)
const featuredNatureSounds = sleepSoundsData.slice(0, 6);
const featuredWhiteNoise = whiteNoiseData.slice(0, 6);
const featuredMusic = musicData.slice(0, 6);
const featuredASMR = asmrData.slice(0, 6);

function MusicScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleSoundPress = (soundId: string) => {
    router.push(`/music/${soundId}`);
  };

  const renderSoundCard = (
    sound: { id: string; title: string; icon: string; color: string },
    index: number,
    baseDelay: number
  ) => (
    <AnimatedView
      key={sound.id}
      delay={baseDelay + index * 40}
      duration={400}
      style={styles.soundCardWrapper}
    >
      <AnimatedPressable
        onPress={() => handleSoundPress(sound.id)}
        style={styles.soundCard}
      >
        <View
          style={[
            styles.soundIconContainer,
            { backgroundColor: `${sound.color}25` },
          ]}
        >
          <Ionicons
            name={`${sound.icon}-outline` as keyof typeof Ionicons.glyphMap}
            size={24}
            color={sound.color}
          />
        </View>
        <Text style={styles.soundLabel} numberOfLines={1}>
          {sound.title}
        </Text>
      </AnimatedPressable>
    </AnimatedView>
  );

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

  const renderSection = (
    title: string,
    sounds: Array<{ id: string; title: string; icon: string; color: string }>,
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
              color={theme.colors.sleepTextMuted}
            />
          </AnimatedPressable>
        </View>
      </AnimatedView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.soundsScroll}
      >
        {sounds.map((sound, index) =>
          renderSoundCard(sound, index, baseDelay + 50)
        )}
      </ScrollView>
    </View>
  );

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
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="musical-notes"
                    size={48}
                    color={theme.colors.sleepAccent}
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
                contentContainerStyle={styles.soundsScroll}
              >
                {albumsData.map((album, index) => (
                  <AnimatedView
                    key={album.id}
                    delay={150 + index * 40}
                    duration={400}
                  >
                    <AnimatedPressable
                      onPress={() => handleAlbumPress(album)}
                      style={styles.albumCard}
                    >
                      <View
                        style={[
                          styles.albumIconContainer,
                          { backgroundColor: `${album.color}20` },
                        ]}
                      >
                        <Ionicons
                          name={getCategoryIcon(album.category)}
                          size={28}
                          color={album.color}
                        />
                      </View>
                      <Text style={styles.albumTitle} numberOfLines={2}>
                        {album.title}
                      </Text>
                      <Text style={styles.albumMeta}>
                        {album.trackCount} tracks
                      </Text>
                    </AnimatedPressable>
                  </AnimatedView>
                ))}
              </ScrollView>
            </View>

            {/* White Noise Section */}
            {renderSection("White Noise", featuredWhiteNoise, "/music/white-noise", 300)}

            {/* Nature Sounds Section */}
            {renderSection("Nature Sounds", featuredNatureSounds, "/music/nature-sounds", 500)}

            {/* Music Section */}
            {renderSection("Music", featuredMusic, "/music/music", 700)}

            {/* ASMR Section */}
            {renderSection("ASMR", featuredASMR, "/music/asmr", 900)}

            {/* Bottom spacing */}
            <View style={{ height: 40 }} />
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
    iconContainer: {
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
      color: theme.colors.sleepText,
    },
    sectionHeaderNoLink: {
      paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    sectionSubtitle: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 13,
      color: theme.colors.sleepTextMuted,
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
      color: theme.colors.sleepTextMuted,
    },
    soundsScroll: {
      paddingHorizontal: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    soundCardWrapper: {
      width: 100,
    },
    soundCard: {
      backgroundColor: theme.colors.sleepSurface,
      borderRadius: theme.borderRadius.xl,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
      alignItems: "center",
    },
    soundIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing.sm,
    },
    soundLabel: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 12,
      color: theme.colors.sleepTextMuted,
      textAlign: "center",
    },
    albumCard: {
      width: 150,
      backgroundColor: theme.colors.sleepSurface,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.md,
      alignItems: "center",
    },
    albumIconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing.sm,
    },
    albumTitle: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 14,
      color: theme.colors.sleepText,
      textAlign: "center",
      marginBottom: 4,
    },
    albumMeta: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 12,
      color: theme.colors.sleepTextMuted,
    },
  });

export default function Music() {
  return (
    <ProtectedRoute>
      <MusicScreen />
    </ProtectedRoute>
  );
}

