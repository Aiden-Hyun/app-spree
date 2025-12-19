import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import { getSleepStories } from '../../src/services/firestoreService';
import { theme } from '../../src/theme';
import { SleepStory } from '../../src/types';

function SleepScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sleepStories, setSleepStories] = useState<SleepStory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSleepStories();
  }, []);

  const loadSleepStories = async () => {
    try {
      setLoading(true);
      const data = await getSleepStories();
      setSleepStories(data);
    } catch (error) {
      console.error('Failed to load sleep stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: null, label: 'All', icon: 'apps' },
    { id: 'nature', label: 'Nature', icon: 'leaf' },
    { id: 'fantasy', label: 'Fantasy', icon: 'sparkles' },
    { id: 'travel', label: 'Travel', icon: 'airplane' },
    { id: 'fiction', label: 'Fiction', icon: 'book' },
  ];

  const filteredStories = selectedCategory
    ? sleepStories.filter(story => story.category === selectedCategory)
    : sleepStories;

  const getCategoryGradient = (category: string) => {
    switch (category) {
      case 'nature':
        return ['#00b894', '#55a88b'];
      case 'fantasy':
        return ['#6c5ce7', '#a29bfe'];
      case 'travel':
        return ['#0984e3', '#74b9ff'];
      case 'fiction':
        return ['#5f3dc4', '#7c5cdb'];
      default:
        return ['#5f3dc4', '#7c5cdb'];
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Sleep</Text>
          <Text style={styles.subtitle}>Drift into peaceful dreams</Text>
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id ?? 'all'}
              style={[
                styles.filterChip,
                selectedCategory === cat.id && styles.filterChipActive,
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Ionicons
                name={cat.icon as any}
                size={16}
                color={selectedCategory === cat.id ? 'white' : theme.colors.text}
              />
              <Text style={[
                styles.filterText,
                selectedCategory === cat.id && styles.filterTextActive,
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured Section */}
        <View style={styles.featuredSection}>
          <Text style={styles.sectionTitle}>Tonight's Recommendation</Text>
          <TouchableOpacity style={styles.featuredCard} activeOpacity={0.9}>
            <LinearGradient
              colors={['#2d3436', '#636e72']}
              style={styles.featuredGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.featuredContent}>
                <Ionicons name="moon" size={48} color="white" />
                <View style={styles.featuredInfo}>
                  <Text style={styles.featuredTitle}>Deep Sleep Collection</Text>
                  <Text style={styles.featuredSubtitle}>
                    Curated stories and sounds for restful sleep
                  </Text>
                  <View style={styles.featuredMeta}>
                    <Ionicons name="time-outline" size={16} color="white" />
                    <Text style={styles.featuredMetaText}>8 hours</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Content List */}
        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Sleep Library</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading stories...</Text>
            </View>
          ) : filteredStories.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No stories found</Text>
            </View>
          ) : (
            filteredStories.map((story) => (
              <TouchableOpacity
                key={story.id}
                style={styles.contentCard}
                onPress={() => {
                  // TODO: Navigate to player with story.id
                }}
              >
                <LinearGradient
                  colors={getCategoryGradient(story.category)}
                  style={styles.contentThumbnail}
                >
                  <Ionicons
                    name={
                      story.category === 'nature' ? 'leaf' :
                      story.category === 'fantasy' ? 'sparkles' :
                      story.category === 'travel' ? 'airplane' : 'book'
                    }
                    size={24}
                    color="white"
                  />
                </LinearGradient>
                
                <View style={styles.contentInfo}>
                  <Text style={styles.contentTitle}>{story.title}</Text>
                  <Text style={styles.contentNarrator}>{story.narrator}</Text>
                  <View style={styles.contentMeta}>
                    <Ionicons name="time-outline" size={14} color={theme.colors.textLight} />
                    <Text style={styles.contentDuration}>{story.duration_minutes} min</Text>
                    {story.is_premium && (
                      <View style={styles.premiumBadge}>
                        <Ionicons name="star" size={12} color={theme.colors.primary} />
                        <Text style={styles.premiumText}>PRO</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                <Ionicons name="play-circle" size={32} color={theme.colors.primary} />
              </TouchableOpacity>
            ))
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
  filterContainer: {
    maxHeight: 50,
    marginBottom: theme.spacing.lg,
  },
  filterContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray[200],
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  filterChipActive: {
    backgroundColor: theme.colors.sleep || '#5f3dc4',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  filterTextActive: {
    color: 'white',
  },
  featuredSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  featuredCard: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  featuredGradient: {
    padding: theme.spacing.xl,
  },
  featuredContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  featuredInfo: {
    flex: 1,
  },
  featuredTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    marginBottom: theme.spacing.xs,
  },
  featuredSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: theme.spacing.sm,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  featuredMetaText: {
    fontSize: 14,
    color: 'white',
  },
  contentSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  contentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  contentThumbnail: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentInfo: {
    flex: 1,
    marginHorizontal: theme.spacing.md,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  contentNarrator: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  contentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  contentDuration: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray[100],
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.sm,
    gap: 2,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  loadingContainer: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textLight,
  },
  emptyContainer: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textLight,
  },
});

export default function Sleep() {
  return (
    <ProtectedRoute>
      <SleepScreen />
    </ProtectedRoute>
  );
}
