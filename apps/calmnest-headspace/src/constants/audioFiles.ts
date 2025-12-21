/**
 * Audio file mapping for meditation content
 * 
 * Maps audio_file identifiers (used in Firestore) to Firebase Storage URLs
 * 
 * Audio files are stored in Firebase Storage bucket: calmnest-e910e.firebasestorage.app
 * 
 * Content Sources:
 * - Guided Meditation by Swami Guruparananda (archive.org, Public Domain)
 * - Body Scan Meditation (archive.org)
 * - Loving Kindness Meditation led by Ellie (archive.org)
 * - Forest Sound Effects (archive.org)
 */

const BUCKET = 'calmnest-e910e.firebasestorage.app';

// Helper to generate Firebase Storage URL
const storageUrl = (path: string) => 
  `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(path)}?alt=media`;

export const audioFiles: Record<string, string> = {
  // ========== GUIDED MEDITATION AUDIO ==========
  // Real guided meditation content with voice narration
  
  // Gratitude meditation
  meditation_gratitude: storageUrl('audio/meditation/gratitude.mp3'),
  
  // Stress relief meditation
  meditation_stress: storageUrl('audio/meditation/stress.mp3'),
  
  // Focus meditation
  meditation_focus: storageUrl('audio/meditation/focus.mp3'),
  
  // Anxiety relief meditation
  meditation_anxiety: storageUrl('audio/meditation/anxiety.mp3'),
  
  // Self esteem meditation
  meditation_selfesteem: storageUrl('audio/meditation/selfesteem.mp3'),
  
  // Body scan meditation (19MB, detailed guided session)
  meditation_bodyscan: storageUrl('audio/meditation/bodyscan.mp3'),
  
  // Loving kindness meditation (15MB, compassion-focused)
  meditation_lovingkindness: storageUrl('audio/meditation/lovingkindness.mp3'),
  
  // ========== SLEEP STORY AUDIO ==========
  // Calming audio for sleep
  
  sleep_nature: storageUrl('audio/sleep/nature.mp3'),
  sleep_ocean: storageUrl('audio/sleep/ocean.mp3'),
  sleep_rain: storageUrl('audio/sleep/rain.mp3'),
  sleep_fantasy: storageUrl('audio/sleep/fantasy.mp3'),
  
  // ========== BREATHING EXERCISE AUDIO ==========
  // Background sounds for breathing exercises
  
  breathing_calm: storageUrl('audio/breathing/calm.mp3'),
  breathing_energy: storageUrl('audio/breathing/energy.mp3'),
  
  // ========== LEGACY KEYS (for backward compatibility) ==========
  meditation_calm: storageUrl('audio/meditation/stress.mp3'),
  meditation_sleep: storageUrl('audio/sleep/nature.mp3'),
};

/**
 * Get audio URL by file key
 * @param key - The audio file key (e.g., 'meditation_gratitude')
 * @returns The Firebase Storage URL or null if not found
 */
export const getAudioFile = (key: string): string | null => {
  return audioFiles[key] || null;
};
