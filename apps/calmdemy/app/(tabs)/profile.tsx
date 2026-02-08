import { ProtectedRoute } from '@shared/ui/ProtectedRoute';
import { ProfileScreen } from '../../src/features/profile/screens/ProfileScreen';

export default function Profile() {
  return (
    <ProtectedRoute>
      <ProfileScreen />
    </ProtectedRoute>
  );
}
