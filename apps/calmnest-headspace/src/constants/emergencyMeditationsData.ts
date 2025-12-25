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
    audioKey: 'emergency_panic',
  },
  {
    id: 'emergency_anxiety',
    title: 'Anxiety SOS',
    description: 'Quick anxiety reset',
    duration_minutes: 3,
    icon: 'pulse',
    color: '#9575CD',
    audioKey: 'emergency_anxiety',
  },
  {
    id: 'emergency_stress',
    title: 'Stress Reset',
    description: 'Release tension now',
    duration_minutes: 2,
    icon: 'thunderstorm',
    color: '#4DB6AC',
    audioKey: 'emergency_stress',
  },
  {
    id: 'emergency_breath',
    title: 'Calm Breathing',
    description: '4-7-8 breathing technique',
    duration_minutes: 1,
    icon: 'fitness',
    color: '#64B5F6',
    audioKey: 'emergency_breath',
  },
  {
    id: 'emergency_ground',
    title: 'Ground Yourself',
    description: '5-4-3-2-1 grounding',
    duration_minutes: 3,
    icon: 'earth',
    color: '#81C784',
    audioKey: 'emergency_ground',
  },
];

