import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useAuth } from "../../src/contexts/AuthContext";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { router } from "expo-router";
import { useAlarms } from "../../src/hooks/useAlarms";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

const DAYS = [
  { id: 1, label: "Mon", short: "M" },
  { id: 2, label: "Tue", short: "T" },
  { id: 3, label: "Wed", short: "W" },
  { id: 4, label: "Thu", short: "T" },
  { id: 5, label: "Fri", short: "F" },
  { id: 6, label: "Sat", short: "S" },
  { id: 7, label: "Sun", short: "S" },
];

const CHALLENGE_TYPES = [
  {
    id: "basic",
    name: "Basic",
    icon: "checkmark-circle",
    description: "Simple dismiss",
  },
  {
    id: "math",
    name: "Math",
    icon: "calculator",
    description: "Solve math problems",
  },
  {
    id: "shake",
    name: "Shake",
    icon: "phone-portrait",
    description: "Shake your phone",
  },
  {
    id: "photo",
    name: "Photo",
    icon: "camera",
    description: "Take a matching photo",
  },
  {
    id: "memory",
    name: "Memory",
    icon: "grid",
    description: "Repeat sequences",
  },
  {
    id: "typing",
    name: "Typing",
    icon: "text",
    description: "Type phrases",
  },
];

function CreateAlarmScreen() {
  const { createAlarm } = useAlarms();
  const [time, setTime] = useState(new Date());
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Weekdays by default
  const [challengeType, setChallengeType] = useState("basic");
  const [saving, setSaving] = useState(false);

  const toggleDay = (dayId: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayId)
        ? prev.filter((d) => d !== dayId)
        : [...prev, dayId].sort()
    );
  };

  const saveAlarm = async () => {
    if (selectedDays.length === 0) {
      Alert.alert("Error", "Please select at least one day");
      return;
    }

    setSaving(true);
    try {
      const hours = time.getHours().toString().padStart(2, "0");
      const minutes = time.getMinutes().toString().padStart(2, "0");
      const timeString = `${hours}:${minutes}:00`;

      await createAlarm({
        time: timeString,
        days_of_week: selectedDays,
        challenge_type: challengeType,
        is_active: true,
      });

      Alert.alert("Success", "Alarm created successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Error creating alarm:", error);
      Alert.alert("Error", "Failed to create alarm");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Set Time</Text>
        <View style={styles.timePickerContainer}>
          <DateTimePicker
            value={time}
            mode="time"
            is24Hour={false}
            display="spinner"
            onChange={(event, selectedDate) => {
              if (selectedDate) setTime(selectedDate);
            }}
            style={styles.timePicker}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Repeat</Text>
        <View style={styles.daysContainer}>
          {DAYS.map((day) => (
            <TouchableOpacity
              key={day.id}
              style={[
                styles.dayButton,
                selectedDays.includes(day.id) && styles.dayButtonActive,
              ]}
              onPress={() => toggleDay(day.id)}
            >
              <Text
                style={[
                  styles.dayButtonText,
                  selectedDays.includes(day.id) && styles.dayButtonTextActive,
                ]}
              >
                {day.short}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wake-Up Challenge</Text>
        <View style={styles.challengeGrid}>
          {CHALLENGE_TYPES.map((challenge) => (
            <TouchableOpacity
              key={challenge.id}
              style={[
                styles.challengeCard,
                challengeType === challenge.id && styles.challengeCardActive,
              ]}
              onPress={() => setChallengeType(challenge.id)}
            >
              <Ionicons
                name={challenge.icon as any}
                size={32}
                color={challengeType === challenge.id ? "#fff" : "#f39c12"}
              />
              <Text
                style={[
                  styles.challengeName,
                  challengeType === challenge.id && styles.challengeNameActive,
                ]}
              >
                {challenge.name}
              </Text>
              <Text
                style={[
                  styles.challengeDesc,
                  challengeType === challenge.id && styles.challengeDescActive,
                ]}
              >
                {challenge.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={saveAlarm}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "Saving..." : "Save Alarm"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 16,
  },
  timePickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  timePicker: {
    height: 200,
  },
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ecf0f1",
    justifyContent: "center",
    alignItems: "center",
  },
  dayButtonActive: {
    backgroundColor: "#f39c12",
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7f8c8d",
  },
  dayButtonTextActive: {
    color: "#fff",
  },
  challengeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  challengeCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    width: "47%",
    borderWidth: 2,
    borderColor: "#ecf0f1",
  },
  challengeCardActive: {
    backgroundColor: "#f39c12",
    borderColor: "#f39c12",
  },
  challengeName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
    marginTop: 8,
  },
  challengeNameActive: {
    color: "#fff",
  },
  challengeDesc: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 4,
    textAlign: "center",
  },
  challengeDescActive: {
    color: "#fff",
  },
  buttonContainer: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#ecf0f1",
  },
  saveButton: {
    backgroundColor: "#f39c12",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#7f8c8d",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});

export default function CreateAlarm() {
  return (
    <ProtectedRoute>
      <CreateAlarmScreen />
    </ProtectedRoute>
  );
}
