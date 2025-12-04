import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { NotificationService } from "../services/notificationService";
import { router } from "expo-router";

export function useNotifications() {
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    // Initialize notification service
    NotificationService.initialize();

    // Set up listeners
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received:", notification);

        const data = notification.request.content.data;
        if (data?.type === "alarm") {
          // Handle alarm notification while app is open
          // Could show a custom in-app alarm screen
        }
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response:", response);

        const data = response.notification.request.content.data;
        if (data?.type === "alarm" && data?.alarmId) {
          // Navigate to challenge screen
          router.push(
            `/challenge/${data.challengeType}?alarmId=${data.alarmId}`
          );
        } else if (data?.type === "sleep_reminder") {
          // Navigate to sleep tab
          router.push("/(tabs)/sleep");
        } else if (data?.type === "nap_timer") {
          // Show nap completed screen
          router.push("/nap-complete");
        }
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const scheduleAlarmNotification = async (alarm: any) => {
    return await NotificationService.scheduleAlarmNotification(alarm);
  };

  const cancelAlarmNotifications = async (alarmId: string) => {
    return await NotificationService.cancelAlarmNotifications(alarmId);
  };

  const scheduleSleepReminder = async (hour: number, minute: number) => {
    return await NotificationService.scheduleSleepReminder(hour, minute);
  };

  const scheduleNapTimer = async (minutes: number) => {
    return await NotificationService.scheduleNapTimer(minutes);
  };

  const getScheduledNotifications = async () => {
    return await NotificationService.getScheduledNotifications();
  };

  return {
    scheduleAlarmNotification,
    cancelAlarmNotifications,
    scheduleSleepReminder,
    scheduleNapTimer,
    getScheduledNotifications,
  };
}


