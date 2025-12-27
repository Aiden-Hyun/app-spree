import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import { AnimatedPressable } from '../../src/components/AnimatedPressable';
import { SoundPlayer } from '../../src/components/SoundPlayer';
import { useAudioPlayer } from '../../src/hooks/useAudioPlayer';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { getAudioUrl } from '../../src/constants/audioFiles';
import { addToListeningHistory } from '../../src/services/firestoreService';
import { sleepSoundsData, SleepSound } from '../../src/constants/sleepSoundsData';
import { whiteNoiseData, musicData, asmrData, MusicItem } from '../../src/constants/musicData';
import { Theme } from '../../src/theme';

type SoundData = SleepSound | MusicItem;

const DEFAULT_TIMER_MINUTES = 45;

function SoundPlayerScreen() {
  const { id, category } = useLocalSearchParams<{ id: string; category?: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [sound, setSound] = useState<SoundData | null>(null);
  const [timerMinutes, setTimerMinutes] = useState<number | null>(DEFAULT_TIMER_MINUTES);
  const [remainingSeconds, setRemainingSeconds] = useState(DEFAULT_TIMER_MINUTES * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [hasTrackedPlay, setHasTrackedPlay] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayer = useAudioPlayer();
  
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Find the sound data based on id and category
  useEffect(() => {
    if (!id) return;
    
    let foundSound: SoundData | undefined;
    
    // Search in all data sources
    const allSounds = [
      ...sleepSoundsData,
      ...whiteNoiseData,
      ...musicData,
      ...asmrData,
    ];
    
    foundSound = allSounds.find((s) => s.id === id);
    
    if (foundSound) {
      setSound(foundSound);
    }
  }, [id, category]);

  // Load audio when sound is found
  useEffect(() => {
    async function loadSoundAudio() {
      if (!sound) return;
      
      const audioUrl = await getAudioUrl(sound.audioKey);
      if (audioUrl) {
        await audioPlayer.loadAudio(audioUrl);
        // Enable looping by default for ambient sounds
        audioPlayer.setLoop(true);
      }
    }
    
    loadSoundAudio();
  }, [sound]);

  // Timer logic
  useEffect(() => {
    if (isTimerRunning && timerMinutes !== null && remainingSeconds > 0) {
      timerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            // Timer ended
            handleTimerEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isTimerRunning, timerMinutes]);

  const handleTimerEnd = useCallback(() => {
    setIsTimerRunning(false);
    audioPlayer.pause();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [audioPlayer]);

  const handlePlay = useCallback(async () => {
    audioPlayer.play();
    if (timerMinutes !== null) {
      setIsTimerRunning(true);
    }
    
    // Track listening history on first play
    if (!hasTrackedPlay && user && sound && id) {
      setHasTrackedPlay(true);
      await addToListeningHistory(
        user.uid,
        id,
        'nature_sound',
        sound.title,
        timerMinutes || 30, // Use timer duration or default
        undefined
      );
    }
  }, [audioPlayer, timerMinutes, hasTrackedPlay, user, sound, id]);

  const handlePause = useCallback(() => {
    audioPlayer.pause();
    setIsTimerRunning(false);
  }, [audioPlayer]);

  const handleToggleLoop = useCallback(() => {
    audioPlayer.setLoop(!audioPlayer.isLooping);
  }, [audioPlayer]);

  const handleSetTimer = useCallback((minutes: number | null) => {
    setTimerMinutes(minutes);
    if (minutes !== null) {
      setRemainingSeconds(minutes * 60);
      if (audioPlayer.isPlaying) {
        setIsTimerRunning(true);
      }
    } else {
      // No timer - continuous play
      setIsTimerRunning(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [audioPlayer.isPlaying]);

  const handleGoBack = useCallback(() => {
    audioPlayer.cleanup();
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    router.back();
  }, [audioPlayer, router]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioPlayer.cleanup();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  if (!sound) {
    return null;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.gradients.sleepyNight as [string, string]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Back Button */}
          <View style={styles.header}>
            <AnimatedPressable onPress={handleGoBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={theme.colors.sleepText} />
            </AnimatedPressable>
          </View>

          {/* Sound Player */}
          <View style={styles.playerContainer}>
            <SoundPlayer
              isPlaying={audioPlayer.isPlaying}
              isLoading={audioPlayer.isLoading}
              isLooping={audioPlayer.isLooping}
              timerMinutes={timerMinutes}
              remainingSeconds={remainingSeconds}
              onPlay={handlePlay}
              onPause={handlePause}
              onToggleLoop={handleToggleLoop}
              onSetTimer={handleSetTimer}
              title={sound.title}
              description={sound.description}
              iconName={`${sound.icon}-outline`}
              iconColor={sound.color}
            />
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const createStyles = (theme: Theme) =>
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.sleepSurface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playerContainer: {
      flex: 1,
      justifyContent: 'center',
    },
  });

export default function SoundPlayerPage() {
  return (
    <ProtectedRoute>
      <SoundPlayerScreen />
    </ProtectedRoute>
  );
}

