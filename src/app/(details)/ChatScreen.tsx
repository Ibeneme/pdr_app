import { useEffect, useState, useRef, useCallback, useMemo } from "react";
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
  Keyboard,
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
import NegotiationActionPanel from "@/components/NegotiationActionPanel";

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
  const { id: negotiationId, parcelId } = useLocalSearchParams<{
    id: string;
    parcelId?: string;
  }>();

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
  const [negotiation, setNegotiation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const scrollViewRef = useRef<ScrollView>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keyboard Listeners (Better Android Support)
  useEffect(() => {
    const showListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true)
    );
    const hideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false)
    );

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  // Dynamic Styles
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

  // Fetch Negotiation
  useEffect(() => {
    if (!negotiationId) return;

    const fetchNegotiation = async () => {
      setIsLoading(true);
      try {
        const res = await dispatch(getNegotiationById(negotiationId)).unwrap();
        const data = res?.data ? res.data : res;
        setNegotiation(data);
      } catch (err: any) {
        setError(err?.message || "Failed to load negotiation");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNegotiation();
  }, [negotiationId, dispatch]);

  // Initialize Chat
  useEffect(() => {
    if (!negotiationId) return;

    const initializeChat = async () => {
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
        console.error("Failed to initialize chat:", error);
      }
    };

    initializeChat();

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      leaveChat();
    };
  }, [negotiationId, joinChat, leaveChat]);

  // Auto Scroll
  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
    return () => clearTimeout(timeout);
  }, [messages, typingUsers]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentUser) return;

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

  const currentUserIdStr = currentUser?._id || currentUser?.id;
  const isServiceProvider =
    negotiation?.serviceProvider?._id === currentUserIdStr ||
    negotiation?.isProvider === true;

  const otherUsers = users.filter(
    (u: any) => u.id !== currentUser?.id && u.id !== currentUser?._id
  );

  const chatTitle =
    otherUsers.length > 0
      ? otherUsers.map((u) => u.name || u.fullName).join(", ")
      : "Negotiation Chat";

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator
          size="large"
          color={theme.primary}
          style={{ flex: 1 }}
        />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <AppText
          style={{ textAlign: "center", padding: 20, color: theme.text }}
        >
          {error}
        </AppText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 80} // Better for Android
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

        {/* Negotiation Action Panel */}
        <NegotiationActionPanel
          negotiationId={negotiationId!}
          parcelId={parcelId}
          isServiceProvider={isServiceProvider}
          currentUserId={currentUserIdStr}
          accordion={true}
        />

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg: Message, index: number) => {
            const isMyMessage =
              (msg.sender?.id || msg.sender?._id) === currentUserIdStr;

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
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: theme.primary }]}
            onPress={handleSendMessage}
            disabled={isSending || !messageText.trim()}
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
  messagesContent: { padding: 16, flexGrow: 1 },
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
    maxHeight: 120,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
});
