import { useState, useEffect } from "react";
import { messagingService, Message } from "../services/messaging.service";

export function useMessages(listingId: string, otherUserId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();

    // Subscribe to new messages
    const unsubscribe = messagingService.subscribeToMessages(
      listingId,
      otherUserId,
      (newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [listingId, otherUserId]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await messagingService.getMessages(listingId, otherUserId);
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch messages");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    try {
      setSending(true);
      const newMessage = await messagingService.sendMessage(
        listingId,
        otherUserId,
        content
      );
      if (newMessage) {
        setMessages((prev) => [...prev, newMessage]);
      }
    } catch (err) {
      throw err;
    } finally {
      setSending(false);
    }
  };

  return {
    messages,
    loading,
    error,
    sending,
    sendMessage,
    refresh: fetchMessages,
  };
}

export function useConversations() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await messagingService.getConversations();
      setConversations(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch conversations"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refresh = () => fetchConversations(true);

  return {
    conversations,
    loading,
    error,
    refreshing,
    refresh,
  };
}
