import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { StatsCard } from "../../src/components/stats/StatsCard";
import { ReadingChart } from "../../src/components/stats/ReadingChart";
import { useReadingStats } from "../../src/hooks/useReadingStats";

function StatsScreen() {
  const {
    stats,
    weeklyData,
    recentSessions,
    loading,
    error,
    refresh,
    formatTime,
    formatNumber,
  } = useReadingStats();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2d3436" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#e74c3c" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reading Statistics</Text>
        <Text style={styles.headerSubtitle}>Track your reading journey</Text>
      </View>

      {/* Overview Cards */}
      <View style={styles.cardsGrid}>
        <StatsCard
          icon="library-outline"
          iconColor="#3498db"
          value={stats.totalBooksRead}
          label="Books Read"
          style={styles.statCard}
        />
        <StatsCard
          icon="checkmark-circle-outline"
          iconColor="#27ae60"
          value={stats.totalBooksRead}
          label="Completed"
          style={styles.statCard}
        />
        <StatsCard
          icon="document-text-outline"
          iconColor="#e74c3c"
          value={formatNumber(stats.totalPagesRead)}
          label="Pages Read"
          style={styles.statCard}
        />
        <StatsCard
          icon="time-outline"
          iconColor="#f39c12"
          value={formatTime(stats.totalReadingTime)}
          label="Reading Time"
          style={styles.statCard}
        />
      </View>

      {/* Streaks Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reading Streaks</Text>
        <View style={styles.streakCard}>
          <View style={styles.streakItem}>
            <View style={styles.streakIconContainer}>
              <Ionicons name="flame-outline" size={24} color="#e74c3c" />
            </View>
            <View style={styles.streakInfo}>
              <Text style={styles.streakValue}>{stats.currentStreak} days</Text>
              <Text style={styles.streakLabel}>Current Streak</Text>
            </View>
          </View>

          <View style={styles.streakDivider} />

          <View style={styles.streakItem}>
            <View style={styles.streakIconContainer}>
              <Ionicons name="trophy-outline" size={24} color="#f39c12" />
            </View>
            <View style={styles.streakInfo}>
              <Text style={styles.streakValue}>{stats.longestStreak} days</Text>
              <Text style={styles.streakLabel}>Longest Streak</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Reading Speed */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reading Performance</Text>
        <View style={styles.performanceCard}>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Average Speed</Text>
            <Text style={styles.performanceValue}>
              {stats.averageReadingSpeed} words/min
            </Text>
          </View>
        </View>
      </View>

      {/* Weekly Activity Chart */}
      <View style={styles.section}>
        <ReadingChart data={weeklyData} dailyGoal={30} />
      </View>

      {/* Recent Sessions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Sessions</Text>
        {recentSessions.length === 0 ? (
          <View style={styles.noDataCard}>
            <Text style={styles.noDataText}>No recent reading sessions</Text>
          </View>
        ) : (
          <View>
            {recentSessions.map((session, index) => (
              <View key={session.id} style={styles.sessionItem}>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionPages}>
                    {session.end_page - session.start_page} pages
                  </Text>
                  <Text style={styles.sessionDuration}>
                    {formatTime(session.duration_minutes)}
                  </Text>
                </View>
                <Text style={styles.sessionDate}>
                  {new Date(session.created_at).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d3436",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10,
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: "white",
    width: "48%",
    padding: 20,
    margin: "1%",
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2d3436",
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 16,
  },
  streakCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  streakItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  streakIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  streakInfo: {
    flex: 1,
  },
  streakValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2d3436",
  },
  streakLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  streakDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 20,
  },
  performanceCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  performanceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  performanceLabel: {
    fontSize: 16,
    color: "#666",
  },
  performanceValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d3436",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  errorText: {
    fontSize: 16,
    color: "#e74c3c",
    marginTop: 16,
    textAlign: "center",
  },
  noDataCard: {
    backgroundColor: "white",
    padding: 40,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  noDataText: {
    fontSize: 14,
    color: "#999",
  },
  sessionItem: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sessionInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sessionPages: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3436",
  },
  sessionDuration: {
    fontSize: 16,
    color: "#3498db",
  },
  sessionDate: {
    fontSize: 14,
    color: "#666",
  },
});

export default function Stats() {
  return (
    <ProtectedRoute>
      <StatsScreen />
    </ProtectedRoute>
  );
}
