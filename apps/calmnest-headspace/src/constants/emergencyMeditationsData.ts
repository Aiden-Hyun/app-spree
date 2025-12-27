/**
 * Emergency Meditations - Quick 1-3 minute sessions for immediate relief
 * For moments of panic, anxiety, or acute stress
 */

export interface EmergencyMeditation {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  icon: string;
  color: string;
  audioKey: string;
}

export const emergencyMeditationsData: EmergencyMeditation[] = [
  {
    id: 'emergency_panic',
    title: 'Panic Relief',
    description: 'Calm racing thoughts fast',
    duration_minutes: 2,
    icon: 'flash',
    color: '#E57373',
    audioKey: 'emergency_panic_relief',
  },
];

