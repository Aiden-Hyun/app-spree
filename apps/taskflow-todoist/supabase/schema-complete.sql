-- =============================================
-- TaskFlow Database Schema (Complete)
-- =============================================
-- This script sets up all tables, security policies, 
-- and automatic user profile creation for TaskFlow

-- =============================================
-- 1. TABLES
-- =============================================

-- Users table (synced with auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  total_tasks_completed INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  preferences JSONB DEFAULT '{
    "notifications_enabled": true,
    "dark_mode": false,
    "default_priority": "medium",
    "first_day_of_week": "monday"
  }'::jsonb
);

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6c5ce7',
  is_archived BOOLEAN DEFAULT false,
  task_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed', 'cancelled')),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);

-- Subtasks table
CREATE TABLE IF NOT EXISTS public.subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task labels table
CREATE TABLE IF NOT EXISTS public.task_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6c5ce7',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Task label assignments (many-to-many)
CREATE TABLE IF NOT EXISTS public.task_label_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES public.task_labels(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, label_id)
);

-- =============================================
-- 2. FUNCTIONS & TRIGGERS
-- =============================================

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS set_updated_at_projects ON public.projects;
CREATE TRIGGER set_updated_at_projects
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_tasks ON public.tasks;
CREATE TRIGGER set_updated_at_tasks
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_subtasks ON public.subtasks;
CREATE TRIGGER set_updated_at_subtasks
  BEFORE UPDATE ON public.subtasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_label_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can manage own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can manage own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can manage subtasks for own tasks" ON public.subtasks;
DROP POLICY IF EXISTS "Users can manage own labels" ON public.task_labels;
DROP POLICY IF EXISTS "Users can manage label assignments for own tasks" ON public.task_label_assignments;

-- RLS Policies for users table
CREATE POLICY "Users can view own data" 
  ON public.users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id);

-- RLS Policies for projects table
CREATE POLICY "Users can manage own projects" 
  ON public.projects FOR ALL 
  USING (auth.uid() = user_id);

-- RLS Policies for tasks table
CREATE POLICY "Users can manage own tasks" 
  ON public.tasks FOR ALL 
  USING (auth.uid() = user_id);

-- RLS Policies for subtasks table
CREATE POLICY "Users can manage subtasks for own tasks" 
  ON public.subtasks FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks 
      WHERE tasks.id = subtasks.task_id 
      AND tasks.user_id = auth.uid()
    )
  );

-- RLS Policies for task_labels table
CREATE POLICY "Users can manage own labels" 
  ON public.task_labels FOR ALL 
  USING (auth.uid() = user_id);

-- RLS Policies for task_label_assignments table
CREATE POLICY "Users can manage label assignments for own tasks" 
  ON public.task_label_assignments FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks 
      WHERE tasks.id = task_label_assignments.task_id 
      AND tasks.user_id = auth.uid()
    )
  );

-- =============================================
-- 4. GRANTS (For anon and authenticated users)
-- =============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant access to tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subtasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_labels TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_label_assignments TO authenticated;

-- =============================================
-- SETUP COMPLETE
-- =============================================
-- Run seed.sql next to populate with sample data (optional)

