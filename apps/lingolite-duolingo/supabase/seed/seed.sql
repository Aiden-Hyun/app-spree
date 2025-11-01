-- Master seed file for LingoLite
-- Run this file to seed all initial data

-- Seed languages
\i languages.sql

-- Seed Spanish vocabulary
\i vocabulary_spanish.sql

-- Seed Spanish lessons
\i lessons_spanish.sql

-- Create some sample achievements
INSERT INTO achievements (name, description, icon, xp_threshold, streak_threshold, lesson_threshold) VALUES
  ('First Steps', 'Complete your first lesson', '🎯', NULL, NULL, 1),
  ('Vocabulary Novice', 'Learn 25 words', '📚', 50, NULL, NULL),
  ('Week Warrior', 'Maintain a 7-day streak', '🔥', NULL, 7, NULL),
  ('Centurion', 'Earn 100 XP', '💯', 100, NULL, NULL),
  ('Lesson Master', 'Complete 10 lessons', '📖', NULL, NULL, 10),
  ('Polyglot', 'Reach 500 XP', '🌍', 500, NULL, NULL),
  ('Master Achiever', 'Complete 50 lessons', '🏆', NULL, NULL, 50),
  ('Dedication', 'Maintain a 30-day streak', '💪', NULL, 30, NULL)
ON CONFLICT (name) DO NOTHING;
