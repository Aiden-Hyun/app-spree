import { useState, useEffect, useCallback } from "react";
import { bookService, Book } from "../services/bookService";

export function useLibrary() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load books
  const loadBooks = useCallback(async () => {
    try {
      setError(null);
      const data = await bookService.getBooks();
      setBooks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load books");
      console.error("Error loading books:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refresh books
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadBooks();
  }, [loadBooks]);

  // Search books
  const searchBooks = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        await loadBooks();
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await bookService.searchBooks(query);
        setBooks(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
        console.error("Error searching books:", err);
      } finally {
        setLoading(false);
      }
    },
    [loadBooks]
  );

  // Add a book
  const addBook = useCallback(
    async (bookData: Parameters<typeof bookService.createBook>[0]) => {
      try {
        const newBook = await bookService.createBook(bookData);
        setBooks((prevBooks) => [newBook, ...prevBooks]);
        return newBook;
      } catch (err) {
        throw err;
      }
    },
    []
  );

  // Update a book
  const updateBook = useCallback(
    async (bookId: string, updates: Partial<Book>) => {
      try {
        const updatedBook = await bookService.updateBook(bookId, updates);
        setBooks((prevBooks) =>
          prevBooks.map((book) => (book.id === bookId ? updatedBook : book))
        );
        return updatedBook;
      } catch (err) {
        throw err;
      }
    },
    []
  );

  // Delete a book
  const deleteBook = useCallback(async (bookId: string) => {
    try {
      await bookService.deleteBook(bookId);
      setBooks((prevBooks) => prevBooks.filter((book) => book.id !== bookId));
    } catch (err) {
      throw err;
    }
  }, []);

  // Update reading progress
  const updateProgress = useCallback(
    async (bookId: string, currentPage: number) => {
      try {
        const updatedBook = await bookService.updateProgress(
          bookId,
          currentPage
        );
        setBooks((prevBooks) =>
          prevBooks.map((book) => (book.id === bookId ? updatedBook : book))
        );
        return updatedBook;
      } catch (err) {
        throw err;
      }
    },
    []
  );

  // Get books by status
  const getBooksByStatus = useCallback(
    (status: Book["status"]) => {
      return books.filter((book) => book.status === status);
    },
    [books]
  );

  // Get book counts
  const getBookCounts = useCallback(() => {
    return {
      all: books.length,
      reading: books.filter((b) => b.status === "reading").length,
      to_read: books.filter((b) => b.status === "to_read").length,
      completed: books.filter((b) => b.status === "completed").length,
      paused: books.filter((b) => b.status === "paused").length,
    };
  }, [books]);

  // Load books on mount
  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  return {
    books,
    loading,
    error,
    refreshing,
    refresh,
    searchBooks,
    addBook,
    updateBook,
    deleteBook,
    updateProgress,
    getBooksByStatus,
    getBookCounts,
  };
}


