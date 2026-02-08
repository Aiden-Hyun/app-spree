import { ProtectedRoute } from '@shared/ui/ProtectedRoute';
import { SleepScreen } from '../../src/features/sleep/screens/SleepScreen';

export default function Sleep() {
  return (
    <ProtectedRoute>
      <SleepScreen />
    </ProtectedRoute>
  );
}
