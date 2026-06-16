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

// Redux
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/api/store";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/api/slices/notification.slice";
import { getUser } from "@/api/secureStore";

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

  // Fetch notifications on component initialization
  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleNotificationClick = async (notification: any) => {
    if (!notification) return;

    // 1. Mark as read
    if (!notification.read && notification._id) {
      dispatch(markNotificationAsRead(notification._id));
    }

    const payloadData = notification.data || {};
    const negotiation = payloadData.negotiation;

    // 2. Routing logic for CHAT_SCREEN
    if (
      notification.type === "MESSAGE" ||
      payloadData.router === "CHAT_SCREEN"
    ) {
      if (!negotiation) return;

      return router.push({
        pathname: "/(details)/ChatScreen",
        params: {
          id: negotiation._id,
          parcelId: negotiation.service, // Mapping your service ID to parcelId
          isServiceProvider: String(negotiation.isProvider),
          currentUserId: String(currentUser?._id || currentUser?.id),
        },
      });
    }

    // 3. Optional: Routing for standard Detail screens
    if (payloadData.negotiationId) {
      return router.push({
        pathname: "/(details)/details",
        params: { id: payloadData.negotiationId },
      });
    }
  };

  const handleMarkAllAsRead = () => {
    console.log("✅ Marking all notifications as read");
    dispatch(markAllNotificationsAsRead());
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* --- HEADER CONTAINER --- */}
      <SafeAreaView
        style={[
          styles.headerSafeArea,
          {
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[
              styles.backTextButton,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <AppText size={13} weight="bold" color={colors.text}>
              Back
            </AppText>
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <AppText size={18} weight="bold" color={colors.text}>
              Notifications
            </AppText>
            {unreadCount > 0 && (
              <View
                style={[
                  styles.unreadBadgeFrame,
                  { borderColor: colors.primary },
                ]}
              >
                <AppText size={10} weight="bold" color={colors.primary}>
                  {unreadCount} NEW
                </AppText>
              </View>
            )}
          </View>

          {unreadCount > 0 ? (
            <TouchableOpacity onPress={handleMarkAllAsRead}>
              <AppText size={13} weight="bold" color={colors.primary}>
                Mark all read
              </AppText>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 60 }} /> // Spacer to balance header row layout
          )}
        </View>
      </SafeAreaView>

      {/* --- CONTENT AREA LAYOUTS --- */}
      {isLoading && notifications.length === 0 ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centeredContainer}>
          <AppText size={14} color="red" style={{ textAlign: "center" }}>
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
              <AppText size={16} color={colors.textMuted}>
                No notifications yet
              </AppText>
            </View>
          ) : (
            notifications.map((notif: any, index: number) => (
              <TouchableOpacity
                key={notif._id || index}
                style={[
                  styles.notificationCardFrame,
                  {
                    backgroundColor: colors.surface,
                    borderColor: notif.read ? colors.border : colors.primary,
                    borderWidth: notif.read ? 1 : 1.5,
                  },
                ]}
                onPress={() => handleNotificationClick(notif)}
                activeOpacity={0.85}
              >
                <View style={styles.cardHeaderRowAlignment}>
                  <View
                    style={[
                      styles.typeInlineLabelBadge,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <AppText
                      size={9}
                      weight="bold"
                      color={notif.read ? colors.textMuted : colors.primary}
                    >
                      {notif.type || "GENERAL"}
                    </AppText>
                  </View>
                  <AppText size={11} weight="medium" color={colors.textMuted}>
                    {notif.createdAt
                      ? new Date(notif.createdAt).toLocaleDateString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </AppText>
                </View>

                <View style={styles.notificationContentBlock}>
                  <AppText
                    size={15}
                    weight="bold"
                    color={colors.text}
                    style={{ marginBottom: 4 }}
                  >
                    {notif.title}
                  </AppText>
                  <AppText
                    size={13}
                    color={colors.textMuted}
                    style={{ lineHeight: 18 }}
                  >
                    {notif.body || notif.message}
                  </AppText>
                </View>

                {!notif.read && (
                  <View
                    style={[
                      styles.unreadMarkerLine,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSafeArea: {
    ...Platform.select({
      android: {
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 4 : 12,
      },
    }),
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backTextButton: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  unreadBadgeFrame: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 50,
  },
  notificationCardFrame: {
    borderRadius: 18,
    marginBottom: 12,
    padding: 16,
    position: "relative",
    overflow: "hidden",
  },
  cardHeaderRowAlignment: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  typeInlineLabelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  notificationContentBlock: {
    width: "100%",
  },
  unreadMarkerLine: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyState: {
    paddingTop: 60,
    alignItems: "center",
    justifyContent: "center",
  },
});
