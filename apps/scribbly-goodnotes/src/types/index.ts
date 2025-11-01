// Database types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  total_notes: number;
  total_words: number;
  storage_used_mb: number;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: "light" | "dark";
  auto_save: boolean;
  default_template_id?: string;
  default_notebook_id?: string;
}

export interface Notebook {
  id: string;
  user_id: string;
  parent_id?: string;
  title: string;
  description?: string;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  is_folder: boolean;
  sort_order: number;
  // Computed fields
  note_count?: number;
  children?: Notebook[];
}

export interface Note {
  id: string;
  user_id: string;
  notebook_id?: string;
  template_id?: string;
  title: string;
  content?: string;
  content_type: "html" | "markdown" | "plain";
  created_at: string;
  updated_at: string;
  is_favorite: boolean;
  is_locked: boolean;
  tags: string[];
  metadata: Record<string, any>;
  // Relations
  notebook?: Notebook;
  template?: Template;
  canvas_data?: CanvasData[];
  attachments?: Attachment[];
}

export interface CanvasData {
  id: string;
  note_id: string;
  page_number: number;
  strokes: Stroke[];
  background_type: "blank" | "grid" | "lined" | "dotted";
  background_color: string;
  width: number;
  height: number;
  created_at: string;
  updated_at: string;
}

export interface Stroke {
  id: string;
  path: string; // SVG path data
  color: string;
  width: number;
  opacity: number;
  type: "pen" | "highlighter" | "eraser";
  timestamp: number;
}

export interface Attachment {
  id: string;
  note_id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  thumbnail_path?: string;
  metadata: AttachmentMetadata;
  created_at: string;
}

export interface AttachmentMetadata {
  width?: number;
  height?: number;
  duration?: number;
  pages?: number;
}

export interface Template {
  id: string;
  user_id?: string;
  title: string;
  description?: string;
  category: string;
  content?: string;
  canvas_data?: any;
  icon: string;
  is_public: boolean;
  is_system: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface NoteVersion {
  id: string;
  note_id: string;
  title: string;
  content?: string;
  canvas_data?: any;
  created_at: string;
  version_number: number;
  change_summary?: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  usage_count: number;
  created_at: string;
}

// Form types
export interface CreateNotebookInput {
  title: string;
  description?: string;
  color?: string;
  icon?: string;
  parent_id?: string;
  is_folder?: boolean;
}

export interface UpdateNotebookInput {
  title?: string;
  description?: string;
  color?: string;
  icon?: string;
  parent_id?: string;
  is_archived?: boolean;
  sort_order?: number;
}

export interface CreateNoteInput {
  title: string;
  content?: string;
  notebook_id?: string;
  template_id?: string;
  tags?: string[];
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  notebook_id?: string;
  is_favorite?: boolean;
  is_locked?: boolean;
  tags?: string[];
}
