/**
 * Background sounds for meditation and guided content
 * Curated subset of ambient sounds that work well as background audio
 */

export type BackgroundSoundCategory = "nature" | "ambient" | "white-noise";

export interface BackgroundSound {
  id: string;
  title: string;
  icon: string;
  category: BackgroundSoundCategory;
  audioKey: string;
  color: string;
}

export interface BackgroundSoundCategoryInfo {
  id: string;
  title: string;
  icon: string;
}

export const backgroundSoundCategories: BackgroundSoundCategoryInfo[] = [
  { id: "nature", title: "Nature", icon: "leaf" },
  { id: "ambient", title: "Ambient", icon: "planet" },
  { id: "white-noise", title: "White Noise", icon: "radio" },
];

export const backgroundSoundsData: BackgroundSound[] = [
  // Nature sounds
  {
    id: "bg_rain_window",
    title: "Rain on Window",
    icon: "rainy",
    category: "nature",
    audioKey: "ns_rain_on_window",
    color: "#7B9BAE",
  },
  {
    id: "bg_rain_forest",
    title: "Forest Rain",
    icon: "rainy",
    category: "nature",
    audioKey: "ns_rain_in_forest",
    color: "#6B8F7A",
  },
  {
    id: "bg_ocean_waves",
    title: "Ocean Waves",
    icon: "water",
    category: "nature",
    audioKey: "ns_ocean_waves",
    color: "#6B8FA1",
  },
  {
    id: "bg_flowing_stream",
    title: "Flowing Stream",
    icon: "water",
    category: "nature",
    audioKey: "ns_flowing_stream",
    color: "#5B8F9B",
  },
  {
    id: "bg_forest_birds",
    title: "Forest Birds",
    icon: "leaf",
    category: "nature",
    audioKey: "ns_forest_birds",
    color: "#7B9F7A",
  },
  {
    id: "bg_night_crickets",
    title: "Night Crickets",
    icon: "moon",
    category: "nature",
    audioKey: "ns_night_crickets",
    color: "#5B6B7B",
  },

  // Ambient sounds
  {
    id: "bg_fireplace",
    title: "Crackling Fire",
    icon: "flame",
    category: "ambient",
    audioKey: "ns_crackling_fire",
    color: "#C47B4B",
  },
  {
    id: "bg_rain_fireplace",
    title: "Rainy Fireplace",
    icon: "flame",
    category: "ambient",
    audioKey: "ns_rain_with_fireplace",
    color: "#8B7B6B",
  },
  {
    id: "bg_wind_chimes",
    title: "Wind Chimes",
    icon: "musical-note",
    category: "ambient",
    audioKey: "ns_wind_chimes",
    color: "#9BABBB",
  },

  // White noise
  {
    id: "bg_white_noise",
    title: "White Noise",
    icon: "radio",
    category: "white-noise",
    audioKey: "wn_white_noise",
    color: "#8B8B9B",
  },
  {
    id: "bg_brown_noise",
    title: "Brown Noise",
    icon: "volume-high",
    category: "white-noise",
    audioKey: "wn_brown_noise",
    color: "#9B8B7B",
  },
  {
    id: "bg_pink_noise",
    title: "Pink Noise",
    icon: "volume-medium",
    category: "white-noise",
    audioKey: "wn_pink_noise",
    color: "#C4A4B4",
  },
  {
    id: "bg_fan",
    title: "Electric Fan",
    icon: "sync",
    category: "white-noise",
    audioKey: "wn_electric_fan",
    color: "#7B8FA1",
  },
];

// Helper to get sounds by category
export function getBackgroundSoundsByCategory(category: string): BackgroundSound[] {
  return backgroundSoundsData.filter((sound) => sound.category === category);
}

// Helper to get a sound by ID
export function getBackgroundSoundById(id: string): BackgroundSound | undefined {
  return backgroundSoundsData.find((sound) => sound.id === id);
}

