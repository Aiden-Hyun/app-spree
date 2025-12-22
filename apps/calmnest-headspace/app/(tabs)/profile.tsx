import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import { AnimatedView } from '../../src/components/AnimatedView';
import { AnimatedPressable } from '../../src/components/AnimatedPressable';
import { Skeleton } from '../../src/components/Skeleton';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useStats } from '../../src/hooks/useStats';
import { Theme } from '../../src/theme';

const milestones = [
  { id: 'week', icon: 'leaf-outline' as const, label: 'First Week', days: 7, description: 'Planted the seed', color: '#8B9F82' },
  { id: 'month', icon: 'flower-outline' as const, label: 'One Month', days: 30, description: 'Growing strong', color: '#A8B89F' },
  { id: 'quarter', icon: 'rose-outline' as const, label: '3 Months', days: 90, description: 'Deep roots', color: '#C4A77D' },
  { id: 'year', icon: 'trophy-outline' as const, label: 'One Year', days: 365, description: 'Mountain climber', color: '#D4A5A5' },
];

function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, isDark } = useTheme();
  const { stats, loading } = useStats();

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const avatarGradient = theme.gradients.sage as [string, string];

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const getMemberSince = () => {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
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
        <AnimatedView delay={0} duration={500}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <LinearGradient
                colors={avatarGradient}
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
        </AnimatedView>

        {/* Your Sanctuary Card */}
        <AnimatedView delay={100} duration={500}>
        <View style={styles.sanctuaryCard}>
          <Text style={styles.sanctuaryTitle}>Your Sanctuary</Text>
          <View style={styles.sanctuaryDivider} />
          
            {loading ? (
              <View style={styles.sanctuaryStats}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={styles.sanctuaryStat}>
                    <Skeleton width={28} height={28} borderRadius={14} style={{ marginBottom: 8 }} />
                    <Skeleton width={50} height={22} style={{ marginBottom: 4 }} />
                    <Skeleton width={60} height={12} />
                  </View>
                ))}
              </View>
            ) : (
          <View style={styles.sanctuaryStats}>
            <View style={styles.sanctuaryStat}>
                  <View style={[styles.sanctuaryIconContainer, { backgroundColor: `${theme.colors.secondary}20` }]}>
                    <Ionicons name="flame-outline" size={24} color={theme.colors.secondary} />
                  </View>
              <View style={styles.sanctuaryStatInfo}>
                <Text style={styles.sanctuaryStatValue}>{stats?.total_sessions || 0}</Text>
                <Text style={styles.sanctuaryStatLabel}>sessions</Text>
              </View>
            </View>
            
            <View style={styles.sanctuaryStat}>
                  <View style={[styles.sanctuaryIconContainer, { backgroundColor: `${theme.colors.primary}20` }]}>
                    <Ionicons name="time-outline" size={24} color={theme.colors.primary} />
                  </View>
              <View style={styles.sanctuaryStatInfo}>
                <Text style={styles.sanctuaryStatValue}>
                  {formatTime(stats?.total_minutes || 0)}
                </Text>
                <Text style={styles.sanctuaryStatLabel}>mindful</Text>
              </View>
            </View>
            
            <View style={styles.sanctuaryStat}>
                  <View style={[styles.sanctuaryIconContainer, { backgroundColor: `${theme.colors.accent}20` }]}>
                    <Ionicons name="trending-up-outline" size={24} color={theme.colors.accent} />
                  </View>
              <View style={styles.sanctuaryStatInfo}>
                <Text style={styles.sanctuaryStatValue}>{stats?.current_streak || 0}</Text>
                <Text style={styles.sanctuaryStatLabel}>day streak</Text>
              </View>
            </View>
          </View>
            )}
        </View>
        </AnimatedView>

        {/* Milestones */}
        <View style={styles.section}>
          <AnimatedView delay={200} duration={500}>
          <Text style={styles.sectionTitle}>Milestones</Text>
          </AnimatedView>
          
          <View style={styles.milestonesGrid}>
            {milestones.map((milestone, index) => {
              const isAchieved = (stats?.longest_streak || 0) >= milestone.days;
              return (
                <AnimatedView 
                  key={milestone.id}
                  delay={250 + index * 50} 
                  duration={400}
                  style={styles.milestoneCardWrapper}
                >
                  <View 
                  style={[
                    styles.milestoneCard,
                    isAchieved && styles.milestoneCardAchieved
                  ]}
                >
                    <View style={[
                      styles.milestoneIconContainer,
                      { backgroundColor: isAchieved ? `${milestone.color}20` : theme.colors.gray[100] }
                  ]}>
                      <Ionicons 
                        name={isAchieved ? milestone.icon : 'lock-closed-outline'} 
                        size={28} 
                        color={isAchieved ? milestone.color : theme.colors.textMuted} 
                      />
                    </View>
                  <Text style={[
                    styles.milestoneLabel,
                    isAchieved && styles.milestoneLabelAchieved
                  ]}>
                    {milestone.label}
                  </Text>
                  {isAchieved && (
                      <Text style={[styles.milestoneDescription, { color: milestone.color }]}>
                      {milestone.description}
                    </Text>
                  )}
                </View>
                </AnimatedView>
              );
            })}
          </View>
          
          {getNextMilestone() && (
            <AnimatedView delay={500} duration={400}>
            <View style={styles.nextMilestone}>
                <Ionicons name="flag-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.nextMilestoneText}>
                {getNextMilestone()!.days - (stats?.longest_streak || 0)} days until {getNextMilestone()!.label.toLowerCase()}
              </Text>
            </View>
            </AnimatedView>
          )}
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <AnimatedView delay={550} duration={400}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          </AnimatedView>
          
          <AnimatedView delay={600} duration={400}>
          <View style={styles.preferencesCard}>
              <AnimatedPressable style={styles.preferenceRow}>
              <View style={styles.preferenceLeft}>
                  <View style={styles.preferenceIconContainer}>
                    <Ionicons name="notifications-outline" size={20} color={theme.colors.primary} />
                  </View>
                <Text style={styles.preferenceLabel}>Reminder Time</Text>
              </View>
              <View style={styles.preferenceRight}>
                <Text style={styles.preferenceValue}>8:00 PM</Text>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
              </View>
              </AnimatedPressable>
            
            <View style={styles.preferenceDivider} />
            
              <AnimatedPressable style={styles.preferenceRow}>
              <View style={styles.preferenceLeft}>
                  <View style={styles.preferenceIconContainer}>
                    <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
                  </View>
                <Text style={styles.preferenceLabel}>Session Length</Text>
              </View>
              <View style={styles.preferenceRight}>
                <Text style={styles.preferenceValue}>10 min</Text>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
              </View>
              </AnimatedPressable>
            
            <View style={styles.preferenceDivider} />
            
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceLeft}>
                  <View style={styles.preferenceIconContainer}>
                    <Ionicons name="volume-medium-outline" size={20} color={theme.colors.primary} />
                  </View>
                <Text style={styles.preferenceLabel}>Background Sounds</Text>
              </View>
              <Switch
                value={true}
                trackColor={{ false: theme.colors.gray[300], true: theme.colors.primary }}
                thumbColor="white"
              />
            </View>
          </View>
          </AnimatedView>
        </View>

        {/* Quick Links */}
        <View style={styles.section}>
          <AnimatedView delay={650} duration={400}>
          <View style={styles.quickLinks}>
              <AnimatedPressable 
                onPress={() => router.push('/stats')}
              style={styles.quickLink}
            >
                <View style={[styles.quickLinkIcon, { backgroundColor: `${theme.colors.info}15` }]}>
                  <Ionicons name="stats-chart-outline" size={20} color={theme.colors.info} />
                </View>
              <Text style={styles.quickLinkText}>Statistics</Text>
              </AnimatedPressable>
            
              <AnimatedPressable 
                onPress={() => router.push('/settings')}
              style={styles.quickLink}
            >
                <View style={[styles.quickLinkIcon, { backgroundColor: `${theme.colors.textLight}15` }]}>
                  <Ionicons name="settings-outline" size={20} color={theme.colors.textLight} />
                </View>
              <Text style={styles.quickLinkText}>Settings</Text>
              </AnimatedPressable>
            
              <AnimatedPressable style={styles.quickLink}>
                <View style={[styles.quickLinkIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                  <Ionicons name="help-circle-outline" size={20} color={theme.colors.primary} />
                </View>
              <Text style={styles.quickLinkText}>Help</Text>
              </AnimatedPressable>
          </View>
          </AnimatedView>
        </View>

        {/* Logout */}
        <AnimatedView delay={700} duration={400}>
          <AnimatedPressable style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
          </AnimatedPressable>
        </AnimatedView>

        {/* Footer */}
        <AnimatedView delay={750} duration={400}>
        <View style={styles.footer}>
          <Text style={styles.footerText}>CalmNest v1.0.0</Text>
            <Text style={styles.footerSubtext}>Made with love for your peace</Text>
        </View>
        </AnimatedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
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
      width: 96,
      height: 96,
      borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  avatarText: {
      fontFamily: theme.fonts.display.bold,
      fontSize: 40,
    color: 'white',
  },
  userName: {
    fontFamily: theme.fonts.display.semiBold,
      fontSize: 26,
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
    sanctuaryIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.sm,
  },
  sanctuaryStatInfo: {
    alignItems: 'center',
  },
  sanctuaryStatValue: {
      fontFamily: theme.fonts.display.bold,
      fontSize: 24,
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
      fontSize: 18,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  milestonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
      marginHorizontal: -theme.spacing.xs,
    },
    milestoneCardWrapper: {
      width: '50%',
      paddingHorizontal: theme.spacing.xs,
      marginBottom: theme.spacing.sm,
  },
  milestoneCard: {
    backgroundColor: theme.colors.gray[100],
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
    alignItems: 'center',
  },
  milestoneCardAchieved: {
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
    milestoneIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.sm,
  },
  milestoneLabel: {
      fontFamily: theme.fonts.ui.semiBold,
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  milestoneLabelAchieved: {
    color: theme.colors.text,
  },
  milestoneDescription: {
    fontFamily: theme.fonts.ui.regular,
    fontSize: 12,
    marginTop: 4,
  },
  nextMilestone: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
      backgroundColor: isDark ? `${theme.colors.primary}30` : `${theme.colors.primary}10`,
    borderRadius: theme.borderRadius.lg,
      flexDirection: 'row',
    alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
  },
  nextMilestoneText: {
    fontFamily: theme.fonts.ui.medium,
    fontSize: 14,
    color: theme.colors.primary,
  },
  preferencesCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
    ...theme.shadows.sm,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
      paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
    preferenceIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: `${theme.colors.primary}15`,
      alignItems: 'center',
      justifyContent: 'center',
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
      marginLeft: 60,
  },
  quickLinks: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  quickLink: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
    quickLinkIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.sm,
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
      borderWidth: 1.5,
    borderColor: theme.colors.error,
      gap: theme.spacing.sm,
  },
  logoutText: {
      fontFamily: theme.fonts.ui.semiBold,
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
