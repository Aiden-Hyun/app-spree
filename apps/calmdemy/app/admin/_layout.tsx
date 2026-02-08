import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@core/providers/contexts/ThemeContext';
import { useAdminAuth } from '@features/admin/hooks/useAdminAuth';

export default function AdminLayout() {
  const { theme } = useTheme();
  const { isAdmin, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
          Checking access...
        </Text>
      </View>
    );
  }

  if (!isAdmin) {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontFamily: 'DMSans-SemiBold' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'Content Factory' }}
      />
      <Stack.Screen
        name="create"
        options={{ title: 'Create Content', presentation: 'modal' }}
      />
      <Stack.Screen
        name="job/[id]"
        options={{ title: 'Job Details' }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'DMSans-Regular',
  },
});
