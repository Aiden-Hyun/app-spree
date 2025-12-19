import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import { MeditationCard } from '../../src/components/MeditationCard';
import { getMeditations, isFavorite, toggleFavorite } from '../../src/services/firestoreService';
import { useAuth } from '../../src/contexts/AuthContext';
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
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<MeditationCategory | null>(null);
  const [meditations, setMeditations] = useState<GuidedMeditation[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMeditations();
  }, [selectedCategory]);

  useEffect(() => {
    if (user && meditations.length > 0) {
      loadFavorites();
    }
  }, [user, meditations]);

  const loadMeditations = async () => {
    try {
      setLoading(true);
      const data = await getMeditations(selectedCategory || undefined);
      setMeditations(data);
    } catch (error) {
      console.error('Failed to load meditations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    if (!user) return;
    
    const favSet = new Set<string>();
    for (const meditation of meditations) {
      const isFav = await isFavorite(user.uid, meditation.id);
      if (isFav) favSet.add(meditation.id);
    }
    setFavorites(favSet);
  };

  const handleMeditationPress = (meditation: GuidedMeditation) => {
    router.push({
      pathname: '/meditation/[id]',
      params: { id: meditation.id },
    });
  };

  const handleToggleFavorite = async (meditationId: string) => {
    if (!user) return;
    
    const isFav = await toggleFavorite(user.uid, meditationId, 'meditation');
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (isFav) {
        newSet.add(meditationId);
      } else {
        newSet.delete(meditationId);
      }
      return newSet;
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
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading meditations...</Text>
          </View>
        ) : meditations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No meditations found</Text>
            <Text style={styles.emptySubtext}>Check back soon for new content!</Text>
          </View>
        ) : (
          <FlatList
            data={meditations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MeditationCard
                meditation={item}
                onPress={() => handleMeditationPress(item)}
                isFavorite={favorites.has(item.id)}
                onToggleFavorite={() => handleToggleFavorite(item.id)}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textLight,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
});

export default function Meditate() {
  return (
    <ProtectedRoute>
      <MeditateScreen />
    </ProtectedRoute>
  );
}
