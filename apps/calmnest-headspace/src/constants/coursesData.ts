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
];

export const getCourseById = (id: string): Course | undefined => {
  return coursesData.find((course) => course.id === id);
};
