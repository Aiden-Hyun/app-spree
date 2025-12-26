/**
 * Meditation Techniques - Different approaches to meditation practice
 */

export interface MeditationTechnique {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  longDescription?: string;
}

export interface TechniqueMeditation {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  technique: string;
  instructor: string;
  audioKey: string;
  color: string;
}

export const techniquesData: MeditationTechnique[] = [
  {
    id: 'body-scan',
    title: 'Body Scan',
    description: 'Awareness through the body',
    icon: 'body',
    color: '#7DAFB4',
    longDescription: 'Systematically focus attention on different parts of your body to release tension and increase awareness.',
  },
  {
    id: 'breathing',
    title: 'Breathing Exercises',
    description: 'Breath-focused practices',
    icon: 'fitness',
    color: '#8B9F82',
    longDescription: 'Use the breath as an anchor for attention, calming the nervous system and centering the mind.',
  },
  {
    id: 'visualization',
    title: 'Visualization',
    description: 'Guided imagery journeys',
    icon: 'image',
    color: '#B4A7C7',
    longDescription: 'Create vivid mental images to promote relaxation, healing, and positive emotional states.',
  },
  {
    id: 'mindfulness-walking',
    title: 'Mindful Walking',
    description: 'Moving meditation',
    icon: 'walk',
    color: '#C4A77D',
    longDescription: 'Practice mindfulness while walking, connecting movement with breath and awareness.',
  },
  {
    id: 'progressive-relaxation',
    title: 'Progressive Relaxation',
    description: 'Tension and release',
    icon: 'contract',
    color: '#A8B4C4',
    longDescription: 'Systematically tense and release muscle groups to achieve deep physical and mental relaxation.',
  },
  {
    id: 'loving-kindness',
    title: 'Loving Kindness',
    description: 'Cultivate compassion',
    icon: 'heart',
    color: '#D4A5C7',
    longDescription: 'Direct feelings of love and kindness toward yourself and others to build compassion and connection.',
  },
];

// Placeholder meditations for each technique
export const techniqueMeditationsData: TechniqueMeditation[] = [
  // Body Scan
  {
    id: 'tech_body_scan',
    title: 'Body Scan',
    description: 'Guided awareness through your entire body',
    duration_minutes: 12,
    technique: 'body-scan',
    instructor: 'Delilah',
    audioKey: 'meditation_body_scan',
    color: '#7DAFB4',
  },
  // Breathing
  {
    id: 'tech_breath_box',
    title: 'Box Breathing',
    description: 'Four-square breathing pattern',
    duration_minutes: 5,
    technique: 'breathing',
    instructor: 'Rachel',
    audioKey: 'tech_breath_box',
    color: '#8B9F82',
  },
  {
    id: 'tech_breath_478',
    title: '4-7-8 Breath',
    description: 'Relaxing breath technique',
    duration_minutes: 10,
    technique: 'breathing',
    instructor: 'Rachel',
    audioKey: 'tech_breath_478',
    color: '#8B9F82',
  },
  // Visualization
  {
    id: 'tech_vis_beach',
    title: 'Beach Visualization',
    description: 'Peaceful ocean imagery',
    duration_minutes: 15,
    technique: 'visualization',
    instructor: 'Rachel',
    audioKey: 'tech_vis_beach',
    color: '#B4A7C7',
  },
  {
    id: 'tech_vis_forest',
    title: 'Forest Walk',
    description: 'Tranquil woodland journey',
    duration_minutes: 12,
    technique: 'visualization',
    instructor: 'Rachel',
    audioKey: 'tech_vis_forest',
    color: '#B4A7C7',
  },
  // Mindful Walking
  {
    id: 'tech_walk_intro',
    title: 'Walking Meditation Intro',
    description: 'Learn mindful movement',
    duration_minutes: 10,
    technique: 'mindfulness-walking',
    instructor: 'Rachel',
    audioKey: 'tech_walk_intro',
    color: '#C4A77D',
  },
  {
    id: 'tech_walk_nature',
    title: 'Nature Walk',
    description: 'Outdoor mindfulness practice',
    duration_minutes: 15,
    technique: 'mindfulness-walking',
    instructor: 'Rachel',
    audioKey: 'tech_walk_nature',
    color: '#C4A77D',
  },
  // Progressive Relaxation
  {
    id: 'tech_prog_full',
    title: 'Full Progressive Relaxation',
    description: 'Complete muscle relaxation',
    duration_minutes: 20,
    technique: 'progressive-relaxation',
    instructor: 'Rachel',
    audioKey: 'tech_prog_full',
    color: '#A8B4C4',
  },
  {
    id: 'tech_prog_quick',
    title: 'Quick Tension Release',
    description: 'Fast stress relief',
    duration_minutes: 8,
    technique: 'progressive-relaxation',
    instructor: 'Rachel',
    audioKey: 'tech_prog_quick',
    color: '#A8B4C4',
  },
  // Loving Kindness
  {
    id: 'tech_lk_self',
    title: 'Self-Compassion',
    description: 'Kindness toward yourself',
    duration_minutes: 12,
    technique: 'loving-kindness',
    instructor: 'Rachel',
    audioKey: 'tech_lk_self',
    color: '#D4A5C7',
  },
  {
    id: 'tech_lk_others',
    title: 'Extending Kindness',
    description: 'Compassion for all beings',
    duration_minutes: 15,
    technique: 'loving-kindness',
    instructor: 'Rachel',
    audioKey: 'tech_lk_others',
    color: '#D4A5C7',
  },
];

// Get meditations by technique
export const getMeditationsByTechnique = (techniqueId: string): TechniqueMeditation[] => {
  return techniqueMeditationsData.filter((m) => m.technique === techniqueId);
};

