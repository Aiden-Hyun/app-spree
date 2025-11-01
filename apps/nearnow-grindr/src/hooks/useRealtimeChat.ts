import { useState, useEffect, useCallback, useRef } from "react";
import { chatService, Message } from "../services/chatService";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../supabase";

interface ChatState {
  messages: Message[];
  loading: boolean;
  sending: boolean;
  error: string | null;
  hasMore: boolean;
}

interface OtherUser {
  id: string;
  full_name?: string;
  avatar_url?: string;
  is_online?: boolean;
  last_seen?: string;
}

export function useRealtimeChat(matchId: string) {
  const { user } = useAuth();
  const [state, setState] = useState<ChatState>({
    messages: [],
    loading: true,
    sending: false,
    error: null,
    hasMore: true,
  });
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial messages and other user info
  useEffect(() => {
    if (!user || !matchId) return;

    const initializeChat = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // Fetch match info to get other user
        const { data: match } = await supabase
          .from("matches")
          .select(
            `
            *,
            users!matches_user1_id_fkey (
              id,
              full_name,
              avatar_url,
              is_online,
              last_seen
            ),
            users!matches_user2_id_fkey (
              id,
              full_name,
              avatar_url,
              is_online,
              last_seen
            )
          `
          )
          .eq("id", matchId)
          .single();

        if (match) {
          const other =
            match.user1_id === user.id ? match.users2 : match.users1;
          setOtherUser(other);
        }

        // Fetch initial messages
        const messages = await chatService.getMessages(matchId);
        setState((prev) => ({
          ...prev,
          messages,
          loading: false,
          hasMore: messages.length >= 50,
        }));

        // Mark messages as read
        await chatService.markMessagesAsRead(matchId, user.id);
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error.message || "Failed to load chat",
        }));
      }
    };

    initializeChat();

    // Subscribe to new messages
    unsubscribeRef.current = chatService.subscribeToMessages(
      matchId,
      (newMessage) => {
        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, newMessage],
        }));

        // Mark as read if we're the recipient
        if (newMessage.sender_id !== user.id) {
          chatService.markMessagesAsRead(matchId, user.id);
        }
      },
      (messageId) => {
        // Update read status in local state
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === messageId
              ? { ...msg, read_at: new Date().toISOString() }
              : msg
          ),
        }));
      }
    );

    // Create chat images bucket if needed
    chatService.createChatImagesBucket();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [user, matchId]);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!user || !matchId || !otherUser) return;

    const channel = supabase
      .channel(`typing:${matchId}`)
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const otherUserTyping = Object.values(state).some(
          (presence: any) =>
            presence[0]?.user_id === otherUser.id && presence[0]?.is_typing
        );
        setIsTyping(otherUserTyping);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, matchId, otherUser]);

  const sendMessage = useCallback(
    async (
      content: string,
      messageType: Message["message_type"] = "text"
    ): Promise<boolean> => {
      if (!user || !content.trim()) return false;

      setState((prev) => ({ ...prev, sending: true, error: null }));

      try {
        const message = await chatService.sendMessage(
          matchId,
          user.id,
          content,
          messageType
        );

        if (message) {
          setState((prev) => ({
            ...prev,
            messages: [...prev.messages, message],
            sending: false,
          }));
          return true;
        }

        throw new Error("Failed to send message");
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          sending: false,
          error: error.message || "Failed to send message",
        }));
        return false;
      }
    },
    [matchId, user]
  );

  const sendImage = useCallback(
    async (imageUri: string): Promise<boolean> => {
      if (!user || !imageUri) return false;

      setState((prev) => ({ ...prev, sending: true, error: null }));

      try {
        // Upload image first
        const imageUrl = await chatService.uploadChatImage(
          matchId,
          user.id,
          imageUri
        );

        if (!imageUrl) {
          throw new Error("Failed to upload image");
        }

        // Send message with image URL
        return await sendMessage(imageUrl, "image");
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          sending: false,
          error: error.message || "Failed to send image",
        }));
        return false;
      }
    },
    [matchId, user, sendMessage]
  );

  const sendLocation = useCallback(
    async (latitude: number, longitude: number): Promise<boolean> => {
      const locationString = `${latitude},${longitude}`;
      return await sendMessage(locationString, "location");
    },
    [sendMessage]
  );

  const loadMoreMessages = useCallback(async () => {
    if (!state.hasMore || state.loading || state.messages.length === 0) return;

    setState((prev) => ({ ...prev, loading: true }));

    try {
      const oldestMessage = state.messages[0];
      const olderMessages = await chatService.getMessages(
        matchId,
        50,
        oldestMessage.sent_at
      );

      setState((prev) => ({
        ...prev,
        messages: [...olderMessages, ...prev.messages],
        loading: false,
        hasMore: olderMessages.length >= 50,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || "Failed to load messages",
      }));
    }
  }, [matchId, state.messages, state.hasMore, state.loading]);

  const deleteMessage = useCallback(
    async (messageId: string): Promise<boolean> => {
      const success = await chatService.deleteMessage(messageId);
      if (success) {
        setState((prev) => ({
          ...prev,
          messages: prev.messages.filter((msg) => msg.id !== messageId),
        }));
      }
      return success;
    },
    []
  );

  const sendTypingIndicator = useCallback(
    (isTyping: boolean) => {
      if (!user || !matchId) return;

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      const channel = supabase.channel(`typing:${matchId}`);
      channel.track({ user_id: user.id, is_typing: isTyping });

      // Auto-stop typing after 3 seconds
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          channel.track({ user_id: user.id, is_typing: false });
        }, 3000);
      }
    },
    [user, matchId]
  );

  return {
    messages: state.messages,
    loading: state.loading,
    sending: state.sending,
    error: state.error,
    hasMore: state.hasMore,
    otherUser,
    isTyping,
    sendMessage,
    sendImage,
    sendLocation,
    loadMoreMessages,
    deleteMessage,
    sendTypingIndicator,
  };
}
