import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SecurityStats } from "../contexts/SecurityContext";

interface SecurityScoreProps {
  stats: SecurityStats;
}

export function SecurityScore({ stats }: SecurityScoreProps) {
  const getScoreColor = (score: number): string => {
    if (score >= 80) return "#2ecc71";
    if (score >= 60) return "#f39c12";
    if (score >= 40) return "#e67e22";
    return "#e74c3c";
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  };

  const scoreColor = getScoreColor(stats.securityScore);
  const scoreLabel = getScoreLabel(stats.securityScore);

  return (
    <View style={styles.container}>
      <View style={styles.scoreCircle}>
        <View
          style={[
            styles.scoreRing,
            {
              borderColor: scoreColor,
              borderWidth: 12,
            },
          ]}
        >
          <Text style={[styles.scoreNumber, { color: scoreColor }]}>
            {stats.securityScore}
          </Text>
          <Text style={styles.scoreMax}>/100</Text>
        </View>
      </View>

      <Text style={[styles.scoreLabel, { color: scoreColor }]}>
        {scoreLabel}
      </Text>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalPasswords}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text
            style={[
              styles.statNumber,
              stats.weakPasswords > 0 && styles.warningText,
            ]}
          >
            {stats.weakPasswords}
          </Text>
          <Text style={styles.statLabel}>Weak</Text>
        </View>
        <View style={styles.statItem}>
          <Text
            style={[
              styles.statNumber,
              stats.reusedPasswords > 0 && styles.warningText,
            ]}
          >
            {stats.reusedPasswords}
          </Text>
          <Text style={styles.statLabel}>Reused</Text>
        </View>
        <View style={styles.statItem}>
          <Text
            style={[
              styles.statNumber,
              stats.oldPasswords > 0 && styles.warningText,
            ]}
          >
            {stats.oldPasswords}
          </Text>
          <Text style={styles.statLabel}>Old</Text>
        </View>
      </View>

      {(stats.weakPasswords > 0 ||
        stats.reusedPasswords > 0 ||
        stats.oldPasswords > 0) && (
        <View style={styles.recommendations}>
          <Text style={styles.recommendationTitle}>Recommendations:</Text>
          {stats.weakPasswords > 0 && (
            <Text style={styles.recommendationText}>
              • Update {stats.weakPasswords} weak password
              {stats.weakPasswords > 1 ? "s" : ""}
            </Text>
          )}
          {stats.reusedPasswords > 0 && (
            <Text style={styles.recommendationText}>
              • Replace {stats.reusedPasswords} reused password
              {stats.reusedPasswords > 1 ? "s" : ""}
            </Text>
          )}
          {stats.oldPasswords > 0 && (
            <Text style={styles.recommendationText}>
              • Update {stats.oldPasswords} old password
              {stats.oldPasswords > 1 ? "s" : ""} (90+ days)
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 20,
  },
  scoreCircle: {
    marginBottom: 16,
  },
  scoreRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: "bold",
  },
  scoreMax: {
    fontSize: 20,
    color: "#636e72",
  },
  scoreLabel: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2d3436",
  },
  statLabel: {
    fontSize: 14,
    color: "#636e72",
    marginTop: 4,
  },
  warningText: {
    color: "#e74c3c",
  },
  recommendations: {
    width: "100%",
    backgroundColor: "#fff9c4",
    padding: 16,
    borderRadius: 12,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
});
