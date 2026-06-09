import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/components/AppText";
import { useSocket } from "@/contexts/socket";
import { getUser } from "@/api/secureStore";
import { getNegotiationById } from "@/api/slices/negotiation.slice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/api/store";
import { MessageBubble } from "@/components/MessageBubble";

interface Message {
  id: string;
  negotiation?: string;
  sender: {
    id?: string;
    _id?: string;
    name: string;
    fullName?: string;
    profileImage?: string;
    email?: string;
  };
  text: string;
  attachments?: string[];
  isRead?: boolean;
  readBy?: string[];
  timestamp: string | Date;
  createdAt?: string;
  updatedAt?: string;
}

export default function ChatScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id: negotiationId } = useLocalSearchParams<{ id: string }>();

  const {
    isConnected,
    joinChat,
    sendMessage,
    sendTyping,
    leaveChat,
    messages,
    users,
    typingUsers,
  } = useSocket();

  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [negotiation, setNegotiation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const dispatch = useDispatch<AppDispatch>();
  const scrollViewRef = useRef<ScrollView>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic Styles Generator
  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        myMessage: {
          maxWidth: "78%",
          padding: 14,
          borderRadius: 20,
          marginVertical: 4,
          alignSelf: "flex-end",
          backgroundColor: theme.primary,
          borderBottomRightRadius: 4,
        },
        otherMessage: {
          maxWidth: "78%",
          padding: 14,
          borderRadius: 20,
          marginVertical: 4,
          alignSelf: "flex-start",
          backgroundColor: theme.surface,
          borderBottomLeftRadius: 4,
        },
      }),
    [theme]
  );

  useEffect(() => {
    if (!negotiationId) return;
    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const data = await dispatch(getNegotiationById(negotiationId)).unwrap();
        console.warn(data, 'datadata')
        setNegotiation(data);
      } catch (err) {
        setError(err as any);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [negotiationId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timeout);
  }, [messages, typingUsers]);

  useEffect(() => {
    if (!negotiationId) return;
    const initializeChat = async () => {
      setIsLoadingUser(true);
      try {
        const user = await getUser();
        if (!user) return;
        setCurrentUser(user);
        joinChat(negotiationId, {
          id: user._id || user.id,
          name: user.fullName || user.name || "You",
          email: user.email,
          profileImage: user.profileImage,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoadingUser(false);
      }
    };
    initializeChat();
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      leaveChat();
    };
  }, [negotiationId, joinChat, leaveChat]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentUser || !negotiation) return;
    setIsSending(true);
    try {
      sendMessage(messageText.trim(), currentUser, negotiation);
      setMessageText("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = useCallback(
    (isTyping: boolean) => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      sendTyping(isTyping);
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => sendTyping(false), 1500);
      }
    },
    [sendTyping]
  );

  const otherUsers = users.filter(
    (u: any) => u.id !== currentUser?.id && u.id !== currentUser?._id
  );
  const chatTitle =
    otherUsers.length > 0
      ? otherUsers.map((u) => u.name || u.fullName).join(", ")
      : "Negotiation Chat";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: theme.surface, borderBottomColor: theme.border },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <AppText weight="bold" size={17} color={theme.text}>
              {chatTitle}
            </AppText>
            <AppText size={13} color={theme.textMuted}>
              {isConnected ? "● Online" : "○ Offline"}
            </AppText>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((msg: Message, index: number) => {
            const isMyMessage =
              (msg.sender?.id || msg.sender?._id) ===
              (currentUser?.id || currentUser?._id);

            return (
              <MessageBubble
                key={msg.id || index}
                text={msg.text}
                senderName={
                  !isMyMessage
                    ? msg.sender?.name || msg.sender?.fullName
                    : undefined
                }
                isMyMessage={isMyMessage}
                theme={theme}
              />
            );
          })}
        </ScrollView>

        {/* Input */}
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: theme.surface, borderTopColor: theme.border },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.background,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            value={messageText}
            onChangeText={(text) => {
              setMessageText(text);
              handleTyping(text.length > 0);
            }}
            placeholder="Type a message..."
            placeholderTextColor={theme.textMuted}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: theme.primary }]}
            onPress={handleSendMessage}
            disabled={isSending}
          >
            {isSending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Ionicons name="send" size={24} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: { marginRight: 12 },
  headerInfo: { flex: 1 },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16 },
  messageText: { fontSize: 16, lineHeight: 22 },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    alignItems: "flex-end",
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginRight: 10,
    borderWidth: 1,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
});
