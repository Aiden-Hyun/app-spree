import * as Notifications from "expo-notifications";
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

export interface PushToken {
  token: string;
  platform: "ios" | "android";
}

export class NotificationService {
  private static instance: NotificationService;
  private pushToken: string | null = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Register for push notifications
      const token = await this.registerForPushNotifications();
      if (token) {
        this.pushToken = token;
      }

      // Handle notification responses
      Notifications.addNotificationResponseReceivedListener((response) => {
        this.handleNotificationResponse(response);
      });
    } catch (error) {
      console.error("Error initializing notifications:", error);
    }
  }

  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#e84393",
        });
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Failed to get push token for push notification!");
        return null;
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log("Push token:", token);
      return token;
    } catch (error) {
      console.error("Error registering for push notifications:", error);
      return null;
    }
  }

  async savePushToken(userId: string): Promise<void> {
    if (!this.pushToken) return;

    try {
      const { error } = await supabase.from("push_tokens").upsert(
        {
          user_id: userId,
          token: this.pushToken,
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,token",
        }
      );

      if (error) throw error;
    } catch (error) {
      console.error("Error saving push token:", error);
    }
  }

  async removePushToken(userId: string): Promise<void> {
    if (!this.pushToken) return;

    try {
      const { error } = await supabase
        .from("push_tokens")
        .delete()
        .eq("user_id", userId)
        .eq("token", this.pushToken);

      if (error) throw error;
    } catch (error) {
      console.error("Error removing push token:", error);
    }
  }

  async sendLocalNotification(
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Send immediately
    });
  }

  handleNotificationResponse(
    response: Notifications.NotificationResponse
  ): void {
    const { notification } = response;
    const data = notification.request.content.data;

    // Handle different notification types
    if (data?.type === "message") {
      // Navigate to chat
      if (data.matchId) {
        // Use router to navigate to chat screen
        // This would need to be handled in the app component
        console.log("Navigate to chat:", data.matchId);
      }
    } else if (data?.type === "match") {
      // Navigate to user profile
      if (data.userId) {
        console.log("Navigate to user profile:", data.userId);
      }
    }
  }

  async sendMatchNotification(
    matchedUserName: string,
    matchedUserId: string
  ): Promise<void> {
    await this.sendLocalNotification(
      "It's a Match! 🎉",
      `You and ${matchedUserName} have liked each other!`,
      {
        type: "match",
        userId: matchedUserId,
      }
    );
  }

  async sendMessageNotification(
    senderName: string,
    message: string,
    matchId: string
  ): Promise<void> {
    await this.sendLocalNotification(senderName, message, {
      type: "message",
      matchId,
    });
  }

  async sendTapNotification(
    tapperName: string,
    tapperId: string
  ): Promise<void> {
    await this.sendLocalNotification(
      "Someone tapped you! 👋",
      `${tapperName} is interested in you`,
      {
        type: "tap",
        userId: tapperId,
      }
    );
  }

  async clearAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
  }

  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }
}

export const notificationService = NotificationService.getInstance();


