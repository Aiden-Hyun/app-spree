import { supabase } from "../supabase";

export interface Message {
  id: string;
  listing_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: "text" | "image" | "offer";
  sent_at: string;
  read_at: string | null;
}

export interface Conversation {
  id: string;
  listing: {
    id: string;
    title: string;
    images: string[];
  };
  otherUser: {
    id: string;
    email: string;
    full_name: string | null;
  };
  lastMessage: Message;
  unreadCount: number;
}

export const messagingService = {
  // Get all conversations for current user
  async getConversations(): Promise<Conversation[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Get messages where user is sender or receiver
    const { data: messages, error } = await supabase
      .from("messages")
      .select(
        `
        *,
        listing:listings!listing_id(id, title, images),
        sender:users!sender_id(id, email, full_name),
        receiver:users!receiver_id(id, email, full_name)
      `
      )
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("sent_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      throw error;
    }

    // Group by listing and other user
    const conversationMap = new Map<string, any>();

    messages?.forEach((msg: any) => {
      const otherUserId =
        msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      const key = `${msg.listing_id}-${otherUserId}`;

      if (!conversationMap.has(key)) {
        conversationMap.set(key, {
          id: key,
          listing: msg.listing,
          otherUser: msg.sender_id === user.id ? msg.receiver : msg.sender,
          lastMessage: msg,
          unreadCount: 0,
        });
      }

      // Count unread messages
      if (msg.receiver_id === user.id && !msg.read_at) {
        const conv = conversationMap.get(key);
        conv.unreadCount++;
      }
    });

    return Array.from(conversationMap.values());
  },

  // Get messages for a specific listing conversation
  async getMessages(
    listingId: string,
    otherUserId: string
  ): Promise<Message[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("listing_id", listingId)
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
      )
      .order("sent_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }

    // Mark messages as read
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("listing_id", listingId)
      .eq("sender_id", otherUserId)
      .eq("receiver_id", user.id)
      .is("read_at", null);

    return data || [];
  },

  // Send a message
  async sendMessage(
    listingId: string,
    receiverId: string,
    content: string,
    messageType: "text" | "image" | "offer" = "text"
  ): Promise<Message | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("messages")
      .insert({
        listing_id: listingId,
        sender_id: user.id,
        receiver_id: receiverId,
        content,
        message_type: messageType,
      })
      .select()
      .single();

    if (error) {
      console.error("Error sending message:", error);
      throw error;
    }

    return data;
  },

  // Subscribe to new messages for a conversation
  subscribeToMessages(
    listingId: string,
    otherUserId: string,
    callback: (message: Message) => void
  ) {
    const {
      data: { user },
    } = supabase.auth.getUser();

    user.then((userData) => {
      if (!userData.user) return;

      const subscription = supabase
        .channel(`messages:${listingId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `listing_id=eq.${listingId}`,
          },
          (payload) => {
            const message = payload.new as Message;
            // Only trigger callback if message involves the current conversation
            if (
              (message.sender_id === userData.user!.id &&
                message.receiver_id === otherUserId) ||
              (message.sender_id === otherUserId &&
                message.receiver_id === userData.user!.id)
            ) {
              callback(message);
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    });
  },

  // Mark conversation as read
  async markAsRead(listingId: string, senderId: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("listing_id", listingId)
      .eq("sender_id", senderId)
      .eq("receiver_id", user.id)
      .is("read_at", null);
  },
};


