import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { AppText } from "@/components/AppText";
import {
  ArrowLeft,
  CheckCheck,
  MessageCircle,
  Package,
  Car,
  Bell,
  BellOff,
} from "lucide-react-native";

// Redux
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/api/store";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/api/slices/notification.slice";
import { getUser } from "@/api/secureStore";

const UNREAD_PURPLE = "#7C3AED";
const UNREAD_PURPLE_LIGHT = "#EDE9FE";

const getNotifMeta = (type?: string) => {
  switch ((type || "").toUpperCase()) {
    case "MESSAGE":
    case "CHAT":
      return { Icon: MessageCircle };
    case "PARCEL":
    case "DELIVERY":
      return { Icon: Package };
    case "RIDE":
      return { Icon: Car };
    default:
      return { Icon: Bell };
  }
};

export default function NotificationsScreen() {
  const { theme: colors, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const [currentUser, setCurrentUser] = useState<any | null>(null);

  const { notifications, unreadCount, isLoading, error } = useSelector(
    (state: RootState) => state.notification
  );

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = await getUser();
      setCurrentUser(user);
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  // ==================== IMPROVED NAVIGATION ====================
  const handleNotificationClick = async (notification: any) => {
    if (!notification) return;

    // Mark as read
    if (!notification.read && notification._id) {
      dispatch(markNotificationAsRead(notification._id));
    }

    const data = notification.data || {};
    const negotiationId = data.negotiationId || data.negotiation;

    // For Chat / Message Notifications
    if (
      notification.type === "CHAT" ||
      notification.type === "MESSAGE" ||
      data.router?.includes("chat")
    ) {
      if (!negotiationId) {
        console.warn("No negotiationId found in notification");
        return;
      }

      router.push({
        pathname: "/(features)/chat_screen", // Make sure this matches your file
        params: {
          id: negotiationId, // negotiation ID
          currentId: currentUser?._id || currentUser?.id,
        },
      });

      return;
    }

    // You can extend this for other notification types later
    console.log("Notification clicked (no specific route):", notification.type);
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* HEADER */}
      <View style={styles.headerWrap}>
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: colors.surface }]}
              activeOpacity={0.7}
              onPress={() => router.back()}
            >
              <ArrowLeft size={19} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <AppText size={18} weight="bold" color={colors.text}>
                Notifications
              </AppText>
              {unreadCount > 0 && (
                <View
                  style={[
                    styles.unreadBadgeFrame,
                    { backgroundColor: UNREAD_PURPLE_LIGHT },
                  ]}
                >
                  <AppText size={10} weight="bold" color={UNREAD_PURPLE}>
                    {unreadCount} new
                  </AppText>
                </View>
              )}
            </View>

            {unreadCount > 0 ? (
              <TouchableOpacity
                onPress={handleMarkAllAsRead}
                style={[
                  styles.markAllButton,
                  { backgroundColor: colors.surface },
                ]}
                activeOpacity={0.7}
              >
                <CheckCheck size={14} color={colors.text} />
              </TouchableOpacity>
            ) : (
              <View style={styles.headerSpacer} />
            )}
          </View>
        </SafeAreaView>
      </View>

      {/* CONTENT */}
      {isLoading && notifications.length === 0 ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centeredContainer}>
          <AppText size={14} color="#EF4444" style={{ textAlign: "center" }}>
            {error}
          </AppText>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <View
                style={[
                  styles.emptyIconCircle,
                  { backgroundColor: colors.surface },
                ]}
              >
                <BellOff size={26} color={colors.textMuted} />
              </View>
              <AppText size={15} weight="bold" color={colors.text}>
                No notifications yet
              </AppText>
              <AppText
                size={13}
                color={colors.textMuted}
                style={styles.emptySubText}
              >
                Updates on your deliveries, rides, and messages will appear here
              </AppText>
            </View>
          ) : (
            notifications.map((notif: any, index: number) => {
              const { Icon } = getNotifMeta(notif.type);

              return (
                <TouchableOpacity
                  key={notif._id || index}
                  style={[
                    styles.notificationCardFrame,
                    {
                      backgroundColor: colors.surface,
                      borderColor: notif.read
                        ? colors.border
                        : UNREAD_PURPLE_LIGHT,
                    },
                  ]}
                  onPress={() => handleNotificationClick(notif)}
                  activeOpacity={0.85}
                >
                  {!notif.read && (
                    <View
                      style={[
                        styles.unreadMarkerLine,
                        { backgroundColor: UNREAD_PURPLE },
                      ]}
                    />
                  )}

                  <View
                    style={[
                      styles.notifIconChip,
                      {
                        backgroundColor: notif.read
                          ? `${colors.text}0D`
                          : `${UNREAD_PURPLE}15`,
                      },
                    ]}
                  >
                    <Icon
                      size={18}
                      color={notif.read ? colors.text : UNREAD_PURPLE}
                    />
                  </View>

                  <View style={styles.notificationContentBlock}>
                    <View style={styles.cardHeaderRowAlignment}>
                      <AppText
                        size={14.5}
                        weight="bold"
                        color={colors.text}
                        numberOfLines={1}
                        style={styles.notifTitle}
                      >
                        {notif.title}
                      </AppText>
                      <AppText
                        size={11}
                        weight="medium"
                        color={colors.textMuted}
                      >
                        {notif.createdAt
                          ? new Date(notif.createdAt).toLocaleDateString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </AppText>
                    </View>

                    <AppText
                      size={13}
                      color={colors.textMuted}
                      numberOfLines={2}
                      style={{ lineHeight: 18 }}
                    >
                      {notif.body || notif.message}
                    </AppText>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // ... your existing styles (unchanged)
  container: { flex: 1 },
  headerWrap: { paddingBottom: 4 },
  headerSafeArea: {
    paddingTop: Platform.OS === "ios" ? 6 : StatusBar.currentHeight || 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  unreadBadgeFrame: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  markAllButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  headerSpacer: { width: 38 },

  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 50,
  },

  notificationCardFrame: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 16,
    marginBottom: 12,
    padding: 14,
    borderWidth: 1,
    position: "relative",
    overflow: "hidden",
  },
  notifIconChip: {
    width: 38,
    height: 38,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardHeaderRowAlignment: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  notifTitle: { flex: 1 },
  notificationContentBlock: { flex: 1 },
  unreadMarkerLine: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3.5,
  },

  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyState: {
    paddingTop: 70,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  emptySubText: {
    textAlign: "center",
    marginTop: 2,
    paddingHorizontal: 30,
    lineHeight: 18,
  },
});
