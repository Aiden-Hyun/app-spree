import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import { AnimatedView } from '../../src/components/AnimatedView';
import { AnimatedPressable } from '../../src/components/AnimatedPressable';
import { Skeleton, SkeletonCard, SkeletonListItem } from '../../src/components/Skeleton';
import { getMeditations } from '../../src/services/firestoreService';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Theme } from '../../src/theme';
import { GuidedMeditation, MeditationCategory } from '../../src/types';

type Mood = {
  id: string;
  emoji: string;
  label: string;
  categories: MeditationCategory[];
};

const moods: Mood[] = [
  { id: 'calm', emoji: '😌', label: 'Calm', categories: ['gratitude', 'loving-kindness'] },
  { id: 'low', emoji: '😔', label: 'Low', categories: ['self-esteem', 'loving-kindness'] },
  { id: 'stressed', emoji: '😤', label: 'Stressed', categories: ['stress', 'anxiety'] },
  { id: 'tired', emoji: '😴', label: 'Tired', categories: ['sleep', 'body-scan'] },
];

const themeCategories = [
  { id: 'focus', label: 'Focus', icon: 'eye-outline' as const, color: '#8B9F82' },
  { id: 'sleep', label: 'Sleep', icon: 'moon-outline' as const, color: '#7B8FA1' },
  { id: 'stress', label: 'Stress', icon: 'water-outline' as const, color: '#A8B4C4' },
  { id: 'gratitude', label: 'Gratitude', icon: 'heart-outline' as const, color: '#C4A77D' },
  { id: 'anxiety', label: 'Calm', icon: 'leaf-outline' as const, color: '#B4A7C7' },
  { id: 'self-esteem', label: 'Self Love', icon: 'flower-outline' as const, color: '#D4A5A5' },
];

function MeditateScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<MeditationCategory | null>(null);
  const [meditations, setMeditations] = useState<GuidedMeditation[]>([]);
  const [recommendedSession, setRecommendedSession] = useState<GuidedMeditation | null>(null);
  const [loading, setLoading] = useState(true);

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  useEffect(() => {
    loadMeditations();
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedMood && meditations.length > 0) {
      const mood = moods.find(m => m.id === selectedMood);
      if (mood) {
        const filtered = meditations.filter(m => mood.categories.includes(m.category));
        if (filtered.length > 0) {
          setRecommendedSession(filtered[0]);
        }
      }
    }
  }, [selectedMood, meditations]);

  const loadMeditations = async () => {
    try {
      setLoading(true);
      const data = await getMeditations(selectedCategory || undefined);
      setMeditations(data);
      if (data.length > 0 && !recommendedSession) {
        setRecommendedSession(data[0]);
      }
    } catch (error) {
      console.error('Failed to load meditations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMoodSelect = (moodId: string) => {
    setSelectedMood(selectedMood === moodId ? null : moodId);
    setSelectedCategory(null);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId as MeditationCategory);
    setSelectedMood(null);
  };

  const handleMeditationPress = (meditation: GuidedMeditation) => {
    router.push({
      pathname: '/meditation/[id]',
      params: { id: meditation.id },
    });
  };

  const recommendedDefaultGradient = theme.gradients.sage as [string, string];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <AnimatedView delay={0} duration={400}>
          <View style={styles.header}>
            <Text style={styles.title}>Practice</Text>
            <Text style={styles.subtitle}>Find your stillness</Text>
          </View>
        </AnimatedView>

        {/* Mood Selector */}
        <View style={styles.section}>
          <AnimatedView delay={100} duration={400}>
            <Text style={styles.sectionTitle}>How are you feeling?</Text>
          </AnimatedView>
          <View style={styles.moodGrid}>
            {moods.map((mood, index) => (
              <AnimatedView key={mood.id} delay={150 + index * 40} duration={400} style={styles.moodCardWrapper}>
                <AnimatedPressable
                  onPress={() => handleMoodSelect(mood.id)}
                  style={[
                    styles.moodCard,
                    selectedMood === mood.id && styles.moodCardSelected
                  ]}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text style={[
                    styles.moodLabel,
                    selectedMood === mood.id && styles.moodLabelSelected
                  ]}>
                    {mood.label}
                  </Text>
                </AnimatedPressable>
              </AnimatedView>
            ))}
          </View>
        </View>

        {/* Recommended Session */}
        <View style={styles.section}>
          <AnimatedView delay={300} duration={400}>
            <Text style={styles.sectionTitle}>
              {selectedMood ? 'Recommended for you' : 'Start here'}
            </Text>
          </AnimatedView>
          
          {loading ? (
            <AnimatedView delay={350} duration={400}>
              <SkeletonCard />
            </AnimatedView>
          ) : recommendedSession ? (
            <AnimatedView delay={350} duration={400}>
              <AnimatedPressable
                onPress={() => handleMeditationPress(recommendedSession)}
                style={styles.recommendedCard}
              >
                {recommendedSession.thumbnail_url ? (
                  <Image 
                    source={{ uri: recommendedSession.thumbnail_url }} 
                    style={styles.recommendedImage}
                  />
                ) : null}
                <LinearGradient
                  colors={recommendedSession.thumbnail_url 
                    ? ['transparent', 'rgba(0,0,0,0.7)'] 
                    : recommendedDefaultGradient}
                  style={[
                    styles.recommendedGradient,
                    recommendedSession.thumbnail_url && styles.recommendedGradientOverlay
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                >
                  <View style={styles.recommendedBadge}>
                    <Ionicons name="sparkles" size={14} color="white" />
                    <Text style={styles.recommendedBadgeText}>For you</Text>
                  </View>
                  <Text style={styles.recommendedTitle}>{recommendedSession.title}</Text>
                  <Text style={styles.recommendedDescription} numberOfLines={2}>
                    {recommendedSession.description}
                  </Text>
                  <View style={styles.recommendedMeta}>
                    <View style={styles.recommendedMetaItem}>
                      <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.recommendedMetaText}>
                        {recommendedSession.duration_minutes} min
                      </Text>
                    </View>
                    <View style={styles.recommendedMetaItem}>
                      <Ionicons name="person-outline" size={16} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.recommendedMetaText}>
                        {recommendedSession.instructor || 'Guided'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.beginButton}>
                    <Text style={styles.beginButtonText}>Begin</Text>
                    <Ionicons name="arrow-forward" size={18} color={theme.colors.primary} />
                  </View>
                </LinearGradient>
              </AnimatedPressable>
            </AnimatedView>
          ) : null}
        </View>

        {/* Browse by Theme */}
        <View style={styles.section}>
          <AnimatedView delay={400} duration={400}>
            <Text style={styles.sectionTitle}>Browse by theme</Text>
          </AnimatedView>
          <View style={styles.themeGrid}>
            {themeCategories.map((cat, index) => (
              <AnimatedView 
                key={cat.id} 
                delay={450 + index * 40} 
                duration={400}
                style={styles.themeCardWrapper}
              >
                <AnimatedPressable
                  onPress={() => handleCategorySelect(cat.id)}
                  style={[
                    styles.themeCard,
                    selectedCategory === cat.id && styles.themeCardSelected,
                    selectedCategory === cat.id && { borderColor: cat.color }
                  ]}
                >
                  <View style={[styles.themeIconContainer, { backgroundColor: `${cat.color}20` }]}>
                    <Ionicons name={cat.icon} size={24} color={cat.color} />
                  </View>
                  <Text style={styles.themeLabel}>{cat.label}</Text>
                </AnimatedPressable>
              </AnimatedView>
            ))}
          </View>
        </View>

        {/* All Sessions */}
        <View style={styles.section}>
          <AnimatedView delay={700} duration={400}>
            <Text style={styles.sectionTitle}>
              {selectedCategory 
                ? themeCategories.find(c => c.id === selectedCategory)?.label || 'Sessions'
                : 'All Sessions'
              }
            </Text>
          </AnimatedView>
          
          {loading ? (
            <View style={styles.sessionsList}>
              {[0, 1, 2].map((_, index) => (
                <AnimatedView key={index} delay={750 + index * 50} duration={400}>
                  <SkeletonListItem style={{ marginBottom: theme.spacing.sm }} />
                </AnimatedView>
              ))}
            </View>
          ) : meditations.length === 0 ? (
            <AnimatedView delay={750} duration={400}>
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="leaf-outline" size={48} color={theme.colors.textMuted} />
                </View>
                <Text style={styles.emptyText}>No sessions found</Text>
                <Text style={styles.emptySubtext}>Check back soon for new content</Text>
              </View>
            </AnimatedView>
          ) : (
            <View style={styles.sessionsList}>
              {meditations.slice(0, 5).map((meditation, index) => (
                <AnimatedView key={meditation.id} delay={750 + index * 50} duration={400}>
                  <AnimatedPressable
                    onPress={() => handleMeditationPress(meditation)}
                    style={styles.sessionCard}
                  >
                    {meditation.thumbnail_url ? (
                      <Image 
                        source={{ uri: meditation.thumbnail_url }} 
                        style={styles.sessionImage}
                      />
                    ) : (
                      <View style={styles.sessionIcon}>
                        <Ionicons name="leaf" size={20} color={theme.colors.primary} />
                      </View>
                    )}
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionTitle}>{meditation.title}</Text>
                      <Text style={styles.sessionMeta}>
                        {meditation.duration_minutes} min · {meditation.difficulty_level}
                      </Text>
                    </View>
                    <View style={styles.sessionChevron}>
                      <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
                    </View>
                  </AnimatedPressable>
                </AnimatedView>
              ))}
            </View>
          )}
        </View>
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
    container: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: theme.spacing.xxl,
    },
    header: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
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
      paddingHorizontal: theme.spacing.lg,
    },
    sectionTitle: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 18,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    moodGrid: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    moodCardWrapper: {
      flex: 1,
    },
    moodCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xl,
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing.md,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
      ...theme.shadows.sm,
    },
    moodCardSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: isDark ? theme.colors.gray[100] : '#F5FAF3',
    },
    moodEmoji: {
      fontSize: 32,
      marginBottom: theme.spacing.sm,
    },
    moodLabel: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 13,
      color: theme.colors.textLight,
    },
    moodLabelSelected: {
      color: theme.colors.primary,
    },
    recommendedCard: {
      borderRadius: theme.borderRadius.xl,
      overflow: 'hidden',
      ...theme.shadows.md,
      position: 'relative',
    },
    recommendedImage: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    recommendedGradient: {
      padding: theme.spacing.xl,
    },
    recommendedGradientOverlay: {
      paddingTop: 120,
    },
    recommendedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignSelf: 'flex-start',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.full,
      gap: 6,
      marginBottom: theme.spacing.md,
    },
    recommendedBadgeText: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 12,
      color: 'white',
    },
    recommendedTitle: {
      fontFamily: theme.fonts.display.semiBold,
      fontSize: 24,
      color: 'white',
      marginBottom: theme.spacing.xs,
    },
    recommendedDescription: {
      fontFamily: theme.fonts.body.regular,
      fontSize: 15,
      color: 'rgba(255,255,255,0.85)',
      lineHeight: 22,
      marginBottom: theme.spacing.md,
    },
    recommendedMeta: {
      flexDirection: 'row',
      gap: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    recommendedMetaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    recommendedMetaText: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 14,
      color: 'rgba(255,255,255,0.8)',
    },
    beginButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'white',
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      gap: 8,
      ...theme.shadows.sm,
    },
    beginButtonText: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 16,
      color: theme.colors.primary,
    },
    themeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -theme.spacing.xs,
    },
    themeCardWrapper: {
      width: '33.33%',
      paddingHorizontal: theme.spacing.xs,
      marginBottom: theme.spacing.sm,
    },
    themeCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xl,
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing.sm,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
      ...theme.shadows.sm,
    },
    themeCardSelected: {
      backgroundColor: isDark ? theme.colors.gray[100] : theme.colors.surfaceElevated,
    },
    themeIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.sm,
    },
    themeLabel: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 12,
      color: theme.colors.text,
      textAlign: 'center',
    },
    loadingContainer: {
      paddingVertical: theme.spacing.xxl,
      alignItems: 'center',
    },
    emptyContainer: {
      paddingVertical: theme.spacing.xxl,
      alignItems: 'center',
    },
    emptyIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.md,
    },
    emptyText: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 16,
      color: theme.colors.text,
    },
    emptySubtext: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 14,
      color: theme.colors.textLight,
      marginTop: 4,
    },
    sessionsList: {
      gap: theme.spacing.sm,
    },
    sessionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.md,
      ...theme.shadows.sm,
    },
    sessionIcon: {
      width: 56,
      height: 56,
      borderRadius: 16,
      backgroundColor: isDark ? theme.colors.gray[100] : `${theme.colors.primary}15`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sessionImage: {
      width: 56,
      height: 56,
      borderRadius: 16,
      resizeMode: 'cover',
    },
    sessionInfo: {
      flex: 1,
      marginLeft: theme.spacing.md,
    },
    sessionTitle: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 16,
      color: theme.colors.text,
      marginBottom: 4,
    },
    sessionMeta: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 13,
      color: theme.colors.textLight,
      textTransform: 'capitalize',
    },
    sessionChevron: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.gray[100],
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default function Meditate() {
  return (
    <ProtectedRoute>
      <MeditateScreen />
    </ProtectedRoute>
  );
}
