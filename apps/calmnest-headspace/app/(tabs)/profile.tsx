import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import { useAuth } from '../../src/contexts/AuthContext';
import { useStats } from '../../src/hooks/useStats';
import { theme } from '../../src/theme';

const milestones = [
  { id: 'week', emoji: '🌱', label: 'First Week', days: 7, description: 'Planted the seed' },
  { id: 'month', emoji: '🌿', label: 'One Month', days: 30, description: 'Growing strong' },
  { id: 'quarter', emoji: '🌳', label: '3 Months', days: 90, description: 'Deep roots' },
  { id: 'year', emoji: '🏔️', label: 'One Year', days: 365, description: 'Mountain climber' },
];

function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { stats } = useStats();

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const getMemberSince = () => {
    // For now, show current month/year
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
  };

  const getAchievedMilestones = () => {
    const longestStreak = stats?.longest_streak || 0;
    return milestones.filter(m => longestStreak >= m.days);
  };

  const getNextMilestone = () => {
    const longestStreak = stats?.longest_streak || 0;
    return milestones.find(m => longestStreak < m.days);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#A8B89F', '#8B9F82']}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </LinearGradient>
          </View>
          <Text style={styles.userName}>
            {user?.email?.split('@')[0] || 'Friend'}
          </Text>
          <Text style={styles.memberSince}>
            Meditating since {getMemberSince()}
          </Text>
        </View>

        {/* Your Sanctuary Card */}
        <View style={styles.sanctuaryCard}>
          <Text style={styles.sanctuaryTitle}>Your Sanctuary</Text>
          <View style={styles.sanctuaryDivider} />
          
          <View style={styles.sanctuaryStats}>
            <View style={styles.sanctuaryStat}>
              <Text style={styles.sanctuaryEmoji}>🕯️</Text>
              <View style={styles.sanctuaryStatInfo}>
                <Text style={styles.sanctuaryStatValue}>{stats?.total_sessions || 0}</Text>
                <Text style={styles.sanctuaryStatLabel}>sessions</Text>
              </View>
            </View>
            
            <View style={styles.sanctuaryStat}>
              <Text style={styles.sanctuaryEmoji}>⏱️</Text>
              <View style={styles.sanctuaryStatInfo}>
                <Text style={styles.sanctuaryStatValue}>
                  {formatTime(stats?.total_minutes || 0)}
                </Text>
                <Text style={styles.sanctuaryStatLabel}>mindful</Text>
              </View>
            </View>
            
            <View style={styles.sanctuaryStat}>
              <Text style={styles.sanctuaryEmoji}>🔥</Text>
              <View style={styles.sanctuaryStatInfo}>
                <Text style={styles.sanctuaryStatValue}>{stats?.current_streak || 0}</Text>
                <Text style={styles.sanctuaryStatLabel}>day streak</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Milestones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Milestones</Text>
          <View style={styles.milestonesGrid}>
            {milestones.map((milestone) => {
              const isAchieved = (stats?.longest_streak || 0) >= milestone.days;
              return (
                <View 
                  key={milestone.id}
                  style={[
                    styles.milestoneCard,
                    isAchieved && styles.milestoneCardAchieved
                  ]}
                >
                  <Text style={[
                    styles.milestoneEmoji,
                    !isAchieved && styles.milestoneEmojiLocked
                  ]}>
                    {isAchieved ? milestone.emoji : '🔒'}
                  </Text>
                  <Text style={[
                    styles.milestoneLabel,
                    isAchieved && styles.milestoneLabelAchieved
                  ]}>
                    {milestone.label}
                  </Text>
                  {isAchieved && (
                    <Text style={styles.milestoneDescription}>
                      {milestone.description}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
          
          {getNextMilestone() && (
            <View style={styles.nextMilestone}>
              <Text style={styles.nextMilestoneText}>
                {getNextMilestone()!.days - (stats?.longest_streak || 0)} days until {getNextMilestone()!.label.toLowerCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.preferencesCard}>
            <TouchableOpacity style={styles.preferenceRow}>
              <View style={styles.preferenceLeft}>
                <Ionicons name="notifications-outline" size={22} color={theme.colors.text} />
                <Text style={styles.preferenceLabel}>Reminder Time</Text>
              </View>
              <View style={styles.preferenceRight}>
                <Text style={styles.preferenceValue}>8:00 PM</Text>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
              </View>
            </TouchableOpacity>
            
            <View style={styles.preferenceDivider} />
            
            <TouchableOpacity style={styles.preferenceRow}>
              <View style={styles.preferenceLeft}>
                <Ionicons name="time-outline" size={22} color={theme.colors.text} />
                <Text style={styles.preferenceLabel}>Session Length</Text>
              </View>
              <View style={styles.preferenceRight}>
                <Text style={styles.preferenceValue}>10 min</Text>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
              </View>
            </TouchableOpacity>
            
            <View style={styles.preferenceDivider} />
            
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceLeft}>
                <Ionicons name="volume-medium-outline" size={22} color={theme.colors.text} />
                <Text style={styles.preferenceLabel}>Background Sounds</Text>
              </View>
              <Switch
                value={true}
                trackColor={{ false: theme.colors.gray[300], true: theme.colors.primary }}
                thumbColor="white"
              />
            </View>
          </View>
        </View>

        {/* Quick Links */}
        <View style={styles.section}>
          <View style={styles.quickLinks}>
            <TouchableOpacity 
              style={styles.quickLink}
              onPress={() => router.push('/stats')}
            >
              <Ionicons name="stats-chart-outline" size={20} color={theme.colors.text} />
              <Text style={styles.quickLinkText}>Statistics</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickLink}
              onPress={() => router.push('/settings')}
            >
              <Ionicons name="settings-outline" size={20} color={theme.colors.text} />
              <Text style={styles.quickLinkText}>Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickLink}>
              <Ionicons name="help-circle-outline" size={20} color={theme.colors.text} />
              <Text style={styles.quickLinkText}>Help</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>CalmNest v1.0.0</Text>
          <Text style={styles.footerSubtext}>Made with 🤍 for your peace</Text>
        </View>
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
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    alignItems: 'center',
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  avatarContainer: {
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  avatarText: {
    fontFamily: theme.fonts.display.semiBold,
    fontSize: 36,
    color: 'white',
  },
  userName: {
    fontFamily: theme.fonts.display.semiBold,
    fontSize: 24,
    color: theme.colors.text,
    marginBottom: 4,
  },
  memberSince: {
    fontFamily: theme.fonts.ui.regular,
    fontSize: 14,
    color: theme.colors.textLight,
  },
  sanctuaryCard: {
    marginHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    ...theme.shadows.sm,
  },
  sanctuaryTitle: {
    fontFamily: theme.fonts.display.semiBold,
    fontSize: 18,
    color: theme.colors.text,
    textAlign: 'center',
  },
  sanctuaryDivider: {
    height: 1,
    backgroundColor: theme.colors.gray[200],
    marginVertical: theme.spacing.lg,
  },
  sanctuaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sanctuaryStat: {
    alignItems: 'center',
  },
  sanctuaryEmoji: {
    fontSize: 28,
    marginBottom: theme.spacing.xs,
  },
  sanctuaryStatInfo: {
    alignItems: 'center',
  },
  sanctuaryStatValue: {
    fontFamily: theme.fonts.display.semiBold,
    fontSize: 22,
    color: theme.colors.text,
  },
  sanctuaryStatLabel: {
    fontFamily: theme.fonts.ui.regular,
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  section: {
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  sectionTitle: {
    fontFamily: theme.fonts.ui.semiBold,
    fontSize: 17,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  milestonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  milestoneCard: {
    width: '48%',
    backgroundColor: theme.colors.gray[100],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  milestoneCardAchieved: {
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  milestoneEmoji: {
    fontSize: 32,
    marginBottom: theme.spacing.xs,
  },
  milestoneEmojiLocked: {
    opacity: 0.5,
  },
  milestoneLabel: {
    fontFamily: theme.fonts.ui.medium,
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  milestoneLabelAchieved: {
    color: theme.colors.text,
  },
  milestoneDescription: {
    fontFamily: theme.fonts.ui.regular,
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 4,
  },
  nextMilestone: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: 'rgba(139, 159, 130, 0.1)',
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  nextMilestoneText: {
    fontFamily: theme.fonts.ui.medium,
    fontSize: 14,
    color: theme.colors.primary,
  },
  preferencesCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  preferenceLabel: {
    fontFamily: theme.fonts.ui.regular,
    fontSize: 15,
    color: theme.colors.text,
  },
  preferenceRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  preferenceValue: {
    fontFamily: theme.fonts.ui.regular,
    fontSize: 14,
    color: theme.colors.textLight,
  },
  preferenceDivider: {
    height: 1,
    backgroundColor: theme.colors.gray[200],
    marginHorizontal: theme.spacing.sm,
  },
  quickLinks: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  quickLink: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
    ...theme.shadows.sm,
  },
  quickLinkText: {
    fontFamily: theme.fonts.ui.medium,
    fontSize: 13,
    color: theme.colors.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.error,
    gap: theme.spacing.xs,
  },
  logoutText: {
    fontFamily: theme.fonts.ui.medium,
    fontSize: 15,
    color: theme.colors.error,
  },
  footer: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  footerText: {
    fontFamily: theme.fonts.ui.regular,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  footerSubtext: {
    fontFamily: theme.fonts.ui.regular,
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
});

export default function Profile() {
  return (
    <ProtectedRoute>
      <ProfileScreen />
    </ProtectedRoute>
  );
}
