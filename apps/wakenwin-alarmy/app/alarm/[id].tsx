import React, { useState, useEffect } from "react";
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
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "../../src/supabase";
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

interface Alarm {
  id: string;
  time: string;
  days_of_week: number[];
  challenge_type: string;
  is_active: boolean;
}

function EditAlarmScreen() {
  const { user } = useAuth();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [alarm, setAlarm] = useState<Alarm | null>(null);
  const [time, setTime] = useState(new Date());
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [challengeType, setChallengeType] = useState("basic");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAlarm();
  }, []);

  const fetchAlarm = async () => {
    try {
      const { data, error } = await supabase
        .from("alarms")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (data) {
        setAlarm(data);

        // Parse time
        const [hours, minutes] = data.time.split(":");
        const date = new Date();
        date.setHours(parseInt(hours));
        date.setMinutes(parseInt(minutes));
        setTime(date);

        setSelectedDays(data.days_of_week);
        setChallengeType(data.challenge_type);
      }
    } catch (error) {
      console.error("Error fetching alarm:", error);
      Alert.alert("Error", "Failed to load alarm");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (dayId: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayId)
        ? prev.filter((d) => d !== dayId)
        : [...prev, dayId].sort()
    );
  };

  const updateAlarm = async () => {
    if (selectedDays.length === 0) {
      Alert.alert("Error", "Please select at least one day");
      return;
    }

    setSaving(true);
    try {
      const hours = time.getHours().toString().padStart(2, "0");
      const minutes = time.getMinutes().toString().padStart(2, "0");
      const timeString = `${hours}:${minutes}:00`;

      const { error } = await supabase
        .from("alarms")
        .update({
          time: timeString,
          days_of_week: selectedDays,
          challenge_type: challengeType,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      Alert.alert("Success", "Alarm updated successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Error updating alarm:", error);
      Alert.alert("Error", "Failed to update alarm");
    } finally {
      setSaving(false);
    }
  };

  const deleteAlarm = async () => {
    Alert.alert("Delete Alarm", "Are you sure you want to delete this alarm?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from("alarms")
              .delete()
              .eq("id", id);

            if (error) throw error;
            router.back();
          } catch (error) {
            console.error("Error deleting alarm:", error);
            Alert.alert("Error", "Failed to delete alarm");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

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
          style={[styles.button, styles.deleteButton]}
          onPress={deleteAlarm}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={updateAlarm}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "Saving..." : "Save Changes"}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#7f8c8d",
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
  deleteButton: {
    backgroundColor: "#e74c3c",
  },
  saveButton: {
    backgroundColor: "#f39c12",
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});

export default function EditAlarm() {
  return (
    <ProtectedRoute>
      <EditAlarmScreen />
    </ProtectedRoute>
  );
}
