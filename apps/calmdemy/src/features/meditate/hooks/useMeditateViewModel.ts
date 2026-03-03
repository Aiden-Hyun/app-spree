import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTheme } from '@core/providers/contexts/ThemeContext';
import { useSubscription } from '@core/providers/contexts/SubscriptionContext';
import { useCourses, useGuidedMeditations } from '@shared/hooks/queries/useMeditateQueries';
import type { FirestoreCourse } from '../data/meditateRepository';
import type { MeditationTechnique } from '../../../types';
import type { GuidedMeditation } from '../../../types';

export function useMeditateViewModel() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { isPremium: hasSubscription } = useSubscription();

  // Use Query Hook
  const { data: courses = [] } = useCourses();
  const { data: guidedMeditations = [] } = useGuidedMeditations();

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

  const handleGuidedMeditationPress = useCallback((meditation: GuidedMeditation) => {
    if (!meditation.isFree && !hasSubscription) {
      setShowPaywall(true);
      return;
    }
    router.push({
      pathname: '/meditation/[id]',
      params: { id: meditation.id },
    });
  }, [hasSubscription, router]);

  return {
    theme,
    isDark,
    hasSubscription,
    courses,
    guidedMeditations,
    showPaywall,
    setShowPaywall,
    handleThemePress,
    handleTherapyPress,
    handleTechniquePress,
    handleCoursePress,
    handleGuidedMeditationPress,
  };
}
