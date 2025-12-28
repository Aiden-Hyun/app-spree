/**
 * Music page data with White Noise, Music, and ASMR categories
 * Nature Sounds are imported from sleepSoundsData.ts
 */

export type MusicCategory = 'white-noise' | 'nature' | 'music' | 'asmr';

export interface MusicItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: MusicCategory;
  audioKey: string;
  color: string;
  duration_minutes?: number;
  thumbnailUrl?: string;
}

// White Noise - now with working audio files
export const whiteNoiseData: MusicItem[] = [
  {
    id: 'white_noise_fan',
    title: 'Electric Fan',
    description: 'Steady fan motor hum',
    icon: 'sync',
    category: 'white-noise',
    audioKey: 'wn_electric_fan',
    color: '#7B8FA1',
    thumbnailUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
  },
  {
    id: 'white_noise_static',
    title: 'White Noise',
    description: 'Classic white noise static',
    icon: 'radio',
    category: 'white-noise',
    audioKey: 'wn_white_noise',
    color: '#8B8B9B',
    thumbnailUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&q=80',
  },
  {
    id: 'white_noise_brown',
    title: 'Brown Noise',
    description: 'Deep, low frequency rumble',
    icon: 'volume-high',
    category: 'white-noise',
    audioKey: 'wn_brown_noise',
    color: '#9B8B7B',
    thumbnailUrl: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=400&q=80',
  },
  {
    id: 'white_noise_pink',
    title: 'Pink Noise',
    description: 'Balanced, soothing tones',
    icon: 'volume-medium',
    category: 'white-noise',
    audioKey: 'wn_pink_noise',
    color: '#C4A4B4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&q=80',
  },
  {
    id: 'white_noise_grey',
    title: 'Grey Noise',
    description: 'Balanced mid-frequency noise',
    icon: 'volume-medium',
    category: 'white-noise',
    audioKey: 'wn_grey_noise',
    color: '#A8A8B8',
    thumbnailUrl: 'https://images.unsplash.com/photo-1557683311-eac922347aa1?w=400&q=80',
  },
  {
    id: 'white_noise_airplane',
    title: 'Airplane Cabin',
    description: 'In-flight ambient sound',
    icon: 'airplane',
    category: 'white-noise',
    audioKey: 'wn_airplane_cabin',
    color: '#7B9BAE',
    thumbnailUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&q=80',
  },
  {
    id: 'white_noise_ac',
    title: 'Air Conditioner',
    description: 'Cooling unit hum',
    icon: 'snow',
    category: 'white-noise',
    audioKey: 'wn_air_conditioner',
    color: '#6B8F9B',
    thumbnailUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80',
  },
];

// Music - placeholder data (no audio files yet)
export const musicData: MusicItem[] = [
  {
    id: 'music_piano',
    title: 'Peaceful Piano',
    description: 'Soft piano melodies',
    icon: 'musical-notes',
    category: 'music',
    audioKey: 'music_piano',
    color: '#A8A4C4',
    duration_minutes: 60,
    thumbnailUrl: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&q=80',
  },
  {
    id: 'music_ambient',
    title: 'Ambient Dreams',
    description: 'Ethereal ambient soundscapes',
    icon: 'planet',
    category: 'music',
    audioKey: 'music_ambient',
    color: '#8B7BAE',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=400&q=80',
  },
  {
    id: 'music_lofi',
    title: 'Lo-Fi Beats',
    description: 'Chill lo-fi hip hop',
    icon: 'headset',
    category: 'music',
    audioKey: 'music_lofi',
    color: '#9B8FAE',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&q=80',
  },
  {
    id: 'music_classical',
    title: 'Classical Calm',
    description: 'Relaxing classical pieces',
    icon: 'musical-note',
    category: 'music',
    audioKey: 'music_classical',
    color: '#C4B4A4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&q=80',
  },
  {
    id: 'music_guitar',
    title: 'Acoustic Guitar',
    description: 'Gentle guitar fingerpicking',
    icon: 'musical-notes',
    category: 'music',
    audioKey: 'music_guitar',
    color: '#B4976D',
    thumbnailUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&q=80',
  },
  {
    id: 'music_meditation',
    title: 'Meditation Music',
    description: 'Zen meditation sounds',
    icon: 'leaf',
    category: 'music',
    audioKey: 'music_meditation',
    color: '#7B9B7F',
    thumbnailUrl: 'https://images.unsplash.com/photo-1528715471579-d1bcf0ba5e83?w=400&q=80',
  },
];

// ASMR - with working audio files
export const asmrData: MusicItem[] = [
  {
    id: 'asmr_page_turning',
    title: 'Page Turning',
    description: 'Gentle book pages being turned',
    icon: 'book',
    category: 'asmr',
    audioKey: 'asmr_page_turning',
    color: '#9B8B7B',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
  },
  {
    id: 'asmr_keyboard',
    title: 'Keyboard Typing',
    description: 'Satisfying mechanical keyboard sounds',
    icon: 'keypad',
    category: 'asmr',
    audioKey: 'asmr_keyboard',
    color: '#8B9BAE',
    thumbnailUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80',
  },
];

// Get all items by category
export const getMusicByCategory = (category: MusicCategory): MusicItem[] => {
  switch (category) {
    case 'white-noise':
      return whiteNoiseData;
    case 'music':
      return musicData;
    case 'asmr':
      return asmrData;
    default:
      return [];
  }
};

