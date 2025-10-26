import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import { theme } from '../../src/theme';

interface SleepContent {
  id: string;
  title: string;
  narrator: string;
  duration: number;
  type: 'story' | 'soundscape' | 'music';
  thumbnail?: string;
  isPremium: boolean;
}

function SleepScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<'all' | 'story' | 'soundscape' | 'music'>('all');

  const sleepContent: SleepContent[] = [
    {
      id: '1',
      title: 'Moonlit Forest',
      narrator: 'Emma Thompson',
      duration: 30,
      type: 'story',
      isPremium: false,
    },
    {
      id: '2',
      title: 'Ocean Waves',
      narrator: 'Nature Sounds',
      duration: 60,
      type: 'soundscape',
      isPremium: false,
    },
    {
      id: '3',
      title: 'Starry Night Journey',
      narrator: 'Michael Rivers',
      duration: 45,
      type: 'story',
      isPremium: true,
    },
    {
      id: '4',
      title: 'Rain on Leaves',
      narrator: 'Nature Sounds',
      duration: 90,
      type: 'soundscape',
      isPremium: false,
    },
    {
      id: '5',
      title: 'Dream Piano',
      narrator: 'Classical Collection',
      duration: 40,
      type: 'music',
      isPremium: false,
    },
  ];

  const filteredContent = selectedType === 'all' 
    ? sleepContent 
    : sleepContent.filter(item => item.type === selectedType);

  const contentTypes = [
    { id: 'all', label: 'All', icon: 'apps' },
    { id: 'story', label: 'Stories', icon: 'book' },
    { id: 'soundscape', label: 'Soundscapes', icon: 'water' },
    { id: 'music', label: 'Music', icon: 'musical-notes' },
  ];

  const getTypeGradient = (type: string) => {
    switch (type) {
      case 'story':
        return ['#5f3dc4', '#7c5cdb'];
      case 'soundscape':
        return ['#0984e3', '#74b9ff'];
      case 'music':
        return ['#6c5ce7', '#a29bfe'];
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

        {/* Content Type Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {contentTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.filterChip,
                selectedType === type.id && styles.filterChipActive,
              ]}
              onPress={() => setSelectedType(type.id as any)}
            >
              <Ionicons
                name={type.icon as any}
                size={16}
                color={selectedType === type.id ? 'white' : theme.colors.text}
              />
              <Text style={[
                styles.filterText,
                selectedType === type.id && styles.filterTextActive,
              ]}>
                {type.label}
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
          {filteredContent.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.contentCard}
              onPress={() => {
                // TODO: Navigate to player
              }}
            >
              <LinearGradient
                colors={getTypeGradient(item.type)}
                style={styles.contentThumbnail}
              >
                <Ionicons
                  name={
                    item.type === 'story' ? 'book' :
                    item.type === 'soundscape' ? 'water' : 'musical-notes'
                  }
                  size={24}
                  color="white"
                />
              </LinearGradient>
              
              <View style={styles.contentInfo}>
                <Text style={styles.contentTitle}>{item.title}</Text>
                <Text style={styles.contentNarrator}>{item.narrator}</Text>
                <View style={styles.contentMeta}>
                  <Ionicons name="time-outline" size={14} color={theme.colors.textLight} />
                  <Text style={styles.contentDuration}>{item.duration} min</Text>
                  {item.isPremium && (
                    <View style={styles.premiumBadge}>
                      <Ionicons name="star" size={12} color={theme.colors.primary} />
                      <Text style={styles.premiumText}>PRO</Text>
                    </View>
                  )}
                </View>
              </View>
              
              <Ionicons name="play-circle" size={32} color={theme.colors.primary} />
            </TouchableOpacity>
          ))}
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
    backgroundColor: theme.colors.sleep,
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
});

export default function Sleep() {
  return (
    <ProtectedRoute>
      <SleepScreen />
    </ProtectedRoute>
  );
}
