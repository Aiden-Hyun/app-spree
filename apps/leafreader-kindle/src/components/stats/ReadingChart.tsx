import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";

const { width: screenWidth } = Dimensions.get("window");

interface ReadingChartProps {
  data: {
    day: string;
    minutes: number;
  }[];
  dailyGoal: number;
}

export function ReadingChart({ data, dailyGoal = 30 }: ReadingChartProps) {
  const maxMinutes = Math.max(...data.map((d) => d.minutes), dailyGoal);
  const chartHeight = 200;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weekly Reading Activity</Text>

      <View style={styles.chart}>
        {/* Goal line */}
        <View
          style={[
            styles.goalLine,
            { bottom: (dailyGoal / maxMinutes) * chartHeight },
          ]}
        />
        <Text
          style={[
            styles.goalLabel,
            { bottom: (dailyGoal / maxMinutes) * chartHeight + 5 },
          ]}
        >
          Goal: {dailyGoal} min
        </Text>

        {/* Bars */}
        <View style={styles.bars}>
          {data.map((day, index) => {
            const barHeight = (day.minutes / maxMinutes) * chartHeight;
            const meetsGoal = day.minutes >= dailyGoal;

            return (
              <View key={index} style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: meetsGoal ? "#27ae60" : "#e0e0e0",
                    },
                  ]}
                />
                <Text style={styles.barValue}>
                  {day.minutes > 0 ? `${day.minutes}m` : ""}
                </Text>
                <Text style={styles.dayLabel}>{day.day}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#27ae60" }]} />
          <Text style={styles.legendText}>Goal reached</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#e0e0e0" }]} />
          <Text style={styles.legendText}>Below goal</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 20,
  },
  chart: {
    height: 220,
    position: "relative",
  },
  goalLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#f39c12",
    borderStyle: "dashed",
    zIndex: 1,
  },
  goalLabel: {
    position: "absolute",
    right: 0,
    fontSize: 12,
    color: "#f39c12",
    backgroundColor: "white",
    paddingHorizontal: 4,
  },
  bars: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 200,
    paddingTop: 20,
  },
  barContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  bar: {
    width: "80%",
    borderRadius: 4,
    minHeight: 2,
  },
  barValue: {
    fontSize: 10,
    color: "#666",
    marginTop: 4,
    marginBottom: 8,
  },
  dayLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    gap: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#666",
  },
});
