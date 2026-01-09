import React, { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { useNetwork } from '../contexts/NetworkContext';

interface OfflineNavigatorProps {
  children: React.ReactNode;
}

/**
 * Component that monitors network status and automatically navigates
 * to the downloads page when offline, and back when online.
 */
export function OfflineNavigator({ children }: OfflineNavigatorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isOffline, isLoading } = useNetwork();
  const previousPathRef = useRef<string | null>(null);
  const isOnDownloadsPage = pathname === '/downloads';
  const hasNavigatedToOffline = useRef(false);

  useEffect(() => {
    // Don't do anything while loading initial network state
    if (isLoading) return;

    if (isOffline && !isOnDownloadsPage) {
      // Store current path before navigating to downloads
      previousPathRef.current = pathname;
      hasNavigatedToOffline.current = true;
      router.replace('/downloads');
    } else if (!isOffline && hasNavigatedToOffline.current && isOnDownloadsPage) {
      // Connection restored - navigate back to previous page
      hasNavigatedToOffline.current = false;
      if (previousPathRef.current && previousPathRef.current !== '/downloads') {
        router.replace(previousPathRef.current as any);
      } else {
        router.replace('/(tabs)/home');
      }
      previousPathRef.current = null;
    }
  }, [isOffline, isLoading, isOnDownloadsPage, pathname]);

  return <>{children}</>;
}
