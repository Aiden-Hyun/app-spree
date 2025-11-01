import { supabase } from "../supabase";

export interface Highlight {
  id: string;
  created_at: string;
  user_id: string;
  book_id: string;
  page_number: number;
  start_position: number;
  end_position: number;
  text_content: string;
  note?: string;
  color: string;
}

export interface CreateHighlightInput {
  book_id: string;
  page_number: number;
  start_position: number;
  end_position: number;
  text_content: string;
  note?: string;
  color?: string;
}

export interface Bookmark {
  id: string;
  created_at: string;
  user_id: string;
  book_id: string;
  page_number: number;
  title?: string;
  note?: string;
}

export interface CreateBookmarkInput {
  book_id: string;
  page_number: number;
  title?: string;
  note?: string;
}

export const highlightService = {
  // Create a new highlight
  async createHighlight(highlight: CreateHighlightInput): Promise<Highlight> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("highlights")
      .insert({
        ...highlight,
        user_id: user.id,
        color: highlight.color || "yellow",
      })
      .select()
      .single();

    if (error) throw error;
    return data as Highlight;
  },

  // Get highlights for a book
  async getBookHighlights(bookId: string): Promise<Highlight[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("highlights")
      .select("*")
      .eq("user_id", user.id)
      .eq("book_id", bookId)
      .order("page_number", { ascending: true })
      .order("start_position", { ascending: true });

    if (error) throw error;
    return data as Highlight[];
  },

  // Get highlights for a specific page
  async getPageHighlights(
    bookId: string,
    pageNumber: number
  ): Promise<Highlight[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("highlights")
      .select("*")
      .eq("user_id", user.id)
      .eq("book_id", bookId)
      .eq("page_number", pageNumber)
      .order("start_position", { ascending: true });

    if (error) throw error;
    return data as Highlight[];
  },

  // Update a highlight (mainly for adding/editing notes)
  async updateHighlight(
    highlightId: string,
    updates: { note?: string; color?: string }
  ): Promise<Highlight> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("highlights")
      .update(updates)
      .eq("id", highlightId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return data as Highlight;
  },

  // Delete a highlight
  async deleteHighlight(highlightId: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("highlights")
      .delete()
      .eq("id", highlightId)
      .eq("user_id", user.id);

    if (error) throw error;
  },

  // Create a bookmark
  async createBookmark(bookmark: CreateBookmarkInput): Promise<Bookmark> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("bookmarks")
      .insert({
        ...bookmark,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Bookmark;
  },

  // Get bookmarks for a book
  async getBookBookmarks(bookId: string): Promise<Bookmark[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .eq("book_id", bookId)
      .order("page_number", { ascending: true });

    if (error) throw error;
    return data as Bookmark[];
  },

  // Check if a page is bookmarked
  async isPageBookmarked(bookId: string, pageNumber: number): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", user.id)
      .eq("book_id", bookId)
      .eq("page_number", pageNumber)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 means no rows returned
    return !!data;
  },

  // Toggle bookmark for a page
  async toggleBookmark(
    bookId: string,
    pageNumber: number,
    title?: string
  ): Promise<void> {
    const isBookmarked = await this.isPageBookmarked(bookId, pageNumber);

    if (isBookmarked) {
      // Remove bookmark
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("book_id", bookId)
        .eq("page_number", pageNumber);

      if (error) throw error;
    } else {
      // Add bookmark
      await this.createBookmark({
        book_id: bookId,
        page_number: pageNumber,
        title,
      });
    }
  },

  // Delete a bookmark
  async deleteBookmark(bookmarkId: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", bookmarkId)
      .eq("user_id", user.id);

    if (error) throw error;
  },

  // Export highlights and bookmarks for a book
  async exportAnnotations(bookId: string): Promise<{
    highlights: Highlight[];
    bookmarks: Bookmark[];
  }> {
    const [highlights, bookmarks] = await Promise.all([
      this.getBookHighlights(bookId),
      this.getBookBookmarks(bookId),
    ]);

    return { highlights, bookmarks };
  },

  // Get highlight colors
  getHighlightColors() {
    return [
      { name: "Yellow", value: "yellow", hex: "#FFEB3B" },
      { name: "Green", value: "green", hex: "#4CAF50" },
      { name: "Blue", value: "blue", hex: "#2196F3" },
      { name: "Pink", value: "pink", hex: "#E91E63" },
      { name: "Purple", value: "purple", hex: "#9C27B0" },
    ];
  },
};
