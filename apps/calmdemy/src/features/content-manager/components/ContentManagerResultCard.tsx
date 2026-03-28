import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@core/providers/contexts/ThemeContext';
import { Theme } from '@/theme';
import { ContentManagerItemSummary } from '../types';

interface Props {
  item: ContentManagerItemSummary;
  onPress: () => void;
}

function formatDuration(durationMinutes?: number): string | null {
  if (!durationMinutes || durationMinutes <= 0) return null;
  return `${durationMinutes} min`;
}

function iconForCollection(collection: ContentManagerItemSummary['collection']) {
  switch (collection) {
    case 'guided_meditations':
      return 'leaf-outline';
    case 'sleep_meditations':
      return 'moon-outline';
    case 'bedtime_stories':
      return 'book-outline';
    case 'emergency_meditations':
      return 'flash-outline';
    case 'courses':
      return 'school-outline';
    case 'course_sessions':
      return 'reader-outline';
    default:
      return 'document-text-outline';
  }
}

export function ContentManagerResultCard({ item, onPress }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const durationLabel = formatDuration(item.durationMinutes);

  return (
    <Pressable
      testID={`content-manager-item-${item.collection}-${item.id}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {item.thumbnailUrl ? (
        <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
      ) : (
        <View style={styles.placeholder}>
          <Ionicons
            name={iconForCollection(item.collection)}
            size={24}
            color={theme.colors.primary}
          />
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <View
            style={[
              styles.accessBadge,
              item.access === 'premium'
                ? styles.premiumBadge
                : styles.freeBadge,
            ]}
          >
            <Text style={styles.accessBadgeText}>
              {item.access === 'premium' ? 'Premium' : 'Free'}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.typeLabel}>{item.typeLabel}</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.identifier} numberOfLines={1}>
            {item.identifier}
          </Text>
          {durationLabel ? (
            <>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.duration}>{durationLabel}</Text>
            </>
          ) : null}
        </View>

        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        ) : (
          <Text style={styles.descriptionMuted}>No description</Text>
        )}
      </View>
    </Pressable>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      gap: 14,
      padding: 14,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cardPressed: {
      opacity: 0.9,
    },
    thumbnail: {
      width: 72,
      height: 72,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.gray[200],
    },
    placeholder: {
      width: 72,
      height: 72,
      borderRadius: theme.borderRadius.md,
      backgroundColor: `${theme.colors.primary}14`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
      flex: 1,
      gap: 6,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    title: {
      flex: 1,
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 16,
      color: theme.colors.text,
    },
    accessBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: theme.borderRadius.full,
    },
    premiumBadge: {
      backgroundColor: `${theme.colors.secondary}26`,
    },
    freeBadge: {
      backgroundColor: `${theme.colors.success}20`,
    },
    accessBadgeText: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 11,
      color: theme.colors.text,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
    },
    typeLabel: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    metaDot: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    identifier: {
      flexShrink: 1,
      fontFamily: theme.fonts.ui.medium,
      fontSize: 12,
      color: theme.colors.text,
    },
    duration: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    description: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 13,
      lineHeight: 18,
      color: theme.colors.textSecondary,
    },
    descriptionMuted: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 13,
      color: theme.colors.textMuted,
    },
  });
