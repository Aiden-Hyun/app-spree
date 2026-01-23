import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
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
import { getAudioUrlFromPath } from '../../src/constants/audioFiles';
import {
  addToListeningHistory,
  getSleepSounds,
  getWhiteNoise,
  getMusic,
  getAsmr,
  FirestoreSleepSound,
  FirestoreMusicItem,
  createSession,
} from '../../src/services/firestoreService';
import { Theme } from '../../src/theme';

type SoundData = FirestoreSleepSound | FirestoreMusicItem;

const DEFAULT_TIMER_MINUTES = 45;

function SoundPlayerScreen() {
  const { id, category } = useLocalSearchParams<{ id: string; category?: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { user, isAnonymous } = useAuth();
  
  const [sound, setSound] = useState<SoundData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timerMinutes, setTimerMinutes] = useState<number | null>(DEFAULT_TIMER_MINUTES);
  const [remainingSeconds, setRemainingSeconds] = useState(DEFAULT_TIMER_MINUTES * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [hasTrackedPlay, setHasTrackedPlay] = useState(false);
  const [hasTrackedSession, setHasTrackedSession] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayer = useAudioPlayer();
  
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Fetch sound data from Firestore based on id
  useEffect(() => {
    async function fetchSound() {
      if (!id) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        // Fetch all sound sources from Firestore
        const [sleepSounds, whiteNoise, music, asmr] = await Promise.all([
          getSleepSounds(),
          getWhiteNoise(),
          getMusic(),
          getAsmr(),
        ]);
    
    // Search in all data sources
        const allSounds: SoundData[] = [
          ...sleepSounds,
          ...whiteNoise,
          ...music,
          ...asmr,
    ];
    
        const foundSound = allSounds.find((s) => s.id === id);
    
    if (foundSound) {
      setSound(foundSound);
    }
      } catch (error) {
        console.error('Error fetching sound:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchSound();
  }, [id]);

  // Load audio when sound is found
  useEffect(() => {
    async function loadSoundAudio() {
      if (!sound?.audioPath) return;
      
      const audioUrl = await getAudioUrlFromPath(sound.audioPath);
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

  const handleTimerEnd = useCallback(async () => {
    setIsTimerRunning(false);
    audioPlayer.pause();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Track session when timer ends (user completed their intended listening)
    if (!hasTrackedSession && user && timerMinutes && timerMinutes >= 5) {
      setHasTrackedSession(true);
      try {
        await createSession({
          user_id: user.uid,
          duration_minutes: timerMinutes,
          session_type: 'music',
        });
      } catch (error) {
        console.error('Failed to track session:', error);
      }
    }
  }, [audioPlayer, hasTrackedSession, user, timerMinutes]);

  const handlePlay = useCallback(async () => {
    audioPlayer.play();
    if (timerMinutes !== null) {
      setIsTimerRunning(true);
    }
    
    // Track listening history on first play
    if (!hasTrackedPlay && user && sound && id && !isAnonymous) {
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

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={theme.gradients.sleepyNight as [string, string]}
          style={styles.gradient}
        >
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.sleepText} />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    loadingText: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 16,
      color: theme.colors.sleepText,
    },
  });

export default function SoundPlayerPage() {
  return (
    <ProtectedRoute>
      <SoundPlayerScreen />
    </ProtectedRoute>
  );
}

