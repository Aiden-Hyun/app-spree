import { useContentPreload } from '@core/providers/contexts/ContentPreloadContext';

export function useMusicContent() {
  const { musicContent, refreshMusic } = useContentPreload();
  return { musicContent, refreshMusic };
}
