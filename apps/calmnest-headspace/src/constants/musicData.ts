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
  },
  {
    id: 'white_noise_static',
    title: 'White Noise',
    description: 'Classic white noise static',
    icon: 'radio',
    category: 'white-noise',
    audioKey: 'wn_white_noise',
    color: '#8B8B9B',
  },
  {
    id: 'white_noise_brown',
    title: 'Brown Noise',
    description: 'Deep, low frequency rumble',
    icon: 'volume-high',
    category: 'white-noise',
    audioKey: 'wn_brown_noise',
    color: '#9B8B7B',
  },
  {
    id: 'white_noise_pink',
    title: 'Pink Noise',
    description: 'Balanced, soothing tones',
    icon: 'volume-medium',
    category: 'white-noise',
    audioKey: 'wn_pink_noise',
    color: '#C4A4B4',
  },
  {
    id: 'white_noise_grey',
    title: 'Grey Noise',
    description: 'Balanced mid-frequency noise',
    icon: 'volume-medium',
    category: 'white-noise',
    audioKey: 'wn_grey_noise',
    color: '#A8A8B8',
  },
  {
    id: 'white_noise_airplane',
    title: 'Airplane Cabin',
    description: 'In-flight ambient sound',
    icon: 'airplane',
    category: 'white-noise',
    audioKey: 'wn_airplane_cabin',
    color: '#7B9BAE',
  },
  {
    id: 'white_noise_ac',
    title: 'Air Conditioner',
    description: 'Cooling unit hum',
    icon: 'snow',
    category: 'white-noise',
    audioKey: 'wn_air_conditioner',
    color: '#6B8F9B',
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
  },
  {
    id: 'music_ambient',
    title: 'Ambient Dreams',
    description: 'Ethereal ambient soundscapes',
    icon: 'planet',
    category: 'music',
    audioKey: 'music_ambient',
    color: '#8B7BAE',
  },
  {
    id: 'music_lofi',
    title: 'Lo-Fi Beats',
    description: 'Chill lo-fi hip hop',
    icon: 'headset',
    category: 'music',
    audioKey: 'music_lofi',
    color: '#9B8FAE',
  },
  {
    id: 'music_classical',
    title: 'Classical Calm',
    description: 'Relaxing classical pieces',
    icon: 'musical-note',
    category: 'music',
    audioKey: 'music_classical',
    color: '#C4B4A4',
  },
  {
    id: 'music_guitar',
    title: 'Acoustic Guitar',
    description: 'Gentle guitar fingerpicking',
    icon: 'musical-notes',
    category: 'music',
    audioKey: 'music_guitar',
    color: '#B4976D',
  },
  {
    id: 'music_meditation',
    title: 'Meditation Music',
    description: 'Zen meditation sounds',
    icon: 'leaf',
    category: 'music',
    audioKey: 'music_meditation',
    color: '#7B9B7F',
  },
];

// ASMR - placeholder data (no audio files yet)
export const asmrData: MusicItem[] = [
  {
    id: 'asmr_whisper',
    title: 'Soft Whispers',
    description: 'Gentle whispering sounds',
    icon: 'chatbubble',
    category: 'asmr',
    audioKey: 'asmr_whisper',
    color: '#C4A4C4',
  },
  {
    id: 'asmr_tapping',
    title: 'Tapping Sounds',
    description: 'Rhythmic finger tapping',
    icon: 'hand-left',
    category: 'asmr',
    audioKey: 'asmr_tapping',
    color: '#A4B4C4',
  },
  {
    id: 'asmr_brushing',
    title: 'Brush Strokes',
    description: 'Soft brush on microphone',
    icon: 'brush',
    category: 'asmr',
    audioKey: 'asmr_brushing',
    color: '#B4A4A4',
  },
  {
    id: 'asmr_typing',
    title: 'Keyboard Typing',
    description: 'Mechanical keyboard sounds',
    icon: 'keypad',
    category: 'asmr',
    audioKey: 'asmr_typing',
    color: '#8B9BAE',
  },
  {
    id: 'asmr_page_turning',
    title: 'Page Turning',
    description: 'Book pages being turned',
    icon: 'book',
    category: 'asmr',
    audioKey: 'asmr_page_turning',
    color: '#9B8B7B',
  },
  {
    id: 'asmr_rain_window',
    title: 'Rain on Glass',
    description: 'ASMR rain on window pane',
    icon: 'rainy',
    category: 'asmr',
    audioKey: 'asmr_rain_window',
    color: '#7B9BAE',
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

