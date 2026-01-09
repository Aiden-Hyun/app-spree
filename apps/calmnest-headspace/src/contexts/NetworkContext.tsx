import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as Network from 'expo-network';

interface NetworkContextType {
  isConnected: boolean;
  isOffline: boolean;
  isLoading: boolean;
  refresh: () => Promise<boolean>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

interface NetworkProviderProps {
  children: ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Check network state
  const checkNetworkState = useCallback(async (): Promise<boolean> => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      const connected = networkState.isConnected ?? false;
      return connected;
    } catch (error) {
      return false;
    }
  }, []);

  useEffect(() => {
    // Get initial state
    checkNetworkState().then((connected) => {
      setIsConnected(connected);
      setIsLoading(false);
    });

    // Poll for network changes every 2 seconds (expo-network doesn't have event listener)
    const interval = setInterval(async () => {
      const connected = await checkNetworkState();
      setIsConnected(connected);
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [checkNetworkState]);

  // Manual refresh function that returns the current connection state
  const refresh = useCallback(async (): Promise<boolean> => {
    const connected = await checkNetworkState();
    setIsConnected(connected);
    return connected;
  }, [checkNetworkState]);

  return (
    <NetworkContext.Provider
      value={{
        isConnected,
        isOffline: !isConnected,
        isLoading,
        refresh,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork(): NetworkContextType {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}
