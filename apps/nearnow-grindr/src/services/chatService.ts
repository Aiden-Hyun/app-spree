import { supabase } from "../supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  message_type: "text" | "image" | "location";
  sent_at: string;
  read_at?: string;
}

export interface ChatRoom {
  match_id: string;
  messages: Message[];
  otherUser: {
    id: string;
    full_name?: string;
    avatar_url?: string;
    is_online?: boolean;
  };
}

export class ChatService {
  private static instance: ChatService;
  private channels: Map<string, RealtimeChannel> = new Map();

  private constructor() {}

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  async sendMessage(
    matchId: string,
    senderId: string,
    content: string,
    messageType: Message["message_type"] = "text"
  ): Promise<Message | null> {
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          match_id: matchId,
          sender_id: senderId,
          content,
          message_type: messageType,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error sending message:", error);
      return null;
    }
  }

  async getMessages(
    matchId: string,
    limit: number = 50,
    before?: string
  ): Promise<Message[]> {
    try {
      let query = supabase
        .from("messages")
        .select("*")
        .eq("match_id", matchId)
        .order("sent_at", { ascending: false })
        .limit(limit);

      if (before) {
        query = query.lt("sent_at", before);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data?.reverse() || [];
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  }

  async markMessagesAsRead(matchId: string, userId: string): Promise<void> {
    try {
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("match_id", matchId)
        .neq("sender_id", userId)
        .is("read_at", null);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }

  subscribeToMessages(
    matchId: string,
    onNewMessage: (message: Message) => void,
    onMessageRead?: (messageId: string) => void
  ): () => void {
    // Unsubscribe from existing channel if any
    const existingChannel = this.channels.get(matchId);
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
    }

    const channel = supabase
      .channel(`chat:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          onNewMessage(payload.new as Message);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          if (payload.new.read_at && !payload.old.read_at) {
            onMessageRead?.(payload.new.id);
          }
        }
      )
      .subscribe();

    this.channels.set(matchId, channel);

    // Return unsubscribe function
    return () => {
      const channelToRemove = this.channels.get(matchId);
      if (channelToRemove) {
        supabase.removeChannel(channelToRemove);
        this.channels.delete(matchId);
      }
    };
  }

  async uploadChatImage(
    matchId: string,
    senderId: string,
    imageUri: string
  ): Promise<string | null> {
    try {
      const fileExt = imageUri.split(".").pop() || "jpg";
      const fileName = `${matchId}/${senderId}_${Date.now()}.${fileExt}`;

      // Convert URI to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("chat-images")
        .upload(fileName, blob, {
          contentType: `image/${fileExt}`,
          cacheControl: "3600",
        });

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("chat-images").getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading chat image:", error);
      return null;
    }
  }

  async createChatImagesBucket(): Promise<void> {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();

      if (!buckets?.find((bucket) => bucket.name === "chat-images")) {
        const { error } = await supabase.storage.createBucket("chat-images", {
          public: true,
          allowedMimeTypes: [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
          ],
          fileSizeLimit: 10485760, // 10MB
        });

        if (error && !error.message.includes("already exists")) {
          throw error;
        }
      }
    } catch (error) {
      console.error("Error creating chat images bucket:", error);
    }
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting message:", error);
      return false;
    }
  }

  unsubscribeAll(): void {
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }
}

export const chatService = ChatService.getInstance();


