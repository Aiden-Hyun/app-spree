import { useState, useEffect, useCallback } from "react";
import { NoteService } from "../services/noteService";
import { Note, CreateNoteInput, UpdateNoteInput } from "../types";

export function useNotes(notebookId?: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await NoteService.getNotes(notebookId);
      setNotes(data);
    } catch (err) {
      console.error("Error loading notes:", err);
      setError(err instanceof Error ? err.message : "Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, [notebookId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const createNote = useCallback(
    async (input: CreateNoteInput) => {
      try {
        const newNote = await NoteService.createNote(input);
        await loadNotes(); // Reload to get updated list
        return newNote;
      } catch (err) {
        console.error("Error creating note:", err);
        throw err;
      }
    },
    [loadNotes]
  );

  const updateNote = useCallback(
    async (id: string, input: UpdateNoteInput) => {
      try {
        const updatedNote = await NoteService.updateNote(id, input);
        await loadNotes(); // Reload to get updated list
        return updatedNote;
      } catch (err) {
        console.error("Error updating note:", err);
        throw err;
      }
    },
    [loadNotes]
  );

  const deleteNote = useCallback(
    async (id: string) => {
      try {
        await NoteService.deleteNote(id);
        await loadNotes(); // Reload to get updated list
      } catch (err) {
        console.error("Error deleting note:", err);
        throw err;
      }
    },
    [loadNotes]
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      try {
        await NoteService.toggleFavorite(id);
        await loadNotes(); // Reload to get updated list
      } catch (err) {
        console.error("Error toggling favorite:", err);
        throw err;
      }
    },
    [loadNotes]
  );

  const searchNotes = useCallback(async (query: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await NoteService.searchNotes(query);
      setNotes(data);
    } catch (err) {
      console.error("Error searching notes:", err);
      setError(err instanceof Error ? err.message : "Failed to search notes");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    toggleFavorite,
    searchNotes,
    refresh: loadNotes,
  };
}

export function useNote(id: string) {
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadNote = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await NoteService.getNote(id);
        setNote(data);
      } catch (err) {
        console.error("Error loading note:", err);
        setError(err instanceof Error ? err.message : "Failed to load note");
        setNote(null);
      } finally {
        setLoading(false);
      }
    };

    loadNote();
  }, [id]);

  const updateNote = useCallback(
    async (input: UpdateNoteInput) => {
      if (!id || !note) return;

      try {
        const updatedNote = await NoteService.updateNote(id, input);
        setNote(updatedNote);
        return updatedNote;
      } catch (err) {
        console.error("Error updating note:", err);
        throw err;
      }
    },
    [id, note]
  );

  const autoSave = useCallback(
    async (content: string) => {
      if (!id) return;

      try {
        await NoteService.autoSave(id, content);
      } catch (err) {
        console.error("Error auto-saving note:", err);
        // Don't throw for auto-save errors
      }
    },
    [id]
  );

  return {
    note,
    loading,
    error,
    updateNote,
    autoSave,
  };
}

export function useFavoriteNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await NoteService.getFavoriteNotes();
      setNotes(data);
    } catch (err) {
      console.error("Error loading favorite notes:", err);
      setError(err instanceof Error ? err.message : "Failed to load favorites");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  return {
    notes,
    loading,
    error,
    refresh: loadFavorites,
  };
}
