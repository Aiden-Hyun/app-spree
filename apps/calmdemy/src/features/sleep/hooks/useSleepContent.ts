import { useContentPreload } from '@core/providers/contexts/ContentPreloadContext';

export function useSleepContent() {
  const { sleepContent, refreshSleep } = useContentPreload();
  return { sleepContent, refreshSleep };
}
