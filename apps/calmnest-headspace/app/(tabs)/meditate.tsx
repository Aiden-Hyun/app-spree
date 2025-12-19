import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import { getMeditations, isFavorite, toggleFavorite } from '../../src/services/firestoreService';
import { useAuth } from '../../src/contexts/AuthContext';
import { theme } from '../../src/theme';
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
  { id: 'focus', label: 'Focus', emoji: '🎯', color: '#8B9F82' },
  { id: 'sleep', label: 'Sleep', emoji: '🌙', color: '#7B8FA1' },
  { id: 'stress', label: 'Stress Relief', emoji: '🌊', color: '#A8B4C4' },
  { id: 'gratitude', label: 'Gratitude', emoji: '🙏', color: '#C4A77D' },
  { id: 'anxiety', label: 'Calm Anxiety', emoji: '🦋', color: '#B4A7C7' },
  { id: 'self-esteem', label: 'Self Love', emoji: '💗', color: '#D4A5A5' },
];

function MeditateScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<MeditationCategory | null>(null);
  const [meditations, setMeditations] = useState<GuidedMeditation[]>([]);
  const [recommendedSession, setRecommendedSession] = useState<GuidedMeditation | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Practice</Text>
          <Text style={styles.subtitle}>Find your stillness</Text>
        </View>

        {/* Mood Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How are you feeling?</Text>
          <View style={styles.moodGrid}>
            {moods.map((mood) => (
              <TouchableOpacity
                key={mood.id}
                style={[
                  styles.moodCard,
                  selectedMood === mood.id && styles.moodCardSelected
                ]}
                onPress={() => handleMoodSelect(mood.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={[
                  styles.moodLabel,
                  selectedMood === mood.id && styles.moodLabelSelected
                ]}>
                  {mood.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recommended Session */}
        {recommendedSession && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {selectedMood ? 'Recommended for you' : 'Start here'}
            </Text>
            <TouchableOpacity
              style={styles.recommendedCard}
              activeOpacity={0.9}
              onPress={() => handleMeditationPress(recommendedSession)}
            >
              <LinearGradient
                colors={['#A8B89F', '#8B9F82']}
                style={styles.recommendedGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
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
            </TouchableOpacity>
          </View>
        )}

        {/* Browse by Theme */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by theme</Text>
          <View style={styles.themeGrid}>
            {themeCategories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.themeCard,
                  selectedCategory === cat.id && styles.themeCardSelected,
                  { borderColor: selectedCategory === cat.id ? cat.color : 'transparent' }
                ]}
                onPress={() => handleCategorySelect(cat.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.themeEmoji}>{cat.emoji}</Text>
                <Text style={styles.themeLabel}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* All Sessions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedCategory 
              ? themeCategories.find(c => c.id === selectedCategory)?.label || 'Sessions'
              : 'All Sessions'
            }
          </Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : meditations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🧘</Text>
              <Text style={styles.emptyText}>No sessions found</Text>
              <Text style={styles.emptySubtext}>Check back soon for new content</Text>
            </View>
          ) : (
            <View style={styles.sessionsList}>
              {meditations.slice(0, 5).map((meditation) => (
                <TouchableOpacity
                  key={meditation.id}
                  style={styles.sessionCard}
                  onPress={() => handleMeditationPress(meditation)}
                  activeOpacity={0.8}
                >
                  <View style={styles.sessionIcon}>
                    <Ionicons name="leaf" size={20} color={theme.colors.primary} />
                  </View>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionTitle}>{meditation.title}</Text>
                    <Text style={styles.sessionMeta}>
                      {meditation.duration_minutes} min · {meditation.difficulty_level}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    fontSize: 17,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  moodGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  moodCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...theme.shadows.sm,
  },
  moodCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#F5FAF3',
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 6,
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
  },
  recommendedGradient: {
    padding: theme.spacing.xl,
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    gap: 4,
    marginBottom: theme.spacing.md,
  },
  recommendedBadgeText: {
    fontFamily: theme.fonts.ui.medium,
    fontSize: 12,
    color: 'white',
  },
  recommendedTitle: {
    fontFamily: theme.fonts.display.semiBold,
    fontSize: 22,
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
  },
  beginButtonText: {
    fontFamily: theme.fonts.ui.semiBold,
    fontSize: 16,
    color: theme.colors.primary,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  themeCard: {
    width: '31%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...theme.shadows.sm,
  },
  themeCardSelected: {
    backgroundColor: theme.colors.gray[50],
  },
  themeEmoji: {
    fontSize: 24,
    marginBottom: 6,
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
  emptyEmoji: {
    fontSize: 48,
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
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
  },
  sessionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  sessionTitle: {
    fontFamily: theme.fonts.ui.medium,
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 2,
  },
  sessionMeta: {
    fontFamily: theme.fonts.ui.regular,
    fontSize: 13,
    color: theme.colors.textLight,
    textTransform: 'capitalize',
  },
});

export default function Meditate() {
  return (
    <ProtectedRoute>
      <MeditateScreen />
    </ProtectedRoute>
  );
}
