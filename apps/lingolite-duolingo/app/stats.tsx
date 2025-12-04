import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useAuth } from "../src/contexts/AuthContext";
import { ProtectedRoute } from "../src/components/ProtectedRoute";

function StatsScreen() {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Detailed Statistics</Text>
        <Text style={styles.subtitle}>Your complete learning analytics</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Learning Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Total Study Days</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0h 0m</Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Words Mastered</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0%</Text>
            <Text style={styles.statLabel}>Accuracy Rate</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Language Progress</Text>
        <View style={styles.languageCard}>
          <View style={styles.languageHeader}>
            <Text style={styles.languageFlag}>🇪🇸</Text>
            <Text style={styles.languageName}>Spanish</Text>
          </View>
          <View style={styles.progressItem}>
            <Text style={styles.progressLabel}>Vocabulary</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: "0%" }]} />
            </View>
            <Text style={styles.progressText}>0 / 60 words</Text>
          </View>
          <View style={styles.progressItem}>
            <Text style={styles.progressLabel}>Grammar</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: "0%" }]} />
            </View>
            <Text style={styles.progressText}>0 / 15 lessons</Text>
          </View>
          <View style={styles.progressItem}>
            <Text style={styles.progressLabel}>Conversation</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: "0%" }]} />
            </View>
            <Text style={styles.progressText}>0 / 15 lessons</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Activity</Text>
        <View style={styles.activityChart}>
          <View style={styles.chartLabels}>
            <Text style={styles.chartLabel}>100</Text>
            <Text style={styles.chartLabel}>50</Text>
            <Text style={styles.chartLabel}>0</Text>
          </View>
          <View style={styles.chartBars}>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
              (day, index) => (
                <View key={index} style={styles.dayContainer}>
                  <View style={styles.barContainer}>
                    <View style={[styles.bar, { height: 4 }]} />
                  </View>
                  <Text style={styles.dayLabel}>{day}</Text>
                </View>
              )
            )}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Milestones</Text>
        <View style={styles.milestoneCard}>
          <Text style={styles.milestoneIcon}>🎯</Text>
          <View style={styles.milestoneInfo}>
            <Text style={styles.milestoneTitle}>Ready to Start!</Text>
            <Text style={styles.milestoneDesc}>
              Complete your first lesson to begin tracking milestones
            </Text>
          </View>
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
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d3436",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#00b894",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  languageCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  languageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d3436",
  },
  progressItem: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2d3436",
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginBottom: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#00b894",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: "#666",
  },
  activityChart: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartLabels: {
    marginRight: 12,
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  chartLabel: {
    fontSize: 12,
    color: "#666",
  },
  chartBars: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  dayContainer: {
    flex: 1,
    alignItems: "center",
  },
  barContainer: {
    height: 100,
    width: "60%",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  bar: {
    width: "100%",
    backgroundColor: "#00b894",
    borderRadius: 2,
  },
  dayLabel: {
    fontSize: 12,
    color: "#666",
  },
  milestoneCard: {
    backgroundColor: "#e8f8f5",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  milestoneIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 4,
  },
  milestoneDesc: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
});

export default function Stats() {
  return (
    <ProtectedRoute>
      <StatsScreen />
    </ProtectedRoute>
  );
}


