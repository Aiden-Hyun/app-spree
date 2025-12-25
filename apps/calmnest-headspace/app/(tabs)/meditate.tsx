import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import { AnimatedView } from '../../src/components/AnimatedView';
import { AnimatedPressable } from '../../src/components/AnimatedPressable';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Theme } from '../../src/theme';
import { emergencyMeditationsData, EmergencyMeditation } from '../../src/constants/emergencyMeditationsData';
import { techniquesData, MeditationTechnique } from '../../src/constants/techniquesData';
import { coursesData, Course } from '../../src/constants/coursesData';

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
  const { theme, isDark } = useTheme();

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const handleThemePress = (categoryId: string) => {
    router.push({
      pathname: '/meditations',
      params: { category: categoryId },
    });
  };

  const handleEmergencyPress = (meditation: EmergencyMeditation) => {
    // TODO: Navigate to quick meditation player
    console.log('Play emergency meditation:', meditation.id);
  };

  const handleTechniquePress = (technique: MeditationTechnique) => {
    router.push({
      pathname: '/meditations/techniques',
      params: { technique: technique.id },
    });
  };

  const handleCoursePress = (course: Course) => {
    router.push(`/course/${course.id}`);
  };

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
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {coursesData.map((course) => (
                <AnimatedPressable
                  key={course.id}
                  onPress={() => handleCoursePress(course)}
                  style={styles.courseCard}
                >
                  <View
                    style={[
                      styles.courseIconContainer,
                      { backgroundColor: `${course.color}20` },
                    ]}
                  >
                    <Ionicons name="school" size={28} color={course.color} />
                  </View>
                  <Text style={styles.courseTitle} numberOfLines={2}>
                    {course.title}
                  </Text>
                  <View style={styles.courseMeta}>
                    <Text style={styles.courseMetaText}>
                      {course.sessionCount} sessions
                    </Text>
                  </View>
                </AnimatedPressable>
              ))}
            </ScrollView>
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
              contentContainerStyle={styles.horizontalScroll}
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

        {/* Emergency */}
        <View style={styles.section}>
          <AnimatedView delay={300} duration={400}>
            <View style={styles.sectionHeaderNoLink}>
              <View style={styles.emergencyTitleRow}>
                <Ionicons name="flash" size={20} color="#E57373" />
                <Text style={styles.sectionTitle}>Emergency</Text>
              </View>
              <Text style={styles.sectionSubtitle}>Quick relief in 1-3 minutes</Text>
            </View>
          </AnimatedView>

          <AnimatedView delay={350} duration={400}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {emergencyMeditationsData.map((meditation) => (
                <AnimatedPressable
                  key={meditation.id}
                  onPress={() => handleEmergencyPress(meditation)}
                  style={styles.emergencyCard}
                >
                  <View
                    style={[
                      styles.emergencyIconContainer,
                      { backgroundColor: `${meditation.color}20` },
                    ]}
                  >
                    <Ionicons
                      name={meditation.icon as keyof typeof Ionicons.glyphMap}
                      size={28}
                      color={meditation.color}
                    />
                  </View>
                  <Text style={styles.emergencyTitle} numberOfLines={1}>
                    {meditation.title}
                  </Text>
                  <Text style={styles.emergencyDescription} numberOfLines={1}>
                    {meditation.description}
                  </Text>
                  <View style={styles.emergencyDuration}>
                    <Ionicons name="time-outline" size={12} color={theme.colors.textMuted} />
                    <Text style={styles.emergencyDurationText}>
                      {meditation.duration_minutes} min
                    </Text>
                  </View>
                </AnimatedPressable>
              ))}
            </ScrollView>
          </AnimatedView>
        </View>

        {/* Browse by Techniques */}
        <View style={styles.section}>
          <AnimatedView delay={400} duration={400}>
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

          <AnimatedView delay={450} duration={400}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {techniquesData.map((technique) => (
                <AnimatedPressable
                  key={technique.id}
                  onPress={() => handleTechniquePress(technique)}
                  style={styles.techniqueCard}
                >
                  <View
                    style={[
                      styles.techniqueIconContainer,
                      { backgroundColor: `${technique.color}20` },
                    ]}
                  >
                    <Ionicons
                      name={technique.icon as keyof typeof Ionicons.glyphMap}
                      size={28}
                      color={technique.color}
                    />
                  </View>
                  <Text style={styles.techniqueTitle} numberOfLines={2}>
                    {technique.title}
                  </Text>
                  <Text style={styles.techniqueDescription} numberOfLines={1}>
                    {technique.description}
                  </Text>
                </AnimatedPressable>
              ))}
            </ScrollView>
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
    horizontalScroll: {
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
    emergencyCard: {
      width: 140,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.md,
      alignItems: 'center',
      ...theme.shadows.sm,
    },
    emergencyIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.sm,
    },
    emergencyTitle: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 14,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    emergencyDescription: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 12,
      color: theme.colors.textLight,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    emergencyDuration: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    emergencyDurationText: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 11,
      color: theme.colors.textMuted,
    },
    techniqueCard: {
      width: 130,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.md,
      alignItems: 'center',
      ...theme.shadows.sm,
    },
    techniqueIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.sm,
    },
    techniqueTitle: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 14,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    techniqueDescription: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 12,
      color: theme.colors.textLight,
      textAlign: 'center',
    },
    courseCard: {
      width: 150,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.md,
      alignItems: 'center',
      ...theme.shadows.sm,
    },
    courseIconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.sm,
    },
    courseTitle: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 14,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    courseMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    courseMetaText: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 12,
      color: theme.colors.textLight,
    },
  });

export default function Meditate() {
  return (
    <ProtectedRoute>
      <MeditateScreen />
    </ProtectedRoute>
  );
}
