import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@core/providers/contexts/ThemeContext";
import { Theme } from "@/theme";
import { AnimatedView } from "@shared/ui/AnimatedView";
import { AnimatedPressable } from "@shared/ui/AnimatedPressable";
import { Skeleton } from "@shared/ui/Skeleton";
import { getCourses, getSubjects, FirestoreCourse, Subject } from '@/features/meditate/data/meditateRepository';

// "All" is always prepended; actual therapy subjects come from Firestore
const ALL_CATEGORY = {
  id: "all",
  label: "All",
  fullName: "All Therapies",
  icon: "apps-outline" as const,
  color: "#6B7280",
};

type TherapyCategory = typeof ALL_CATEGORY | Subject;

export default function TherapiesScreen() {
  const router = useRouter();
  const { therapy: initialTherapy } = useLocalSearchParams<{
    therapy?: string;
  }>();
  const { theme, isDark } = useTheme();
  const [selectedTherapy, setSelectedTherapy] = useState(
    (initialTherapy || "all").toLowerCase(),
  );
  const [courses, setCourses] = useState<FirestoreCourse[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  // Combine "All" with Firestore subjects for the filter pills
  const therapyCategories = useMemo<TherapyCategory[]>(
    () => [ALL_CATEGORY, ...subjects],
    [subjects]
  );

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [coursesData, subjectsData] = await Promise.all([
        getCourses(),
        getSubjects(),
      ]);
      setCourses(coursesData);
      setSubjects(subjectsData);
      setLoading(false);
    }
    loadData();
  }, []);

  // Filter courses by actual subject metadata so generated subject catalogs stay grouped correctly.
  const filteredCourses = useMemo(() => {
    const normalizedSelectedTherapy = String(selectedTherapy || "").trim().toLowerCase();
    if (normalizedSelectedTherapy === "all") return courses;
    return courses.filter(
      (course) =>
        String(course.subjectId || "").trim().toLowerCase() === normalizedSelectedTherapy ||
        String(course.subjectLabel || "").trim().toLowerCase() === normalizedSelectedTherapy,
    );
  }, [courses, selectedTherapy]);

  const selectedTherapyData = therapyCategories.find(
    (t: { id: string }) =>
      String(t.id || "").trim().toLowerCase() ===
      String(selectedTherapy || "").trim().toLowerCase(),
  );

  const therapyHeader = (
    <>
      {selectedTherapyData && selectedTherapy !== "all" && (
        <AnimatedView delay={0} duration={300}>
          <View
            style={[
              styles.therapyInfoCard,
              { backgroundColor: `${selectedTherapyData.color}15` },
            ]}
          >
            <View
              style={[
                styles.therapyInfoIcon,
                { backgroundColor: `${selectedTherapyData.color}25` },
              ]}
            >
              <Ionicons
                name={selectedTherapyData.icon as keyof typeof Ionicons.glyphMap}
                size={28}
                color={selectedTherapyData.color}
              />
            </View>
            <View style={styles.therapyInfoContent}>
              <Text style={styles.therapyInfoTitle}>
                {selectedTherapyData.fullName}
              </Text>
              <Text style={styles.therapyInfoDescription}>
                {(selectedTherapyData as Subject)?.description || ""}
              </Text>
            </View>
          </View>
        </AnimatedView>
      )}

      <AnimatedView delay={100} duration={400}>
        <Text style={styles.sectionTitle}>
          {selectedTherapy === "all"
            ? "All Courses"
            : `${selectedTherapyData?.label} Courses`}
        </Text>
      </AnimatedView>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Browse by Therapies</Text>
          <Text style={styles.subtitle}>
            Evidence-based therapeutic approaches
          </Text>
        </View>
      </View>

      {/* Therapy Filter Pills */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={therapyCategories}
          keyExtractor={(therapy) => therapy.id}
          renderItem={({ item: therapy }) => (
            <TouchableOpacity
              style={[
                styles.filterPill,
                String(selectedTherapy || "").trim().toLowerCase() ===
                  String(therapy.id || "").trim().toLowerCase() && {
                  backgroundColor: therapy.color,
                },
              ]}
              onPress={() =>
                setSelectedTherapy(String(therapy.id || "").trim().toLowerCase())
              }
            >
              <Ionicons
                name={therapy.icon as keyof typeof Ionicons.glyphMap}
                size={16}
                color={
                  String(selectedTherapy || "").trim().toLowerCase() ===
                  String(therapy.id || "").trim().toLowerCase()
                    ? "white"
                    : therapy.color
                }
              />
              <Text
                style={[
                  styles.filterPillText,
                  String(selectedTherapy || "").trim().toLowerCase() ===
                    String(therapy.id || "").trim().toLowerCase() &&
                    styles.filterPillTextActive,
                ]}
              >
                {therapy.label}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
          ItemSeparatorComponent={() => <View style={styles.filterSeparator} />}
          extraData={selectedTherapy}
        />
      </View>

      {loading ? (
        <View style={[styles.content, styles.contentContainer]}>
          {therapyHeader}
          <View style={styles.skeletonContainer}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.skeletonCard}>
                <Skeleton
                  width="100%"
                  height={140}
                  style={{ borderRadius: theme.borderRadius.lg }}
                />
                <Skeleton width="80%" height={16} style={{ marginTop: 12 }} />
                <Skeleton width="50%" height={12} style={{ marginTop: 8 }} />
              </View>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          style={styles.content}
          data={filteredCourses}
          keyExtractor={(course) => course.id}
          renderItem={({ item: course }) => (
            <AnimatedPressable
              onPress={() => router.push(`/course/${course.id}`)}
              style={styles.courseCard}
              animated={false}
            >
              {course.thumbnailUrl ? (
                <Image
                  source={{ uri: course.thumbnailUrl }}
                  style={styles.courseImage}
                />
              ) : (
                <View
                  style={[
                    styles.courseImagePlaceholder,
                    { backgroundColor: `${course.color}20` },
                  ]}
                >
                  <Ionicons name="school" size={24} color={course.color} />
                </View>
              )}
              <View style={styles.courseInfo}>
                {course.code && (
                  <View
                    style={[
                      styles.courseCodeBadge,
                      { backgroundColor: `${course.color}20` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.courseCodeText,
                        { color: course.color },
                      ]}
                    >
                      {course.code}
                    </Text>
                  </View>
                )}
                <Text style={styles.courseTitle}>{course.title}</Text>
                <View style={styles.courseMetaRow}>
                  <View style={styles.courseMetaItem}>
                    <Ionicons
                      name="library-outline"
                      size={12}
                      color={theme.colors.textMuted}
                    />
                    <Text style={styles.courseMeta}>
                      {course.sessionCount} sessions
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.courseChevron}>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.colors.textMuted}
                />
              </View>
            </AnimatedPressable>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
          ListHeaderComponent={therapyHeader}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons
                name="search-outline"
                size={48}
                color={theme.colors.textLight}
              />
              <Text style={styles.emptyTitle}>No courses yet</Text>
              <Text style={styles.emptySubtitle}>
                {selectedTherapy === "all"
                  ? "Courses will appear here once added."
                  : `No ${selectedTherapyData?.label} courses available yet.`}
              </Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.courseSeparator} />}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={7}
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
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.surface,
    },
    headerContent: {
      flex: 1,
    },
    title: {
      fontFamily: theme.fonts.display.semiBold,
      fontSize: 22,
      color: theme.colors.text,
    },
    subtitle: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 13,
      color: theme.colors.textLight,
      marginTop: 2,
    },
    filterContainer: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.gray[200],
    },
    filterScroll: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    filterSeparator: {
      width: theme.spacing.sm,
    },
    filterPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.gray[200],
    },
    filterPillText: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 13,
      color: theme.colors.text,
    },
    filterPillTextActive: {
      color: "white",
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
    },
    therapyInfoCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.xl,
      marginBottom: theme.spacing.xl,
      gap: theme.spacing.md,
    },
    therapyInfoIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
    },
    therapyInfoContent: {
      flex: 1,
    },
    therapyInfoTitle: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 16,
      color: theme.colors.text,
      marginBottom: 4,
    },
    therapyInfoDescription: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 13,
      color: theme.colors.textLight,
      lineHeight: 18,
    },
    sectionTitle: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 18,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    skeletonContainer: {
      gap: theme.spacing.md,
    },
    skeletonCard: {
      marginBottom: theme.spacing.md,
    },
    courseSeparator: {
      height: theme.spacing.sm,
    },
    courseCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.md,
      ...theme.shadows.sm,
    },
    courseImage: {
      width: 64,
      height: 64,
      borderRadius: 12,
    },
    courseImagePlaceholder: {
      width: 64,
      height: 64,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    courseInfo: {
      flex: 1,
      marginLeft: theme.spacing.md,
    },
    courseCodeBadge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.full,
      alignSelf: "flex-start",
      marginBottom: 4,
    },
    courseCodeText: {
      fontFamily: theme.fonts.ui.bold,
      fontSize: 10,
      letterSpacing: 0.5,
    },
    courseTitle: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 15,
      color: theme.colors.text,
      marginBottom: 6,
      flexWrap: "wrap",
    },
    courseMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
    },
    courseMetaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    courseMeta: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    courseChevron: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.gray[100],
      alignItems: "center",
      justifyContent: "center",
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: theme.spacing.xxl,
    },
    emptyTitle: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 18,
      color: theme.colors.text,
      marginTop: theme.spacing.md,
    },
    emptySubtitle: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 14,
      color: theme.colors.textLight,
      textAlign: "center",
      marginTop: theme.spacing.sm,
      paddingHorizontal: theme.spacing.xl,
    },
  });
