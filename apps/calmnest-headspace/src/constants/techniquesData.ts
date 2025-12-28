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
  thumbnailUrl?: string;
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
  thumbnailUrl?: string;
}

export const techniquesData: MeditationTechnique[] = [
  {
    id: "body-scan",
    title: "Body Scan",
    description: "Awareness through the body",
    icon: "body",
    color: "#7DAFB4",
    longDescription:
      "Systematically focus attention on different parts of your body to release tension and increase awareness.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80",
  },
  {
    id: "breathing",
    title: "Breathing Exercises",
    description: "Breath-focused practices",
    icon: "fitness",
    color: "#8B9F82",
    longDescription:
      "Use the breath as an anchor for attention, calming the nervous system and centering the mind.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80",
  },
  {
    id: "visualization",
    title: "Visualization",
    description: "Guided imagery journeys",
    icon: "image",
    color: "#B4A7C7",
    longDescription:
      "Create vivid mental images to promote relaxation, healing, and positive emotional states.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=400&q=80",
  },
  {
    id: "mindfulness-walking",
    title: "Mindful Walking",
    description: "Moving meditation",
    icon: "walk",
    color: "#C4A77D",
    longDescription:
      "Practice mindfulness while walking, connecting movement with breath and awareness.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&q=80",
  },
  {
    id: "progressive-relaxation",
    title: "Progressive Relaxation",
    description: "Tension and release",
    icon: "contract",
    color: "#A8B4C4",
    longDescription:
      "Systematically tense and release muscle groups to achieve deep physical and mental relaxation.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=400&q=80",
  },
  {
    id: "loving-kindness",
    title: "Loving Kindness",
    description: "Cultivate compassion",
    icon: "heart",
    color: "#D4A5C7",
    longDescription:
      "Direct feelings of love and kindness toward yourself and others to build compassion and connection.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&q=80",
  },
];

// Technique meditations with real audio
export const techniqueMeditationsData: TechniqueMeditation[] = [
  // Body Scan - has real audio
  {
    id: "tech_body_scan",
    title: "Body Scan",
    description: "Guided awareness through your entire body",
    duration_minutes: 12,
    technique: "body-scan",
    instructor: "Delilah",
    audioKey: "meditation_body_scan",
    color: "#7DAFB4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80",
  },
];

// Get meditations by technique
export const getMeditationsByTechnique = (
  techniqueId: string
): TechniqueMeditation[] => {
  return techniqueMeditationsData.filter((m) => m.technique === techniqueId);
};
