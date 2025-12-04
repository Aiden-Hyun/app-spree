-- Seed data for alarm_sounds table
INSERT INTO alarm_sounds (name, file_url, category, is_premium) VALUES
  ('Classic Bell', 'https://example.com/sounds/classic-bell.mp3', 'classic', false),
  ('Digital Beep', 'https://example.com/sounds/digital-beep.mp3', 'digital', false),
  ('Gentle Chimes', 'https://example.com/sounds/gentle-chimes.mp3', 'gentle', false),
  ('Morning Birds', 'https://example.com/sounds/morning-birds.mp3', 'nature', false),
  ('Ocean Waves', 'https://example.com/sounds/ocean-waves.mp3', 'nature', true),
  ('Forest Rain', 'https://example.com/sounds/forest-rain.mp3', 'nature', true),
  ('Motivational', 'https://example.com/sounds/motivational.mp3', 'voice', true),
  ('Emergency', 'https://example.com/sounds/emergency.mp3', 'loud', false)
ON CONFLICT DO NOTHING;

-- Example user preferences
-- This would be populated when users sign up or update their settings
-- UPDATE users 
-- SET preferences = jsonb_build_object(
--   'default_challenge', 'math',
--   'snooze_limit', 3,
--   'volume_gradual', true,
--   'bedtime_reminder', true,
--   'bedtime_hour', 22,
--   'bedtime_minute', 30,
--   'wake_goal_hour', 6,
--   'wake_goal_minute', 30
-- )
-- WHERE email = 'user@example.com';


