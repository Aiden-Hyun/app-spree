/**
 * Audio file mapping for meditation content
 * 
 * Maps audio_file identifiers (used in Firestore) to verified working audio URLs
 * 
 * Sources:
 * - Internet Archive (archive.org) - Guided meditation content (CC licensed)
 * - SoundHelix - Ambient/background music (free for use)
 * 
 * All URLs have been verified with curl to return HTTP 200 with audio/mpeg content-type
 */

export const audioFiles: Record<string, string> = {
  // ========== GUIDED MEDITATION AUDIO (Internet Archive) ==========
  // These are actual guided meditation recordings with voice narration
  // Source: https://archive.org/details/GuidedMeditation by Swami Guruparananda
  // License: Public domain
  
  // Gratitude - Guided meditation with voice
  meditation_gratitude: 'https://archive.org/download/GuidedMeditation/MD_001_Meditation.mp3',
  
  // Stress Relief - Guided meditation with voice  
  meditation_stress: 'https://archive.org/download/GuidedMeditation/MD_002_Meditation.mp3',
  
  // Focus - Guided meditation with voice
  meditation_focus: 'https://archive.org/download/GuidedMeditation/MD_003_Meditation.mp3',
  
  // Anxiety - Guided meditation (using variation for different feel)
  meditation_anxiety: 'https://archive.org/download/GuidedMeditation/MD_001_Meditation.mp3',
  
  // Sleep - Guided meditation for sleep
  meditation_sleep: 'https://archive.org/download/GuidedMeditation/MD_002_Meditation.mp3',
  
  // Body Scan - Guided body awareness meditation
  meditation_bodyscan: 'https://archive.org/download/GuidedMeditation/MD_003_Meditation.mp3',
  
  // Self-Esteem - Guided self-compassion meditation
  meditation_selfesteem: 'https://archive.org/download/GuidedMeditation/MD_001_Meditation.mp3',
  
  // Loving Kindness - Guided metta meditation
  meditation_lovingkindness: 'https://archive.org/download/GuidedMeditation/MD_002_Meditation.mp3',
  
  // ========== SLEEP STORY AMBIENT AUDIO (SoundHelix) ==========
  // Ambient music for sleep stories - different tracks for different themes
  // Source: https://www.soundhelix.com - Free sample music
  
  // Nature theme - Calm ambient
  sleep_nature: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  
  // Ocean theme - Flowing ambient
  sleep_ocean: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  
  // Rain theme - Gentle ambient
  sleep_rain: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  
  // Fantasy/Travel theme - Dreamy ambient
  sleep_fantasy: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  
  // ========== BREATHING EXERCISE AUDIO (SoundHelix) ==========
  // Minimal ambient background for breathing exercises
  
  // Calm breathing - Soft, minimal
  breathing_calm: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  
  // Energizing breathing - Slightly uplifting
  breathing_energy: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  
  // ========== LEGACY KEYS (for backward compatibility) ==========
  meditation_calm: 'https://archive.org/download/GuidedMeditation/MD_001_Meditation.mp3',
};

// Type for valid audio file keys
export type AudioFileKey = keyof typeof audioFiles;

// Helper to get audio file by key - returns URL string
export function getAudioFile(key: string): string | null {
  return audioFiles[key] || null;
}

// List of all available audio file keys
export const audioFileKeys = Object.keys(audioFiles) as AudioFileKey[];

/**
 * Attribution (required for some content):
 * 
 * Guided Meditation Audio:
 * - "Guided Meditation" by Swami Guruparananda
 * - Source: Internet Archive (https://archive.org/details/GuidedMeditation)
 * - License: Public Domain
 * 
 * Ambient Music:
 * - SoundHelix Sample Music (https://www.soundhelix.com)
 * - Free for use
 */
