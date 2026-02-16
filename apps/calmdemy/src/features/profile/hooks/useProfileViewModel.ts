import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@core/providers/contexts/AuthContext';
import { useTheme } from '@core/providers/contexts/ThemeContext';
import { useSubscription } from '@core/providers/contexts/SubscriptionContext';
import { useStats } from '@shared/hooks/useStats';

const guestAdjectives = [
  'Calm', 'Peaceful', 'Serene', 'Gentle', 'Mindful', 'Tranquil', 'Zen',
  'Cozy', 'Dreamy', 'Blissful', 'Mellow', 'Quiet', 'Still', 'Soft',
  'Happy', 'Bright', 'Sunny', 'Warm', 'Kind', 'Sweet', 'Lovely',
];

const guestAnimals = [
  'Panda', 'Koala', 'Bunny', 'Owl', 'Fox', 'Bear', 'Deer', 'Dove',
  'Swan', 'Cloud', 'Moon', 'Star', 'Wave', 'Breeze', 'Leaf', 'Lotus',
  'Butterfly', 'Dolphin', 'Seal', 'Otter', 'Sloth', 'Cat', 'Penguin',
];

export function useProfileViewModel() {
  const router = useRouter();
  const { user, logout, isAnonymous } = useAuth();
  const { theme, isDark } = useTheme();
  const { stats, loading } = useStats();
  const { isPremium } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);

  const avatarGradient = theme.gradients.sage as [string, string];

  const generateGuestNickname = useCallback((uid: string): string => {
    const hash = uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const adjIndex = hash % guestAdjectives.length;
    const animalIndex = (hash * 7) % guestAnimals.length;
    return `${guestAdjectives[adjIndex]} ${guestAnimals[animalIndex]}`;
  }, []);

  const displayName = useMemo(() => {
    const directName =
      user?.displayName ||
      user?.providerData?.find((provider) => provider.displayName)?.displayName;
    if (directName) return directName;

    const emailPrefix = user?.email?.split('@')[0];
    if (emailPrefix) return emailPrefix;

    if (isAnonymous && user?.uid) {
      return generateGuestNickname(user.uid);
    }

    return 'Friend';
  }, [user, isAnonymous, generateGuestNickname]);

  const avatarInitial = useMemo(() => {
    if (user?.email) return user.email.charAt(0).toUpperCase();
    if (isAnonymous && user?.uid) {
      const nickname = generateGuestNickname(user.uid);
      return nickname.charAt(0);
    }
    return 'G';
  }, [user, isAnonymous, generateGuestNickname]);

  const formatTime = useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }, []);

  const getMemberSince = useCallback(() => {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
  }, []);

  const getNextMilestone = useCallback((milestones: { days: number; label: string }[]) => {
    const longestStreak = stats?.longest_streak || 0;
    return milestones.find((m) => longestStreak < m.days);
  }, [stats?.longest_streak]);

  const navigateToStats = useCallback(() => {
    router.push('/stats');
  }, [router]);

  const navigateToDownloads = useCallback(() => {
    router.push('/downloads');
  }, [router]);

  const navigateToSettings = useCallback(() => {
    router.push('/settings');
  }, [router]);

  const navigateToAdmin = useCallback(() => {
    router.push('/admin');
  }, [router]);

  const navigateToLogin = useCallback(() => {
    router.push(isPremium ? '/login?mode=link' : '/login');
  }, [router, isPremium]);

  const openPaywall = useCallback(() => {
    setShowPaywall(true);
  }, []);

  return {
    theme,
    isDark,
    isAnonymous,
    isPremium,
    stats,
    loading,
    showPaywall,
    setShowPaywall,
    logout,
    avatarGradient,
    displayName,
    avatarInitial,
    formatTime,
    getMemberSince,
    getNextMilestone,
    navigateToStats,
    navigateToDownloads,
    navigateToSettings,
    navigateToAdmin,
    navigateToLogin,
    openPaywall,
  };
}
