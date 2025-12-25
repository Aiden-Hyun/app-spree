import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { AnimatedView } from "../../src/components/AnimatedView";
import { AnimatedPressable } from "../../src/components/AnimatedPressable";
import { useTheme } from "../../src/contexts/ThemeContext";
import { Theme } from "../../src/theme";
import { getCourseById, CourseSession } from "../../src/constants/coursesData";

function CourseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, isDark } = useTheme();

  const course = useMemo(() => getCourseById(id || ""), [id]);
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  if (!course) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Course not found</Text>
          <AnimatedPressable
            onPress={() => router.back()}
            style={styles.backLink}
          >
            <Text style={styles.backLinkText}>Go back</Text>
          </AnimatedPressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleSessionPress = (session: CourseSession) => {
    // TODO: Navigate to meditation player with session
    console.log("Play session:", session.id);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={
          isDark
            ? (theme.gradients.sleepyNight as [string, string])
            : [
                `${course.color}30`,
                `${course.color}10`,
                theme.colors.background,
              ]
        }
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Hero Section */}
            <AnimatedView delay={0} duration={400}>
              <View style={styles.heroSection}>
                <View
                  style={[
                    styles.heroIcon,
                    { backgroundColor: `${course.color}25` },
                  ]}
                >
                  <Ionicons name="school" size={48} color={course.color} />
                </View>
                <Text style={styles.courseTitle}>{course.title}</Text>
                <View style={styles.courseMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons
                      name="layers-outline"
                      size={16}
                      color={
                        isDark
                          ? theme.colors.sleepTextMuted
                          : theme.colors.textLight
                      }
                    />
                    <Text style={styles.metaText}>
                      {course.sessionCount} sessions
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={
                        isDark
                          ? theme.colors.sleepTextMuted
                          : theme.colors.textLight
                      }
                    />
                    <Text style={styles.metaText}>
                      {course.totalDuration} min total
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons
                      name="fitness-outline"
                      size={16}
                      color={
                        isDark
                          ? theme.colors.sleepTextMuted
                          : theme.colors.textLight
                      }
                    />
                    <Text style={styles.metaText}>{course.difficulty}</Text>
                  </View>
                </View>
                <Text style={styles.courseDescription}>
                  {course.description}
                </Text>
              </View>
            </AnimatedView>

            {/* Sessions List */}
            <View style={styles.sessionsContainer}>
              <AnimatedView delay={100} duration={400}>
                <Text style={styles.sectionTitle}>Sessions</Text>
              </AnimatedView>

              {course.sessions.map((session, index) => (
                <AnimatedView
                  key={session.id}
                  delay={150 + index * 50}
                  duration={300}
                >
                  <AnimatedPressable
                    onPress={() => handleSessionPress(session)}
                    style={styles.sessionCard}
                  >
                    <View
                      style={[
                        styles.sessionNumber,
                        { backgroundColor: `${course.color}20` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.sessionNumberText,
                          { color: course.color },
                        ]}
                      >
                        {session.dayNumber}
                      </Text>
                    </View>
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionTitle}>{session.title}</Text>
                      <Text style={styles.sessionDescription} numberOfLines={1}>
                        {session.description}
                      </Text>
                      <View style={styles.sessionMeta}>
                        <Ionicons
                          name="time-outline"
                          size={12}
                          color={
                            isDark
                              ? theme.colors.sleepTextMuted
                              : theme.colors.textMuted
                          }
                        />
                        <Text style={styles.sessionMetaText}>
                          {session.duration_minutes} min
                        </Text>
                      </View>
                    </View>
                    <View style={styles.playButton}>
                      <Ionicons name="play" size={20} color={course.color} />
                    </View>
                  </AnimatedPressable>
                </AnimatedView>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      {/* Floating Back Button */}
      <SafeAreaView
        style={styles.backButtonContainer}
        edges={["top"]}
        pointerEvents="box-none"
      >
        <AnimatedPressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={isDark ? theme.colors.sleepText : theme.colors.text}
          />
        </AnimatedPressable>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    gradient: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    backButtonContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
    },
    backButton: {
      marginLeft: theme.spacing.md,
      marginTop: theme.spacing.sm,
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)",
    },
    heroSection: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xxl,
      paddingBottom: theme.spacing.xl,
      alignItems: "center",
    },
    heroIcon: {
      width: 96,
      height: 96,
      borderRadius: 48,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing.lg,
    },
    courseTitle: {
      fontFamily: theme.fonts.display.semiBold,
      fontSize: 28,
      color: isDark ? theme.colors.sleepText : theme.colors.text,
      textAlign: "center",
      marginBottom: theme.spacing.sm,
    },
    courseMeta: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    metaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    metaText: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 13,
      color: isDark ? theme.colors.sleepTextMuted : theme.colors.textLight,
      textTransform: "capitalize",
    },
    courseDescription: {
      fontFamily: theme.fonts.body.regular,
      fontSize: 15,
      color: isDark ? theme.colors.sleepTextMuted : theme.colors.textLight,
      textAlign: "center",
      lineHeight: 22,
      paddingHorizontal: theme.spacing.md,
    },
    sessionsContainer: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
    },
    sectionTitle: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 18,
      color: isDark ? theme.colors.sleepText : theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    sessionCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark
        ? theme.colors.sleepSurface
        : theme.colors.surface,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    sessionNumber: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    sessionNumberText: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 16,
    },
    sessionInfo: {
      flex: 1,
      marginLeft: theme.spacing.md,
    },
    sessionTitle: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 15,
      color: isDark ? theme.colors.sleepText : theme.colors.text,
      marginBottom: 2,
    },
    sessionDescription: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 13,
      color: isDark ? theme.colors.sleepTextMuted : theme.colors.textLight,
      marginBottom: 4,
    },
    sessionMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    sessionMetaText: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 11,
      color: isDark ? theme.colors.sleepTextMuted : theme.colors.textMuted,
    },
    playButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark
        ? `${theme.colors.sleepAccent}20`
        : `${theme.colors.primary}15`,
      alignItems: "center",
      justifyContent: "center",
    },
    errorContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    errorText: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 16,
      color: isDark ? theme.colors.sleepText : theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    backLink: {
      padding: theme.spacing.sm,
    },
    backLinkText: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 14,
      color: theme.colors.primary,
    },
  });

export default function CourseDetail() {
  return (
    <ProtectedRoute>
      <CourseDetailScreen />
    </ProtectedRoute>
  );
}
