/**
 * Bedtime Story Series - Multi-chapter story collections
 */

export interface SeriesChapter {
  id: string;
  chapterNumber: number;
  title: string;
  description: string;
  duration_minutes: number;
  audioKey: string;
}

export interface Series {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  color: string;
  narrator: string;
  chapterCount: number;
  totalDuration: number;
  category: 'fantasy' | 'nature' | 'travel' | 'thriller' | 'fiction';
  chapters: SeriesChapter[];
}

export const seriesData: Series[] = [
  {
    id: 'series_enchanted',
    title: 'The Enchanted Forest',
    description: 'Journey through a magical woodland realm where ancient trees whisper secrets and mystical creatures guide you to peaceful slumber.',
    color: '#8B9F82',
    narrator: 'Rachel',
    chapterCount: 5,
    totalDuration: 75,
    category: 'fantasy',
    chapters: [
      {
        id: 'enchanted_ch1',
        chapterNumber: 1,
        title: 'The Hidden Path',
        description: 'Discover the entrance to the enchanted forest',
        duration_minutes: 15,
        audioKey: 'series_enchanted_ch1',
      },
      {
        id: 'enchanted_ch2',
        chapterNumber: 2,
        title: 'The Wise Owl',
        description: 'Meet the guardian of forest wisdom',
        duration_minutes: 15,
        audioKey: 'series_enchanted_ch2',
      },
      {
        id: 'enchanted_ch3',
        chapterNumber: 3,
        title: 'The Moonlit Glade',
        description: 'Rest in a clearing bathed in silver light',
        duration_minutes: 15,
        audioKey: 'series_enchanted_ch3',
      },
      {
        id: 'enchanted_ch4',
        chapterNumber: 4,
        title: 'The Singing Stream',
        description: 'Follow the melody of flowing water',
        duration_minutes: 15,
        audioKey: 'series_enchanted_ch4',
      },
      {
        id: 'enchanted_ch5',
        chapterNumber: 5,
        title: 'The Dream Tree',
        description: 'Find rest beneath the ancient dream tree',
        duration_minutes: 15,
        audioKey: 'series_enchanted_ch5',
      },
    ],
  },
  {
    id: 'series_voyage',
    title: 'The Starlight Voyage',
    description: 'Sail across celestial seas on a ship made of moonbeams. Each night brings new wonders among the stars.',
    color: '#7B8FA1',
    narrator: 'Rachel',
    chapterCount: 4,
    totalDuration: 60,
    category: 'fantasy',
    chapters: [
      {
        id: 'voyage_ch1',
        chapterNumber: 1,
        title: 'Setting Sail',
        description: 'Board the starship and leave the harbor',
        duration_minutes: 15,
        audioKey: 'series_voyage_ch1',
      },
      {
        id: 'voyage_ch2',
        chapterNumber: 2,
        title: 'The Nebula Gardens',
        description: 'Drift through clouds of cosmic flowers',
        duration_minutes: 15,
        audioKey: 'series_voyage_ch2',
      },
      {
        id: 'voyage_ch3',
        chapterNumber: 3,
        title: 'The Comet\'s Trail',
        description: 'Follow a comet to distant worlds',
        duration_minutes: 15,
        audioKey: 'series_voyage_ch3',
      },
      {
        id: 'voyage_ch4',
        chapterNumber: 4,
        title: 'The Sleeping Star',
        description: 'Find rest on a quiet, glowing star',
        duration_minutes: 15,
        audioKey: 'series_voyage_ch4',
      },
    ],
  },
  {
    id: 'series_midnight',
    title: 'Midnight Mysteries',
    description: 'A collection of gentle thriller tales that intrigue the mind while lulling you to sleep. Mystery meets tranquility.',
    color: '#4A5568',
    narrator: 'Rachel',
    chapterCount: 3,
    totalDuration: 45,
    category: 'thriller',
    chapters: [
      {
        id: 'midnight_ch1',
        chapterNumber: 1,
        title: 'The Lighthouse Keeper',
        description: 'Secrets hidden in the coastal fog',
        duration_minutes: 15,
        audioKey: 'series_midnight_ch1',
      },
      {
        id: 'midnight_ch2',
        chapterNumber: 2,
        title: 'The Antique Clock',
        description: 'Time holds more than memories',
        duration_minutes: 15,
        audioKey: 'series_midnight_ch2',
      },
      {
        id: 'midnight_ch3',
        chapterNumber: 3,
        title: 'The Last Train',
        description: 'A journey to an unexpected destination',
        duration_minutes: 15,
        audioKey: 'series_midnight_ch3',
      },
    ],
  },
];

export const getSeriesById = (id: string): Series | undefined => {
  return seriesData.find((series) => series.id === id);
};

