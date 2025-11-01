import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";

interface ChatUser {
  id: string;
  full_name?: string;
  avatar_url?: string;
  is_online?: boolean;
}

interface LastMessage {
  content: string;
  sent_at: string;
  sender_id: string;
}

interface Chat {
  id: string;
  other_user: ChatUser;
  last_message?: LastMessage;
  unread_count: number;
}

export function useChats() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchChats();
      subscribeToUpdates();
    }
  }, [user]);

  const fetchChats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch matches with latest messages
      const { data: matches, error: matchError } = await supabase
        .from("matches")
        .select(
          `
          id,
          user1_id,
          user2_id,
          users!matches_user1_id_fkey (
            id,
            full_name,
            avatar_url,
            is_online
          ),
          users!matches_user2_id_fkey (
            id,
            full_name,
            avatar_url,
            is_online
          )
        `
        )
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq("is_active", true);

      if (matchError) throw matchError;

      if (!matches) {
        setChats([]);
        return;
      }

      // Format chats and fetch last messages
      const formattedChats = await Promise.all(
        matches.map(async (match) => {
          // Determine other user
          const isUser1 = match.user1_id === user.id;
          const otherUser = isUser1
            ? (match as any).users2
            : (match as any).users1;

          // Fetch last message
          const { data: messages } = await supabase
            .from("messages")
            .select("content, sent_at, sender_id")
            .eq("match_id", match.id)
            .order("sent_at", { ascending: false })
            .limit(1);

          // Count unread messages
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("match_id", match.id)
            .neq("sender_id", user.id)
            .is("read_at", null);

          return {
            id: match.id,
            other_user: otherUser,
            last_message: messages?.[0],
            unread_count: count || 0,
          };
        })
      );

      // Sort by last message time
      const sortedChats = formattedChats.sort((a, b) => {
        if (!a.last_message) return 1;
        if (!b.last_message) return -1;
        return (
          new Date(b.last_message.sent_at).getTime() -
          new Date(a.last_message.sent_at).getTime()
        );
      });

      setChats(sortedChats);
    } catch (err: any) {
      setError(err.message || "Failed to load chats");
    } finally {
      setLoading(false);
    }
  };

  const subscribeToUpdates = () => {
    if (!user) return;

    // Subscribe to new messages
    const messageChannel = supabase
      .channel("chat_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          // Update chat list when new message arrives
          fetchChats();
        }
      )
      .subscribe();

    // Subscribe to match updates
    const matchChannel = supabase
      .channel("chat_matches")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "matches",
          filter: `user1_id=eq.${user.id},user2_id=eq.${user.id}`,
        },
        (payload) => {
          fetchChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(matchChannel);
    };
  };

  return {
    chats,
    loading,
    error,
    currentUserId: user?.id || "",
    refetch: fetchChats,
  };
}
