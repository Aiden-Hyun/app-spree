-- Seed data for languages
INSERT INTO languages (code, name, flag_emoji, is_active) VALUES
  ('es', 'Spanish', '🇪🇸', true),
  ('fr', 'French', '🇫🇷', true),
  ('de', 'German', '🇩🇪', true),
  ('it', 'Italian', '🇮🇹', true),
  ('pt', 'Portuguese', '🇵🇹', true),
  ('ja', 'Japanese', '🇯🇵', false),
  ('ko', 'Korean', '🇰🇷', false),
  ('zh', 'Chinese', '🇨🇳', false)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  flag_emoji = EXCLUDED.flag_emoji,
  is_active = EXCLUDED.is_active;


