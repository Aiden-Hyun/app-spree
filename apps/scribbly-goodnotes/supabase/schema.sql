-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  total_notes INTEGER DEFAULT 0,
  total_words INTEGER DEFAULT 0,
  storage_used_mb DECIMAL(10,2) DEFAULT 0,
  preferences JSONB DEFAULT '{
    "theme": "light",
    "auto_save": true,
    "default_template_id": null,
    "default_notebook_id": null
  }'::jsonb
);

-- Notebooks table with folder support
CREATE TABLE IF NOT EXISTS notebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES notebooks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#00b894',
  icon TEXT DEFAULT 'book',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT false,
  is_folder BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0
);

-- Templates table (moved before notes table)
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL for system templates
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  content TEXT, -- Default content for the template
  canvas_data JSONB, -- Default canvas setup if applicable
  icon TEXT DEFAULT 'document',
  is_public BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notes table with enhanced content types
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  notebook_id UUID REFERENCES notebooks(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT, -- HTML content for rich text
  content_type TEXT DEFAULT 'html' CHECK (content_type IN ('html', 'markdown', 'plain')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_favorite BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Canvas data for handwritten notes
CREATE TABLE IF NOT EXISTS canvas_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  page_number INTEGER DEFAULT 1,
  strokes JSONB NOT NULL, -- Array of stroke objects with path, color, width, etc.
  background_type TEXT DEFAULT 'blank' CHECK (background_type IN ('blank', 'grid', 'lined', 'dotted')),
  background_color TEXT DEFAULT '#ffffff',
  width INTEGER DEFAULT 768,
  height INTEGER DEFAULT 1024,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attachments table for files and media
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL, -- in bytes
  storage_path TEXT NOT NULL, -- Supabase storage path
  thumbnail_path TEXT, -- For images/videos
  metadata JSONB DEFAULT '{}'::jsonb, -- Duration for audio/video, dimensions for images, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note versions table for version history
CREATE TABLE IF NOT EXISTS note_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  canvas_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version_number INTEGER NOT NULL,
  change_summary TEXT
);

-- Tags table for better tag management
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#00b894',
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Search index table for better performance
CREATE TABLE IF NOT EXISTS search_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  notebook_id UUID REFERENCES notebooks(id) ON DELETE CASCADE,
  content_tsv tsvector,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_notebooks_user_id ON notebooks(user_id);
CREATE INDEX idx_notebooks_parent_id ON notebooks(parent_id);
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_notebook_id ON notes(notebook_id);
CREATE INDEX idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX idx_canvas_data_note_id ON canvas_data(note_id);
CREATE INDEX idx_attachments_note_id ON attachments(note_id);
CREATE INDEX idx_search_index_content ON search_index USING gin(content_tsv);
CREATE INDEX idx_tags_user_id ON tags(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_index ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own data" ON users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage own notebooks" ON notebooks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notes" ON notes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own canvas data" ON canvas_data
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM notes 
      WHERE notes.id = canvas_data.note_id 
      AND notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own attachments" ON attachments
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view public and own templates" ON templates
  FOR SELECT USING (
    is_public = true OR 
    is_system = true OR 
    auth.uid() = user_id
  );

CREATE POLICY "Users can manage own templates" ON templates
  FOR INSERT WITH CHECK (auth.uid() = user_id)
  FOR UPDATE USING (auth.uid() = user_id)
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view note versions for own notes" ON note_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM notes 
      WHERE notes.id = note_versions.note_id 
      AND notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own tags" ON tags
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own search index" ON search_index
  FOR ALL USING (auth.uid() = user_id);

-- Functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update timestamps
CREATE TRIGGER update_notebooks_updated_at BEFORE UPDATE ON notebooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_canvas_data_updated_at BEFORE UPDATE ON canvas_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to update search index
CREATE OR REPLACE FUNCTION update_search_index()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM search_index WHERE note_id = OLD.id;
  ELSE
    INSERT INTO search_index (user_id, note_id, notebook_id, content_tsv)
    VALUES (
      NEW.user_id,
      NEW.id,
      NEW.notebook_id,
      to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, ''))
    )
    ON CONFLICT (note_id) DO UPDATE
    SET content_tsv = to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, '')),
        updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_note_search_index
  AFTER INSERT OR UPDATE OR DELETE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_search_index();
