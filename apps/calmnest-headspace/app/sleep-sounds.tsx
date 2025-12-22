import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ProtectedRoute } from '../src/components/ProtectedRoute';
import { AnimatedView } from '../src/components/AnimatedView';
import { AnimatedPressable } from '../src/components/AnimatedPressable';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAudioPlayer } from '../src/hooks/useAudioPlayer';
import { getAudioFile } from '../src/constants/audioFiles';
import {
  sleepSoundsData,
  categoryLabels,
  getSoundsByCategory,
  SleepSound,
  SleepSoundCategory,
} from '../src/constants/sleepSoundsData';
import { Theme } from '../src/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

function SleepSoundsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<SleepSoundCategory | 'all'>('all');
  const [playingSound, setPlayingSound] = useState<string | null>(null);

  const audioPlayer = useAudioPlayer();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const filteredSounds = useMemo(
    () => getSoundsByCategory(selectedCategory),
    [selectedCategory]
  );

  const categories: (SleepSoundCategory | 'all')[] = [
    'all',
    'rain',
    'water',
    'fire',
    'wind',
    'nature',
    'ambient',
  ];

  const handleSoundPress = useCallback(async (sound: SleepSound) => {
    if (playingSound === sound.id) {
      // Stop playing
      audioPlayer.pause();
      setPlayingSound(null);
    } else {
      // Play new sound
      const audioUrl = getAudioFile(sound.audioKey);
      if (audioUrl) {
        await audioPlayer.loadAudio(audioUrl);
        audioPlayer.play();
        setPlayingSound(sound.id);
      }
    }
  }, [playingSound, audioPlayer]);

  const handleGoBack = useCallback(() => {
    audioPlayer.cleanup();
    router.back();
  }, [audioPlayer, router]);

  const getIconName = (iconBase: string, isPlaying: boolean): keyof typeof Ionicons.glyphMap => {
    if (isPlaying) return 'pause';
    return `${iconBase}-outline` as keyof typeof Ionicons.glyphMap;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.gradients.sleepyNight as [string, string]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.sleepText} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Sleep Sounds</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Category Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
            style={styles.categoryContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={[
                  styles.categoryTab,
                  selectedCategory === category && styles.categoryTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category && styles.categoryTextActive,
                  ]}
                >
                  {categoryLabels[category]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Sounds Grid */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.gridContainer}
          >
            <View style={styles.grid}>
              {filteredSounds.map((sound, index) => {
                const isPlaying = playingSound === sound.id;
                return (
                  <AnimatedView
                    key={sound.id}
                    delay={index * 50}
                    duration={400}
                    style={styles.cardWrapper}
                  >
                    <AnimatedPressable
                      onPress={() => handleSoundPress(sound)}
                      style={[
                        styles.soundCard,
                        isPlaying && styles.soundCardPlaying,
                        { borderColor: isPlaying ? sound.color : 'transparent' },
                      ]}
                    >
                      <View
                        style={[
                          styles.iconContainer,
                          { backgroundColor: `${sound.color}25` },
                        ]}
                      >
                        <Ionicons
                          name={getIconName(sound.icon, isPlaying)}
                          size={32}
                          color={isPlaying ? theme.colors.sleepAccent : sound.color}
                        />
                      </View>
                      <Text style={styles.soundTitle} numberOfLines={1}>
                        {sound.title}
                      </Text>
                      <Text style={styles.soundDescription} numberOfLines={2}>
                        {sound.description}
                      </Text>
                      {isPlaying && (
                        <View style={styles.playingIndicator}>
                          <Ionicons
                            name="volume-high"
                            size={16}
                            color={theme.colors.sleepAccent}
                          />
                          <Text style={styles.playingText}>Playing</Text>
                        </View>
                      )}
                    </AnimatedPressable>
                  </AnimatedView>
                );
              })}
            </View>

            {/* Attribution */}
            <View style={styles.attribution}>
              <Text style={styles.attributionText}>
                Sounds from Pixabay • Free for personal use
              </Text>
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    backButton: {
      padding: theme.spacing.sm,
      marginLeft: -theme.spacing.sm,
    },
    headerTitle: {
      fontFamily: theme.fonts.display.semiBold,
      fontSize: 20,
      color: theme.colors.sleepText,
      letterSpacing: -0.3,
    },
    headerSpacer: {
      width: 40,
    },
    categoryContainer: {
      maxHeight: 50,
    },
    categoryScroll: {
      paddingHorizontal: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    categoryTab: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.sleepSurface,
      marginRight: theme.spacing.sm,
    },
    categoryTabActive: {
      backgroundColor: theme.colors.sleepAccent,
    },
    categoryText: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 14,
      color: theme.colors.sleepTextMuted,
    },
    categoryTextActive: {
      color: theme.colors.sleepBackground,
    },
    gridContainer: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    cardWrapper: {
      width: CARD_WIDTH,
      marginBottom: theme.spacing.md,
    },
    soundCard: {
      backgroundColor: theme.colors.sleepSurface,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    soundCardPlaying: {
      backgroundColor: 'rgba(201, 184, 150, 0.1)',
    },
    iconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.md,
    },
    soundTitle: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 15,
      color: theme.colors.sleepText,
      marginBottom: 4,
    },
    soundDescription: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 12,
      color: theme.colors.sleepTextMuted,
      lineHeight: 16,
    },
    playingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.sm,
      gap: 4,
    },
    playingText: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 12,
      color: theme.colors.sleepAccent,
    },
    attribution: {
      paddingVertical: theme.spacing.xl,
      alignItems: 'center',
    },
    attributionText: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 12,
      color: theme.colors.sleepTextMuted,
      opacity: 0.6,
    },
  });

export default function SleepSounds() {
  return (
    <ProtectedRoute>
      <SleepSoundsScreen />
    </ProtectedRoute>
  );
}

