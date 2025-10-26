-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  master_password_hash TEXT, -- Encrypted master password
  two_factor_enabled BOOLEAN DEFAULT false,
  biometric_enabled BOOLEAN DEFAULT false,
  auto_lock_minutes INTEGER DEFAULT 15,
  preferences JSONB DEFAULT '{}'::jsonb
);

-- Password categories table
CREATE TABLE IF NOT EXISTS password_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#2d3436',
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Passwords table
CREATE TABLE IF NOT EXISTS passwords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES password_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  username TEXT,
  password_encrypted TEXT NOT NULL, -- Encrypted password
  website TEXT,
  notes TEXT,
  is_favorite BOOLEAN DEFAULT false,
  last_used TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Password history table
CREATE TABLE IF NOT EXISTS password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  password_id UUID REFERENCES passwords(id) ON DELETE CASCADE,
  old_password_encrypted TEXT NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security events table
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'login', 'password_created', 'password_updated', 'export', etc.
  description TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shared passwords table (for family/shared accounts)
CREATE TABLE IF NOT EXISTS shared_passwords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  password_id UUID REFERENCES passwords(id) ON DELETE CASCADE,
  shared_with_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permission_level TEXT DEFAULT 'read', -- 'read', 'write'
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(password_id, shared_with_user_id)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_passwords ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own data" ON users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage own categories" ON password_categories
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own passwords" ON passwords
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view password history for own passwords" ON password_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM passwords 
      WHERE passwords.id = password_history.password_id 
      AND passwords.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own security events" ON security_events
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared passwords" ON shared_passwords
  FOR ALL USING (auth.uid() = shared_with_user_id);