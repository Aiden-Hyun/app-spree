/**
 * Audio file mapping for meditation and sleep content
 * 
 * All audio files are hosted on Firebase Storage (private)
 * Use getAudioUrl() to get download URLs with access tokens
 * 
 * Sources: Fragrant Heart (meditations), Pixabay (sounds)
 * All audio is free for personal use.
 */

import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

// Fragrant Heart base URL for guided meditations (external - public)
const fragrantheart = (path: string) => 
  `https://www.fragrantheart.com/audio/${path}.mp3`;

// Storage paths for Firebase-hosted audio (private - needs download URL)
const storagePaths: Record<string, string> = {
  // ========== GUIDED MEDITATION AUDIO (Firebase Storage) ==========
  meditation_gratitude: 'audio/meditate/meditations/gratitude.mp3',
  meditation_stress: 'audio/meditate/meditations/stress-relief.mp3',
  meditation_focus: 'audio/meditate/meditations/focus-clarity.mp3',
  meditation_anxiety: 'audio/meditate/meditations/anxiety-relief.mp3',
  meditation_selfesteem: 'audio/meditate/meditations/self-esteem.mp3',
  meditation_bodyscan: 'audio/meditate/meditations/body-scan.mp3',
  meditation_lovingkindness: 'audio/meditate/meditations/loving-kindness.mp3',
  
  // ========== BREATHING EXERCISE AUDIO (Firebase Storage) ==========
  breathing_calm: 'audio/meditate/meditations/breathing-calm.mp3',
  breathing_energy: 'audio/meditate/meditations/breathing-energy.mp3',
  
  // ========== BEDTIME STORIES (Firebase Storage) ==========
  story_midnight_crossing: 'audio/sleep/stories/midnight-crossing-chapter-1.mp3',
  
  // ========== WHITE NOISE (Firebase Storage) ==========
  wn_electric_fan: 'audio/music/white-noise/electric-fan.mp3',
  wn_airplane_cabin: 'audio/music/white-noise/airplane-cabin.mp3',
  wn_pink_noise: 'audio/music/white-noise/pink-noise.mp3',
  wn_grey_noise: 'audio/music/white-noise/grey-noise.mp3',
  wn_brown_noise: 'audio/music/white-noise/brown-noise.mp3',
  wn_white_noise: 'audio/music/white-noise/white-noise.mp3',
  wn_air_conditioner: 'audio/music/white-noise/air-conditioner.mp3',
  
  // ========== NATURE SOUNDS (Firebase Storage) ==========
  // Rain sounds
  ns_rain_on_window: 'audio/music/nature-sounds/rain-on-window.mp3',
  ns_rain_in_forest: 'audio/music/nature-sounds/rain-in-forest.mp3',
  ns_rain_with_fireplace: 'audio/music/nature-sounds/rain-with-fireplace.mp3',
  ns_city_rain: 'audio/music/nature-sounds/city-rain.mp3',
  
  // Ocean & water sounds
  ns_ocean_waves: 'audio/music/nature-sounds/ocean-waves.mp3',
  ns_ocean_seagulls: 'audio/music/nature-sounds/ocean-seagulls.mp3',
  ns_flowing_stream: 'audio/music/nature-sounds/flowing-stream.mp3',
  ns_water_drops: 'audio/music/nature-sounds/water-drops.mp3',
  ns_gentle_water: 'audio/music/nature-sounds/gentle-water.mp3',
  
  // Fire sounds
  ns_crackling_fireplace: 'audio/music/nature-sounds/crackling-fireplace.mp3',
  ns_cozy_fireplace: 'audio/music/nature-sounds/cozy-fireplace.mp3',
  ns_forest_campfire: 'audio/music/nature-sounds/forest-campfire.mp3',
  ns_riverside_campfire: 'audio/music/nature-sounds/riverside-campfire.mp3',
  ns_autumn_ambience: 'audio/music/nature-sounds/autumn-ambience.mp3',
  
  // Wind sounds
  ns_mountain_wind: 'audio/music/nature-sounds/mountain-wind.mp3',
  ns_desert_wind: 'audio/music/nature-sounds/desert-wind.mp3',
  
  // Nature & wildlife
  ns_night_wildlife: 'audio/music/nature-sounds/night-wildlife.mp3',
  
  // Thunder & storm
  ns_thunderstorm: 'audio/music/nature-sounds/thunderstorm.mp3',
  
  // Other ambient sounds
  ns_ambient_dreams: 'audio/music/nature-sounds/ambient-dreams.mp3',
  ns_cave_echoes: 'audio/music/nature-sounds/cave-echoes.mp3',
  ns_cat_purring: 'audio/music/nature-sounds/cat-purring.mp3',
  ns_cat_purring_soft: 'audio/music/nature-sounds/cat-purring-soft.mp3',
  ns_train_journey: 'audio/music/nature-sounds/train-journey.mp3',
  ns_snow_footsteps: 'audio/music/nature-sounds/snow-footsteps.mp3',
};

