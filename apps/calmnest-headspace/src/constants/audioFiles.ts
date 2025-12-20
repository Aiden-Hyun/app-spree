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

const STORAGE_BASE = 'https://storage.googleapis.com/calmnest-e910e.firebasestorage.app/audio';

export const audioFiles: Record<string, string> = {
  // ========== GUIDED MEDITATION AUDIO ==========
  // Real guided meditation content with voice narration
  
  // Gratitude meditation
  meditation_gratitude: `${STORAGE_BASE}/meditation/gratitude.mp3`,
  
  // Stress relief meditation
  meditation_stress: `${STORAGE_BASE}/meditation/stress.mp3`,
  
  // Focus meditation
  meditation_focus: `${STORAGE_BASE}/meditation/focus.mp3`,
  
  // Anxiety relief meditation
  meditation_anxiety: `${STORAGE_BASE}/meditation/anxiety.mp3`,
  
  // Self esteem meditation
  meditation_selfesteem: `${STORAGE_BASE}/meditation/selfesteem.mp3`,
  
  // Body scan meditation (19MB, detailed guided session)
  meditation_bodyscan: `${STORAGE_BASE}/meditation/bodyscan.mp3`,
  
  // Loving kindness meditation (15MB, compassion-focused)
  meditation_lovingkindness: `${STORAGE_BASE}/meditation/lovingkindness.mp3`,
  
  // ========== SLEEP STORY AUDIO ==========
  // Calming audio for sleep
  
  sleep_nature: `${STORAGE_BASE}/sleep/nature.mp3`,
  sleep_ocean: `${STORAGE_BASE}/sleep/ocean.mp3`,
  sleep_rain: `${STORAGE_BASE}/sleep/rain.mp3`,
  sleep_fantasy: `${STORAGE_BASE}/sleep/fantasy.mp3`,
  
  // ========== BREATHING EXERCISE AUDIO ==========
  // Background sounds for breathing exercises
  
  breathing_calm: `${STORAGE_BASE}/breathing/calm.mp3`,
  breathing_energy: `${STORAGE_BASE}/breathing/energy.mp3`,
  
  // ========== LEGACY KEYS (for backward compatibility) ==========
  meditation_calm: `${STORAGE_BASE}/meditation/stress.mp3`,
  meditation_sleep: `${STORAGE_BASE}/sleep/nature.mp3`,
};
