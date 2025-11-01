import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { supabase } from "../supabase";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  private static notificationListener: any;
  private static responseListener: any;

  static async initialize() {
    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      console.warn("Notification permissions not granted");
      return false;
    }

    // Configure channel for Android
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("alarms", {
        name: "Alarms",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#f39c12",
        sound: "default",
      });
    }

    return true;
  }

  static async scheduleAlarmNotification(alarm: {
    id: string;
    time: string;
    days_of_week: number[];
    challenge_type: string;
    label?: string;
  }) {
    const [hours, minutes] = alarm.time.split(":").map(Number);

    // Cancel existing notifications for this alarm
    await this.cancelAlarmNotifications(alarm.id);

    // Schedule notifications for each selected day
    const scheduledNotifications: string[] = [];

    for (const dayOfWeek of alarm.days_of_week) {
      const trigger = {
        hour: hours,
        minute: minutes,
        weekday: dayOfWeek === 7 ? 1 : dayOfWeek + 1, // Convert to expo format (1=Sunday)
        repeats: true,
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "⏰ Wake Up!",
          body:
            alarm.label || `Time for your ${alarm.challenge_type} challenge`,
          sound: "default",
          data: {
            alarmId: alarm.id,
            challengeType: alarm.challenge_type,
            type: "alarm",
          },
        },
        trigger,
      });

      scheduledNotifications.push(notificationId);
    }

    // Store notification IDs in the database
    await supabase
      .from("alarms")
      .update({
        notification_ids: scheduledNotifications,
        updated_at: new Date().toISOString(),
      })
      .eq("id", alarm.id);

    return scheduledNotifications;
  }

  static async cancelAlarmNotifications(alarmId: string) {
    // Get notification IDs from database
    const { data } = await supabase
      .from("alarms")
      .select("notification_ids")
      .eq("id", alarmId)
      .single();

    if (data?.notification_ids) {
      for (const notificationId of data.notification_ids) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
      }
    }
  }

  static async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  static setupNotificationListeners(
    onNotificationReceived: (notification: Notifications.Notification) => void,
    onNotificationResponse: (
      response: Notifications.NotificationResponse
    ) => void
  ) {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(
      onNotificationReceived
    );

    // Listener for user interaction with notifications
    this.responseListener =
      Notifications.addNotificationResponseReceivedListener(
        onNotificationResponse
      );
  }

  static removeNotificationListeners() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  static async scheduleSleepReminder(hour: number, minute: number) {
    const trigger = {
      hour,
      minute,
      repeats: true,
    };

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: "🌙 Time to Sleep",
        body: "Start winding down for a good night's rest",
        sound: "default",
        data: { type: "sleep_reminder" },
      },
      trigger,
    });
  }

  static async scheduleNapTimer(minutes: number) {
    const trigger = {
      seconds: minutes * 60,
    };

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ Nap Time's Up!",
        body: "Time to wake up from your power nap",
        sound: "default",
        data: { type: "nap_timer" },
      },
      trigger,
    });
  }

  static async getScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
  }
}
