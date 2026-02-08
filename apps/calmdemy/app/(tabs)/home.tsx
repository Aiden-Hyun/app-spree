import { ProtectedRoute } from '@shared/ui/ProtectedRoute';
import { HomeScreen } from '../../src/features/home/screens/HomeScreen';

export default function Home() {
  return (
    <ProtectedRoute>
      <HomeScreen />
    </ProtectedRoute>
  );
}
