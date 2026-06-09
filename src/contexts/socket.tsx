import { baseURL } from "@/api/axiosInstance";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import io, { Socket } from "socket.io-client";

interface Message {
  id: string;
  negotiation: string;
  sender: {
    id?: string;
    _id?: string;
    name: string;
    fullName?: string;
    profileImage?: string;
  };
  text: string;
  attachments?: string[];
  isRead: boolean;
  readBy?: string[];
  timestamp: string | Date;
  createdAt?: string;
  updatedAt?: string;
}

const SocketContext = createContext<any>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<any[]>([]);

  const negotiationIdRef = useRef<string | null>(null); // Keep track of current room

  useEffect(() => {
    console.log("🔌 Initializing socket connection to:", baseURL);

    const newSocket = io(baseURL, {
      reconnection: true,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("✅ Socket connected. ID:", newSocket.id);
      setIsConnected(true);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected. Reason:", reason);
      setIsConnected(false);
    });

    // Room joined
    newSocket.on("room-joined", ({ users, messages: initialMessages }) => {
      console.log("📥 [Client] Event 'room-joined' received:");
      console.log("   - Users Array Length:", users?.length);
      console.log("   - Messages Array Length:", initialMessages?.length);
      
      if (initialMessages && initialMessages.length > 0) {
          console.log("   - First Message Object:", initialMessages[0]);
      } else {
          console.log("   - Warning: No messages received in 'room-joined' payload.");
      }
  
      setUsers(users || []);
      setMessages(initialMessages || []);
  });

    // New user joined
    newSocket.on("user-joined", ({ userPayload }) => {
      console.log("📥 Event [user-joined] received:", userPayload);
      setUsers((prev) => [
        ...prev.filter((u) => u.id !== userPayload.id),
        userPayload,
      ]);
    });

    // Receive new message
    newSocket.on("pr-chat-message", (msg: Message) => {
      console.log("📥 Event [pr-chat-message] received:", msg);
      setMessages((prev) => [...prev, msg]);
    });

    // Typing indicator
    newSocket.on("user-typing", ({ userPayload, isTyping }) => {
      console.log("📥 Event [user-typing] received:", {
        userPayload,
        isTyping,
      });
      setTypingUsers((prev) =>
        isTyping
          ? [...prev.filter((u) => u.id !== userPayload.id), userPayload]
          : prev.filter((u) => u.id !== userPayload.id)
      );
    });

    setSocket(newSocket);

    return () => {
      console.log("🧹 Cleaning up SocketProvider: Disconnecting socket...");
      newSocket.disconnect();
    };
  }, []);

  const joinChat = (negotiationId: string, userPayload: any) => {
    console.log("📤 Action [joinChat] called:", { negotiationId, userPayload });

    if (!negotiationId || !userPayload) {
      console.warn("⚠️ joinChat aborted: Missing negotiationId or userPayload");
      return;
    }

    negotiationIdRef.current = negotiationId;

    if (!socket) {
      console.warn("⚠️ joinChat: Socket is not initialized yet!");
    }

    socket?.emit("join-pr-chat", {
      negotiationId,
      userPayload,
    });
    console.log("🚀 Emitted [join-pr-chat]");
  };

  // Inside SocketProvider.tsx
  const sendMessage = (
    text: string,
    currentUser: any,
    negotiation: any, // Accepts the full object
    attachments: string[] = []
  ) => {
    // Extract the ID from the object safely
    const negotiationId = negotiation?._id || negotiation?.id;

    if (!text.trim() || !currentUser || !negotiationId) {
      console.warn("⚠️ sendMessage aborted: Missing data", {
        hasText: !!text.trim(),
        hasUser: !!currentUser,
        hasNegotiationId: !!negotiationId,
      });
      return;
    }

    if (!socket) {
      console.warn("⚠️ sendMessage aborted: Socket not connected");
      return;
    }

    socket.emit("pr-chat-message", {
      negotiation: negotiationId, // Send the ID derived from the object
      text: text.trim(),
      attachments,
      senderId: currentUser._id || currentUser.id,
    });

    console.log(
      `🚀 Emitted [pr-chat-message] for negotiation: ${negotiationId}`
    );
  };
  const sendTyping = (isTyping: boolean) => {
    console.log("📤 Action [sendTyping] called:", { isTyping });

    if (!socket || !negotiationIdRef.current) {
      console.warn(
        "⚠️ sendTyping aborted: Socket not initialized or not in a room"
      );
      return;
    }

    socket.emit("pr-typing", {
      negotiationId: negotiationIdRef.current,
      isTyping,
    });
    console.log("🚀 Emitted [pr-typing]:", {
      negotiationId: negotiationIdRef.current,
      isTyping,
    });
  };

  const leaveChat = () => {
    console.log(
      "📤 Action [leaveChat] called. Current room:",
      negotiationIdRef.current
    );

    if (socket && negotiationIdRef.current) {
      socket.emit("leave-pr-chat", { negotiationId: negotiationIdRef.current });
      console.log("🚀 Emitted [leave-pr-chat]");

      console.log("♻️ Resetting chat state fields...");
      setMessages([]);
      setUsers([]);
      setTypingUsers([]);
      negotiationIdRef.current = null;
    } else {
      console.warn(
        "⚠️ leaveChat skipped: Socket missing or not currently in a room"
      );
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinChat,
        sendMessage,
        sendTyping,
        leaveChat,
        messages,
        users,
        typingUsers,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
