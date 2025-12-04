import { useState, useEffect } from "react";
import { AlarmService, Alarm } from "../services/alarmService";
import { useAuth } from "../contexts/AuthContext";

export function useAlarms() {
  const { user } = useAuth();
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAlarms();
    }
  }, [user]);

  const fetchAlarms = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await AlarmService.getAlarms(user.id);
      setAlarms(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching alarms:", err);
      setError("Failed to load alarms");
    } finally {
      setLoading(false);
    }
  };

  const createAlarm = async (
    alarm: Omit<Alarm, "id" | "created_at" | "updated_at" | "user_id">
  ) => {
    if (!user) return;

    try {
      const newAlarm = await AlarmService.createAlarm({
        ...alarm,
        user_id: user.id,
      });
      setAlarms((prev) => [...prev, newAlarm]);
      return newAlarm;
    } catch (err) {
      console.error("Error creating alarm:", err);
      throw err;
    }
  };

  const updateAlarm = async (alarmId: string, updates: Partial<Alarm>) => {
    try {
      const updatedAlarm = await AlarmService.updateAlarm(alarmId, updates);
      setAlarms((prev) =>
        prev.map((alarm) => (alarm.id === alarmId ? updatedAlarm : alarm))
      );
      return updatedAlarm;
    } catch (err) {
      console.error("Error updating alarm:", err);
      throw err;
    }
  };

  const deleteAlarm = async (alarmId: string) => {
    try {
      await AlarmService.deleteAlarm(alarmId);
      setAlarms((prev) => prev.filter((alarm) => alarm.id !== alarmId));
    } catch (err) {
      console.error("Error deleting alarm:", err);
      throw err;
    }
  };

  const toggleAlarm = async (alarmId: string, isActive: boolean) => {
    try {
      await AlarmService.toggleAlarm(alarmId, isActive);
      setAlarms((prev) =>
        prev.map((alarm) =>
          alarm.id === alarmId ? { ...alarm, is_active: isActive } : alarm
        )
      );
    } catch (err) {
      console.error("Error toggling alarm:", err);
      throw err;
    }
  };

  const getNextAlarm = async () => {
    if (!user) return null;

    try {
      return await AlarmService.getNextAlarm(user.id);
    } catch (err) {
      console.error("Error getting next alarm:", err);
      return null;
    }
  };

  return {
    alarms,
    loading,
    error,
    createAlarm,
    updateAlarm,
    deleteAlarm,
    toggleAlarm,
    getNextAlarm,
    refetch: fetchAlarms,
  };
}


