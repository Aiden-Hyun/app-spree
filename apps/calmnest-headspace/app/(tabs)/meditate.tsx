import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import { AnimatedView } from '../../src/components/AnimatedView';
import { AnimatedPressable } from '../../src/components/AnimatedPressable';
import { ContentCard } from '../../src/components/ContentCard';
import { Skeleton } from '../../src/components/Skeleton';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Theme } from '../../src/theme';
import { 
  getEmergencyMeditations, 
  getTechniques, 
  getCourses,
  FirestoreEmergencyMeditation,
  FirestoreTechnique,
  FirestoreCourse
} from '../../src/services/firestoreService';

const themeCategories = [
  { id: 'focus', label: 'Focus', icon: 'eye-outline' as const, color: '#8B9F82' },
  { id: 'sleep', label: 'Sleep', icon: 'moon-outline' as const, color: '#7B8FA1' },
  { id: 'stress', label: 'Stress', icon: 'water-outline' as const, color: '#A8B4C4' },
  { id: 'gratitude', label: 'Gratitude', icon: 'heart-outline' as const, color: '#C4A77D' },
  { id: 'anxiety', label: 'Calm', icon: 'leaf-outline' as const, color: '#B4A7C7' },
  { id: 'self-esteem', label: 'Self Love', icon: 'flower-outline' as const, color: '#D4A5A5' },
];

const therapyCategories = [
  { id: 'cbt', label: 'CBT', fullName: 'Cognitive Behavioral Therapy', icon: 'bulb-outline' as const, color: '#2DD4BF' },
  { id: 'act', label: 'ACT', fullName: 'Acceptance & Commitment', icon: 'hand-left-outline' as const, color: '#818CF8' },
  { id: 'dbt', label: 'DBT', fullName: 'Dialectical Behavior Therapy', icon: 'git-merge-outline' as const, color: '#F472B6' },
  { id: 'mbct', label: 'MBCT', fullName: 'Mindfulness-Based CBT', icon: 'infinite-outline' as const, color: '#34D399' },
  { id: 'ifs', label: 'IFS', fullName: 'Internal Family Systems', icon: 'people-outline' as const, color: '#FB923C' },
  { id: 'somatic', label: 'Somatic', fullName: 'Body-Based Therapy', icon: 'body-outline' as const, color: '#A78BFA' },
];

function MeditateScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [emergencyMeditations, setEmergencyMeditations] = useState<FirestoreEmergencyMeditation[]>([]);
  const [techniques, setTechniques] = useState<FirestoreTechnique[]>([]);
  const [courses, setCourses] = useState<FirestoreCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  useEffect(() => {
    async function loadContent() {
      setLoading(true);
      const [emergencyData, techniquesData, coursesData] = await Promise.all([
        getEmergencyMeditations(),
        getTechniques(),
        getCourses()
      ]);
      setEmergencyMeditations(emergencyData);
      setTechniques(techniquesData);
      setCourses(coursesData);
      setLoading(false);
    }
    loadContent();
  }, []);

  const handleThemePress = (categoryId: string) => {
    router.push({
      pathname: '/meditations',
      params: { category: categoryId },
    });
  };

  const handleTherapyPress = (therapyId: string) => {
    router.push({
      pathname: '/meditations/therapies',
      params: { therapy: therapyId },
    });
  };

  const handleEmergencyPress = (meditation: FirestoreEmergencyMeditation) => {
    router.push({
      pathname: '/emergency/[id]',
      params: {
        id: meditation.id,
        title: meditation.title,
        description: meditation.description,
        duration: meditation.duration_minutes.toString(),
        audioPath: meditation.audioPath,
        color: meditation.color,
        icon: meditation.icon,
        narrator: meditation.narrator || '',
      },
    });
  };

  const handleTechniquePress = (technique: FirestoreTechnique) => {
    router.push({
      pathname: '/meditations/techniques',
      params: { technique: technique.id },
    });
  };

  const handleCoursePress = (course: FirestoreCourse) => {
    router.push(`/course/${course.id}`);
  };

  // Skeleton cards for loading state
  const renderSkeletonCards = useCallback((count: number = 3) => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      contentContainerStyle={styles.cardsScroll}
    >
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ width: 150 }}>
          <Skeleton width={150} height={120} style={{ borderRadius: theme.borderRadius.lg }} />
          <Skeleton width={120} height={14} style={{ marginTop: 8 }} />
          <Skeleton width={60} height={12} style={{ marginTop: 4 }} />
        </View>
      ))}
    </ScrollView>
  ), [theme, styles.cardsScroll]);

  // Skeleton for theme cards (smaller)
  const renderThemeSkeletons = useCallback(() => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      contentContainerStyle={styles.cardsScroll}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <View key={i} style={{ width: 100, alignItems: 'center' }}>
          <Skeleton width={100} height={100} style={{ borderRadius: theme.borderRadius.xl }} />
        </View>
      ))}
    </ScrollView>
  ), [theme, styles.cardsScroll]);

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

        {/* Courses */}
        <View style={styles.section}>
          <AnimatedView delay={100} duration={400}>
            <View style={styles.sectionHeaderNoLink}>
              <Text style={styles.sectionTitle}>Courses</Text>
              <Text style={styles.sectionSubtitle}>Multi-day meditation programs</Text>
            </View>
          </AnimatedView>

          <AnimatedView delay={150} duration={400}>
            {loading ? (
              renderSkeletonCards(3)
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsScroll}
              >
                {courses.map((course) => (
                  <ContentCard
                    key={course.id}
                    title={course.title}
                    thumbnailUrl={course.thumbnailUrl}
                    fallbackIcon="school"
                    fallbackColor={course.color}
                    meta={`${course.sessionCount} sessions`}
                    onPress={() => handleCoursePress(course)}
                  />
                ))}
              </ScrollView>
            )}
          </AnimatedView>
        </View>

        {/* Browse by Theme */}
        <View style={styles.section}>
          <AnimatedView delay={200} duration={400}>
            <AnimatedPressable
              onPress={() => router.push('/meditations')}
              style={styles.sectionHeader}
            >
              <Text style={styles.sectionTitle}>Browse by Theme</Text>
              <View style={styles.seeAllContainer}>
                <Text style={styles.seeAllText}>See all</Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={theme.colors.primary}
                />
              </View>
            </AnimatedPressable>
          </AnimatedView>

          <AnimatedView delay={250} duration={400}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardsScroll}
            >
              {themeCategories.map((cat) => (
                <AnimatedPressable
                  key={cat.id}
                  onPress={() => handleThemePress(cat.id)}
                  style={styles.themeCard}
                >
                  <View
                style={[
                      styles.themeIconContainer,
                      { backgroundColor: `${cat.color}20` },
                ]}
              >
                    <Ionicons name={cat.icon} size={24} color={cat.color} />
                  </View>
                <Text style={styles.themeLabel}>{cat.label}</Text>
                </AnimatedPressable>
              ))}
            </ScrollView>
              </AnimatedView>
        </View>

        {/* Browse by Therapies */}
        <View style={styles.section}>
          <AnimatedView delay={300} duration={400}>
            <AnimatedPressable
              onPress={() => router.push('/meditations/therapies')}
              style={styles.sectionHeader}
            >
              <Text style={styles.sectionTitle}>Browse by Therapies</Text>
              <View style={styles.seeAllContainer}>
                <Text style={styles.seeAllText}>See all</Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={theme.colors.primary}
                />
              </View>
            </AnimatedPressable>
          </AnimatedView>

          <AnimatedView delay={350} duration={400}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardsScroll}
            >
              {therapyCategories.map((therapy) => (
                <AnimatedPressable
                  key={therapy.id}
                  onPress={() => handleTherapyPress(therapy.id)}
                  style={styles.therapyCard}
                >
                  <View
                    style={[
                      styles.therapyIconContainer,
                      { backgroundColor: `${therapy.color}20` },
                    ]}
                  >
                    <Ionicons name={therapy.icon} size={22} color={therapy.color} />
                  </View>
                  <Text style={styles.therapyLabel}>{therapy.label}</Text>
                  <Text style={styles.therapySubLabel} numberOfLines={1}>{therapy.fullName}</Text>
                </AnimatedPressable>
              ))}
            </ScrollView>
          </AnimatedView>
        </View>

        {/* Emergency */}
        <View style={styles.section}>
          <AnimatedView delay={400} duration={400}>
            <View style={styles.sectionHeaderNoLink}>
              <View style={styles.emergencyTitleRow}>
                <Ionicons name="flash" size={20} color="#E57373" />
                <Text style={styles.sectionTitle}>Emergency</Text>
            </View>
              <Text style={styles.sectionSubtitle}>Quick relief in 1-3 minutes</Text>
            </View>
            </AnimatedView>

          <AnimatedView delay={450} duration={400}>
            {loading ? (
              renderSkeletonCards(3)
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsScroll}
              >
                {emergencyMeditations.map((meditation) => (
                  <ContentCard
                    key={meditation.id}
                    title={meditation.title}
                    thumbnailUrl={meditation.thumbnailUrl}
                    fallbackIcon={meditation.icon as keyof typeof Ionicons.glyphMap}
                    fallbackColor={meditation.color}
                    meta={`${meditation.duration_minutes} min`}
                    onPress={() => handleEmergencyPress(meditation)}
                  />
                ))}
              </ScrollView>
            )}
          </AnimatedView>
        </View>

        {/* Browse by Techniques */}
        <View style={styles.section}>
          <AnimatedView delay={500} duration={400}>
            <AnimatedPressable
              onPress={() => router.push('/meditations/techniques')}
              style={styles.sectionHeader}
            >
              <Text style={styles.sectionTitle}>Browse by Techniques</Text>
              <View style={styles.seeAllContainer}>
                <Text style={styles.seeAllText}>See all</Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={theme.colors.primary}
                />
                    </View>
                  </AnimatedPressable>
                </AnimatedView>

          <AnimatedView delay={550} duration={400}>
            {loading ? (
              renderSkeletonCards(3)
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsScroll}
              >
                {techniques.map((technique) => (
                  <ContentCard
                    key={technique.id}
                    title={technique.title}
                    thumbnailUrl={technique.thumbnailUrl}
                    fallbackIcon={technique.icon as keyof typeof Ionicons.glyphMap}
                    fallbackColor={technique.color}
                    meta={technique.description}
                    onPress={() => handleTechniquePress(technique)}
                  />
                ))}
              </ScrollView>
            )}
          </AnimatedView>
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
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    sectionHeaderNoLink: {
    paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    emergencyTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
  },
  sectionTitle: {
    fontFamily: theme.fonts.ui.semiBold,
      fontSize: 18,
    color: theme.colors.text,
    },
    sectionSubtitle: {
      fontFamily: theme.fonts.ui.regular,
    fontSize: 13,
    color: theme.colors.textLight,
      marginTop: 4,
    },
    seeAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
      gap: 4,
  },
    seeAllText: {
    fontFamily: theme.fonts.ui.medium,
    fontSize: 14,
    color: theme.colors.primary,
  },
    cardsScroll: {
      paddingHorizontal: theme.spacing.lg,
      gap: theme.spacing.md,
  },
  themeCard: {
      width: 100,
    backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xl,
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing.sm,
    alignItems: 'center',
    ...theme.shadows.sm,
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
  therapyCard: {
    width: 120,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  therapyIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  therapyLabel: {
    fontFamily: theme.fonts.ui.semiBold,
    fontSize: 14,
    color: theme.colors.text,
    textAlign: 'center',
  },
  therapySubLabel: {
    fontFamily: theme.fonts.ui.regular,
    fontSize: 10,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: 2,
    paddingHorizontal: 4,
  },
});

export default function Meditate() {
  return (
    <ProtectedRoute>
      <MeditateScreen />
    </ProtectedRoute>
  );
}
