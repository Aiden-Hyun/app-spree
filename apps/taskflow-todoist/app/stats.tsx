import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ProtectedRoute } from "../src/components/ProtectedRoute";
import { statsService, ProductivityStats } from "../src/services/statsService";
import { useAuth } from "../src/contexts/AuthContext";
import { router } from "expo-router";

function StatsScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProductivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user, timeRange]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await statsService.getProductivityStats(user!.id, timeRange);
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6c5ce7" />
      </View>
    );
  }

  if (error || !stats) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to load statistics</Text>
      </View>
    );
  }

  const priorityColors = {
    low: "#95a5a6",
    medium: "#3498db",
    high: "#f39c12",
    urgent: "#e74c3c",
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Productivity Stats</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Time range selector */}
      <View style={styles.timeRangeContainer}>
        {[
          { value: 7, label: "7 days" },
          { value: 30, label: "30 days" },
          { value: 90, label: "90 days" },
        ].map((range) => (
          <TouchableOpacity
            key={range.value}
            style={[
              styles.timeRangeButton,
              timeRange === range.value && styles.timeRangeButtonActive,
            ]}
            onPress={() => setTimeRange(range.value as 7 | 30 | 90)}
          >
            <Text
              style={[
                styles.timeRangeText,
                timeRange === range.value && styles.timeRangeTextActive,
              ]}
            >
              {range.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Streak cards */}
      <View style={styles.streakContainer}>
        <View style={styles.streakCard}>
          <Ionicons name="flame" size={32} color="#e74c3c" />
          <Text style={styles.streakNumber}>{stats.currentStreak}</Text>
          <Text style={styles.streakLabel}>Current Streak</Text>
        </View>
        <View style={styles.streakCard}>
          <Ionicons name="trophy" size={32} color="#f39c12" />
          <Text style={styles.streakNumber}>{stats.longestStreak}</Text>
          <Text style={styles.streakLabel}>Longest Streak</Text>
        </View>
      </View>

      {/* Overview stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.overviewGrid}>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewNumber}>
              {stats.totalTasksCompleted}
            </Text>
            <Text style={styles.overviewLabel}>Tasks Completed</Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewNumber}>
              {stats.averageCompletionTime}h
            </Text>
            <Text style={styles.overviewLabel}>Avg. Completion Time</Text>
          </View>
        </View>
      </View>

      {/* Productivity insights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Productivity Insights</Text>
        <View style={styles.insightCard}>
          <Ionicons name="calendar" size={20} color="#6c5ce7" />
          <Text style={styles.insightText}>
            Most productive on{" "}
            <Text style={styles.insightHighlight}>
              {stats.mostProductiveDay}s
            </Text>
          </Text>
        </View>
        <View style={styles.insightCard}>
          <Ionicons name="time" size={20} color="#6c5ce7" />
          <Text style={styles.insightText}>
            Peak productivity at{" "}
            <Text style={styles.insightHighlight}>
              {stats.mostProductiveHour}:00
            </Text>
          </Text>
        </View>
      </View>

      {/* Tasks by project */}
      {stats.tasksByProject.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tasks by Project</Text>
          {stats.tasksByProject.map((project, index) => (
            <View key={index} style={styles.projectRow}>
              <View style={styles.projectInfo}>
                <View
                  style={[
                    styles.projectDot,
                    { backgroundColor: project.color },
                  ]}
                />
                <Text style={styles.projectName}>{project.projectName}</Text>
              </View>
              <Text style={styles.projectCount}>{project.count} tasks</Text>
            </View>
          ))}
        </View>
      )}

      {/* Tasks by priority */}
      {stats.tasksByPriority.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tasks by Priority</Text>
          <View style={styles.priorityGrid}>
            {stats.tasksByPriority.map((priority) => (
              <View key={priority.priority} style={styles.priorityCard}>
                <Ionicons
                  name="flag"
                  size={24}
                  color={
                    priorityColors[
                      priority.priority as keyof typeof priorityColors
                    ]
                  }
                />
                <Text style={styles.priorityCount}>{priority.count}</Text>
                <Text style={styles.priorityLabel}>
                  {priority.priority.charAt(0).toUpperCase() +
                    priority.priority.slice(1)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Activity chart placeholder */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity Over Time</Text>
        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartPlaceholderText}>
            Chart visualization would go here
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#e74c3c",
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  timeRangeContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "white",
    marginBottom: 16,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
    marginHorizontal: 4,
  },
  timeRangeButtonActive: {
    backgroundColor: "#6c5ce7",
  },
  timeRangeText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  timeRangeTextActive: {
    color: "white",
  },
  streakContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 16,
  },
  streakCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginTop: 8,
  },
  streakLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  overviewGrid: {
    flexDirection: "row",
    gap: 16,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  overviewNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6c5ce7",
  },
  overviewLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  insightCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 12,
    flex: 1,
  },
  insightHighlight: {
    fontWeight: "600",
    color: "#333",
  },
  projectRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  projectInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  projectDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  projectName: {
    fontSize: 14,
    color: "#333",
  },
  projectCount: {
    fontSize: 14,
    color: "#666",
  },
  priorityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  priorityCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    minWidth: 80,
  },
  priorityCount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 8,
  },
  priorityLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  chartPlaceholder: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  chartPlaceholderText: {
    fontSize: 14,
    color: "#999",
  },
});

export default function Stats() {
  return (
    <ProtectedRoute>
      <StatsScreen />
    </ProtectedRoute>
  );
}


