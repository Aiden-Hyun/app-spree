/**
 * Narrator profiles for voice-based content
 * Used in bedtime stories, series chapters, and guided meditations
 */

export interface Narrator {
  id: string;
  name: string;
  photoUrl: string;
  bio?: string;
}

export const narrators: Record<string, Narrator> = {
  rachel: {
    id: 'rachel',
    name: 'Rachel',
    photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
    bio: 'Soothing voice for peaceful nights',
  },
  sarah: {
    id: 'sarah',
    name: 'Sarah',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    bio: 'Gentle guidance for mindful moments',
  },
  emma: {
    id: 'emma',
    name: 'Emma',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
    bio: 'Calming presence for deep relaxation',
  },
  michael: {
    id: 'michael',
    name: 'Michael',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    bio: 'Grounding voice for focused meditation',
  },
  james: {
    id: 'james',
    name: 'James',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80',
    bio: 'Warm tones for restful sleep',
  },
  delilah: {
    id: 'delilah',
    name: 'Delilah',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80',
    bio: 'Gentle guide for body awareness',
  },
  brittney: {
    id: 'brittney',
    name: 'Brittney',
    photoUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80',
    bio: 'Calming voice for moments of stress',
  },
};

/**
 * Get narrator by name (case-insensitive)
 */
export function getNarratorByName(name: string): Narrator | undefined {
  const key = name.toLowerCase();
  return narrators[key];
}

