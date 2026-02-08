import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTheme } from '@core/providers/contexts/ThemeContext';
import { useMeditateContent } from './useMeditateContent';
import type { FirestoreCourse } from '../data/meditateRepository';
import type { MeditationTechnique } from '../../../types';

export function useMeditateViewModel() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { meditateContent } = useMeditateContent();

  const courses = meditateContent.courses;

  const [showPaywall, setShowPaywall] = useState(false);

  const handleThemePress = useCallback((categoryId: string) => {
    router.push({
      pathname: '/meditations',
      params: { category: categoryId },
    });
  }, [router]);

  const handleTherapyPress = useCallback((therapyId: string) => {
    router.push({
      pathname: '/meditations/therapies',
      params: { therapy: therapyId },
    });
  }, [router]);

  const handleTechniquePress = useCallback((techniqueId: MeditationTechnique) => {
    router.push({
      pathname: '/meditations/techniques',
      params: { technique: techniqueId },
    });
  }, [router]);

  const handleCoursePress = useCallback((course: FirestoreCourse) => {
    router.push(`/course/${course.id}`);
  }, [router]);

  return {
    theme,
    isDark,
    courses,
    showPaywall,
    setShowPaywall,
    handleThemePress,
    handleTherapyPress,
    handleTechniquePress,
    handleCoursePress,
  };
}
