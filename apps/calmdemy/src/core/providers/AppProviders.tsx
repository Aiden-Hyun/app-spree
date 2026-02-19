import React from 'react';
import { AuthProvider } from '@core/providers/contexts/AuthContext';
import { ThemeProvider } from '@core/providers/contexts/ThemeContext';
import { NetworkProvider } from '@core/providers/contexts/NetworkContext';
import { SleepTimerProvider } from '@core/providers/contexts/SleepTimerContext';
import { SubscriptionProvider } from '@core/providers/contexts/SubscriptionContext';
import { OfflineNavigator } from '@shared/ui/OfflineNavigator';
import { QueryProvider } from './QueryProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <NetworkProvider>
              <SleepTimerProvider>
                <OfflineNavigator>
                  {children}
                </OfflineNavigator>
              </SleepTimerProvider>
            </NetworkProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
