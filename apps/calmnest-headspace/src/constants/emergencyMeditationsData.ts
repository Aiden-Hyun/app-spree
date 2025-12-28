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
  narrator?: string;
  thumbnailUrl?: string;
}

export const emergencyMeditationsData: EmergencyMeditation[] = [
  {
    id: 'emergency_panic',
    title: 'Panic Relief',
    description: 'Calm racing thoughts fast',
    duration_minutes: 4,
    icon: 'flash',
    color: '#E57373',
    audioKey: 'emergency_panic_relief',
    narrator: 'Brittney',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=400&q=80',
  },
  {
    id: 'emergency_478_breathing',
    title: '4-7-8 Breathing',
    description: 'Soothing breath pattern for instant calm',
    duration_minutes: 2,
    icon: 'fitness',
    color: '#64B5C6',
    audioKey: 'emergency_478_breathing',
    narrator: 'Rachel',
    thumbnailUrl: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=400&q=80',
  },
];

