import React from 'react';
import { AuthProvider } from '@core/providers/contexts/AuthContext';
import { ThemeProvider } from '@core/providers/contexts/ThemeContext';
import { NetworkProvider } from '@core/providers/contexts/NetworkContext';
import { SleepTimerProvider } from '@core/providers/contexts/SleepTimerContext';
import { SubscriptionProvider } from '@core/providers/contexts/SubscriptionContext';
import { ContentPreloadProvider } from '@core/providers/contexts/ContentPreloadContext';
import { PreloadGate } from '@shared/ui/PreloadGate';
import { OfflineNavigator } from '@shared/ui/OfflineNavigator';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <ContentPreloadProvider>
            <NetworkProvider>
              <SleepTimerProvider>
                <OfflineNavigator>
                  <PreloadGate>{children}</PreloadGate>
                </OfflineNavigator>
              </SleepTimerProvider>
            </NetworkProvider>
          </ContentPreloadProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
