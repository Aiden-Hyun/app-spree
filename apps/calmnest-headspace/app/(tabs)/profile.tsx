import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import { useAuth } from '../../src/contexts/AuthContext';
import { useStats } from '../../src/hooks/useStats';
import { StatsCard } from '../../src/components/StatsCard';
import { ProgressRing } from '../../src/components/ProgressRing';
import { theme } from '../../src/theme';

function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { stats } = useStats();

  const menuItems = [
    { id: 'stats', label: 'Detailed Statistics', icon: 'stats-chart', route: '/stats' },
    { id: 'settings', label: 'Settings', icon: 'settings', route: '/settings' },
    { id: 'reminders', label: 'Reminders', icon: 'notifications', route: '/settings' },
    { id: 'favorites', label: 'Favorites', icon: 'heart', route: '/favorites' },
    { id: 'about', label: 'About', icon: 'information-circle', route: '/about' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.profileInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user?.email?.split('@')[0] || 'User'}
              </Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <ProgressRing
              progress={100}
              size={80}
              strokeWidth={6}
              centerText={stats?.current_streak.toString() || '0'}
              centerSubtext="days"
            />
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {stats?.total_sessions || 0}
            </Text>
            <Text style={styles.statLabel}>Total Sessions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Math.floor((stats?.total_minutes || 0) / 60)}h
            </Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.achievementsContainer}
          >
            <View style={styles.achievement}>
              <View style={[styles.achievementIcon, { backgroundColor: '#fdcb6e20' }]}>
                <Text style={styles.achievementEmoji}>🔥</Text>
              </View>
              <Text style={styles.achievementLabel}>First Week</Text>
            </View>
            <View style={styles.achievement}>
              <View style={[styles.achievementIcon, { backgroundColor: '#74b9ff20' }]}>
                <Text style={styles.achievementEmoji}>🧘</Text>
              </View>
              <Text style={styles.achievementLabel}>10 Sessions</Text>
            </View>
            <View style={styles.achievement}>
              <View style={[styles.achievementIcon, { backgroundColor: '#6c5ce720' }]}>
                <Text style={styles.achievementEmoji}>⏰</Text>
              </View>
              <Text style={styles.achievementLabel}>Early Bird</Text>
            </View>
            <View style={styles.achievement}>
              <View style={[styles.achievementIcon, { backgroundColor: '#00b89420' }]}>
                <Text style={styles.achievementEmoji}>🌙</Text>
              </View>
              <Text style={styles.achievementLabel}>Night Owl</Text>
            </View>
          </ScrollView>
        </View>

        {/* Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menu</Text>
          <View style={styles.menu}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => router.push(item.route as any)}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons
                    name={item.icon as any}
                    size={24}
                    color={theme.colors.text}
                  />
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.colors.textLight}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.lg,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  userEmail: {
    fontSize: 16,
    color: theme.colors.textLight,
    marginTop: 4,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'space-around',
    ...theme.shadows.sm,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: theme.colors.gray[300],
  },
  section: {
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  achievementsContainer: {
    gap: theme.spacing.md,
  },
  achievement: {
    alignItems: 'center',
  },
  achievementIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  achievementEmoji: {
    fontSize: 32,
  },
  achievementLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
  menu: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  menuItemText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xxl,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.error,
  },
});

export default function Profile() {
  return (
    <ProtectedRoute>
      <ProfileScreen />
    </ProtectedRoute>
  );
}
