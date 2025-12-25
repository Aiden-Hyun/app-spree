/**
 * Meditation Courses - Sequential guided meditation programs
 */

export interface CourseSession {
  id: string;
  dayNumber: number;
  title: string;
  description: string;
  duration_minutes: number;
  audioKey: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  color: string;
  totalDuration: number;
  sessionCount: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  sessions: CourseSession[];
}

export const coursesData: Course[] = [
  {
    id: 'course_basics',
    title: 'Meditation Basics',
    description: 'A 7-day introduction to meditation for complete beginners. Learn the fundamentals of mindfulness and build a daily practice.',
    color: '#8B9F82',
    totalDuration: 70,
    sessionCount: 7,
    difficulty: 'beginner',
    sessions: [
      {
        id: 'basics_day1',
        dayNumber: 1,
        title: 'Finding Your Breath',
        description: 'Learn to use your breath as an anchor for attention',
        duration_minutes: 10,
        audioKey: 'course_basics_day1',
      },
      {
        id: 'basics_day2',
        dayNumber: 2,
        title: 'Body Awareness',
        description: 'Develop awareness of physical sensations',
        duration_minutes: 10,
        audioKey: 'course_basics_day2',
      },
      {
        id: 'basics_day3',
        dayNumber: 3,
        title: 'Wandering Mind',
        description: 'Understanding and working with distractions',
        duration_minutes: 10,
        audioKey: 'course_basics_day3',
      },
      {
        id: 'basics_day4',
        dayNumber: 4,
        title: 'Emotions & Thoughts',
        description: 'Observing mental activity without judgment',
        duration_minutes: 10,
        audioKey: 'course_basics_day4',
      },
      {
        id: 'basics_day5',
        dayNumber: 5,
        title: 'Cultivating Calm',
        description: 'Deepening relaxation through practice',
        duration_minutes: 10,
        audioKey: 'course_basics_day5',
      },
      {
        id: 'basics_day6',
        dayNumber: 6,
        title: 'Present Moment',
        description: 'Staying grounded in the now',
        duration_minutes: 10,
        audioKey: 'course_basics_day6',
      },
      {
        id: 'basics_day7',
        dayNumber: 7,
        title: 'Building Your Practice',
        description: 'Creating a sustainable meditation habit',
        duration_minutes: 10,
        audioKey: 'course_basics_day7',
      },
    ],
  },
  {
    id: 'course_stress',
    title: 'Stress Less',
    description: 'A 5-day program to reduce stress and anxiety. Learn practical techniques to calm your nervous system.',
    color: '#7B8FA1',
    totalDuration: 60,
    sessionCount: 5,
    difficulty: 'beginner',
    sessions: [
      {
        id: 'stress_day1',
        dayNumber: 1,
        title: 'Understanding Stress',
        description: 'Recognize how stress affects your body and mind',
        duration_minutes: 12,
        audioKey: 'course_stress_day1',
      },
      {
        id: 'stress_day2',
        dayNumber: 2,
        title: 'The Relaxation Response',
        description: 'Activate your parasympathetic nervous system',
        duration_minutes: 12,
        audioKey: 'course_stress_day2',
      },
      {
        id: 'stress_day3',
        dayNumber: 3,
        title: 'Releasing Tension',
        description: 'Let go of physical and mental tightness',
        duration_minutes: 12,
        audioKey: 'course_stress_day3',
      },
      {
        id: 'stress_day4',
        dayNumber: 4,
        title: 'Anxious Thoughts',
        description: 'Working skillfully with worry and anxiety',
        duration_minutes: 12,
        audioKey: 'course_stress_day4',
      },
      {
        id: 'stress_day5',
        dayNumber: 5,
        title: 'Inner Peace',
        description: 'Cultivating lasting calm and resilience',
        duration_minutes: 12,
        audioKey: 'course_stress_day5',
      },
    ],
  },
  {
    id: 'course_sleep',
    title: 'Sleep Well',
    description: 'A 6-day program to improve your sleep quality. Wind down effectively and wake up refreshed.',
    color: '#B4A7C7',
    totalDuration: 90,
    sessionCount: 6,
    difficulty: 'beginner',
    sessions: [
      {
        id: 'sleep_day1',
        dayNumber: 1,
        title: 'Preparing for Rest',
        description: 'Create the conditions for quality sleep',
        duration_minutes: 15,
        audioKey: 'course_sleep_day1',
      },
      {
        id: 'sleep_day2',
        dayNumber: 2,
        title: 'Letting Go of the Day',
        description: 'Release the events and worries of your day',
        duration_minutes: 15,
        audioKey: 'course_sleep_day2',
      },
      {
        id: 'sleep_day3',
        dayNumber: 3,
        title: 'Body Relaxation',
        description: 'Progressive relaxation for deep rest',
        duration_minutes: 15,
        audioKey: 'course_sleep_day3',
      },
      {
        id: 'sleep_day4',
        dayNumber: 4,
        title: 'Quieting the Mind',
        description: 'Calm racing thoughts before sleep',
        duration_minutes: 15,
        audioKey: 'course_sleep_day4',
      },
      {
        id: 'sleep_day5',
        dayNumber: 5,
        title: 'Dream Preparation',
        description: 'Set intentions for restful dreams',
        duration_minutes: 15,
        audioKey: 'course_sleep_day5',
      },
      {
        id: 'sleep_day6',
        dayNumber: 6,
        title: 'Deep Sleep',
        description: 'Extended relaxation for profound rest',
        duration_minutes: 15,
        audioKey: 'course_sleep_day6',
      },
    ],
  },
];

export const getCourseById = (id: string): Course | undefined => {
  return coursesData.find((course) => course.id === id);
};

