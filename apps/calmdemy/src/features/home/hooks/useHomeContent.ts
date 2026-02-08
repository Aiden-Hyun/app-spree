import { useContentPreload } from '@core/providers/contexts/ContentPreloadContext';

export function useHomeContent() {
  const { homeContent, refreshHome } = useContentPreload();
  return { homeContent, refreshHome };
}
