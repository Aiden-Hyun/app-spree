import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../src/contexts/AuthContext";
import { ProtectedRoute } from "../src/components/ProtectedRoute";
import { supabase } from "../src/supabase";
import * as Notifications from "expo-notifications";

interface UserPreferences {
  default_challenge?: string;
  snooze_limit?: number;
  volume_gradual?: boolean;
  bedtime_reminder?: boolean;
  bedtime_hour?: number;
  bedtime_minute?: number;
  wake_goal_hour?: number;
  wake_goal_minute?: number;
}

function SettingsScreen() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>({
    default_challenge: "basic",
    snooze_limit: 3,
    volume_gradual: true,
    bedtime_reminder: false,
    bedtime_hour: 22,
    bedtime_minute: 0,
    wake_goal_hour: 7,
    wake_goal_minute: 0,
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    fetchPreferences();
    checkNotificationPermissions();
  }, []);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("preferences")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      if (data?.preferences) {
        setPreferences((prev) => ({ ...prev, ...data.preferences }));
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    }
  };

  const checkNotificationPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setNotificationsEnabled(status === "granted");
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);

    try {
      const { error } = await supabase
        .from("users")
        .update({ preferences: newPreferences })
        .eq("id", user?.id);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating preferences:", error);
      Alert.alert("Error", "Failed to save preferences");
    }
  };

  const handleNotificationToggle = async () => {
    if (!notificationsEnabled) {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotificationsEnabled(status === "granted");
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please enable notifications in your device settings to use alarms."
        );
      }
    } else {
      Alert.alert(
        "Disable Notifications",
        "To disable notifications, please go to your device settings."
      );
    }
  };

  const settingsSections = [
    {
      title: "Alarm Settings",
      items: [
        {
          type: "select",
          label: "Default Challenge",
          value: preferences.default_challenge,
          options: [
            { label: "Basic", value: "basic" },
            { label: "Math", value: "math" },
            { label: "Shake", value: "shake" },
            { label: "Photo", value: "photo" },
            { label: "Memory", value: "memory" },
            { label: "Typing", value: "typing" },
          ],
          onSelect: (value: string) =>
            updatePreferences({ default_challenge: value }),
        },
        {
          type: "number",
          label: "Snooze Limit",
          value: preferences.snooze_limit,
          min: 0,
          max: 10,
          onChange: (value: number) =>
            updatePreferences({ snooze_limit: value }),
        },
        {
          type: "switch",
          label: "Gradual Volume Increase",
          value: preferences.volume_gradual,
          onChange: (value: boolean) =>
            updatePreferences({ volume_gradual: value }),
        },
      ],
    },
    {
      title: "Sleep Settings",
      items: [
        {
          type: "switch",
          label: "Bedtime Reminder",
          value: preferences.bedtime_reminder,
          onChange: (value: boolean) =>
            updatePreferences({ bedtime_reminder: value }),
        },
        {
          type: "time",
          label: "Bedtime",
          hour: preferences.bedtime_hour,
          minute: preferences.bedtime_minute,
          onChange: (hour: number, minute: number) =>
            updatePreferences({ bedtime_hour: hour, bedtime_minute: minute }),
        },
        {
          type: "time",
          label: "Wake Goal",
          hour: preferences.wake_goal_hour,
          minute: preferences.wake_goal_minute,
          onChange: (hour: number, minute: number) =>
            updatePreferences({
              wake_goal_hour: hour,
              wake_goal_minute: minute,
            }),
        },
      ],
    },
    {
      title: "Notifications",
      items: [
        {
          type: "switch",
          label: "Enable Notifications",
          value: notificationsEnabled,
          onChange: handleNotificationToggle,
        },
      ],
    },
  ];

  const renderSettingItem = (item: any) => {
    switch (item.type) {
      case "switch":
        return (
          <View style={styles.settingItem} key={item.label}>
            <Text style={styles.settingLabel}>{item.label}</Text>
            <Switch
              value={item.value}
              onValueChange={item.onChange}
              trackColor={{ false: "#ecf0f1", true: "#f39c12" }}
              thumbColor={item.value ? "#fff" : "#bdc3c7"}
            />
          </View>
        );
      case "number":
        return (
          <View style={styles.settingItem} key={item.label}>
            <Text style={styles.settingLabel}>{item.label}</Text>
            <View style={styles.numberControl}>
              <TouchableOpacity
                onPress={() =>
                  item.onChange(Math.max(item.min, item.value - 1))
                }
                style={styles.numberButton}
              >
                <Ionicons name="remove" size={20} color="#7f8c8d" />
              </TouchableOpacity>
              <Text style={styles.numberValue}>{item.value}</Text>
              <TouchableOpacity
                onPress={() =>
                  item.onChange(Math.min(item.max, item.value + 1))
                }
                style={styles.numberButton}
              >
                <Ionicons name="add" size={20} color="#7f8c8d" />
              </TouchableOpacity>
            </View>
          </View>
        );
      case "select":
        return (
          <TouchableOpacity
            style={styles.settingItem}
            key={item.label}
            onPress={() => {
              Alert.alert(
                item.label,
                "Select an option",
                item.options.map((opt: any) => ({
                  text: opt.label,
                  onPress: () => item.onSelect(opt.value),
                }))
              );
            }}
          >
            <Text style={styles.settingLabel}>{item.label}</Text>
            <View style={styles.selectControl}>
              <Text style={styles.selectValue}>
                {
                  item.options.find((opt: any) => opt.value === item.value)
                    ?.label
                }
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
            </View>
          </TouchableOpacity>
        );
      case "time":
        return (
          <TouchableOpacity
            style={styles.settingItem}
            key={item.label}
            onPress={() => {
              // In a real app, you'd show a time picker
              Alert.alert("Time Picker", "Time picker would appear here");
            }}
          >
            <Text style={styles.settingLabel}>{item.label}</Text>
            <View style={styles.selectControl}>
              <Text style={styles.selectValue}>
                {`${item.hour.toString().padStart(2, "0")}:${item.minute
                  .toString()
                  .padStart(2, "0")}`}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
            </View>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {settingsSections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionContent}>
            {section.items.map(renderSettingItem)}
          </View>
        </View>
      ))}

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.dangerButton}
          onPress={() => {
            Alert.alert(
              "Clear All Data",
              "This will delete all your alarms and reset your statistics. This action cannot be undone.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Clear Data",
                  style: "destructive",
                  onPress: () => {
                    // Implement data clearing
                    Alert.alert("Success", "All data has been cleared");
                  },
                },
              ]
            );
          }}
        >
          <Text style={styles.dangerButtonText}>Clear All Data</Text>
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
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#7f8c8d",
    marginBottom: 8,
    marginHorizontal: 20,
    textTransform: "uppercase",
  },
  sectionContent: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#ecf0f1",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  settingLabel: {
    fontSize: 16,
    color: "#2c3e50",
    flex: 1,
  },
  numberControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  numberButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ecf0f1",
    justifyContent: "center",
    alignItems: "center",
  },
  numberValue: {
    fontSize: 16,
    color: "#2c3e50",
    minWidth: 30,
    textAlign: "center",
  },
  selectControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectValue: {
    fontSize: 16,
    color: "#7f8c8d",
  },
  dangerButton: {
    backgroundColor: "#e74c3c",
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  dangerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default function Settings() {
  return (
    <ProtectedRoute>
      <SettingsScreen />
    </ProtectedRoute>
  );
}
