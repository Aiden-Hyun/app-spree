import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@core/providers/contexts/ThemeContext';
import { Theme } from '@/theme';
import { ContentManagerFilterPills } from '../components/ContentManagerFilterPills';
import { ContentManagerResultCard } from '../components/ContentManagerResultCard';
import { useContentManagerCatalog } from '../hooks/useContentManager';
import {
  CONTENT_MANAGER_COLLECTION_LABELS,
  CONTENT_MANAGER_COLLECTIONS,
} from '../types';

const TYPE_OPTIONS = [
  { id: 'all', label: 'All' },
  ...CONTENT_MANAGER_COLLECTIONS.map((collection) => ({
    id: collection,
    label: CONTENT_MANAGER_COLLECTION_LABELS[collection],
  })),
] as const;

const ACCESS_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'free', label: 'Free' },
  { id: 'premium', label: 'Premium' },
] as const;

export default function ContentManagerScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {
    filteredItems,
    filters,
    isLoading,
    isRefreshing,
    error,
    refresh,
    setAccess,
    setQuery,
    setType,
  } = useContentManagerCatalog();

  return (
    <View style={styles.screen}>
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => `${item.collection}:${item.id}`}
        renderItem={({ item }) => (
          <ContentManagerResultCard
            item={item}
            onPress={() =>
              router.push({
                pathname: '/admin/content/[collection]/[id]',
                params: {
                  collection: item.collection,
                  id: item.id,
                },
              })
            }
          />
        )}
        ListHeaderComponent={
          <View style={styles.headerCard}>
            <View style={styles.heroRow}>
              <View style={styles.heroText}>
                <Text style={styles.eyebrow}>Admin</Text>
                <Text style={styles.title}>Content Manager</Text>
                <Text style={styles.subtitle}>
                  Find published content, inspect metadata, and jump into the live experience.
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                testID="content-manager-refresh"
                onPress={refresh}
                style={({ pressed }) => [
                  styles.refreshButton,
                  pressed && { opacity: 0.88 },
                ]}
              >
                {isRefreshing ? (
                  <ActivityIndicator size="small" color={theme.colors.textOnPrimary} />
                ) : (
                  <>
                    <Ionicons name="refresh-outline" size={16} color={theme.colors.textOnPrimary} />
                    <Text style={styles.refreshButtonText}>Refresh</Text>
                  </>
                )}
              </Pressable>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={18} color={theme.colors.textMuted} />
              <TextInput
                value={filters.query}
                onChangeText={setQuery}
                placeholder="Search by title, doc id, course code, or session code"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.searchInput}
              />
            </View>

            <ContentManagerFilterPills
              label="Type"
              options={TYPE_OPTIONS}
              selectedId={filters.type}
              onChange={setType}
            />

            <ContentManagerFilterPills
              label="Access"
              options={ACCESS_OPTIONS}
              selectedId={filters.access}
              onChange={setAccess}
            />

            {error ? (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle-outline" size={18} color={theme.colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {!isLoading ? (
              <Text style={styles.resultsText}>
                {filteredItems.length} result{filteredItems.length === 1 ? '' : 's'}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.emptyTitle}>Loading content</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="documents-outline" size={40} color={theme.colors.textMuted} />
              <Text style={styles.emptyTitle}>No matching content</Text>
              <Text style={styles.emptyBody}>
                Try a different search term or relax one of the filters.
              </Text>
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingHorizontal: Platform.OS === 'web' ? 24 : 0,
    },
    listContent: {
      width: '100%',
      maxWidth: Platform.OS === 'web' ? 1080 : undefined,
      alignSelf: 'center',
      paddingHorizontal: Platform.OS === 'web' ? 0 : 16,
      paddingTop: 16,
      paddingBottom: 40,
    },
    headerCard: {
      gap: 18,
      marginBottom: 18,
      padding: 20,
      borderRadius: theme.borderRadius.xl,
      backgroundColor: theme.colors.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.sm,
    },
    heroRow: {
      flexDirection: Platform.OS === 'web' ? 'row' : 'column',
      justifyContent: 'space-between',
      gap: 16,
    },
    heroText: {
      flex: 1,
      gap: 6,
    },
    eyebrow: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 1,
      color: theme.colors.primary,
    },
    title: {
      fontFamily: theme.fonts.display.semiBold,
      fontSize: 30,
      color: theme.colors.text,
    },
    subtitle: {
      fontFamily: theme.fonts.body.regular,
      fontSize: 15,
      lineHeight: 22,
      color: theme.colors.textSecondary,
      maxWidth: 760,
    },
    refreshButton: {
      alignSelf: Platform.OS === 'web' ? 'flex-start' : 'stretch',
      minWidth: 112,
      height: 42,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    refreshButtonText: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 14,
      color: theme.colors.textOnPrimary,
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 14,
      paddingVertical: Platform.OS === 'web' ? 14 : 10,
    },
    searchInput: {
      flex: 1,
      fontFamily: theme.fonts.ui.regular,
      fontSize: 15,
      color: theme.colors.text,
    },
    errorCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderRadius: theme.borderRadius.md,
      backgroundColor: `${theme.colors.error}14`,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    errorText: {
      flex: 1,
      fontFamily: theme.fonts.ui.medium,
      fontSize: 13,
      color: theme.colors.error,
    },
    resultsText: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 13,
      color: theme.colors.textMuted,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingVertical: 48,
      paddingHorizontal: 24,
    },
    emptyTitle: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 18,
      color: theme.colors.text,
    },
    emptyBody: {
      fontFamily: theme.fonts.body.regular,
      fontSize: 14,
      lineHeight: 21,
      textAlign: 'center',
      color: theme.colors.textSecondary,
      maxWidth: 420,
    },
  });
