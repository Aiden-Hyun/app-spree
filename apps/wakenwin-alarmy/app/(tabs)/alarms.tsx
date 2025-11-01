import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Switch,
} from "react-native";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAlarms } from "../../src/hooks/useAlarms";
import { Alarm } from "../../src/services/alarmService";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

function AlarmsScreen() {
  const { alarms, loading, toggleAlarm, getNextAlarm } = useAlarms();
  const [nextAlarm, setNextAlarm] = useState<Alarm | null>(null);

  useEffect(() => {
    loadNextAlarm();
  }, [alarms]);

  const loadNextAlarm = async () => {
    const next = await getNextAlarm();
    setNextAlarm(next);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const renderAlarm = ({ item }: { item: Alarm }) => (
    <TouchableOpacity
      style={styles.alarmCard}
      onPress={() => router.push(`/alarm/${item.id}`)}
    >
      <View style={styles.alarmInfo}>
        <Text style={styles.alarmTime}>{formatTime(item.time)}</Text>
        {item.label && <Text style={styles.alarmLabel}>{item.label}</Text>}
        <View style={styles.daysContainer}>
          {DAYS.map((day, index) => (
            <Text
              key={index}
              style={[
                styles.dayText,
                item.days_of_week.includes(index + 1) && styles.dayActive,
              ]}
            >
              {day}
            </Text>
          ))}
        </View>
        <Text style={styles.challengeType}>
          Challenge: {item.challenge_type}
        </Text>
      </View>
      <Switch
        value={item.is_active}
        onValueChange={(value) => toggleAlarm(item.id, value)}
        trackColor={{ false: "#ecf0f1", true: "#f39c12" }}
        thumbColor={item.is_active ? "#fff" : "#bdc3c7"}
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {nextAlarm && (
        <View style={styles.nextAlarmContainer}>
          <Text style={styles.nextAlarmLabel}>Next alarm</Text>
          <Text style={styles.nextAlarmTime}>{formatTime(nextAlarm.time)}</Text>
          <Text style={styles.nextAlarmDays}>
            {nextAlarm.days_of_week.map((d) => DAYS[d - 1]).join(", ")}
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading alarms...</Text>
        </View>
      ) : alarms.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alarm-outline" size={64} color="#bdc3c7" />
          <Text style={styles.emptyText}>No alarms set</Text>
          <Text style={styles.emptySubtext}>
            Tap + to create your first alarm
          </Text>
        </View>
      ) : (
        <FlatList
          data={alarms}
          renderItem={renderAlarm}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/alarm/create")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  nextAlarmContainer: {
    backgroundColor: "#f39c12",
    padding: 20,
    alignItems: "center",
  },
  nextAlarmLabel: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.8,
  },
  nextAlarmTime: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 4,
  },
  nextAlarmDays: {
    fontSize: 16,
    color: "#fff",
    marginTop: 4,
    opacity: 0.9,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#7f8c8d",
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#7f8c8d",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#95a5a6",
    marginTop: 8,
  },
  listContent: {
    padding: 16,
  },
  alarmCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alarmInfo: {
    flex: 1,
  },
  alarmTime: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  alarmLabel: {
    fontSize: 14,
    color: "#7f8c8d",
    marginTop: 4,
  },
  daysContainer: {
    flexDirection: "row",
    marginTop: 8,
    gap: 8,
  },
  dayText: {
    fontSize: 12,
    color: "#bdc3c7",
    fontWeight: "600",
  },
  dayActive: {
    color: "#f39c12",
  },
  challengeType: {
    fontSize: 12,
    color: "#95a5a6",
    marginTop: 8,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f39c12",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});

export default function Alarms() {
  return (
    <ProtectedRoute>
      <AlarmsScreen />
    </ProtectedRoute>
  );
}
