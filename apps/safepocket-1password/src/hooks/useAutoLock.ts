import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "../contexts/AuthContext";

const AUTO_LOCK_TIMEOUT_KEY = "auto_lock_timeout";
const DEFAULT_TIMEOUT_MINUTES = 15;

export function useAutoLock() {
  const { isVaultUnlocked, lockVault } = useAuth();
  const appStateRef = useRef(AppState.currentState);
  const backgroundTimeRef = useRef<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isVaultUnlocked) return;

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      // App has gone to background
      if (
        appStateRef.current.match(/active/) &&
        nextAppState.match(/inactive|background/)
      ) {
        backgroundTimeRef.current = new Date();
        startAutoLockTimer();
      }

      // App has come to foreground
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        clearAutoLockTimer();

        if (backgroundTimeRef.current) {
          const timeoutMinutes = await getAutoLockTimeout();
          const elapsedMinutes =
            (new Date().getTime() - backgroundTimeRef.current.getTime()) /
            (1000 * 60);

          if (elapsedMinutes >= timeoutMinutes) {
            lockVault();
          }
        }
      }

      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
      clearAutoLockTimer();
    };
  }, [isVaultUnlocked, lockVault]);

  const startAutoLockTimer = async () => {
    clearAutoLockTimer();

    const timeoutMinutes = await getAutoLockTimeout();
    const timeoutMs = timeoutMinutes * 60 * 1000;

    timeoutRef.current = setTimeout(() => {
      lockVault();
    }, timeoutMs);
  };

  const clearAutoLockTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const getAutoLockTimeout = async (): Promise<number> => {
    try {
      const timeout = await SecureStore.getItemAsync(AUTO_LOCK_TIMEOUT_KEY);
      return timeout ? parseInt(timeout, 10) : DEFAULT_TIMEOUT_MINUTES;
    } catch {
      return DEFAULT_TIMEOUT_MINUTES;
    }
  };

  const setAutoLockTimeout = async (minutes: number): Promise<void> => {
    await SecureStore.setItemAsync(AUTO_LOCK_TIMEOUT_KEY, minutes.toString());
  };

  const resetActivity = () => {
    if (isVaultUnlocked) {
      backgroundTimeRef.current = null;
      startAutoLockTimer();
    }
  };

  return {
    getAutoLockTimeout,
    setAutoLockTimeout,
    resetActivity,
  };
}
