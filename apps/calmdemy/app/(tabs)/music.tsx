import { ProtectedRoute } from '@shared/ui/ProtectedRoute';
import { MusicScreen } from '../../src/features/music/screens/MusicScreen';

export default function Music() {
  return (
    <ProtectedRoute>
      <MusicScreen />
    </ProtectedRoute>
  );
}
