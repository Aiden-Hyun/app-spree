import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import { AnimatedView } from '../../src/components/AnimatedView';
import { AnimatedPressable } from '../../src/components/AnimatedPressable';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Theme } from '../../src/theme';
import { getAlbumById, AlbumTrack } from '../../src/constants/albumsData';

function AlbumDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();

  const album = useMemo(() => getAlbumById(id || ''), [id]);
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!album) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={theme.gradients.sleepyNight as [string, string]}
          style={styles.gradient}
        >
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Album not found</Text>
              <AnimatedPressable onPress={() => router.back()} style={styles.backLink}>
                <Text style={styles.backLinkText}>Go back</Text>
              </AnimatedPressable>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  const handleTrackPress = (track: AlbumTrack) => {
    // Navigate to album track player
    router.push(`/album/track/${track.id}?audioKey=${track.audioKey}&title=${encodeURIComponent(track.title)}&albumTitle=${encodeURIComponent(album.title)}&duration=${track.duration_minutes}&artist=${encodeURIComponent(album.artist)}`);
  };

  const getCategoryIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (album.category) {
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
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.gradients.sleepyNight as [string, string]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Hero Section */}
            <AnimatedView delay={0} duration={400}>
              <View style={styles.heroSection}>
                <View style={[styles.heroIcon, { backgroundColor: `${album.color}25` }]}>
                  <Ionicons name={getCategoryIcon()} size={48} color={album.color} />
                </View>
                <Text style={styles.albumTitle}>{album.title}</Text>
                <View style={styles.albumMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="disc-outline" size={16} color={theme.colors.sleepTextMuted} />
                    <Text style={styles.metaText}>{album.trackCount} tracks</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={16} color={theme.colors.sleepTextMuted} />
                    <Text style={styles.metaText}>{album.totalDuration} min</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="person-outline" size={16} color={theme.colors.sleepTextMuted} />
                    <Text style={styles.metaText}>{album.artist}</Text>
                  </View>
                </View>
                <Text style={styles.albumDescription}>{album.description}</Text>
              </View>
            </AnimatedView>

            {/* Tracks List */}
            <View style={styles.tracksContainer}>
              <AnimatedView delay={100} duration={400}>
                <Text style={styles.sectionTitle}>Tracks</Text>
              </AnimatedView>

              {album.tracks.map((track, index) => (
                <AnimatedView key={track.id} delay={150 + index * 40} duration={300}>
                  <AnimatedPressable
                    onPress={() => handleTrackPress(track)}
                    style={styles.trackCard}
                  >
                    <View style={[styles.trackNumber, { backgroundColor: `${album.color}20` }]}>
                      <Text style={[styles.trackNumberText, { color: album.color }]}>
                        {track.trackNumber}
                      </Text>
                    </View>
                    <View style={styles.trackInfo}>
                      <Text style={styles.trackTitle}>{track.title}</Text>
                      <View style={styles.trackMeta}>
                        <Ionicons name="time-outline" size={12} color={theme.colors.sleepTextMuted} />
                        <Text style={styles.trackMetaText}>{track.duration_minutes} min</Text>
                      </View>
                    </View>
                    <View style={styles.playButton}>
                      <Ionicons name="play" size={20} color={theme.colors.sleepAccent} />
                    </View>
                  </AnimatedPressable>
                </AnimatedView>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      {/* Floating Back Button */}
      <SafeAreaView style={styles.backButtonContainer} edges={['top']} pointerEvents="box-none">
        <AnimatedPressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.sleepText} />
        </AnimatedPressable>
      </SafeAreaView>
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
    backButtonContainer: {
      position: 'absolute',
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
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.15)',
    },
    heroSection: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.xl,
      alignItems: 'center',
    },
    heroIcon: {
      width: 96,
      height: 96,
      borderRadius: 48,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.lg,
    },
    albumTitle: {
      fontFamily: theme.fonts.display.semiBold,
      fontSize: 28,
      color: theme.colors.sleepText,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    albumMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 13,
      color: theme.colors.sleepTextMuted,
    },
    albumDescription: {
      fontFamily: theme.fonts.body.regular,
      fontSize: 15,
      color: theme.colors.sleepTextMuted,
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: theme.spacing.md,
    },
    tracksContainer: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
    },
    sectionTitle: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 18,
      color: theme.colors.sleepText,
      marginBottom: theme.spacing.md,
    },
    trackCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.sleepSurface,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    trackNumber: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    trackNumberText: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 14,
    },
    trackInfo: {
      flex: 1,
      marginLeft: theme.spacing.md,
    },
    trackTitle: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 15,
      color: theme.colors.sleepText,
      marginBottom: 4,
    },
    trackMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    trackMetaText: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 11,
      color: theme.colors.sleepTextMuted,
    },
    playButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorText: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 16,
      color: theme.colors.sleepText,
      marginBottom: theme.spacing.md,
    },
    backLink: {
      padding: theme.spacing.sm,
    },
    backLinkText: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 14,
      color: theme.colors.sleepAccent,
    },
  });

export default function AlbumDetail() {
  return (
    <ProtectedRoute>
      <AlbumDetailScreen />
    </ProtectedRoute>
  );
}

