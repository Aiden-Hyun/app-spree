import { supabase } from "../supabase";

export interface ReadingSession {
  id: string;
  created_at: string;
  user_id: string;
  book_id: string;
  start_page: number;
  end_page: number;
  duration_minutes: number;
  words_read?: number;
  session_notes?: string;
}

export interface UserBookProgress {
  id: string;
  created_at: string;
  user_id: string;
  book_id: string;
  current_page: number;
  total_pages: number;
  progress_percentage: number;
  last_read_at: string;
  estimated_completion_date?: string;
  reading_speed_wpm: number;
}

export interface ReadingStats {
  totalBooksRead: number;
  totalPagesRead: number;
  totalReadingTime: number;
  averageReadingSpeed: number;
  currentStreak: number;
  longestStreak: number;
  dailyGoalProgress: number;
}

export const progressService = {
  // Start a new reading session
  async startSession(
    bookId: string,
    currentPage: number
  ): Promise<ReadingSession> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const sessionData = {
      user_id: user.id,
      book_id: bookId,
      start_page: currentPage,
      end_page: currentPage,
      duration_minutes: 0,
      created_at: new Date().toISOString(),
    };

    // Store session in memory or local storage for tracking
    // This is a simplified version - in production, you'd want more robust session tracking
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "activeReadingSession",
        JSON.stringify({
          ...sessionData,
          startTime: Date.now(),
        })
      );
    }

    return sessionData as ReadingSession;
  },

  // End reading session
  async endSession(bookId: string, endPage: number): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Get session from memory
    const sessionStr =
      typeof window !== "undefined"
        ? localStorage.getItem("activeReadingSession")
        : null;

    if (!sessionStr) return;

    const session = JSON.parse(sessionStr);
    const duration = Math.round((Date.now() - session.startTime) / 60000); // Convert to minutes

    // Save session to database
    const { error } = await supabase.from("reading_sessions").insert({
      user_id: user.id,
      book_id: bookId,
      start_page: session.start_page,
      end_page: endPage,
      duration_minutes: duration,
      words_read: (endPage - session.start_page) * 250, // Estimate 250 words per page
    });

    if (error) throw error;

    // Update user book progress
    await this.updateBookProgress(bookId, endPage);

    // Clear session from memory
    if (typeof window !== "undefined") {
      localStorage.removeItem("activeReadingSession");
    }
  },

  // Update book progress
  async updateBookProgress(bookId: string, currentPage: number): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Get book details to calculate progress
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("total_pages")
      .eq("id", bookId)
      .single();

    if (bookError) throw bookError;

    const progressPercentage = (currentPage / book.total_pages) * 100;

    // Update or insert progress
    const { error } = await supabase.from("user_book_progress").upsert(
      {
        user_id: user.id,
        book_id: bookId,
        current_page: currentPage,
        total_pages: book.total_pages,
        progress_percentage: progressPercentage,
        last_read_at: new Date().toISOString(),
        reading_speed_wpm: 200, // Default, would be calculated from actual reading data
      },
      {
        onConflict: "user_id,book_id",
      }
    );

    if (error) throw error;

    // Update book status
    const status = progressPercentage >= 100 ? "completed" : "reading";
    await supabase
      .from("books")
      .update({
        current_page: currentPage,
        status,
      })
      .eq("id", bookId)
      .eq("user_id", user.id);
  },

  // Get reading sessions for a book
  async getBookSessions(bookId: string): Promise<ReadingSession[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("reading_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("book_id", bookId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as ReadingSession[];
  },

  // Get all reading sessions
  async getAllSessions(): Promise<ReadingSession[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("reading_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as ReadingSession[];
  },

  // Get reading stats
  async getReadingStats(): Promise<ReadingStats> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Get all sessions
    const sessions = await this.getAllSessions();

    // Get completed books count
    const { count: completedBooks } = await supabase
      .from("books")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "completed");

    // Calculate stats
    const totalPagesRead = sessions.reduce(
      (sum, session) => sum + (session.end_page - session.start_page),
      0
    );

    const totalReadingTime = sessions.reduce(
      (sum, session) => sum + session.duration_minutes,
      0
    );

    const totalWordsRead = sessions.reduce(
      (sum, session) => sum + (session.words_read || 0),
      0
    );

    const averageReadingSpeed =
      totalReadingTime > 0 ? Math.round(totalWordsRead / totalReadingTime) : 0;

    // Calculate streaks (simplified)
    const { currentStreak, longestStreak } = await this.calculateStreaks(
      user.id
    );

    // Get daily goal progress
    const todaySessions = sessions.filter((session) => {
      const sessionDate = new Date(session.created_at).toDateString();
      return sessionDate === new Date().toDateString();
    });

    const todayMinutes = todaySessions.reduce(
      (sum, session) => sum + session.duration_minutes,
      0
    );

    return {
      totalBooksRead: completedBooks || 0,
      totalPagesRead,
      totalReadingTime,
      averageReadingSpeed,
      currentStreak,
      longestStreak,
      dailyGoalProgress: todayMinutes, // Assuming 30 min daily goal
    };
  },

  // Calculate reading streaks
  async calculateStreaks(
    userId: string
  ): Promise<{ currentStreak: number; longestStreak: number }> {
    const { data: sessions, error } = await supabase
      .from("reading_sessions")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !sessions || sessions.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Group sessions by date
    const dateSet = new Set(
      sessions.map((s) => new Date(s.created_at).toDateString())
    );
    const dates = Array.from(dateSet).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (dates[0] === today || dates[0] === yesterday) {
      currentStreak = 1;
      for (let i = 1; i < dates.length; i++) {
        const prevDate = new Date(dates[i - 1]);
        const currDate = new Date(dates[i]);
        const diffDays = Math.floor(
          (prevDate.getTime() - currDate.getTime()) / 86400000
        );

        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1]);
      const currDate = new Date(dates[i]);
      const diffDays = Math.floor(
        (prevDate.getTime() - currDate.getTime()) / 86400000
      );

      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      currentStreak,
      longestStreak: Math.max(currentStreak, longestStreak),
    };
  },
};
