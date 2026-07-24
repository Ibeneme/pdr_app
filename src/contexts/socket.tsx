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
  isPriceSet?: boolean;
  price?: number;
  readBy?: string[];
  timestamp: string | Date;
  createdAt?: string;
  updatedAt?: string;
  type?: "text" | "status" | "price" | "system";
  meta?: {
    status?: string;
    currentLocation?: string;
    requestId?: string;
  };
}

const SocketContext = createContext<any>(null);

// Same ALL CAPS mapping used in ChatScreen — kept here too so the
// OPTIMISTIC local message (created before the server round trip
// completes) reads identically to the eventual server-broadcast one.
// If ChatScreen's copy of this ever changes, update both.
function getStatusAnnouncementText(status?: string): string | null {
  if (!status) return null;
  const STATUS_ANNOUNCEMENTS: Record<string, string> = {
    assigned: "RIDE ASSIGNED",
    in_progress: "THIS RIDE IS NOW IN PROGRESS",
    completed: "RIDE MARKED AS COMPLETED",
    confirmed: "RIDE CONFIRMED",
  };
  return (
    STATUS_ANNOUNCEMENTS[status] ||
    `STATUS UPDATED: ${status.replace(/_/g, " ").toUpperCase()}`
  );
}

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<any[]>([]);
  const [agreedPrices, setAgreedPrices] = useState<{ [key: string]: number }>(
    {}
  ); // Track agreed price for the room

  const negotiationIdRef = useRef<string | null>(null);

  useEffect(() => {
    console.log("🔌 [socket] Initializing connection to:", baseURL);

    const newSocket = io(baseURL, {
      reconnection: true,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("✅ [socket] Connected. ID:", newSocket.id);
      setIsConnected(true);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ [socket] Disconnected. Reason:", reason);
      setIsConnected(false);
    });

    newSocket.on("connect_error", (err) => {
      console.log("🔴 [socket] connect_error:", err?.message || err);
    });

    // Generic server-side error passthrough
    newSocket.on("error", (payload) => {
      console.log("🔴 [socket] RECEIVED 'error':", payload);
    });

    // Room joined
    newSocket.on("room-joined", ({ users, messages: initialMessages }) => {
      console.log("📥 [socket] RECEIVED 'room-joined':", {
        userCount: users?.length,
        messageCount: initialMessages?.length,
      });
      setUsers(users || []);
      setMessages(initialMessages || []);
    });

    // New user joined
    newSocket.on("user-joined", ({ userPayload }) => {
      console.log("📥 [socket] RECEIVED 'user-joined':", userPayload);
      setUsers((prev) => [
        ...prev.filter((u) => u.id !== userPayload.id),
        userPayload,
      ]);
    });

    // Receive new message (also carries "status" type messages from
    // pr-update-request-progress on the server).
    //
    // IMPORTANT — dedupe against optimistic local messages: when we
    // update a status/location ourselves, addLocalStatusMessage() below
    // pushes a temporary message (id starting with "local_") into state
    // IMMEDIATELY, before the server round trip completes. When the real
    // server-broadcast version of that same update arrives here, we swap
    // it into the SAME slot instead of appending a second copy — so the
    // person never sees the automated message twice, but also never has
    // to wait for the network to see it once.
    newSocket.on("pr-chat-message", (msg: Message) => {
      console.log("📥 [socket] RECEIVED 'pr-chat-message':", {
        id: msg.id,
        type: msg.type,
        text: msg.text,
        meta: msg.meta,
      });

      setMessages((prev) => {
        if (msg.type === "status") {
          const optimisticIndex = prev.findIndex(
            (m) =>
              typeof m.id === "string" &&
              m.id.startsWith("local_") &&
              m.type === "status" &&
              m.meta?.requestId === msg.meta?.requestId &&
              (m.meta?.status || undefined) ===
                (msg.meta?.status || undefined) &&
              (m.meta?.currentLocation || undefined) ===
                (msg.meta?.currentLocation || undefined)
          );
          if (optimisticIndex !== -1) {
            console.log(
              "🔁 [socket] Reconciling optimistic status message with server version"
            );
            const updated = [...prev];
            updated[optimisticIndex] = msg;
            return updated;
          }
        }
        return [...prev, msg];
      });
    });

    // Price Agreed Listener
    newSocket.on(
      "price-agreed",
      ({ messageId, negotiationId, price, updatedNegotiation }) => {
        console.log("📥 [socket] RECEIVED 'price-agreed':", {
          messageId,
          negotiationId,
          price,
        });
        setAgreedPrices((prev) => ({
          ...prev,
          [negotiationId]: price,
        }));
      }
    );

    // Lightweight status/location event fired alongside the inline chat
    // message. Not required for the chat feed itself (that comes via
    // 'pr-chat-message'), but useful if any screen wants status without
    // the chat context.
    newSocket.on(
      "request-progress-updated",
      ({ requestId, status, currentLocation, message }) => {
        console.log("📥 [socket] RECEIVED 'request-progress-updated':", {
          requestId,
          status,
          currentLocation,
          hasMessage: !!message,
        });
      }
    );

    // Typing indicator
    newSocket.on("user_typing", ({ userPayload, isTyping, name }) => {
      console.log("📥 [socket] RECEIVED 'user_typing':", {
        name: userPayload?.id || name,
        isTyping,
      });
      if (!userPayload) return; // server sends {roomUuid, name, isTyping} shape too — guard
      setTypingUsers((prev) =>
        isTyping
          ? [...prev.filter((u) => u.id !== userPayload.id), userPayload]
          : prev.filter((u) => u.id !== userPayload.id)
      );
    });

    setSocket(newSocket);

    return () => {
      console.log("🧹 [socket] Cleaning up: disconnecting socket...");
      newSocket.disconnect();
    };
  }, []);

  const joinChat = (negotiationId: string, userPayload: any) => {
    if (!negotiationId || !userPayload) {
      console.warn(
        "⚠️ [socket] joinChat aborted: Missing negotiationId or userPayload"
      );
      return;
    }

    negotiationIdRef.current = negotiationId;
    const payload = { negotiationId, userPayload };
    console.log("📤 [socket] SENDING 'join-pr-chat':", payload);
    socket?.emit("join-pr-chat", payload);
  };

  const sendMessage = (
    text: string,
    currentUser: any,
    negotiation: any,
    attachments: string[] = [],
    price: number = 0,
    isPriceSet: boolean = false
  ) => {
    const negotiationId =
      typeof negotiation === "string"
        ? negotiation
        : negotiation?._id || negotiation?.id;

    if ((!text.trim() && !isPriceSet) || !currentUser || !negotiationId) {
      console.warn(
        "⚠️ [socket] sendMessage aborted — missing text/user/negotiationId",
        {
          hasText: !!text.trim(),
          isPriceSet,
          hasUser: !!currentUser,
          negotiationId,
        }
      );
      return;
    }

    const clientId = `client_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const payload = {
      negotiation: negotiationId,
      text: text ? text.trim() : "",
      attachments,
      senderId: currentUser._id || currentUser.id,
      price,
      isPriceSet,
      clientId,
    };

    console.log("📤 [socket] SENDING 'pr-chat-message':", payload);
    socket?.emit("pr-chat-message", payload);
  };

  const agreeToPrice = (
    messageId: string,
    negotiationId: string,
    price: number
  ) => {
    if (!socket || !negotiationId) {
      console.warn(
        "⚠️ [socket] agreeToPrice aborted — no socket or negotiationId"
      );
      return;
    }

    // Optimistic UI update
    setAgreedPrices((prev) => ({ ...prev, [negotiationId]: price }));

    const payload = { messageId, negotiationId, price };
    console.log("📤 [socket] SENDING 'pr-agree-price':", payload);
    socket.emit("pr-agree-price", payload);
  };

  // NEW — pushes a temporary, LOCAL-ONLY status/location message into
  // `messages` the instant a status or location update happens, before
  // any network round trip. This is what guarantees "an automated
  // message shows up when I update the status" is never dependent on
  // server timing. Its id is prefixed "local_" so the 'pr-chat-message'
  // listener above can find and replace it (not duplicate it) once the
  // real, DB-persisted version comes back from the server.
  const addLocalStatusMessage = (
    requestId: string,
    negotiationId: string,
    status?: string,
    currentLocation?: string,
    senderId?: string
  ) => {
    const statusAnnouncement = getStatusAnnouncementText(status);
    let text: string;
    if (statusAnnouncement) {
      text = currentLocation
        ? `${statusAnnouncement} • LOCATION: ${currentLocation.toUpperCase()}`
        : statusAnnouncement;
    } else if (currentLocation) {
      text = `LOCATION UPDATED: ${currentLocation.toUpperCase()}`;
    } else {
      console.warn(
        "⚠️ [socket] addLocalStatusMessage called with neither status nor currentLocation — skipping"
      );
      return;
    }

    const localMessage: Message = {
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      negotiation: negotiationId,
      sender: { id: senderId, name: "You" },
      text,
      type: "status",
      meta: { status, currentLocation, requestId },
      isRead: false,
      readBy: [],
      timestamp: new Date().toISOString(),
    };

    console.log(
      "⚡ [socket] Adding OPTIMISTIC local status message (instant, pre-network):",
      localMessage
    );
    setMessages((prev) => [...prev, localMessage]);
  };

  // Emits "pr-update-request-progress", matching the server handler
  // exactly (requestId, negotiationId, status, currentLocation,
  // senderId). Also fires the optimistic local message above FIRST, so
  // the chat feed and header badge update instantly regardless of
  // network latency — the server-broadcast version reconciles into the
  // same slot moments later.
  const updateRequestStatus = (
    requestId: string,
    negotiationId: string,
    status?: string,
    currentLocation?: string,
    senderId?: string
  ) => {
    if (!socket || !requestId) {
      console.warn(
        "⚠️ [socket] updateRequestStatus aborted — missing socket or requestId",
        { requestId, negotiationId, status, currentLocation }
      );
      return;
    }

    // Instant, local, automated message — this is the fix: status
    // updates now behave exactly like location updates always did.
    addLocalStatusMessage(
      requestId,
      negotiationId,
      status,
      currentLocation,
      senderId
    );

    const payload = {
      requestId,
      negotiationId,
      status,
      currentLocation,
      senderId,
    };

    console.log("📤 [socket] SENDING 'pr-update-request-progress':", payload);
    socket.emit("pr-update-request-progress", payload);
  };

  // Was emitting "pr-typing", but the server only listens for "typing" /
  // "stop_typing". Split so it actually reaches the server's handlers.
  const sendTyping = (isTyping: boolean) => {
    if (!socket || !negotiationIdRef.current) return;

    const payload = {
      uuid: negotiationIdRef.current,
      isTyping,
    };

    if (isTyping) {
      console.log("📤 [socket] SENDING 'typing':", payload);
      socket.emit("typing", payload);
    } else {
      console.log("📤 [socket] SENDING 'stop_typing':", payload);
      socket.emit("stop_typing", payload);
    }
  };

  // NOTE — server has no "leave-pr-chat" handler. socket.io rooms are
  // cleaned up automatically on disconnect, so this just resets local
  // state. Left the emit in (harmless / forward-compatible) but logged
  // clearly so it's not mistaken for something the server acts on.
  const leaveChat = () => {
    if (socket && negotiationIdRef.current) {
      const payload = { negotiationId: negotiationIdRef.current };
      console.log(
        "📤 [socket] SENDING 'leave-pr-chat' (note: no server handler currently):",
        payload
      );
      socket.emit("leave-pr-chat", payload);
      setMessages([]);
      setUsers([]);
      setTypingUsers([]);
      negotiationIdRef.current = null;
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinChat,
        sendMessage,
        agreeToPrice,
        agreedPrices,
        sendTyping,
        leaveChat,
        updateRequestStatus, // now fires an INSTANT local message + the real socket emit
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
