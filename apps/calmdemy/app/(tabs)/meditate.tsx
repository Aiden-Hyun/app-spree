import { ProtectedRoute } from '@shared/ui/ProtectedRoute';
import { MeditateScreen } from '../../src/features/meditate/screens/MeditateScreen';

export default function Meditate() {
  return (
    <ProtectedRoute>
      <MeditateScreen />
    </ProtectedRoute>
  );
}
