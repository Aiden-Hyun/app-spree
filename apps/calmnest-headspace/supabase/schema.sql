-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  meditation_streak INTEGER DEFAULT 0,
  total_meditation_minutes INTEGER DEFAULT 0,
  preferences JSONB DEFAULT '{}'::jsonb
);

-- Meditation sessions table
CREATE TABLE IF NOT EXISTS meditation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  duration_minutes INTEGER NOT NULL,
  session_type TEXT NOT NULL, -- 'meditation', 'breathing', 'sleep_story'
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  mood_before INTEGER CHECK (mood_before >= 1 AND mood_before <= 5),
  mood_after INTEGER CHECK (mood_after >= 1 AND mood_after <= 5)
);

-- Meditation programs table
CREATE TABLE IF NOT EXISTS meditation_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL,
  difficulty_level TEXT NOT NULL, -- 'beginner', 'intermediate', 'advanced'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- User program progress table
CREATE TABLE IF NOT EXISTS user_program_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  program_id UUID REFERENCES meditation_programs(id) ON DELETE CASCADE,
  current_day INTEGER DEFAULT 1,
  completed_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, program_id)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE meditation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meditation_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_program_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own data" ON users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can view own meditation sessions" ON meditation_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view all active programs" ON meditation_programs
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view own program progress" ON user_program_progress
  FOR ALL USING (auth.uid() = user_id);