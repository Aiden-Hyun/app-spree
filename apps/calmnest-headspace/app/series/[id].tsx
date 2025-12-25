import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import { AnimatedView } from '../../src/components/AnimatedView';
import { AnimatedPressable } from '../../src/components/AnimatedPressable';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Theme } from '../../src/theme';
import { getSeriesById, SeriesChapter } from '../../src/constants/seriesData';

function SeriesDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();

  const series = useMemo(() => getSeriesById(id || ''), [id]);
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!series) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={theme.gradients.sleepyNight as [string, string]}
          style={styles.gradient}
        >
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Series not found</Text>
              <AnimatedPressable onPress={() => router.back()} style={styles.backLink}>
                <Text style={styles.backLinkText}>Go back</Text>
              </AnimatedPressable>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  const handleChapterPress = (chapter: SeriesChapter) => {
    // TODO: Navigate to story player with chapter
    console.log('Play chapter:', chapter.id);
  };

  const getCategoryIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (series.category) {
      case 'fantasy':
        return 'planet';
      case 'nature':
        return 'leaf';
      case 'travel':
        return 'airplane';
      case 'thriller':
        return 'skull';
      case 'fiction':
        return 'book';
      default:
        return 'book';
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.gradients.sleepyNight as [string, string]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Hero Section */}
            <AnimatedView delay={0} duration={400}>
              <View style={styles.heroSection}>
                <View style={[styles.heroIcon, { backgroundColor: `${series.color}25` }]}>
                  <Ionicons name={getCategoryIcon()} size={48} color={series.color} />
                </View>
                <Text style={styles.seriesTitle}>{series.title}</Text>
                <View style={styles.seriesMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="book-outline" size={16} color={theme.colors.sleepTextMuted} />
                    <Text style={styles.metaText}>{series.chapterCount} chapters</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={16} color={theme.colors.sleepTextMuted} />
                    <Text style={styles.metaText}>{series.totalDuration} min</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="mic-outline" size={16} color={theme.colors.sleepTextMuted} />
                    <Text style={styles.metaText}>{series.narrator}</Text>
                  </View>
                </View>
                <Text style={styles.seriesDescription}>{series.description}</Text>
              </View>
            </AnimatedView>

            {/* Chapters List */}
            <View style={styles.chaptersContainer}>
              <AnimatedView delay={100} duration={400}>
                <Text style={styles.sectionTitle}>Chapters</Text>
              </AnimatedView>

              {series.chapters.map((chapter, index) => (
                <AnimatedView key={chapter.id} delay={150 + index * 50} duration={300}>
                  <AnimatedPressable
                    onPress={() => handleChapterPress(chapter)}
                    style={styles.chapterCard}
                  >
                    <View style={[styles.chapterNumber, { backgroundColor: `${series.color}20` }]}>
                      <Text style={[styles.chapterNumberText, { color: series.color }]}>
                        {chapter.chapterNumber}
                      </Text>
                    </View>
                    <View style={styles.chapterInfo}>
                      <Text style={styles.chapterTitle}>{chapter.title}</Text>
                      <Text style={styles.chapterDescription} numberOfLines={1}>
                        {chapter.description}
                      </Text>
                      <View style={styles.chapterMeta}>
                        <Ionicons name="time-outline" size={12} color={theme.colors.sleepTextMuted} />
                        <Text style={styles.chapterMetaText}>{chapter.duration_minutes} min</Text>
                      </View>
                    </View>
                    <View style={styles.playButton}>
                      <Ionicons name="play" size={20} color={theme.colors.sleepAccent} />
                    </View>
                  </AnimatedPressable>
                </AnimatedView>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      {/* Floating Back Button */}
      <SafeAreaView style={styles.backButtonContainer} edges={['top']} pointerEvents="box-none">
        <AnimatedPressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.sleepText} />
        </AnimatedPressable>
      </SafeAreaView>
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
    backButtonContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
    },
    backButton: {
      marginLeft: theme.spacing.md,
      marginTop: theme.spacing.sm,
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.15)',
    },
    heroSection: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.xl,
      alignItems: 'center',
    },
    heroIcon: {
      width: 96,
      height: 96,
      borderRadius: 48,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.lg,
    },
    seriesTitle: {
      fontFamily: theme.fonts.display.semiBold,
      fontSize: 28,
      color: theme.colors.sleepText,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    seriesMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 13,
      color: theme.colors.sleepTextMuted,
    },
    seriesDescription: {
      fontFamily: theme.fonts.body.regular,
      fontSize: 15,
      color: theme.colors.sleepTextMuted,
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: theme.spacing.md,
    },
    chaptersContainer: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
    },
    sectionTitle: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 18,
      color: theme.colors.sleepText,
      marginBottom: theme.spacing.md,
    },
    chapterCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.sleepSurface,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    chapterNumber: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chapterNumberText: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 16,
    },
    chapterInfo: {
      flex: 1,
      marginLeft: theme.spacing.md,
    },
    chapterTitle: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 15,
      color: theme.colors.sleepText,
      marginBottom: 2,
    },
    chapterDescription: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 13,
      color: theme.colors.sleepTextMuted,
      marginBottom: 4,
    },
    chapterMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    chapterMetaText: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 11,
      color: theme.colors.sleepTextMuted,
    },
    playButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorText: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 16,
      color: theme.colors.sleepText,
      marginBottom: theme.spacing.md,
    },
    backLink: {
      padding: theme.spacing.sm,
    },
    backLinkText: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 14,
      color: theme.colors.sleepAccent,
    },
  });

export default function SeriesDetail() {
  return (
    <ProtectedRoute>
      <SeriesDetailScreen />
    </ProtectedRoute>
  );
}

