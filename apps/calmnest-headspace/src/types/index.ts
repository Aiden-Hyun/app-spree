// User types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  meditation_streak: number;
  total_meditation_minutes: number;
  preferences: UserPreferences;
  created_at: string;
}

export interface UserPreferences {
  daily_reminder_time?: string;
  preferred_duration?: number;
  theme?: 'light' | 'dark';
  notification_enabled?: boolean;
  background_sounds?: boolean;
}

// Meditation types
export interface MeditationSession {
  id: string;
  user_id: string;
  duration_minutes: number;
  session_type: 'meditation' | 'breathing' | 'sleep_story';
  completed_at: string;
  notes?: string;
  mood_before?: number;
  mood_after?: number;
}

export interface GuidedMeditation {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  audio_url: string;
  thumbnail_url?: string;
  category: MeditationCategory;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  instructor?: string;
  is_premium: boolean;
  created_at: string;
}

export type MeditationCategory = 
  | 'focus'
  | 'stress'
  | 'anxiety'
  | 'sleep'
  | 'relationships'
  | 'self-esteem'
  | 'gratitude'
  | 'body-scan'
  | 'loving-kindness';

export interface MeditationProgram {
  id: string;
  title: string;
  description: string;
  duration_days: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  created_at: string;
  is_active: boolean;
  sessions?: GuidedMeditation[];
}

export interface UserProgramProgress {
  id: string;
  user_id: string;
  program_id: string;
  current_day: number;
  completed_at?: string;
  started_at: string;
  program?: MeditationProgram;
}

// Breathing exercises
export interface BreathingExercise {
  id: string;
  name: string;
  description: string;
  pattern: BreathingPattern;
  duration_minutes: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  benefits: string[];
}

export interface BreathingPattern {
  inhale_duration: number;
  hold_duration?: number;
  exhale_duration: number;
  pause_duration?: number;
  cycles: number;
}

// Sleep content
export interface SleepStory {
  id: string;
  title: string;
  description: string;
  narrator: string;
  duration_minutes: number;
  audio_url: string;
  thumbnail_url?: string;
  category: 'nature' | 'fantasy' | 'travel' | 'fiction';
  is_premium: boolean;
  created_at: string;
}

// Daily content
export interface DailyQuote {
  id: string;
  text: string;
  author: string;
  date: string;
}

// Favorites
export interface UserFavorite {
  id: string;
  user_id: string;
  content_id: string;
  content_type: 'meditation' | 'sleep_story' | 'breathing_exercise';
  favorited_at: string;
}

// Statistics
export interface UserStats {
  total_sessions: number;
  total_minutes: number;
  current_streak: number;
  longest_streak: number;
  favorite_time_of_day?: string;
  most_used_category?: MeditationCategory;
  weekly_minutes: number[];
  mood_improvement: number;
}
