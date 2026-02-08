import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@core/providers/contexts/ThemeContext';
import { useSubscription } from '@core/providers/contexts/SubscriptionContext';
import { useMusicContent } from './useMusicContent';
import type { FirestoreSleepSound, FirestoreMusicItem, FirestoreAlbum } from '../data/musicRepository';

export function useMusicViewModel() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { isPremium: hasSubscription } = useSubscription();
  const { musicContent } = useMusicContent();

  const sleepSounds = musicContent.sleepSounds;
  const whiteNoise = musicContent.whiteNoise;
  const music = musicContent.music;
  const asmr = musicContent.asmr;
  const albums = musicContent.albums;

  const [showPaywall, setShowPaywall] = useState(false);

  const handleSoundPress = useCallback((sound: FirestoreMusicItem | FirestoreSleepSound) => {
    if (!sound.isFree && !hasSubscription) {
      setShowPaywall(true);
      return;
    }
    router.push(`/music/${sound.id}`);
  }, [hasSubscription, router]);

  const handleAlbumPress = useCallback((album: FirestoreAlbum) => {
    router.push(`/album/${album.id}`);
  }, [router]);

  const getCategoryIcon = useCallback((category: string): keyof typeof Ionicons.glyphMap => {
    switch (category) {
      case 'ambient':
        return 'planet';
      case 'piano':
        return 'musical-notes';
      case 'nature':
        return 'leaf';
      case 'classical':
        return 'musical-note';
      case 'lofi':
        return 'headset';
      default:
        return 'disc';
    }
  }, []);

  const navigateToRoute = useCallback((route: string) => {
    router.push(route as any);
  }, [router]);

  return {
    theme,
    isDark,
    sleepSounds,
    whiteNoise,
    music,
    asmr,
    albums,
    showPaywall,
    setShowPaywall,
    handleSoundPress,
    handleAlbumPress,
    getCategoryIcon,
    navigateToRoute,
  };
}
