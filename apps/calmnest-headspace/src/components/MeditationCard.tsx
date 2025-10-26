import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import { GuidedMeditation } from '../types';

interface MeditationCardProps {
  meditation: GuidedMeditation;
  onPress: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function MeditationCard({
  meditation,
  onPress,
  isFavorite = false,
  onToggleFavorite,
}: MeditationCardProps) {
  const getCategoryGradient = () => {
    switch (meditation.category) {
      case 'focus':
        return ['#6c5ce7', '#a29bfe'];
      case 'stress':
        return ['#74b9ff', '#a0d2ff'];
      case 'anxiety':
        return ['#55a3ff', '#7db8ff'];
      case 'sleep':
        return ['#5f3dc4', '#7c5cdb'];
      case 'gratitude':
        return ['#fd79a8', '#fdcb6e'];
      default:
        return ['#6c5ce7', '#a29bfe'];
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <LinearGradient
        colors={getCategoryGradient()}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {meditation.thumbnail_url ? (
          <Image source={{ uri: meditation.thumbnail_url }} style={styles.thumbnail} />
        ) : (
          <View style={styles.iconContainer}>
            <Ionicons name="leaf" size={40} color="white" />
          </View>
        )}
        
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={2}>
              {meditation.title}
            </Text>
            {onToggleFavorite && (
              <TouchableOpacity onPress={onToggleFavorite} style={styles.favoriteButton}>
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={24}
                  color="white"
                />
              </TouchableOpacity>
            )}
          </View>
          
          <Text style={styles.description} numberOfLines={2}>
            {meditation.description}
          </Text>
          
          <View style={styles.footer}>
            <View style={styles.info}>
              <Ionicons name="time-outline" size={16} color="white" />
              <Text style={styles.infoText}>{meditation.duration_minutes} min</Text>
            </View>
            
            {meditation.instructor && (
              <View style={styles.info}>
                <Ionicons name="person-outline" size={16} color="white" />
                <Text style={styles.infoText}>{meditation.instructor}</Text>
              </View>
            )}
            
            {meditation.is_premium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={12} color={theme.colors.primary} />
                <Text style={styles.premiumText}>PRO</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  gradient: {
    padding: theme.spacing.lg,
  },
  thumbnail: {
    width: '100%',
    height: 120,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  iconContainer: {
    width: '100%',
    height: 120,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  favoriteButton: {
    padding: theme.spacing.xs,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  infoText: {
    fontSize: 14,
    color: 'white',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    gap: 2,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary,
  },
});
