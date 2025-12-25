import React, { useState, useMemo, useRef, useEffect } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { AnimatedView } from "../../src/components/AnimatedView";
import { AnimatedPressable } from "../../src/components/AnimatedPressable";
import { useTheme } from "../../src/contexts/ThemeContext";
import { useAudioPlayer } from "../../src/hooks/useAudioPlayer";
import { getAudioFile } from "../../src/constants/audioFiles";
import { sleepSoundsData, SleepSoundCategory, categoryLabels } from "../../src/constants/sleepSoundsData";
import { Theme } from "../../src/theme";

const categories: (SleepSoundCategory | 'all')[] = ['all', 'rain', 'water', 'fire', 'wind', 'nature', 'ambient'];

function NatureSoundsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<SleepSoundCategory | 'all'>('all');

  const audioPlayer = useAudioPlayer();
  const prevSelectedSound = useRef<string | null>(null);

  const styles = useMemo(() => createStyles(theme), [theme]);

  const filteredSounds = useMemo(() => {
    if (selectedCategory === 'all') return sleepSoundsData;
    return sleepSoundsData.filter(s => s.category === selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    const handleSoundChange = async () => {
      if (!selectedSound) {
        if (audioPlayer.isPlaying) {
          audioPlayer.pause();
        }
        prevSelectedSound.current = null;
        return;
      }

      if (selectedSound !== prevSelectedSound.current) {
        const sound = sleepSoundsData.find((s) => s.id === selectedSound);
        if (sound) {
          const audioUrl = getAudioFile(sound.audioKey);
          if (audioUrl) {
            await audioPlayer.loadAudio(audioUrl);
            audioPlayer.play();
          }
        }
        prevSelectedSound.current = selectedSound;
      }
    };

    handleSoundChange();
  }, [selectedSound]);

  useEffect(() => {
    return () => {
      audioPlayer.cleanup();
    };
  }, []);

  const renderItem = ({ item, index }: { item: typeof sleepSoundsData[0]; index: number }) => (
    <AnimatedView delay={index * 50} duration={400}>
      <AnimatedPressable
        onPress={() => setSelectedSound(selectedSound === item.id ? null : item.id)}
        style={[
          styles.soundCard,
          selectedSound === item.id && styles.soundCardSelected,
        ]}
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
            color={selectedSound === item.id ? theme.colors.sleepAccent : item.color}
          />
        </View>
        <View style={styles.soundInfo}>
          <Text style={[
            styles.soundTitle,
            selectedSound === item.id && styles.soundTitleSelected,
          ]}>
            {item.title}
          </Text>
          <Text style={styles.soundDescription}>{item.description}</Text>
        </View>
        {selectedSound === item.id ? (
          <Ionicons name="pause-circle" size={32} color={theme.colors.sleepAccent} />
        ) : (
          <Ionicons name="play-circle-outline" size={32} color={theme.colors.sleepTextMuted} />
        )}
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
            <Text style={styles.headerTitle}>Nature Sounds</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Category Filter */}
          <View style={styles.filterContainer}>
            <FlatList
              horizontal
              data={categories}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterContent}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <AnimatedPressable
                  onPress={() => setSelectedCategory(item)}
                  style={[
                    styles.filterChip,
                    selectedCategory === item && styles.filterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedCategory === item && styles.filterChipTextActive,
                    ]}
                  >
                    {categoryLabels[item]}
                  </Text>
                </AnimatedPressable>
              )}
            />
          </View>

          <FlatList
            data={filteredSounds}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
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
    filterContainer: {
      marginBottom: theme.spacing.md,
    },
    filterContent: {
      paddingHorizontal: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    filterChip: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.sleepSurface,
    },
    filterChipActive: {
      backgroundColor: theme.colors.sleepAccent,
    },
    filterChipText: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 14,
      color: theme.colors.sleepTextMuted,
    },
    filterChipTextActive: {
      color: theme.colors.sleepBackground,
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
      borderWidth: 2,
      borderColor: "transparent",
    },
    soundCardSelected: {
      borderColor: theme.colors.sleepAccent,
      backgroundColor: "rgba(201, 184, 150, 0.1)",
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
    soundTitleSelected: {
      color: theme.colors.sleepAccent,
    },
    soundDescription: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 13,
      color: theme.colors.sleepTextMuted,
    },
  });

export default function NatureSounds() {
  return (
    <ProtectedRoute>
      <NatureSoundsScreen />
    </ProtectedRoute>
  );
}

