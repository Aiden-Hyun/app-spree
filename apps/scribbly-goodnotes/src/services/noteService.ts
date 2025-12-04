import { supabase } from "../supabase";
import { Note, CreateNoteInput, UpdateNoteInput } from "../types";

export class NoteService {
  /**
   * Get all notes for the current user
   */
  static async getNotes(notebookId?: string): Promise<Note[]> {
    let query = supabase
      .from("notes")
      .select(
        `
        *,
        notebook:notebooks(id, title, color),
        template:templates(id, title)
      `
      )
      .order("updated_at", { ascending: false });

    if (notebookId) {
      query = query.eq("notebook_id", notebookId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Get notes by search query
   */
  static async searchNotes(query: string): Promise<Note[]> {
    const { data, error } = await supabase
      .from("notes")
      .select(
        `
        *,
        notebook:notebooks(id, title, color)
      `
      )
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get favorite notes
   */
  static async getFavoriteNotes(): Promise<Note[]> {
    const { data, error } = await supabase
      .from("notes")
      .select(
        `
        *,
        notebook:notebooks(id, title, color)
      `
      )
      .eq("is_favorite", true)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get notes by tag
   */
  static async getNotesByTag(tag: string): Promise<Note[]> {
    const { data, error } = await supabase
      .from("notes")
      .select(
        `
        *,
        notebook:notebooks(id, title, color)
      `
      )
      .contains("tags", [tag])
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get a single note by ID
   */
  static async getNote(id: string): Promise<Note> {
    const { data, error } = await supabase
      .from("notes")
      .select(
        `
        *,
        notebook:notebooks(id, title, color),
        template:templates(id, title),
        canvas_data:canvas_data(*),
        attachments:attachments(*)
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) throw new Error("Note not found");

    return data;
  }

  /**
   * Create a new note
   */
  static async createNote(input: CreateNoteInput): Promise<Note> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("User not authenticated");

    // If template is provided, load template content
    let templateContent = "";
    if (input.template_id) {
      const { data: template } = await supabase
        .from("templates")
        .select("content")
        .eq("id", input.template_id)
        .single();

      if (template) {
        templateContent = template.content || "";
      }
    }

    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: user.user.id,
        title: input.title,
        content: input.content || templateContent,
        notebook_id: input.notebook_id,
        template_id: input.template_id,
        tags: input.tags || [],
      })
      .select()
      .single();

    if (error) throw error;

    // Update user stats
    await this.updateUserStats(user.user.id);

    return data;
  }

  /**
   * Update a note
   */
  static async updateNote(id: string, input: UpdateNoteInput): Promise<Note> {
    const { data, error } = await supabase
      .from("notes")
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Update user stats if content changed
    if (input.content !== undefined) {
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        await this.updateUserStats(user.user.id);
      }
    }

    return data;
  }

  /**
   * Delete a note
   */
  static async deleteNote(id: string): Promise<void> {
    const { error } = await supabase.from("notes").delete().eq("id", id);

    if (error) throw error;

    // Update user stats
    const { data: user } = await supabase.auth.getUser();
    if (user.user) {
      await this.updateUserStats(user.user.id);
    }
  }

  /**
   * Toggle favorite status
   */
  static async toggleFavorite(id: string): Promise<Note> {
    const note = await this.getNote(id);
    return this.updateNote(id, { is_favorite: !note.is_favorite });
  }

  /**
   * Toggle lock status
   */
  static async toggleLock(id: string): Promise<Note> {
    const note = await this.getNote(id);
    return this.updateNote(id, { is_locked: !note.is_locked });
  }

  /**
   * Move note to different notebook
   */
  static async moveNote(id: string, notebookId: string | null): Promise<Note> {
    return this.updateNote(id, { notebook_id: notebookId });
  }

  /**
   * Duplicate a note
   */
  static async duplicateNote(id: string): Promise<Note> {
    const originalNote = await this.getNote(id);

    return this.createNote({
      title: `${originalNote.title} (Copy)`,
      content: originalNote.content,
      notebook_id: originalNote.notebook_id,
      tags: originalNote.tags,
    });
  }

  /**
   * Create a version snapshot
   */
  static async createVersion(
    noteId: string,
    changeSummary?: string
  ): Promise<void> {
    const note = await this.getNote(noteId);

    // Get the latest version number
    const { data: versions } = await supabase
      .from("note_versions")
      .select("version_number")
      .eq("note_id", noteId)
      .order("version_number", { ascending: false })
      .limit(1);

    const nextVersion =
      versions && versions.length > 0 ? versions[0].version_number + 1 : 1;

    const { error } = await supabase.from("note_versions").insert({
      note_id: noteId,
      title: note.title,
      content: note.content,
      canvas_data: note.canvas_data?.[0] || null,
      version_number: nextVersion,
      change_summary: changeSummary,
    });

    if (error) throw error;
  }

  /**
   * Get note versions
   */
  static async getVersions(noteId: string) {
    const { data, error } = await supabase
      .from("note_versions")
      .select("*")
      .eq("note_id", noteId)
      .order("version_number", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Restore from version
   */
  static async restoreVersion(
    noteId: string,
    versionId: string
  ): Promise<Note> {
    const { data: version } = await supabase
      .from("note_versions")
      .select("*")
      .eq("id", versionId)
      .single();

    if (!version) throw new Error("Version not found");

    // Create a new version of current state before restoring
    await this.createVersion(noteId, "Before restore");

    // Restore the note
    return this.updateNote(noteId, {
      title: version.title,
      content: version.content,
    });
  }

  /**
   * Update user statistics
   */
  private static async updateUserStats(userId: string): Promise<void> {
    // Count total notes
    const { count: noteCount } = await supabase
      .from("notes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // Calculate total words
    const { data: notes } = await supabase
      .from("notes")
      .select("content")
      .eq("user_id", userId);

    const totalWords =
      notes?.reduce((sum, note) => {
        const words = (note.content || "").trim().split(/\s+/).length;
        return sum + words;
      }, 0) || 0;

    // Update user stats
    await supabase
      .from("users")
      .update({
        total_notes: noteCount || 0,
        total_words: totalWords,
      })
      .eq("id", userId);
  }

  /**
   * Auto-save note content
   */
  static async autoSave(id: string, content: string): Promise<void> {
    // Use a simple update without returning data for better performance
    const { error } = await supabase
      .from("notes")
      .update({
        content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
  }
}


