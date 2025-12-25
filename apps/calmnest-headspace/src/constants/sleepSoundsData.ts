/**
 * Sleep sounds data with titles and descriptions
 * All audio files are hosted on Firebase Storage (from Pixabay)
 */

export type SleepSoundCategory = 'rain' | 'water' | 'fire' | 'wind' | 'nature' | 'ambient';

export interface SleepSound {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: SleepSoundCategory;
  audioKey: string;
  color: string;
}

export const sleepSoundsData: SleepSound[] = [
  // Rain sounds (4)
  {
    id: 'rain_window',
    title: 'Rain on Window',
    description: 'Gentle rain pattering on glass',
    icon: 'rainy',
    category: 'rain',
    audioKey: 'ns_rain_on_window',
    color: '#7B9BAE',
  },
  {
    id: 'rain_forest',
    title: 'Forest Rain',
    description: 'Rain falling through forest leaves',
    icon: 'rainy',
    category: 'rain',
    audioKey: 'ns_rain_in_forest',
    color: '#6B8F7A',
  },
  {
    id: 'rain_fireplace',
    title: 'Rainy Fireplace',
    description: 'Rain outside, cozy fire inside',
    icon: 'rainy',
    category: 'rain',
    audioKey: 'ns_rain_with_fireplace',
    color: '#8B7B6B',
  },
  {
    id: 'rain_city',
    title: 'City Rain',
    description: 'Walking through rainy city streets',
    icon: 'rainy',
    category: 'rain',
    audioKey: 'ns_city_rain',
    color: '#6B7B8B',
  },

  // Water sounds (5)
  {
    id: 'ocean_waves',
    title: 'Ocean Waves',
    description: 'Calm ocean waves on the shore',
    icon: 'water',
    category: 'water',
    audioKey: 'ns_ocean_waves',
    color: '#6B8FA1',
  },
  {
    id: 'ocean_seagulls',
    title: 'Seaside Seagulls',
    description: 'Ocean with distant seagull calls',
    icon: 'water',
    category: 'water',
    audioKey: 'ns_ocean_seagulls',
    color: '#7B9FAB',
  },
  {
    id: 'brook_stream',
    title: 'Flowing Stream',
    description: 'Gentle stream flowing over stones',
    icon: 'water',
    category: 'water',
    audioKey: 'ns_flowing_stream',
    color: '#5B8F9B',
  },
  {
    id: 'water_drops',
    title: 'Water Drops',
    description: 'Rhythmic water droplets',
    icon: 'water',
    category: 'water',
    audioKey: 'ns_water_drops',
    color: '#4B7F8B',
  },
  {
    id: 'water_wisdom',
    title: 'Gentle Water',
    description: 'Peaceful water meditation',
    icon: 'water',
    category: 'water',
    audioKey: 'ns_gentle_water',
    color: '#5B9FAB',
  },

  // Fire sounds (4)
  {
    id: 'fireplace_burning',
    title: 'Crackling Fireplace',
    description: 'Warm fire crackling',
    icon: 'flame',
    category: 'fire',
    audioKey: 'ns_crackling_fireplace',
    color: '#C4A77D',
  },
  {
    id: 'fireplace_living_room',
    title: 'Cozy Fireplace',
    description: 'Cozy home fireplace',
    icon: 'flame',
    category: 'fire',
    audioKey: 'ns_cozy_fireplace',
    color: '#D4B78D',
  },
  {
    id: 'forest_fire_river',
    title: 'Forest Campfire',
    description: 'Campfire crackling by the river',
    icon: 'flame',
    category: 'fire',
    audioKey: 'ns_forest_campfire',
    color: '#B4976D',
  },
  {
    id: 'autumn_fire_water',
    title: 'Autumn Ambience',
    description: 'Fall ambience with fire and water',
    icon: 'flame',
    category: 'fire',
    audioKey: 'ns_autumn_ambience',
    color: '#A4875D',
  },

  // Wind sounds (2)
  {
    id: 'wind_mountains',
    title: 'Mountain Wind',
    description: 'Wind through mountain peaks',
    icon: 'leaf',
    category: 'wind',
    audioKey: 'ns_mountain_wind',
    color: '#8BA88F',
  },
  {
    id: 'wind_desert',
    title: 'Desert Wind',
    description: 'Dry desert breeze',
    icon: 'leaf',
    category: 'wind',
    audioKey: 'ns_desert_wind',
    color: '#9B987F',
  },

  // Nature sounds (1)
  {
    id: 'frogs_crickets_birds',
    title: 'Night Wildlife',
    description: 'Frogs, crickets and birds singing',
    icon: 'musical-notes',
    category: 'nature',
    audioKey: 'ns_night_wildlife',
    color: '#7B9B7F',
  },

  // Thunder (1)
  {
    id: 'thunder_lightning',
    title: 'Thunderstorm',
    description: 'Distant thunder and lightning',
    icon: 'thunderstorm',
    category: 'ambient',
    audioKey: 'ns_thunderstorm',
    color: '#9A8FAE',
  },

  // Other ambient sounds (6)
  {
    id: 'ambient_dreamer',
    title: 'Ambient Dreams',
    description: 'Relaxing ambient music',
    icon: 'musical-note',
    category: 'ambient',
    audioKey: 'ns_ambient_dreams',
    color: '#A8A4C4',
  },
  {
    id: 'cave_ambience',
    title: 'Cave Echoes',
    description: 'Mysterious cave ambience',
    icon: 'planet',
    category: 'ambient',
    audioKey: 'ns_cave_echoes',
    color: '#6B6B8B',
  },
  {
    id: 'cat_purring',
    title: 'Cat Purring',
    description: 'Soothing cat purr',
    icon: 'heart',
    category: 'ambient',
    audioKey: 'ns_cat_purring',
    color: '#C4A4A4',
  },
  {
    id: 'train_locomotive',
    title: 'Train Journey',
    description: 'Rhythmic locomotive sounds',
    icon: 'train',
    category: 'ambient',
    audioKey: 'ns_train_journey',
    color: '#8B8B9B',
  },
  {
    id: 'snow_crunch',
    title: 'Snow Footsteps',
    description: 'Crunching through fresh snow',
    icon: 'snow',
    category: 'ambient',
    audioKey: 'ns_snow_footsteps',
    color: '#A4B4C4',
  },
];

// Category labels for filter tabs
export const categoryLabels: Record<SleepSoundCategory | 'all', string> = {
  all: 'All',
  rain: 'Rain',
  water: 'Water',
  fire: 'Fire',
  wind: 'Wind',
  nature: 'Nature',
  ambient: 'Ambient',
};

// Get sounds by category
export const getSoundsByCategory = (category: SleepSoundCategory | 'all'): SleepSound[] => {
  if (category === 'all') return sleepSoundsData;
  return sleepSoundsData.filter(sound => sound.category === category);
};

