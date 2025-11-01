-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  current_streak INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  preferences JSONB DEFAULT '{}'::jsonb
);

-- Languages table
CREATE TABLE IF NOT EXISTS languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- 'en', 'es', 'fr', etc.
  name TEXT NOT NULL,
  flag_emoji TEXT,
  is_active BOOLEAN DEFAULT true
);

-- User languages table (many-to-many)
CREATE TABLE IF NOT EXISTS user_languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  language_id UUID REFERENCES languages(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  is_learning BOOLEAN DEFAULT true,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, language_id)
);

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_id UUID REFERENCES languages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  lesson_type TEXT NOT NULL, -- 'vocabulary', 'grammar', 'conversation'
  difficulty_level INTEGER DEFAULT 1,
  xp_reward INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE,
  score INTEGER,
  time_spent_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Vocabulary table
CREATE TABLE IF NOT EXISTS vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_id UUID REFERENCES languages(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  translation TEXT NOT NULL,
  pronunciation TEXT,
  difficulty_level INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true
);

-- User vocabulary progress
CREATE TABLE IF NOT EXISTS user_vocabulary_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vocabulary_id UUID REFERENCES vocabulary(id) ON DELETE CASCADE,
  mastery_level INTEGER DEFAULT 0, -- 0-5 scale
  last_reviewed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  review_count INTEGER DEFAULT 0,
  UNIQUE(user_id, vocabulary_id)
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  xp_threshold INTEGER,
  streak_threshold INTEGER,
  lesson_threshold INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_vocabulary_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own data" ON users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can view all active languages" ON languages
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage own language progress" ON user_languages
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view all active lessons" ON lessons
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage own progress" ON user_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view all active vocabulary" ON vocabulary
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage own vocabulary progress" ON user_vocabulary_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view all achievements" ON achievements
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own achievements" ON user_achievements
  FOR ALL USING (auth.uid() = user_id);
