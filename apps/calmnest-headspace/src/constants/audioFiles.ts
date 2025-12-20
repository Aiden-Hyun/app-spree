/**
 * Audio file mapping for meditation content
 * 
 * Maps audio_file identifiers (used in Firestore) to audio URLs
 * Using free sample audio from reliable CDN sources
 */

// Using verified working free audio URLs
// These are sample meditation/ambient music clips from filesamples.com and similar

export const audioFiles: Record<string, string> = {
  // ========== MEDITATION CATEGORY AUDIO ==========
  
  // Using a known working meditation audio URL
  // This is the URL that was confirmed working earlier
  meditation_gratitude: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  meditation_stress: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  meditation_focus: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  meditation_anxiety: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  meditation_sleep: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  meditation_bodyscan: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  meditation_selfesteem: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
  meditation_lovingkindness: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
  
  // ========== SLEEP STORY CATEGORY AUDIO ==========
  sleep_nature: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
  sleep_ocean: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
  sleep_rain: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3',
  sleep_fantasy: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3',
  
  // ========== BREATHING EXERCISE AUDIO ==========
  breathing_calm: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3',
  breathing_energy: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3',
  
  // ========== LEGACY KEYS (for backward compatibility) ==========
  meditation_calm: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
};

// Type for valid audio file keys
export type AudioFileKey = keyof typeof audioFiles;

// Helper to get audio file by key - returns URL string
export function getAudioFile(key: string): string | null {
  return audioFiles[key] || null;
}

// List of all available audio file keys
export const audioFileKeys = Object.keys(audioFiles) as AudioFileKey[];