// External URLs (public, no token needed)
const externalUrls: Record<string, string> = {
  // Additional meditation keys from Fragrant Heart (external)
  meditation_relaxation: fragrantheart('relaxation/deep-relaxation'),
  meditation_peace: fragrantheart('relaxation/2mins-inner-peace'),
  meditation_calming: fragrantheart('relaxation/1min-calming'),
  meditation_healing: fragrantheart('healing/deep-healing-and-relaxation'),
  meditation_chronic: fragrantheart('healing/chronic-illness'),
  meditation_pain: fragrantheart('healing/guided-meditation-for-acute-or-chronic-pain'),
  meditation_anger: fragrantheart('relaxation/guided-meditation-for-anger'),
  meditation_obsessive: fragrantheart('relaxation/guided-awareness-for-obsessive-thoughts'),
  meditation_overwhelmed: fragrantheart('relaxation/when-you-are-feeling-overwhelmed'),
  meditation_social: fragrantheart('self-esteem/social-anxiety'),
  meditation_compassion: fragrantheart('compassion/loving-self-compassion'),
  meditation_peace_love: fragrantheart('love/peace-love-and-compassion'),
  meditation_calm: fragrantheart('relaxation/stress-relief'),
  meditation_sleep: fragrantheart('relaxation/peaceful-sleep'),
};

// Cache for download URLs (they include tokens that are valid for a while)
const urlCache: Map<string, { url: string; timestamp: number }> = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Get audio URL by file key
 * For Firebase Storage files, fetches a download URL with access token
 * For external URLs, returns directly
 * 
 * @param key - The audio file key (e.g., 'meditation_gratitude', 'story_midnight_crossing')
 * @returns Promise<string | null> - The audio URL or null if not found
 */
export async function getAudioUrl(key: string): Promise<string | null> {
  // Check external URLs first (no token needed)
  if (externalUrls[key]) {
    return externalUrls[key];
  }
  
  // Check if it's a Firebase Storage file
  const storagePath = storagePaths[key];
  if (!storagePath) {
    console.warn(`Audio key not found: ${key}`);
    return null;
  }
  
  // Check cache
  const cached = urlCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.url;
  }
  
  try {
    // Get download URL from Firebase Storage
    const storageRef = ref(storage, storagePath);
    const url = await getDownloadURL(storageRef);
    
    // Cache the URL
    urlCache.set(key, { url, timestamp: Date.now() });
    
    return url;
  } catch (error) {
    console.error(`Failed to get download URL for ${key}:`, error);
    return null;
  }
}

/**
 * Synchronous version - returns cached URL or null
 * Use getAudioUrl() for guaranteed fresh URLs
 * 
 * @deprecated Use getAudioUrl() instead for reliable access
 */
export function getAudioFile(key: string): string | null {
  // Check external URLs first
  if (externalUrls[key]) {
    return externalUrls[key];
  }
  
  // Check cache for Firebase Storage URLs
  const cached = urlCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.url;
  }
  
  // For Firebase Storage files, trigger async fetch and return null for now
  // The caller should use getAudioUrl() instead
  if (storagePaths[key]) {
    // Trigger background fetch
    getAudioUrl(key).catch(() => {});
    return null;
  }
  
  return null;
}

/**
 * Preload audio URLs into cache
 * Call this on app startup or before navigating to audio screens
 */
export async function preloadAudioUrls(keys: string[]): Promise<void> {
  const promises = keys.map(key => getAudioUrl(key).catch(() => null));
  await Promise.all(promises);
}

// Export storage paths for reference
export { storagePaths, externalUrls };
