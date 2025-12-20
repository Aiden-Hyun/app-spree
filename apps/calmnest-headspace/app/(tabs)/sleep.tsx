import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import { getSleepStories } from '../../src/services/firestoreService';
import { theme } from '../../src/theme';
import { SleepStory } from '../../src/types';

const ambientSounds = [
  { id: 'rain', emoji: '🌧️', label: 'Rain' },
  { id: 'waves', emoji: '🌊', label: 'Waves' },
  { id: 'fire', emoji: '🔥', label: 'Fire' },
  { id: 'wind', emoji: '🍃', label: 'Wind' },
  { id: 'birds', emoji: '🐦', label: 'Birds' },
  { id: 'thunder', emoji: '⛈️', label: 'Thunder' },
];

function SleepScreen() {
  const router = useRouter();
  const [sleepStories, setSleepStories] = useState<SleepStory[]>([]);
  const [featuredStory, setFeaturedStory] = useState<SleepStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSound, setSelectedSound] = useState<string | null>(null);

  useEffect(() => {
    loadSleepContent();
  }, []);

  const loadSleepContent = async () => {
    try {
      setLoading(true);
      const stories = await getSleepStories();
      setSleepStories(stories);
      if (stories.length > 0) {
        setFeaturedStory(stories[0]);
      }
    } catch (error) {
      console.error('Failed to load sleep content:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 21 || hour < 5) return 'Sweet dreams await';
    if (hour >= 17) return 'Wind down and relax';
    return 'Rest when you need it';
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A1D29', '#252A3A']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.moonContainer}>
                <Text style={styles.moonEmoji}>🌙</Text>
              </View>
              <Text style={styles.title}>Ready for Rest</Text>
              <Text style={styles.subtitle}>{getTimeGreeting()}</Text>
            </View>

            {/* Featured Story */}
            {featuredStory && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tonight's Story</Text>
                <TouchableOpacity
                  style={styles.featuredCard}
                  activeOpacity={0.9}
                  onPress={() => {
                    // TODO: Navigate to story player
                  }}
                >
                  {featuredStory.thumbnail_url ? (
                    <Image 
                      source={{ uri: featuredStory.thumbnail_url }} 
                      style={styles.featuredImage}
                    />
                  ) : null}
                  <LinearGradient
                    colors={featuredStory.thumbnail_url 
                      ? ['transparent', 'rgba(26, 29, 41, 0.9)'] 
                      : ['#3D4158', '#2A2D3E']}
                    style={[
                      styles.featuredGradient,
                      featuredStory.thumbnail_url && styles.featuredGradientOverlay
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                  >
                    <View style={styles.featuredStars}>
                      <Text style={styles.starsEmoji}>✨</Text>
                    </View>
                    <Text style={styles.featuredTitle}>{featuredStory.title}</Text>
                    <Text style={styles.featuredDescription} numberOfLines={2}>
                      {featuredStory.description}
                    </Text>
                    <View style={styles.featuredMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={14} color={theme.colors.sleepTextMuted} />
                        <Text style={styles.metaText}>{featuredStory.duration_minutes} min</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="mic-outline" size={14} color={theme.colors.sleepTextMuted} />
                        <Text style={styles.metaText}>{featuredStory.narrator}</Text>
                      </View>
                    </View>
                    <View style={styles.playButton}>
                      <Ionicons name="play" size={24} color={theme.colors.sleepBackground} />
                      <Text style={styles.playButtonText}>Play Story</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Sleep Sounds */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sleep Sounds</Text>
              <View style={styles.soundsGrid}>
                {ambientSounds.map((sound) => (
                  <TouchableOpacity
                    key={sound.id}
                    style={[
                      styles.soundCard,
                      selectedSound === sound.id && styles.soundCardSelected
                    ]}
                    onPress={() => setSelectedSound(
                      selectedSound === sound.id ? null : sound.id
                    )}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.soundEmoji}>{sound.emoji}</Text>
                    <Text style={[
                      styles.soundLabel,
                      selectedSound === sound.id && styles.soundLabelSelected
                    ]}>
                      {sound.label}
                    </Text>
                    {selectedSound === sound.id && (
                      <View style={styles.soundPlaying}>
                        <Ionicons name="volume-high" size={12} color={theme.colors.sleepAccent} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Bedtime Stories */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bedtime Stories</Text>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.sleepAccent} />
                </View>
              ) : (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.storiesScroll}
                >
                  {sleepStories.map((story) => (
                    <TouchableOpacity
                      key={story.id}
                      style={styles.storyCard}
                      activeOpacity={0.8}
                      onPress={() => {
                        // TODO: Navigate to story player
                      }}
                    >
                      {story.thumbnail_url ? (
                        <Image 
                          source={{ uri: story.thumbnail_url }} 
                          style={styles.storyImage}
                        />
                      ) : (
                        <View style={styles.storyIcon}>
                          <Text style={styles.storyEmoji}>
                            {story.category === 'nature' ? '🌲' :
                             story.category === 'fantasy' ? '🏰' :
                             story.category === 'travel' ? '✈️' : '📖'}
                          </Text>
                        </View>
                      )}
                      <Text style={styles.storyTitle} numberOfLines={2}>
                        {story.title}
                      </Text>
                      <Text style={styles.storyMeta}>
                        {story.duration_minutes} min
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Sleep Tips */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sleep Better</Text>
              <View style={styles.tipsCard}>
                <View style={styles.tipItem}>
                  <Text style={styles.tipEmoji}>🌡️</Text>
                  <View style={styles.tipContent}>
                    <Text style={styles.tipTitle}>Cool room</Text>
                    <Text style={styles.tipText}>65-68°F is ideal for sleep</Text>
                  </View>
                </View>
                <View style={styles.tipDivider} />
                <View style={styles.tipItem}>
                  <Text style={styles.tipEmoji}>📱</Text>
                  <View style={styles.tipContent}>
                    <Text style={styles.tipTitle}>Screen-free</Text>
                    <Text style={styles.tipText}>30 min before bed</Text>
                  </View>
                </View>
                <View style={styles.tipDivider} />
                <View style={styles.tipItem}>
                  <Text style={styles.tipEmoji}>🕐</Text>
                  <View style={styles.tipContent}>
                    <Text style={styles.tipTitle}>Consistent schedule</Text>
                    <Text style={styles.tipText}>Same time each night</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
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
    alignItems: 'center',
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  moonContainer: {
    marginBottom: theme.spacing.md,
  },
  moonEmoji: {
    fontSize: 56,
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
    paddingHorizontal: theme.spacing.lg,
  },
  sectionTitle: {
    fontFamily: theme.fonts.ui.semiBold,
    fontSize: 17,
    color: theme.colors.sleepText,
    marginBottom: theme.spacing.md,
  },
  featuredCard: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  featuredImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  featuredGradient: {
    padding: theme.spacing.xl,
  },
  featuredGradientOverlay: {
    paddingTop: 100,
  },
  featuredStars: {
    marginBottom: theme.spacing.sm,
  },
  starsEmoji: {
    fontSize: 28,
  },
  featuredTitle: {
    fontFamily: theme.fonts.display.semiBold,
    fontSize: 22,
    color: theme.colors.sleepText,
    marginBottom: theme.spacing.xs,
  },
  featuredDescription: {
    fontFamily: theme.fonts.body.regular,
    fontSize: 15,
    color: theme.colors.sleepTextMuted,
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  featuredMeta: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontFamily: theme.fonts.ui.regular,
    fontSize: 13,
    color: theme.colors.sleepTextMuted,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.sleepAccent,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    gap: 8,
  },
  playButtonText: {
    fontFamily: theme.fonts.ui.semiBold,
    fontSize: 16,
    color: theme.colors.sleepBackground,
  },
  soundsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  soundCard: {
    width: '31%',
    backgroundColor: theme.colors.sleepSurface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  soundCardSelected: {
    borderColor: theme.colors.sleepAccent,
    backgroundColor: 'rgba(201, 184, 150, 0.1)',
  },
  soundEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  soundLabel: {
    fontFamily: theme.fonts.ui.medium,
    fontSize: 12,
    color: theme.colors.sleepTextMuted,
  },
  soundLabelSelected: {
    color: theme.colors.sleepAccent,
  },
  soundPlaying: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  loadingContainer: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  storiesScroll: {
    gap: theme.spacing.md,
  },
  storyCard: {
    width: 140,
    backgroundColor: theme.colors.sleepSurface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  storyImage: {
    width: '100%',
    height: 80,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    resizeMode: 'cover',
  },
  storyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(201, 184, 150, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  storyEmoji: {
    fontSize: 24,
  },
  storyTitle: {
    fontFamily: theme.fonts.ui.medium,
    fontSize: 14,
    color: theme.colors.sleepText,
    marginBottom: 4,
  },
  storyMeta: {
    fontFamily: theme.fonts.ui.regular,
    fontSize: 12,
    color: theme.colors.sleepTextMuted,
  },
  tipsCard: {
    backgroundColor: theme.colors.sleepSurface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipEmoji: {
    fontSize: 28,
    marginRight: theme.spacing.md,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontFamily: theme.fonts.ui.medium,
    fontSize: 15,
    color: theme.colors.sleepText,
  },
  tipText: {
    fontFamily: theme.fonts.ui.regular,
    fontSize: 13,
    color: theme.colors.sleepTextMuted,
    marginTop: 2,
  },
  tipDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: theme.spacing.md,
  },
});

export default function Sleep() {
  return (
    <ProtectedRoute>
      <SleepScreen />
    </ProtectedRoute>
  );
}
