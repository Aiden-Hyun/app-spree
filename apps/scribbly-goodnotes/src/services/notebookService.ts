import { supabase } from "../supabase";
import { Notebook, CreateNotebookInput, UpdateNotebookInput } from "../types";

export class NotebookService {
  /**
   * Get all notebooks for the current user
   */
  static async getNotebooks(): Promise<Notebook[]> {
    const { data, error } = await supabase
      .from("notebooks")
      .select(
        `
        *,
        notes:notes(count)
      `
      )
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Transform the data to include note count
    return (data || []).map((notebook) => ({
      ...notebook,
      note_count: notebook.notes?.[0]?.count || 0,
      notes: undefined,
    }));
  }

  /**
   * Get notebooks organized in a tree structure
   */
  static async getNotebookTree(): Promise<Notebook[]> {
    const notebooks = await this.getNotebooks();
    return this.buildTree(notebooks);
  }

  /**
   * Build tree structure from flat list of notebooks
   */
  private static buildTree(notebooks: Notebook[]): Notebook[] {
    const notebookMap = new Map<string, Notebook>();
    const rootNotebooks: Notebook[] = [];

    // First pass: create map
    notebooks.forEach((notebook) => {
      notebookMap.set(notebook.id, { ...notebook, children: [] });
    });

    // Second pass: build tree
    notebooks.forEach((notebook) => {
      const current = notebookMap.get(notebook.id)!;
      if (notebook.parent_id) {
        const parent = notebookMap.get(notebook.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(current);
        }
      } else {
        rootNotebooks.push(current);
      }
    });

    return rootNotebooks;
  }

  /**
   * Get a single notebook by ID
   */
  static async getNotebook(id: string): Promise<Notebook> {
    const { data, error } = await supabase
      .from("notebooks")
      .select(
        `
        *,
        notes:notes(count)
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) throw new Error("Notebook not found");

    return {
      ...data,
      note_count: data.notes?.[0]?.count || 0,
      notes: undefined,
    };
  }

  /**
   * Create a new notebook
   */
  static async createNotebook(input: CreateNotebookInput): Promise<Notebook> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("notebooks")
      .insert({
        ...input,
        user_id: user.user.id,
        color: input.color || "#00b894",
        icon: input.icon || "book",
        is_folder: input.is_folder || false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a notebook
   */
  static async updateNotebook(
    id: string,
    input: UpdateNotebookInput
  ): Promise<Notebook> {
    const { data, error } = await supabase
      .from("notebooks")
      .update(input)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a notebook
   */
  static async deleteNotebook(id: string): Promise<void> {
    // Check if notebook has children or notes
    const notebook = await this.getNotebook(id);

    if (notebook.note_count && notebook.note_count > 0) {
      throw new Error(
        "Cannot delete notebook with notes. Please move or delete the notes first."
      );
    }

    const { data: children } = await supabase
      .from("notebooks")
      .select("id")
      .eq("parent_id", id);

    if (children && children.length > 0) {
      throw new Error(
        "Cannot delete folder with subfolders. Please move or delete the subfolders first."
      );
    }

    const { error } = await supabase.from("notebooks").delete().eq("id", id);

    if (error) throw error;
  }

  /**
   * Move a notebook to a different parent
   */
  static async moveNotebook(
    id: string,
    newParentId: string | null
  ): Promise<Notebook> {
    // Prevent moving a folder into its own descendant
    if (newParentId) {
      const isDescendant = await this.isDescendant(id, newParentId);
      if (isDescendant) {
        throw new Error("Cannot move a folder into its own subfolder");
      }
    }

    return this.updateNotebook(id, { parent_id: newParentId });
  }

  /**
   * Check if targetId is a descendant of parentId
   */
  private static async isDescendant(
    parentId: string,
    targetId: string
  ): Promise<boolean> {
    const notebooks = await this.getNotebooks();
    const notebookMap = new Map(notebooks.map((n) => [n.id, n]));

    let current = notebookMap.get(targetId);
    while (current) {
      if (current.parent_id === parentId) return true;
      current = current.parent_id
        ? notebookMap.get(current.parent_id)
        : undefined;
    }

    return false;
  }

  /**
   * Archive or unarchive a notebook
   */
  static async toggleArchive(id: string): Promise<Notebook> {
    const notebook = await this.getNotebook(id);
    return this.updateNotebook(id, { is_archived: !notebook.is_archived });
  }

  /**
   * Reorder notebooks
   */
  static async reorderNotebooks(notebookIds: string[]): Promise<void> {
    const updates = notebookIds.map((id, index) => ({
      id,
      sort_order: index,
    }));

    for (const update of updates) {
      await supabase
        .from("notebooks")
        .update({ sort_order: update.sort_order })
        .eq("id", update.id);
    }
  }

  /**
   * Get notebook statistics
   */
  static async getNotebookStats(id: string): Promise<{
    total_notes: number;
    total_words: number;
    last_updated: string;
  }> {
    const { data, error } = await supabase
      .from("notes")
      .select("content, updated_at")
      .eq("notebook_id", id)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    const notes = data || [];
    const total_notes = notes.length;
    const total_words = notes.reduce((sum, note) => {
      const words = (note.content || "").trim().split(/\s+/).length;
      return sum + words;
    }, 0);
    const last_updated = notes[0]?.updated_at || new Date().toISOString();

    return { total_notes, total_words, last_updated };
  }
}


