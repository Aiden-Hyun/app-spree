/**
 * Audio file mapping for meditation content
 * 
 * Primary source: Fragrant Heart (https://www.fragrantheart.com)
 * - Free high-quality guided meditation audio
 * - Professional voice narration with optional background music
 * - Terms: Free for personal use
 * 
 * Fallback: Firebase Storage for custom/uploaded content
 */

const BUCKET = 'calmnest-e910e.firebasestorage.app';

// Helper to generate Firebase Storage URL
const storageUrl = (path: string) => 
  `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(path)}?alt=media`;

// Fragrant Heart base URL
const fragrantheart = (path: string) => 
  `https://www.fragrantheart.com/audio/${path}.mp3`;

export const audioFiles: Record<string, string> = {
  // ========== GUIDED MEDITATION AUDIO (Fragrant Heart) ==========
  // High-quality professional guided meditations with voice narration
  
  // Gratitude meditation (16 min)
  meditation_gratitude: fragrantheart('love/gratitude'),
  
  // Stress relief meditation (20 min)
  meditation_stress: fragrantheart('relaxation/stress-relief'),
  
  // Focus/awareness meditation (12 min)
  meditation_focus: fragrantheart('spiritual-awareness/awareness'),
  
  // Anxiety relief meditation (7 min)
  meditation_anxiety: fragrantheart('relaxation/breathe-away-anxiety'),
  
  // Self esteem meditation (18 min)
  meditation_selfesteem: fragrantheart('self-esteem/enhance-your-self-esteem'),
  
  // Body scan meditation (27 min, detailed guided session)
  meditation_bodyscan: fragrantheart('healing/guided-body-scan-part1'),
  
  // Loving kindness meditation (10 min, compassion-focused)
  meditation_lovingkindness: fragrantheart('love/loving-kindness'),
  
  // Deep relaxation meditation (18 min)
  meditation_relaxation: fragrantheart('relaxation/deep-relaxation'),
  
  // Inner peace meditation (2 min)
  meditation_peace: fragrantheart('relaxation/2mins-inner-peace'),
  
  // Calming meditation (1 min)
  meditation_calming: fragrantheart('relaxation/1min-calming'),
  
  // ========== SLEEP STORY AUDIO (Fragrant Heart) ==========
  // Calming audio for sleep
  
  // Peaceful sleep meditation (15 min)
  sleep_nature: fragrantheart('relaxation/peaceful-sleep'),
  
  // Deep sleep visualization (9 min)
  sleep_ocean: fragrantheart('relaxation/deep-sleep'),
  
  // Rain on tent ambient sound (local upload)
  sleep_rain: 'https://storage.googleapis.com/calmnest-e910e.firebasestorage.app/audio/sleep/rain_on_tent.mp3',
  
  // Golden cone of light relaxation (5 min)
  sleep_fantasy: fragrantheart('relaxation/golden-cone-of-light'),
  
  // Yoga nidra / deep relaxation (28 min)
  sleep_yoga: fragrantheart('relaxation/yoga-nidra'),
  
  // ========== BREATHING EXERCISE AUDIO ==========
  // Background sounds for breathing exercises
  
  // Breathing calmness (9 min)
  breathing_calm: fragrantheart('relaxation/breathing-calmness'),
  
  // Breath of life (7 min)
  breathing_energy: fragrantheart('relaxation/the-breath-of-life'),
  
  // ========== HEALING MEDITATIONS ==========
  
  // Deep healing & relaxation (14 min)
  meditation_healing: fragrantheart('healing/deep-healing-and-relaxation'),
  
  // Chronic illness meditation (10 min)
  meditation_chronic: fragrantheart('healing/chronic-illness'),
  
  // Pain relief meditation (12 min)
  meditation_pain: fragrantheart('healing/guided-meditation-for-acute-or-chronic-pain'),
  
  // ========== EMOTIONAL WELLNESS ==========
  
  // Anger meditation (13 min)
  meditation_anger: fragrantheart('relaxation/guided-meditation-for-anger'),
  
  // Obsessive thoughts (11 min)
  meditation_obsessive: fragrantheart('relaxation/guided-awareness-for-obsessive-thoughts'),
  
  // Feeling overwhelmed (8 min)
  meditation_overwhelmed: fragrantheart('relaxation/when-you-are-feeling-overwhelmed'),
  
  // Social anxiety (14 min)
  meditation_social: fragrantheart('self-esteem/social-anxiety'),
  
  // ========== COMPASSION MEDITATIONS ==========
  
  // Self compassion (10 min)
  meditation_compassion: fragrantheart('compassion/loving-self-compassion'),
  
  // Peace, love, compassion (14 min)
  meditation_peace_love: fragrantheart('love/peace-love-and-compassion'),
  
  // ========== LEGACY KEYS (for backward compatibility) ==========
  meditation_calm: fragrantheart('relaxation/stress-relief'),
  meditation_sleep: fragrantheart('relaxation/peaceful-sleep'),
};

/**
 * Get audio URL by file key
 * @param key - The audio file key (e.g., 'meditation_gratitude')
 * @returns The audio URL or null if not found
 */
export const getAudioFile = (key: string): string | null => {
  return audioFiles[key] || null;
};
