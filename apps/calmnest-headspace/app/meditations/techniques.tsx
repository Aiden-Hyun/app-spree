import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import { AnimatedView } from '../../src/components/AnimatedView';
import { AnimatedPressable } from '../../src/components/AnimatedPressable';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Theme } from '../../src/theme';
import {
  techniquesData,
  techniqueMeditationsData,
  getMeditationsByTechnique,
  MeditationTechnique,
  TechniqueMeditation,
} from '../../src/constants/techniquesData';

function TechniquesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ technique?: string }>();
  const { theme, isDark } = useTheme();
  const [selectedTechnique, setSelectedTechnique] = useState<string>(params.technique || 'all');

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const filteredMeditations = useMemo(() => {
    if (selectedTechnique === 'all') return techniqueMeditationsData;
    return getMeditationsByTechnique(selectedTechnique);
  }, [selectedTechnique]);

  const handleMeditationPress = (meditation: TechniqueMeditation) => {
    router.push(
      `/meditations/technique/${meditation.id}?audioKey=${meditation.audioKey}&title=${encodeURIComponent(meditation.title)}&description=${encodeURIComponent(meditation.description)}&duration=${meditation.duration_minutes}&instructor=${encodeURIComponent(meditation.instructor)}&technique=${meditation.technique}&color=${encodeURIComponent(meditation.color)}`
    );
  };

  const renderMeditationItem = ({ item, index }: { item: TechniqueMeditation; index: number }) => (
    <AnimatedView delay={100 + index * 30} duration={300}>
      <AnimatedPressable
        onPress={() => handleMeditationPress(item)}
        style={styles.meditationCard}
      >
        <View style={[styles.meditationIcon, { backgroundColor: `${item.color}20` }]}>
          <Ionicons
            name={techniquesData.find((t) => t.id === item.technique)?.icon as keyof typeof Ionicons.glyphMap || 'leaf'}
            size={24}
            color={item.color}
          />
        </View>
        <View style={styles.meditationInfo}>
          <Text style={styles.meditationTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.meditationDescription} numberOfLines={1}>
            {item.description}
          </Text>
          <View style={styles.meditationMetaRow}>
            <View style={styles.meditationMetaItem}>
              <Ionicons name="time-outline" size={12} color={theme.colors.textMuted} />
              <Text style={styles.meditationMeta}>{item.duration_minutes} min</Text>
            </View>
            <View style={styles.meditationMetaItem}>
              <Ionicons name="person-outline" size={12} color={theme.colors.textMuted} />
              <Text style={styles.meditationMeta}>{item.instructor}</Text>
            </View>
          </View>
        </View>
        <View style={styles.meditationChevron}>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        </View>
      </AnimatedPressable>
    </AnimatedView>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <AnimatedPressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </AnimatedPressable>
        <Text style={styles.headerTitle}>Techniques</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Technique Filter */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        >
          <AnimatedPressable
            onPress={() => setSelectedTechnique('all')}
            style={[
              styles.filterChip,
              selectedTechnique === 'all' && styles.filterChipSelected,
            ]}
          >
            <Ionicons
              name="grid-outline"
              size={16}
              color={selectedTechnique === 'all' ? 'white' : theme.colors.textLight}
            />
            <Text
              style={[
                styles.filterChipText,
                selectedTechnique === 'all' && styles.filterChipTextSelected,
              ]}
            >
              All
            </Text>
          </AnimatedPressable>
          {techniquesData.map((technique) => (
            <AnimatedPressable
              key={technique.id}
              onPress={() => setSelectedTechnique(technique.id)}
              style={[
                styles.filterChip,
                selectedTechnique === technique.id && styles.filterChipSelected,
                selectedTechnique === technique.id && { backgroundColor: technique.color },
              ]}
            >
              <Ionicons
                name={technique.icon as keyof typeof Ionicons.glyphMap}
                size={16}
                color={selectedTechnique === technique.id ? 'white' : theme.colors.textLight}
              />
              <Text
                style={[
                  styles.filterChipText,
                  selectedTechnique === technique.id && styles.filterChipTextSelected,
                ]}
              >
                {technique.title}
              </Text>
            </AnimatedPressable>
          ))}
        </ScrollView>
      </View>

      {/* Description for selected technique */}
      {selectedTechnique !== 'all' && (
        <AnimatedView delay={50} duration={300}>
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText}>
              {techniquesData.find((t) => t.id === selectedTechnique)?.longDescription}
            </Text>
          </View>
        </AnimatedView>
      )}

      {/* Meditations List */}
      {filteredMeditations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="leaf-outline" size={48} color={theme.colors.textMuted} />
          </View>
          <Text style={styles.emptyText}>No meditations found</Text>
          <Text style={styles.emptySubtext}>Check back soon for new content</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMeditations}
          keyExtractor={(item) => item.id}
          renderItem={renderMeditationItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      flex: 1,
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 17,
      color: theme.colors.text,
      textAlign: 'center',
    },
    headerSpacer: {
      width: 40,
    },
    filterContainer: {
      marginTop: 0,
    },
    filterList: {
      paddingHorizontal: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.surface,
      gap: 6,
      ...theme.shadows.sm,
    },
    filterChipSelected: {
      backgroundColor: theme.colors.primary,
    },
    filterChipText: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 13,
      color: theme.colors.textLight,
    },
    filterChipTextSelected: {
      color: 'white',
    },
    descriptionContainer: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    descriptionText: {
      fontFamily: theme.fonts.body.regular,
      fontSize: 14,
      color: theme.colors.textLight,
      lineHeight: 20,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.xxl,
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
      textAlign: 'center',
      paddingHorizontal: theme.spacing.xl,
    },
    listContent: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.xxl,
    },
    meditationCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.md,
      ...theme.shadows.sm,
    },
    meditationIcon: {
      width: 56,
      height: 56,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    meditationInfo: {
      flex: 1,
      marginLeft: theme.spacing.md,
    },
    meditationTitle: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 16,
      color: theme.colors.text,
      marginBottom: 2,
    },
    meditationDescription: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 13,
      color: theme.colors.textLight,
      marginBottom: 6,
    },
    meditationMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    meditationMetaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    meditationMeta: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 11,
      color: theme.colors.textMuted,
    },
    meditationChevron: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.gray[100],
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default function Techniques() {
  return (
    <ProtectedRoute>
      <TechniquesScreen />
    </ProtectedRoute>
  );
}

