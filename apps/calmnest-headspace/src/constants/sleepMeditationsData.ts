/**
 * Sleep Meditations data
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
    id: 'sleep_med_even_if',
    title: 'Even If You Don\'t Fall Asleep',
    description: 'Rest deeply, even without sleep',
    duration_minutes: 9,
    instructor: 'Delilah',
    icon: 'moon',
    audioKey: 'sleep_med_even_if_you_dont_fall_asleep',
    color: '#7B8FA1',
    thumbnailUrl: 'https://images.unsplash.com/photo-1531353826977-0941b4779a1c?w=400&q=80',
  },
  {
    id: 'sleep_med_let_day_fall',
    title: 'Let the Day Fall Away',
    description: 'Release the day and unwind',
    duration_minutes: 8,
    instructor: 'Delilah',
    icon: 'water',
    audioKey: 'sleep_med_let_the_day_fall_away',
    color: '#8B7BAE',
    thumbnailUrl: 'https://images.unsplash.com/photo-1495197359483-d092478c170a?w=400&q=80',
  },
];
