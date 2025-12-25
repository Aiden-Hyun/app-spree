/**
 * Sleep Meditations placeholder data
 * Guided meditations specifically designed for sleep and relaxation
 */

export interface SleepMeditation {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  instructor: string;
  icon: string;
  audioKey: string;
  thumbnailUrl?: string;
  color: string;
}

export const sleepMeditationsData: SleepMeditation[] = [
  {
    id: 'sleep_med_peaceful',
    title: 'Peaceful Sleep',
    description: 'Drift into deep, restorative sleep',
    duration_minutes: 20,
    instructor: 'Rachel',
    icon: 'moon',
    audioKey: 'sleep_med_peaceful',
    color: '#7B8FA1',
  },
  {
    id: 'sleep_med_deep_rest',
    title: 'Deep Rest',
    description: 'Body scan for complete relaxation',
    duration_minutes: 30,
    instructor: 'Rachel',
    icon: 'bed',
    audioKey: 'sleep_med_deep_rest',
    color: '#8B7BAE',
  },
  {
    id: 'sleep_med_dream_journey',
    title: 'Dream Journey',
    description: 'Visualization for peaceful dreams',
    duration_minutes: 25,
    instructor: 'Rachel',
    icon: 'cloud',
    audioKey: 'sleep_med_dream_journey',
    color: '#9B8FAE',
  },
  {
    id: 'sleep_med_letting_go',
    title: 'Letting Go',
    description: 'Release the day and unwind',
    duration_minutes: 15,
    instructor: 'Rachel',
    icon: 'water',
    audioKey: 'sleep_med_letting_go',
    color: '#7B9BAE',
  },
  {
    id: 'sleep_med_breath_sleep',
    title: 'Breathe Into Sleep',
    description: 'Gentle breathing for slumber',
    duration_minutes: 10,
    instructor: 'Rachel',
    icon: 'fitness',
    audioKey: 'sleep_med_breath_sleep',
    color: '#A4B4C4',
  },
  {
    id: 'sleep_med_night_calm',
    title: 'Night Calm',
    description: 'Quiet the mind for restful sleep',
    duration_minutes: 20,
    instructor: 'Rachel',
    icon: 'sparkles',
    audioKey: 'sleep_med_night_calm',
    color: '#C4A4B4',
  },
];

