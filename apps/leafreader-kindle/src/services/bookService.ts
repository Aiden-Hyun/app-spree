import { supabase } from "../supabase";

export interface Book {
  id: string;
  created_at: string;
  user_id: string;
  title: string;
  author: string;
  isbn?: string;
  cover_url?: string;
  total_pages: number;
  current_page: number;
  status: "to_read" | "reading" | "completed" | "paused";
  rating?: number;
  notes?: string;
  genre?: string;
  publication_year?: number;
}

export interface CreateBookInput {
  title: string;
  author: string;
  isbn?: string;
  cover_url?: string;
  total_pages: number;
  genre?: string;
  publication_year?: number;
}

export const bookService = {
  // Fetch all books for the current user
  async getBooks() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("books")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Book[];
  },

  // Fetch a single book by ID
  async getBook(bookId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("books")
      .select("*")
      .eq("id", bookId)
      .eq("user_id", user.id)
      .single();

    if (error) throw error;
    return data as Book;
  },

  // Create a new book
  async createBook(book: CreateBookInput) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("books")
      .insert({
        ...book,
        user_id: user.id,
        current_page: 0,
        status: "to_read",
      })
      .select()
      .single();

    if (error) throw error;
    return data as Book;
  },

  // Update a book
  async updateBook(bookId: string, updates: Partial<Book>) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("books")
      .update(updates)
      .eq("id", bookId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return data as Book;
  },

  // Update reading progress
  async updateProgress(bookId: string, currentPage: number) {
    const book = await this.getBook(bookId);
    const progress = Math.min(currentPage, book.total_pages);
    const status = progress >= book.total_pages ? "completed" : "reading";

    return this.updateBook(bookId, {
      current_page: progress,
      status,
    });
  },

  // Delete a book
  async deleteBook(bookId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("books")
      .delete()
      .eq("id", bookId)
      .eq("user_id", user.id);

    if (error) throw error;
  },

  // Search books
  async searchBooks(query: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("books")
      .select("*")
      .eq("user_id", user.id)
      .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Book[];
  },

  // Get books by status
  async getBooksByStatus(status: Book["status"]) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("books")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Book[];
  },
};


