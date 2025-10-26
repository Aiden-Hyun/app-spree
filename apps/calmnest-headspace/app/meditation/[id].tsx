import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import { MeditationTimer } from '../../src/components/MeditationTimer';
import { AudioPlayer } from '../../src/components/AudioPlayer';
import { useMeditation } from '../../src/hooks/useMeditation';
import { useAudioPlayer } from '../../src/hooks/useAudioPlayer';
import { theme } from '../../src/theme';
import { GuidedMeditation } from '../../src/types';

function MeditationPlayerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [meditation, setMeditation] = useState<GuidedMeditation | null>(null);
  const [showTimer, setShowTimer] = useState(false);

  const audioPlayer = useAudioPlayer();
  const meditationTimer = useMeditation({
    duration: meditation?.duration_minutes || 10,
    sessionType: 'meditation',
    onComplete: (session) => {
      // TODO: Show completion screen
      console.log('Meditation completed:', session);
    },
  });

  useEffect(() => {
    // Load meditation data (dummy data for now)
    const dummyMeditation: GuidedMeditation = {
      id: id as string,
      title: 'Morning Mindfulness',
      description: 'Start your day with clarity and purpose. This guided meditation will help you set positive intentions and cultivate awareness.',
      duration_minutes: 10,
      audio_url: '', // TODO: Add real audio URL
      category: 'focus',
      difficulty_level: 'beginner',
      instructor: 'Sarah Chen',
      is_premium: false,
      created_at: new Date().toISOString(),
    };
    setMeditation(dummyMeditation);
  }, [id]);

  useEffect(() => {
    if (meditation?.audio_url) {
      audioPlayer.loadAudio(meditation.audio_url);
    }
  }, [meditation]);

  const handlePlayPause = () => {
    if (audioPlayer.isPlaying) {
      audioPlayer.pause();
      if (meditationTimer.isActive && !meditationTimer.isPaused) {
        meditationTimer.pause();
      }
    } else {
      audioPlayer.play();
      if (!meditationTimer.isActive) {
        meditationTimer.start();
      } else if (meditationTimer.isPaused) {
        meditationTimer.resume();
      }
    }
  };

  if (!meditation) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#6c5ce7', '#a29bfe', '#dfe6e9']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.infoContainer}>
            <Text style={styles.title}>{meditation.title}</Text>
            <Text style={styles.instructor}>with {meditation.instructor}</Text>
            <Text style={styles.description}>{meditation.description}</Text>
          </View>

          {/* Toggle between Timer and Audio Player */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, !showTimer && styles.toggleButtonActive]}
              onPress={() => setShowTimer(false)}
            >
              <Text style={[styles.toggleText, !showTimer && styles.toggleTextActive]}>
                Guided
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, showTimer && styles.toggleButtonActive]}
              onPress={() => setShowTimer(true)}
            >
              <Text style={[styles.toggleText, showTimer && styles.toggleTextActive]}>
                Timer
              </Text>
            </TouchableOpacity>
          </View>

          {/* Player/Timer */}
          {showTimer ? (
            <MeditationTimer
              progress={meditationTimer.progress}
              timeRemaining={meditationTimer.formattedTime}
              isActive={meditationTimer.isActive}
              isPaused={meditationTimer.isPaused}
              onStart={meditationTimer.start}
              onPause={meditationTimer.pause}
              onResume={meditationTimer.resume}
              onStop={meditationTimer.stop}
              size={280}
            />
          ) : (
            <View style={styles.playerContainer}>
              <View style={styles.artworkContainer}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                  style={styles.artwork}
                >
                  <Ionicons name="leaf" size={120} color="white" />
                </LinearGradient>
              </View>
              
              <AudioPlayer
                isPlaying={audioPlayer.isPlaying}
                isLoading={audioPlayer.isLoading}
                duration={audioPlayer.duration}
                position={audioPlayer.position}
                progress={audioPlayer.progress}
                formattedPosition={audioPlayer.formattedPosition}
                formattedDuration={audioPlayer.formattedDuration}
                onPlay={handlePlayPause}
                onPause={handlePlayPause}
                onSeek={audioPlayer.seekTo}
              />
            </View>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  instructor: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: theme.spacing.md,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: theme.spacing.xl,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: theme.borderRadius.full,
    padding: 4,
    marginBottom: theme.spacing.xl,
    alignSelf: 'center',
  },
  toggleButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  toggleButtonActive: {
    backgroundColor: 'white',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  toggleTextActive: {
    color: theme.colors.primary,
  },
  playerContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  artworkContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  artwork: {
    width: 240,
    height: 240,
    borderRadius: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default function MeditationPlayer() {
  return (
    <ProtectedRoute>
      <MeditationPlayerScreen />
    </ProtectedRoute>
  );
}
