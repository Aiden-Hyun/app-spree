import { useState, useEffect, useCallback } from "react";
import {
  highlightService,
  Highlight,
  Bookmark,
} from "../services/highlightService";
import { progressService } from "../services/progressService";
import { bookService, Book } from "../services/bookService";

interface ReaderState {
  book: Book | null;
  currentPage: number;
  totalPages: number;
  highlights: Highlight[];
  bookmarks: Bookmark[];
  isBookmarked: boolean;
  fontSize: number;
  theme: "light" | "dark" | "sepia";
  lineHeight: number;
  loading: boolean;
  error: string | null;
}

export function useReader(bookId: string) {
  const [state, setState] = useState<ReaderState>({
    book: null,
    currentPage: 1,
    totalPages: 1,
    highlights: [],
    bookmarks: [],
    isBookmarked: false,
    fontSize: 16,
    theme: "light",
    lineHeight: 1.5,
    loading: true,
    error: null,
  });

  const [sessionStarted, setSessionStarted] = useState(false);

  // Load book and initial data
  useEffect(() => {
    loadBook();
  }, [bookId]);

  // Load highlights for current page
  useEffect(() => {
    if (state.book) {
      loadPageHighlights();
      checkBookmarkStatus();
    }
  }, [state.currentPage, state.book]);

  // Start reading session
  useEffect(() => {
    if (state.book && !sessionStarted) {
      progressService.startSession(bookId, state.currentPage);
      setSessionStarted(true);
    }

    // End session on unmount
    return () => {
      if (sessionStarted && state.book) {
        progressService.endSession(bookId, state.currentPage);
      }
    };
  }, [state.book, sessionStarted]);

  const loadBook = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const bookData = await bookService.getBook(bookId);

      setState((prev) => ({
        ...prev,
        book: bookData,
        currentPage: bookData.current_page || 1,
        totalPages: bookData.total_pages || 1,
        loading: false,
      }));

      // Load all bookmarks
      const bookmarks = await highlightService.getBookBookmarks(bookId);
      setState((prev) => ({ ...prev, bookmarks }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to load book",
      }));
    }
  };

  const loadPageHighlights = async () => {
    try {
      const highlights = await highlightService.getPageHighlights(
        bookId,
        state.currentPage
      );
      setState((prev) => ({ ...prev, highlights }));
    } catch (error) {
      console.error("Error loading highlights:", error);
    }
  };

  const checkBookmarkStatus = async () => {
    try {
      const isBookmarked = await highlightService.isPageBookmarked(
        bookId,
        state.currentPage
      );
      setState((prev) => ({ ...prev, isBookmarked }));
    } catch (error) {
      console.error("Error checking bookmark status:", error);
    }
  };

  const changePage = useCallback(
    async (direction: "next" | "prev") => {
      const newPage =
        direction === "next"
          ? Math.min(state.currentPage + 1, state.totalPages)
          : Math.max(state.currentPage - 1, 1);

      if (newPage !== state.currentPage) {
        setState((prev) => ({ ...prev, currentPage: newPage }));

        // Update progress in background
        progressService.updateBookProgress(bookId, newPage);
        bookService.updateProgress(bookId, newPage);
      }
    },
    [state.currentPage, state.totalPages, bookId]
  );

  const goToPage = useCallback(
    async (pageNumber: number) => {
      const validPage = Math.max(1, Math.min(pageNumber, state.totalPages));

      if (validPage !== state.currentPage) {
        setState((prev) => ({ ...prev, currentPage: validPage }));

        // Update progress in background
        progressService.updateBookProgress(bookId, validPage);
        bookService.updateProgress(bookId, validPage);
      }
    },
    [state.totalPages, state.currentPage, bookId]
  );

  const toggleBookmark = useCallback(async () => {
    try {
      await highlightService.toggleBookmark(
        bookId,
        state.currentPage,
        `Page ${state.currentPage}`
      );

      setState((prev) => ({ ...prev, isBookmarked: !prev.isBookmarked }));

      // Reload bookmarks
      const bookmarks = await highlightService.getBookBookmarks(bookId);
      setState((prev) => ({ ...prev, bookmarks }));
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  }, [bookId, state.currentPage, state.isBookmarked]);

  const createHighlight = useCallback(
    async (
      selection: { text: string; start: number; end: number },
      color: string,
      note?: string
    ) => {
      try {
        await highlightService.createHighlight({
          book_id: bookId,
          page_number: state.currentPage,
          start_position: selection.start,
          end_position: selection.end,
          text_content: selection.text,
          color,
          note,
        });

        // Reload highlights for current page
        await loadPageHighlights();
      } catch (error) {
        console.error("Error creating highlight:", error);
        throw error;
      }
    },
    [bookId, state.currentPage]
  );

  const deleteHighlight = useCallback(async (highlightId: string) => {
    try {
      await highlightService.deleteHighlight(highlightId);
      // Reload highlights
      await loadPageHighlights();
    } catch (error) {
      console.error("Error deleting highlight:", error);
    }
  }, []);

  const updateSettings = useCallback(
    (settings: {
      fontSize?: number;
      theme?: "light" | "dark" | "sepia";
      lineHeight?: number;
    }) => {
      setState((prev) => ({ ...prev, ...settings }));
    },
    []
  );

  const getThemeStyles = () => {
    switch (state.theme) {
      case "dark":
        return {
          backgroundColor: "#1a1a1a",
          color: "#e0e0e0",
        };
      case "sepia":
        return {
          backgroundColor: "#f4ecd8",
          color: "#5c4b37",
        };
      default:
        return {
          backgroundColor: "#ffffff",
          color: "#2d3436",
        };
    }
  };

  return {
    // State
    book: state.book,
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    highlights: state.highlights,
    bookmarks: state.bookmarks,
    isBookmarked: state.isBookmarked,
    fontSize: state.fontSize,
    theme: state.theme,
    lineHeight: state.lineHeight,
    loading: state.loading,
    error: state.error,
    progress: (state.currentPage / state.totalPages) * 100,

    // Actions
    changePage,
    goToPage,
    toggleBookmark,
    createHighlight,
    deleteHighlight,
    updateSettings,
    reload: loadBook,

    // Helpers
    getThemeStyles,
  };
}
