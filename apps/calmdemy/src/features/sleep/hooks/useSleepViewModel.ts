import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@core/providers/contexts/ThemeContext';
import { useSubscription } from '@core/providers/contexts/SubscriptionContext';
import {
  useBedtimeStories,
  useSleepMeditations,
  useSeries,
} from '@shared/hooks/queries/useSleepQueries';
import type { FirestoreSleepMeditation, FirestoreSeries } from '../data/sleepRepository';
import type { BedtimeStory } from '../../../types';

export function useSleepViewModel() {
  const router = useRouter();
  const { theme } = useTheme();
  const { isPremium: hasSubscription } = useSubscription();

  // Use Query Hooks
  const { data: bedtimeStories = [] } = useBedtimeStories();
  const { data: sleepMeditations = [] } = useSleepMeditations();
  const { data: series = [] } = useSeries();

  const [showPaywall, setShowPaywall] = useState(false);

  const getTimeGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour >= 21 || hour < 5) return 'Sweet dreams await';
    if (hour >= 17) return 'Wind down and relax';
    return 'Rest when you need it';
  }, []);

  const getCategoryIcon = useCallback((category: string): keyof typeof Ionicons.glyphMap => {
    switch (category) {
      case 'nature':
        return 'leaf';
      case 'fantasy':
        return 'planet';
      case 'travel':
        return 'airplane';
      case 'thriller':
        return 'skull';
      case 'fiction':
        return 'book';
      default:
        return 'book';
    }
  }, []);

  const handleSeriesPress = useCallback((seriesItem: FirestoreSeries) => {
    router.push(`/series/${seriesItem.id}`);
  }, [router]);

  const handleStoryPress = useCallback((story: BedtimeStory) => {
    if (story.is_premium && !hasSubscription) {
      setShowPaywall(true);
      return;
    }
    router.push(`/sleep/${story.id}`);
  }, [hasSubscription, router]);

  const handleMeditationPress = useCallback((meditation: FirestoreSleepMeditation) => {
    if (!meditation.isFree && !hasSubscription) {
      setShowPaywall(true);
      return;
    }
    router.push(`/sleep/meditation/${meditation.id}`);
  }, [hasSubscription, router]);

  const navigateToBedtimeStories = useCallback(() => {
    router.push('/sleep/bedtime-stories');
  }, [router]);

  const navigateToSleepMeditations = useCallback(() => {
    router.push('/sleep/sleep-meditations');
  }, [router]);

  return {
    theme,
    hasSubscription,
    bedtimeStories,
    sleepMeditations,
    series,
    showPaywall,
    setShowPaywall,
    getTimeGreeting,
    getCategoryIcon,
    handleSeriesPress,
    handleStoryPress,
    handleMeditationPress,
    navigateToBedtimeStories,
    navigateToSleepMeditations,
  };
}
