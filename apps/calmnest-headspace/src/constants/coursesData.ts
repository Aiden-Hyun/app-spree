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
  instructor: string;
  sessions: CourseSession[];
}

export const coursesData: Course[] = [
  {
    id: 'course_10min_reset',
    title: 'The 10 Minute Reset',
    description: 'A 2-session course designed to help you reset and recharge in just 10 minutes. Perfect for busy schedules when you need a quick mental refresh.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80',
    color: '#7DAFB4',
    totalDuration: 20,
    sessionCount: 2,
    difficulty: 'beginner',
    instructor: 'Rachel',
    sessions: [
      {
        id: '10min_reset_session1',
        dayNumber: 1,
        title: 'Session 1: Grounding',
        description: 'Ground yourself and release tension through guided breathing',
        duration_minutes: 10,
        audioKey: 'course_10min_reset_session1',
      },
      {
        id: '10min_reset_session2',
        dayNumber: 2,
        title: 'Session 2: Clarity',
        description: 'Clear your mind and restore mental focus',
        duration_minutes: 10,
        audioKey: 'course_10min_reset_session2',
      },
    ],
  },
  {
    id: 'course_foundational_series',
    title: 'Foundational Series',
    description: 'A calming collection of meditations designed to help you feel safe, grounded, and at peace. Perfect for building a consistent practice.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=400&q=80',
    color: '#8B9DC3',
    totalDuration: 26,
    sessionCount: 3,
    difficulty: 'beginner',
    instructor: 'Rachel',
    sessions: [
      {
        id: 'foundational_session1',
        dayNumber: 1,
        title: "Session 1: You're Safe Right Now",
        description: 'A gentle meditation to help you feel safe and secure in this moment',
        duration_minutes: 7,
        audioKey: 'course_foundational_session1',
      },
      {
        id: 'foundational_session2',
        dayNumber: 2,
        title: "Session 2: When Your Mind Won't Stop",
        description: 'Find calm when racing thoughts feel overwhelming',
        duration_minutes: 8,
        audioKey: 'course_foundational_session2',
      },
      {
        id: 'foundational_session3',
        dayNumber: 3,
        title: 'Session 3: A Place to Rest',
        description: 'A nest visualization to find your inner place of peace',
        duration_minutes: 11,
        audioKey: 'course_foundational_session3',
      },
    ],
  },
];

export const getCourseById = (id: string): Course | undefined => {
  return coursesData.find((course) => course.id === id);
};
