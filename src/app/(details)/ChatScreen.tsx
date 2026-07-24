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
  Animated,
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

// Fixed premium neutral tone matches the reference dark tiles
const INK = "#111318";

// ---- Simple animated shimmer block, same pattern used on the Home screen ----
function ShimmerBlock({
  width,
  height,
  borderRadius = 10,
  baseColor,
  style,
}: {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  baseColor: string;
  style?: any;
}) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: baseColor, opacity },
        style,
      ]}
    />
  );
}

// A single shimmer "bubble" placeholder, alternating left/right like a real
// message thread so the skeleton reads as a chat rather than a generic list.
function ShimmerMessageRow({
  isMine,
  width,
  baseColor,
}: {
  isMine: boolean;
  width: number;
  baseColor: string;
}) {
  return (
    <View
      style={[
        styles.shimmerRow,
        { justifyContent: isMine ? "flex-end" : "flex-start" },
      ]}
    >
      <ShimmerBlock
        width={width}
        height={38}
        borderRadius={18}
        baseColor={baseColor}
      />
    </View>
  );
}

export default function ChatScreen() {
  const { theme, isDark } = useTheme();
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

  const shimmerBase = isDark ? "#2A2A2E" : "#E7E7EA";
  const shimmerBaseOnInk = "rgba(255,255,255,0.14)";

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

  const getInitials = (nameStr: string) => {
    if (!nameStr) return "•";
    return nameStr.trim().charAt(0).toUpperCase();
  };

  if (isLoading) {
    // ---------------- SHIMMER SKELETON STATE ----------------
    // Mirrors the real header / canvas / input-bar shell so the loading
    // state doesn't jump-cut into a different layout once data arrives.
    return (
      <View style={[styles.container, { backgroundColor: INK }]}>
        <SafeAreaView style={styles.topSafeAreaStyle} />

        <View style={styles.header}>
          <View style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </View>

          <ShimmerBlock
            width={38}
            height={38}
            borderRadius={19}
            baseColor={shimmerBaseOnInk}
            style={{ marginRight: 12 }}
          />

          <View style={styles.headerInfo}>
            <ShimmerBlock
              width={140}
              height={15}
              borderRadius={7}
              baseColor={shimmerBaseOnInk}
              style={{ marginBottom: 6 }}
            />
            <ShimmerBlock
              width={70}
              height={11}
              borderRadius={6}
              baseColor={shimmerBaseOnInk}
            />
          </View>

          <View style={styles.headerUtilityOption}>
            <Ionicons name="ellipsis-vertical" size={18} color="#FFFFFF" />
          </View>
        </View>

        <View
          style={[
            styles.chatCanvasContainer,
            { backgroundColor: isDark ? theme.background : "#F4F6F8" },
          ]}
        >
          <View style={styles.messagesContent}>
            <View style={styles.timeDividerContainer}>
              <ShimmerBlock
                width={64}
                height={22}
                borderRadius={12}
                baseColor={shimmerBase}
              />
            </View>

            <ShimmerMessageRow
              isMine={false}
              width={190}
              baseColor={shimmerBase}
            />
            <ShimmerMessageRow
              isMine={false}
              width={130}
              baseColor={shimmerBase}
            />
            <ShimmerMessageRow
              isMine={true}
              width={160}
              baseColor={shimmerBase}
            />
            <ShimmerMessageRow
              isMine={false}
              width={210}
              baseColor={shimmerBase}
            />
            <ShimmerMessageRow
              isMine={true}
              width={110}
              baseColor={shimmerBase}
            />
            <ShimmerMessageRow
              isMine={true}
              width={175}
              baseColor={shimmerBase}
            />
          </View>

          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: theme.surface,
                borderTopColor: isDark ? theme.border : "#EAEAEA",
                marginBottom: 48,
              },
            ]}
          >
            <ShimmerBlock
              width="100%"
              height={44}
              borderRadius={22}
              baseColor={shimmerBase}
              style={{ flex: 1, marginRight: 10 }}
            />
            <ShimmerBlock
              width={40}
              height={40}
              borderRadius={20}
              baseColor={shimmerBase}
            />
          </View>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.background },
          styles.centered,
        ]}
      >
        <AppText style={{ color: theme.textMuted }} weight="medium">
          {error}
        </AppText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: INK }]}>
      <SafeAreaView style={styles.topSafeAreaStyle} />

      {/* Premium Dark Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.avatarContainer}>
          <AppText size={13} weight="bold" color={INK}>
            {getInitials(chatTitle)}
          </AppText>
        </View>

        <View style={styles.headerInfo}>
          <AppText weight="bold" size={16} color="#FFFFFF" numberOfLines={1}>
            {chatTitle}
          </AppText>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusIndicatorDot,
                { backgroundColor: isConnected ? "#10B981" : "#A0AEC0" },
              ]}
            />
            <AppText size={11} color="rgba(255, 255, 255, 0.6)" weight="medium">
              {isConnected ? "Online" : "Offline"}
            </AppText>
          </View>
        </View>

        <TouchableOpacity
          style={styles.headerUtilityOption}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-vertical" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Main Messaging Panel Canvas Area */}
      <View
        style={[
          styles.chatCanvasContainer,
          { backgroundColor: isDark ? theme.background : "#F4F6F8" },
        ]}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "padding"}
        >
          {/* Action Accordion Layer */}
          <View style={styles.actionPanelStickyFrame}>
            <NegotiationActionPanel
              negotiationId={negotiationId!}
              parcelId={parcelId}
              isServiceProvider={isServiceProvider}
              currentUserId={currentUserIdStr}
              accordion={true}
            />
          </View>

          {/* Messages Flow History Viewport */}
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.messagesContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.timeDividerContainer}>
              <View
                style={[
                  styles.timePillBadge,
                  {
                    backgroundColor: isDark ? theme.surface : "#E9EDF0",
                  },
                ]}
              >
                <AppText
                  size={11}
                  color={theme.textMuted}
                  weight="bold"
                  style={styles.timeBadgeText}
                >
                  TODAY
                </AppText>
              </View>
            </View>

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

          {/* Interactive Chat Bar Form Pod input field */}
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: theme.surface,
                borderTopColor: isDark ? theme.border : "#EAEAEA",
                marginBottom: 48,
              },
            ]}
          >
            <View
              style={[
                styles.inputFieldInnerWrapper,
                { backgroundColor: isDark ? theme.background : "#F0F2F5" },
              ]}
            >
              <TouchableOpacity
                style={styles.inputActionMediaButton}
                activeOpacity={0.7}
              >
                <Ionicons name="mic" size={19} color={theme.textMuted} />
              </TouchableOpacity>

              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={messageText}
                onChangeText={(text) => {
                  setMessageText(text);
                  handleTyping(text.length > 0);
                }}
                placeholder="Message..."
                placeholderTextColor={theme.textMuted}
                multiline
                maxLength={500}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: INK,
                  opacity: messageText.trim() ? 1 : 0.4,
                },
              ]}
              onPress={handleSendMessage}
              disabled={isSending || !messageText.trim()}
              activeOpacity={0.8}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="arrow-up-sharp" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: "center", alignItems: "center" },
  topSafeAreaStyle: { backgroundColor: INK },

  // Custom Curved Dark Header Frame Structure
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 40 : 16,
    paddingBottom: 24,
    backgroundColor: INK,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F0F2F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerInfo: { flex: 1, justifyContent: "center" },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 5,
  },
  statusIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  headerUtilityOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  // Main Rounded Window View Content Wrapper Canvas
  chatCanvasContainer: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
  },
  actionPanelStickyFrame: {
    zIndex: 10,
  },
  messagesContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },

  // Custom Decorative Center Timestamp Elements
  timeDividerContainer: {
    alignItems: "center",
    marginVertical: 14,
    width: "100%",
  },
  timePillBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
  },
  timeBadgeText: {
    letterSpacing: 0.5,
  },

  // Shimmer message row wrapper — left/right alignment matches MessageBubble
  shimmerRow: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 10,
  },

  // Redesigned Chat Form Input Bar Panel System
  inputContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderTopWidth: 1,
  },
  inputFieldInnerWrapper: {
    flex: 1,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    marginRight: 10,
  },
  inputActionMediaButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 8,
    paddingTop: Platform.OS === "ios" ? 10 : 8,
    paddingBottom: Platform.OS === "ios" ? 10 : 8,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
});
