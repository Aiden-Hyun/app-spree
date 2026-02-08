import { useContentPreload } from '@core/providers/contexts/ContentPreloadContext';

export function useMeditateContent() {
  const { meditateContent, refreshMeditate } = useContentPreload();
  return { meditateContent, refreshMeditate };
}
