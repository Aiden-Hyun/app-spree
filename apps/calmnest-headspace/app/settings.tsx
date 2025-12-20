import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme, ThemeMode } from '../src/contexts/ThemeContext';
import { ProtectedRoute } from '../src/components/ProtectedRoute';

const themeModes: { id: ThemeMode; label: string; icon: string }[] = [
  { id: 'light', label: 'Light', icon: 'sunny-outline' },
  { id: 'dark', label: 'Dark', icon: 'moon-outline' },
  { id: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

function SettingsScreen() {
  const { user, logout } = useAuth();
  const { theme, themeMode, setThemeMode } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="mail-outline" size={20} color={theme.colors.text} />
                <Text style={styles.settingLabel}>Email</Text>
              </View>
              <Text style={styles.settingValue}>{user?.email}</Text>
            </View>
          </View>
        </View>
        
        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.card}>
            <Text style={styles.themeLabel}>Theme</Text>
            <View style={styles.themeSelector}>
              {themeModes.map((mode) => (
                <TouchableOpacity
                  key={mode.id}
                  style={[
                    styles.themeOption,
                    themeMode === mode.id && styles.themeOptionSelected,
                  ]}
                  onPress={() => setThemeMode(mode.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={mode.icon as any} 
                    size={20} 
                    color={themeMode === mode.id ? theme.colors.textOnPrimary : theme.colors.text} 
                  />
                  <Text style={[
                    styles.themeOptionText,
                    themeMode === mode.id && styles.themeOptionTextSelected,
                  ]}>
                    {mode.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="notifications-outline" size={20} color={theme.colors.text} />
                <Text style={styles.settingLabel}>Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: theme.colors.gray[300], true: theme.colors.primary }}
                thumbColor="white"
              />
            </View>
          </View>
        </View>
        
        {/* Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="download-outline" size={20} color={theme.colors.text} />
                <Text style={styles.settingLabel}>Export Data</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="shield-outline" size={20} color={theme.colors.text} />
                <Text style={styles.settingLabel}>Privacy Policy</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="document-text-outline" size={20} color={theme.colors.text} />
                <Text style={styles.settingLabel}>Terms of Service</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>CalmNest v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof import('../src/theme').createTheme>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 13,
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: theme.spacing.sm,
      marginLeft: theme.spacing.xs,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.md,
      ...theme.shadows.sm,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    settingLabel: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 16,
      color: theme.colors.text,
    },
    settingValue: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 14,
      color: theme.colors.textLight,
    },
    themeLabel: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 14,
      color: theme.colors.textLight,
      marginBottom: theme.spacing.md,
      marginLeft: theme.spacing.sm,
    },
    themeSelector: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    themeOption: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: theme.colors.gray[100],
    },
    themeOptionSelected: {
      backgroundColor: theme.colors.primary,
    },
    themeOptionText: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 14,
      color: theme.colors.text,
    },
    themeOptionTextSelected: {
      color: theme.colors.textOnPrimary,
    },
    actionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.gray[200],
      marginHorizontal: theme.spacing.sm,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.error,
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.lg,
    },
    logoutText: {
      fontFamily: theme.fonts.ui.medium,
      fontSize: 16,
      color: theme.colors.error,
    },
    version: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 12,
      color: theme.colors.textMuted,
      textAlign: 'center',
      marginBottom: theme.spacing.xxl,
    },
  });

export default function Settings() {
  return (
    <ProtectedRoute>
      <SettingsScreen />
    </ProtectedRoute>
  );
}
