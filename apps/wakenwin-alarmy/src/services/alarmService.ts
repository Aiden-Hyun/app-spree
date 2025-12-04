import { supabase } from "../supabase";
import { NotificationService } from "./notificationService";

export interface Alarm {
  id: string;
  user_id: string;
  time: string;
  days_of_week: number[];
  is_active: boolean;
  challenge_type: string;
  label?: string;
  snooze_limit?: number;
  volume?: number;
  created_at: string;
  updated_at: string;
}

export class AlarmService {
  static async getAlarms(userId: string): Promise<Alarm[]> {
    const { data, error } = await supabase
      .from("alarms")
      .select("*")
      .eq("user_id", userId)
      .order("time", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getAlarm(alarmId: string): Promise<Alarm | null> {
    const { data, error } = await supabase
      .from("alarms")
      .select("*")
      .eq("id", alarmId)
      .single();

    if (error) throw error;
    return data;
  }

  static async createAlarm(
    alarm: Omit<Alarm, "id" | "created_at" | "updated_at">
  ): Promise<Alarm> {
    const { data, error } = await supabase
      .from("alarms")
      .insert(alarm)
      .select()
      .single();

    if (error) throw error;

    // Schedule notifications if alarm is active
    if (data.is_active) {
      await NotificationService.scheduleAlarmNotification(data);
    }

    return data;
  }

  static async updateAlarm(
    alarmId: string,
    updates: Partial<Alarm>
  ): Promise<Alarm> {
    const { data, error } = await supabase
      .from("alarms")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", alarmId)
      .select()
      .single();

    if (error) throw error;

    // Reschedule notifications
    await NotificationService.cancelAlarmNotifications(alarmId);
    if (data.is_active) {
      await NotificationService.scheduleAlarmNotification(data);
    }

    return data;
  }

  static async deleteAlarm(alarmId: string): Promise<void> {
    // Cancel notifications first
    await NotificationService.cancelAlarmNotifications(alarmId);

    const { error } = await supabase.from("alarms").delete().eq("id", alarmId);

    if (error) throw error;
  }

  static async toggleAlarm(alarmId: string, isActive: boolean): Promise<void> {
    const { data, error } = await supabase
      .from("alarms")
      .update({ is_active: isActive })
      .eq("id", alarmId)
      .select()
      .single();

    if (error) throw error;

    // Update notifications
    if (isActive) {
      await NotificationService.scheduleAlarmNotification(data);
    } else {
      await NotificationService.cancelAlarmNotifications(alarmId);
    }
  }

  static async snoozeAlarm(
    alarmId: string,
    minutes: number = 5
  ): Promise<void> {
    // Record snooze in wake_up_sessions
    const { data: alarm } = await this.getAlarm(alarmId);
    if (!alarm) return;

    // Get current session or create new one
    const { data: session } = await supabase
      .from("wake_up_sessions")
      .select("*")
      .eq("alarm_id", alarmId)
      .eq("user_id", alarm.user_id)
      .gte("created_at", new Date(Date.now() - 30 * 60 * 1000).toISOString()) // Within last 30 minutes
      .single();

    if (session) {
      // Update snooze count
      await supabase
        .from("wake_up_sessions")
        .update({ snooze_count: session.snooze_count + 1 })
        .eq("id", session.id);
    } else {
      // Create new session
      await supabase.from("wake_up_sessions").insert({
        user_id: alarm.user_id,
        alarm_id: alarmId,
        wake_up_time: new Date().toISOString(),
        snooze_count: 1,
      });
    }

    // Schedule snooze notification
    await NotificationService.scheduleAlarmNotification({
      ...alarm,
      time: new Date(Date.now() + minutes * 60 * 1000)
        .toTimeString()
        .slice(0, 5),
      days_of_week: [new Date().getDay()],
    });
  }

  static async getNextAlarm(userId: string): Promise<Alarm | null> {
    const alarms = await this.getAlarms(userId);
    const activeAlarms = alarms.filter((a) => a.is_active);

    if (activeAlarms.length === 0) return null;

    const now = new Date();
    const currentDay = now.getDay() || 7; // Convert Sunday from 0 to 7
    const currentTime = now.getHours() * 60 + now.getMinutes();

    let nextAlarm: Alarm | null = null;
    let minMinutesUntilAlarm = Infinity;

    for (const alarm of activeAlarms) {
      const [hours, minutes] = alarm.time.split(":").map(Number);
      const alarmMinutes = hours * 60 + minutes;

      for (const day of alarm.days_of_week) {
        let daysUntil = day - currentDay;
        if (daysUntil < 0) daysUntil += 7;
        if (daysUntil === 0 && alarmMinutes <= currentTime) daysUntil = 7;

        const minutesUntilAlarm =
          daysUntil * 24 * 60 + (alarmMinutes - currentTime);

        if (minutesUntilAlarm < minMinutesUntilAlarm) {
          minMinutesUntilAlarm = minutesUntilAlarm;
          nextAlarm = alarm;
        }
      }
    }

    return nextAlarm;
  }
}


