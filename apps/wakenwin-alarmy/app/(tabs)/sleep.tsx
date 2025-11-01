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
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../src/supabase";

interface SleepSession {
  id: string;
  start_time: string;
  end_time: string;
  quality_rating?: number;
}

function SleepScreen() {
  const { user } = useAuth();
  const [sleepSessions, setSleepSessions] = useState<SleepSession[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [currentSessionStart, setCurrentSessionStart] = useState<Date | null>(
    null
  );

  useEffect(() => {
    fetchRecentSleepSessions();
  }, []);

  const fetchRecentSleepSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("sleep_sessions")
        .select("*")
        .eq("user_id", user?.id)
        .order("start_time", { ascending: false })
        .limit(7);

      if (error) throw error;
      setSleepSessions(data || []);
    } catch (error) {
      console.error("Error fetching sleep sessions:", error);
    }
  };

  const startSleepTracking = () => {
    setIsTracking(true);
    setCurrentSessionStart(new Date());
  };

  const stopSleepTracking = async () => {
    if (!currentSessionStart) return;

    try {
      const { error } = await supabase.from("sleep_sessions").insert({
        user_id: user?.id,
        start_time: currentSessionStart.toISOString(),
        end_time: new Date().toISOString(),
      });

      if (error) throw error;

      setIsTracking(false);
      setCurrentSessionStart(null);
      fetchRecentSleepSessions();
    } catch (error) {
      console.error("Error saving sleep session:", error);
    }
  };

  const calculateDuration = (start: string, end: string) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getOptimalSleepMessage = () => {
    const hour = new Date().getHours();
    if (hour < 10) return "Good morning! Track your sleep tonight.";
    if (hour < 20) return "Prepare for a good night's sleep.";
    return "Time to wind down for optimal rest.";
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="moon" size={48} color="#f39c12" />
        <Text style={styles.headerText}>{getOptimalSleepMessage()}</Text>
      </View>

      {!isTracking ? (
        <TouchableOpacity
          style={styles.sleepButton}
          onPress={startSleepTracking}
        >
          <Ionicons name="bed-outline" size={32} color="#fff" />
          <Text style={styles.sleepButtonText}>Start Sleep Tracking</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.sleepButton, styles.wakingButton]}
          onPress={stopSleepTracking}
        >
          <Ionicons name="sunny-outline" size={32} color="#fff" />
          <Text style={styles.sleepButtonText}>I'm Awake!</Text>
        </TouchableOpacity>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sleep Sounds</Text>
        <View style={styles.soundsGrid}>
          {["Rain", "Ocean", "White Noise", "Forest"].map((sound) => (
            <TouchableOpacity key={sound} style={styles.soundCard}>
              <Ionicons name="musical-notes" size={24} color="#f39c12" />
              <Text style={styles.soundName}>{sound}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Sleep</Text>
        {sleepSessions.length === 0 ? (
          <Text style={styles.emptyText}>No sleep sessions recorded yet</Text>
        ) : (
          sleepSessions.map((session) => (
            <View key={session.id} style={styles.sleepCard}>
              <View style={styles.sleepInfo}>
                <Text style={styles.sleepDate}>
                  {new Date(session.start_time).toLocaleDateString()}
                </Text>
                <Text style={styles.sleepDuration}>
                  {calculateDuration(session.start_time, session.end_time)}
                </Text>
              </View>
              {session.quality_rating && (
                <View style={styles.ratingContainer}>
                  {[...Array(5)].map((_, i) => (
                    <Ionicons
                      key={i}
                      name={
                        i < session.quality_rating ? "star" : "star-outline"
                      }
                      size={16}
                      color="#f39c12"
                    />
                  ))}
                </View>
              )}
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Power Nap Timer</Text>
        <View style={styles.napOptions}>
          {[15, 20, 30, 45].map((minutes) => (
            <TouchableOpacity
              key={minutes}
              style={styles.napCard}
              onPress={async () => {
                try {
                  // In a real app, you would use NotificationService.scheduleNapTimer(minutes)
                  Alert.alert(
                    "Nap Timer Set",
                    `You'll be woken up in ${minutes} minutes`,
                    [{ text: "OK" }]
                  );
                } catch (error) {
                  console.error("Error setting nap timer:", error);
                }
              }}
            >
              <Text style={styles.napMinutes}>{minutes}</Text>
              <Text style={styles.napLabel}>min</Text>
            </TouchableOpacity>
          ))}
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
    alignItems: "center",
    padding: 20,
  },
  headerText: {
    fontSize: 18,
    color: "#7f8c8d",
    marginTop: 12,
    textAlign: "center",
  },
  sleepButton: {
    backgroundColor: "#3498db",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    margin: 16,
    borderRadius: 16,
    gap: 12,
  },
  wakingButton: {
    backgroundColor: "#e74c3c",
  },
  sleepButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 16,
  },
  soundsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  soundCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
    minWidth: "45%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  soundName: {
    fontSize: 14,
    color: "#2c3e50",
    marginTop: 8,
  },
  sleepCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sleepInfo: {
    flex: 1,
  },
  sleepDate: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  sleepDuration: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    gap: 2,
  },
  emptyText: {
    fontSize: 14,
    color: "#95a5a6",
    textAlign: "center",
    paddingVertical: 20,
  },
  napOptions: {
    flexDirection: "row",
    gap: 12,
  },
  napCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  napMinutes: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#f39c12",
  },
  napLabel: {
    fontSize: 12,
    color: "#7f8c8d",
  },
});

export default function Sleep() {
  return (
    <ProtectedRoute>
      <SleepScreen />
    </ProtectedRoute>
  );
}
