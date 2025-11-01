import { useState, useEffect, useCallback } from "react";
import { NotebookService } from "../services/notebookService";
import { Notebook, CreateNotebookInput, UpdateNotebookInput } from "../types";

export function useNotebooks() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotebooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await NotebookService.getNotebooks();
      setNotebooks(data);
    } catch (err) {
      console.error("Error loading notebooks:", err);
      setError(err instanceof Error ? err.message : "Failed to load notebooks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotebooks();
  }, [loadNotebooks]);

  const createNotebook = useCallback(
    async (input: CreateNotebookInput) => {
      try {
        const newNotebook = await NotebookService.createNotebook(input);
        await loadNotebooks(); // Reload to get updated list
        return newNotebook;
      } catch (err) {
        console.error("Error creating notebook:", err);
        throw err;
      }
    },
    [loadNotebooks]
  );

  const updateNotebook = useCallback(
    async (id: string, input: UpdateNotebookInput) => {
      try {
        const updatedNotebook = await NotebookService.updateNotebook(id, input);
        await loadNotebooks(); // Reload to get updated list
        return updatedNotebook;
      } catch (err) {
        console.error("Error updating notebook:", err);
        throw err;
      }
    },
    [loadNotebooks]
  );

  const deleteNotebook = useCallback(
    async (id: string) => {
      try {
        await NotebookService.deleteNotebook(id);
        await loadNotebooks(); // Reload to get updated list
      } catch (err) {
        console.error("Error deleting notebook:", err);
        throw err;
      }
    },
    [loadNotebooks]
  );

  const toggleArchive = useCallback(
    async (id: string) => {
      try {
        await NotebookService.toggleArchive(id);
        await loadNotebooks(); // Reload to get updated list
      } catch (err) {
        console.error("Error toggling archive:", err);
        throw err;
      }
    },
    [loadNotebooks]
  );

  return {
    notebooks,
    loading,
    error,
    createNotebook,
    updateNotebook,
    deleteNotebook,
    toggleArchive,
    refresh: loadNotebooks,
  };
}

export function useNotebookTree() {
  const [tree, setTree] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTree = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await NotebookService.getNotebookTree();
      setTree(data);
    } catch (err) {
      console.error("Error loading notebook tree:", err);
      setError(err instanceof Error ? err.message : "Failed to load notebooks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  return {
    tree,
    loading,
    error,
    refresh: loadTree,
  };
}

export function useNotebook(id: string) {
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadNotebook = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await NotebookService.getNotebook(id);
        setNotebook(data);
      } catch (err) {
        console.error("Error loading notebook:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load notebook"
        );
        setNotebook(null);
      } finally {
        setLoading(false);
      }
    };

    loadNotebook();
  }, [id]);

  return {
    notebook,
    loading,
    error,
  };
}
