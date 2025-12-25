/**
 * Audio file mapping for meditation and sleep content
 * 
 * Meditation: Fragrant Heart (https://www.fragrantheart.com)
 * Sleep Sounds: Pixabay (https://pixabay.com) - uploaded to Firebase Storage
 * 
 * All audio is free for personal use.
 */

const STORAGE_BUCKET = 'calmnest-e910e.firebasestorage.app';

// Helper to generate Firebase Storage URL for nature sounds
const storageUrl = (filename: string) => 
  `https://storage.googleapis.com/${STORAGE_BUCKET}/audio/sleep/${filename}`;

// Fragrant Heart base URL for guided meditations
const fragrantheart = (path: string) => 
  `https://www.fragrantheart.com/audio/${path}.mp3`;

export const audioFiles: Record<string, string> = {
  // ========== GUIDED MEDITATION AUDIO (Fragrant Heart) ==========
  meditation_gratitude: fragrantheart('love/gratitude'),
  meditation_stress: fragrantheart('relaxation/stress-relief'),
  meditation_focus: fragrantheart('spiritual-awareness/awareness'),
  meditation_anxiety: fragrantheart('relaxation/breathe-away-anxiety'),
  meditation_selfesteem: fragrantheart('self-esteem/enhance-your-self-esteem'),
  meditation_bodyscan: fragrantheart('healing/guided-body-scan-part1'),
  meditation_lovingkindness: fragrantheart('love/loving-kindness'),
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
  
  // ========== BREATHING EXERCISE AUDIO (Fragrant Heart) ==========
  breathing_calm: fragrantheart('relaxation/breathing-calmness'),
  breathing_energy: fragrantheart('relaxation/the-breath-of-life'),
  
  // ========== SLEEP SOUNDS (Pixabay via Firebase Storage) ==========
  // Rain sounds
  sleep_rain_window: storageUrl('rain_window.mp3'),
  sleep_rain_forest: storageUrl('rain_forest.mp3'),
  sleep_rain_fireplace: storageUrl('rain_fireplace.mp3'),
  sleep_rain_city: storageUrl('rain_city_london.mp3'),
  
  // Ocean & water sounds
  sleep_ocean_waves: storageUrl('ocean_waves.mp3'),
  sleep_ocean_seagulls: storageUrl('ocean_seagulls.mp3'),
  sleep_brook_stream: storageUrl('brook_stream.mp3'),
  sleep_water_drops: storageUrl('water_drops.mp3'),
  sleep_water_wisdom: storageUrl('water_wisdom.mp3'),
  
  // Fire sounds
  sleep_fireplace_burning: storageUrl('fireplace_burning.mp3'),
  sleep_fireplace_living_room: storageUrl('fireplace_living_room.mp3'),
  sleep_forest_fire_river: storageUrl('forest_fire_river.mp3'),
  sleep_autumn_fire_water: storageUrl('autumn_fire_water.mp3'),
  
  // Wind sounds
  sleep_wind_mountains: storageUrl('wind_mountains.mp3'),
  sleep_wind_desert: storageUrl('wind_desert.mp3'),
  
  // Nature & birds
  sleep_frogs_crickets_birds: storageUrl('frogs_crickets_birds.mp3'),
  
  // Thunder & storm
  sleep_thunder_lightning: storageUrl('thunder_lightning.mp3'),
  
  // Other ambient sounds
  sleep_ambient_dreamer: storageUrl('ambient_dreamer.mp3'),
  sleep_cave_ambience: storageUrl('cave_ambience.mp3'),
  sleep_cat_purring: storageUrl('cat_purring.mp3'),
  sleep_train_locomotive: storageUrl('train_locomotive.mp3'),
  sleep_snow_crunch: storageUrl('snow_crunch.mp3'),
  
  // ========== BEDTIME STORIES (Local audio files) ==========
  story_midnight_crossing: require('../../assets/audio/sleep/stories/midnight-crossing-chapter-1.mp3'),
};

/**
 * Get audio URL by file key
 * @param key - The audio file key (e.g., 'meditation_gratitude')
 * @returns The audio URL or null if not found
 */
export const getAudioFile = (key: string): string | null => {
  return audioFiles[key] || null;
};
