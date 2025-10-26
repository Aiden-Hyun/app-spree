import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import { MeditationCard } from '../../src/components/MeditationCard';
import { meditationService } from '../../src/services/meditationService';
import { theme } from '../../src/theme';
import { GuidedMeditation, MeditationCategory } from '../../src/types';

const categories: { id: MeditationCategory; label: string; icon: string }[] = [
  { id: 'focus', label: 'Focus', icon: '🎯' },
  { id: 'stress', label: 'Stress', icon: '😌' },
  { id: 'anxiety', label: 'Anxiety', icon: '🌊' },
  { id: 'sleep', label: 'Sleep', icon: '😴' },
  { id: 'gratitude', label: 'Gratitude', icon: '🙏' },
];

function MeditateScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<MeditationCategory | null>(null);
  const [meditations, setMeditations] = useState<GuidedMeditation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMeditations();
  }, [selectedCategory]);

  const loadMeditations = async () => {
    try {
      setLoading(true);
      // For now, we'll use dummy data until we have real content
      const dummyMeditations: GuidedMeditation[] = [
        {
          id: '1',
          title: 'Morning Mindfulness',
          description: 'Start your day with clarity and purpose',
          duration_minutes: 10,
          audio_url: '',
          category: 'focus',
          difficulty_level: 'beginner',
          instructor: 'Sarah Chen',
          is_premium: false,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Stress Relief',
          description: 'Release tension and find your calm',
          duration_minutes: 15,
          audio_url: '',
          category: 'stress',
          difficulty_level: 'beginner',
          instructor: 'Michael Rivers',
          is_premium: false,
          created_at: new Date().toISOString(),
        },
        {
          id: '3',
          title: 'Deep Sleep Journey',
          description: 'Drift into peaceful slumber',
          duration_minutes: 20,
          audio_url: '',
          category: 'sleep',
          difficulty_level: 'intermediate',
          instructor: 'Emma Thompson',
          is_premium: true,
          created_at: new Date().toISOString(),
        },
        {
          id: '4',
          title: 'Anxiety Relief',
          description: 'Find peace in the present moment',
          duration_minutes: 12,
          audio_url: '',
          category: 'anxiety',
          difficulty_level: 'beginner',
          instructor: 'David Kim',
          is_premium: false,
          created_at: new Date().toISOString(),
        },
        {
          id: '5',
          title: 'Gratitude Practice',
          description: 'Cultivate appreciation and joy',
          duration_minutes: 8,
          audio_url: '',
          category: 'gratitude',
          difficulty_level: 'beginner',
          instructor: 'Lisa Martinez',
          is_premium: false,
          created_at: new Date().toISOString(),
        },
      ];

      const filtered = selectedCategory
        ? dummyMeditations.filter(m => m.category === selectedCategory)
        : dummyMeditations;
      
      setMeditations(filtered);
    } catch (error) {
      console.error('Failed to load meditations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMeditationPress = (meditation: GuidedMeditation) => {
    router.push({
      pathname: '/meditation/[id]',
      params: { id: meditation.id },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Meditate</Text>
          <Text style={styles.subtitle}>Choose your journey to inner peace</Text>
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              !selectedCategory && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[
              styles.categoryText,
              !selectedCategory && styles.categoryTextActive,
            ]}>
              All
            </Text>
          </TouchableOpacity>
          
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={styles.categoryEmoji}>{category.icon}</Text>
              <Text style={[
                styles.categoryText,
                selectedCategory === category.id && styles.categoryTextActive,
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Meditation List */}
        <FlatList
          data={meditations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MeditationCard
              meditation={item}
              onPress={() => handleMeditationPress(item)}
              isFavorite={false}
              onToggleFavorite={() => {
                // TODO: Implement favorites
              }}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
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
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
  },
  categoriesContainer: {
    maxHeight: 60,
    marginBottom: theme.spacing.md,
  },
  categoriesContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray[200],
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  categoryChipActive: {
    backgroundColor: theme.colors.primary,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  categoryTextActive: {
    color: 'white',
  },
  listContent: {
    paddingBottom: theme.spacing.xxl,
  },
});

export default function Meditate() {
  return (
    <ProtectedRoute>
      <MeditateScreen />
    </ProtectedRoute>
  );
}
