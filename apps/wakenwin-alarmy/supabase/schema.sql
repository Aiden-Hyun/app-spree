-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  wake_up_streak INTEGER DEFAULT 0,
  total_challenges_completed INTEGER DEFAULT 0,
  preferences JSONB DEFAULT '{}'::jsonb
);

-- Alarms table
CREATE TABLE IF NOT EXISTS alarms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  time TIME NOT NULL,
  days_of_week INTEGER[] DEFAULT '{1,2,3,4,5}', -- 1=Monday, 7=Sunday
  is_active BOOLEAN DEFAULT true,
  challenge_type TEXT DEFAULT 'basic', -- 'basic', 'math', 'shake', 'photo'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  alarm_id UUID REFERENCES alarms(id) ON DELETE CASCADE,
  challenge_type TEXT NOT NULL,
  difficulty TEXT DEFAULT 'easy', -- 'easy', 'medium', 'hard'
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wake up sessions table
CREATE TABLE IF NOT EXISTS wake_up_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  alarm_id UUID REFERENCES alarms(id) ON DELETE CASCADE,
  wake_up_time TIMESTAMP WITH TIME ZONE NOT NULL,
  challenge_completed BOOLEAN DEFAULT false,
  snooze_count INTEGER DEFAULT 0,
  mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE alarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE wake_up_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own data" ON users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage own alarms" ON alarms
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own challenges" ON challenges
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own wake up sessions" ON wake_up_sessions
  FOR ALL USING (auth.uid() = user_id);
