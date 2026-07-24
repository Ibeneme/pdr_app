import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { AppText } from "@/components/AppText";
import { Ionicons } from "@expo/vector-icons";

// Redux
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/api/store";
import {
  fetchNotifications,
  markNotificationAsRead,
} from "@/api/slices/notification.slice";
import { getUser } from "@/api/secureStore";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const INK = "#111318";

const getInitial = (name?: string) => {
  if (!name) return "•";
  const trimmed = name.trim();
  return trimmed.length ? trimmed[0].toUpperCase() : "•";
};

export default function RecentMessagesWidget() {
  console.log("--> RecentMessagesWidget Floating FAB Engine initialized");

  const { theme: colors, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const { notifications, isLoading } = useSelector(
    (state: RootState) => state.notification
  );

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      console.log("--> Pulling profile data from SecureStore context layer");
      const user = await getUser();
      setCurrentUser(user);
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    console.log(
      "--> Syncing background active notifications collection data stream"
    );
    dispatch(fetchNotifications());
  }, [dispatch]);

  const refresh = () => {
    console.log(
      "--> Refresh trigger execution call captured on message store query"
    );
    dispatch(fetchNotifications());
  };

  const handleMessagePress = async (notif: any) => {
    if (!notif) return;
    console.log(
      `--> Message entity action click handled. ID Reference: ${notif._id}`
    );

    if (!notif.read && notif._id) {
      console.log("--> Mutating item execution flag: Dispatch state to read");
      dispatch(markNotificationAsRead(notif._id));
    }

    const payloadData = notif.data || {};
    const negotiation = payloadData.negotiation;

    if (negotiation) {
      console.log(
        "--> Navigation route matching parameter criteria found. Relocating layout view stack to ChatScreen."
      );
      setModalVisible(false);
      router.push({
        pathname: "/(details)/ChatScreen",
        params: {
          id: negotiation._id,
          parcelId: negotiation.service,
          isServiceProvider: String(negotiation.isProvider),
          currentUserId: String(currentUser?._id || currentUser?.id),
        },
      });
    }
  };

  const handleNavigateToAllNotifications = () => {
    console.log(
      "--> Evacuating widget layer model overlay context tree. Navigating stack framework index -> notification view router context path"
    );
    setModalVisible(false);

    // Router fallback redirecting out to native unified dashboard notifications view array
    router.push("/notifications");
  };

  // Filter criteria logic tracking max 5 items matching requirement payload parameter specifications
  const messageNotifications = notifications
    .filter((notif: any) => notif.type === "MESSAGE")
    .sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  const unreadCount = notifications.filter(
    (notif: any) => notif.type === "MESSAGE" && !notif.read
  ).length;

  return (
    <View style={styles.floatingAnchorWrapper} pointerEvents="box-none">
      {/* FLOATING ACTION TRIGGER WIDGET BUTTON */}
      <TouchableOpacity
        style={[
          styles.floatingFabButton,
          {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
            borderWidth: 12,
          },
        ]}
        activeOpacity={0.9}
        onPress={() => {
          console.log(
            "--> FAB Action Pressed. Shifting message component sheet visibility overlay state true"
          );
          setModalVisible(true);
        }}
      >
        <Ionicons name="chatbubbles" size={22} color="#FFFFFF" />
        {unreadCount > 0 && (
          <View style={[styles.fabNotificationBadge, { backgroundColor: INK }]}>
            <AppText size={10} weight="bold" color="#FFFFFF">
              {unreadCount > 9 ? "9+" : unreadCount}
            </AppText>
          </View>
        )}
      </TouchableOpacity>

      {/* OVERLAY MODAL DISPATCH SYSTEM ARCHITECTURE */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          console.log(
            "--> UI execution framework layer requesting closure context escape loop"
          );
          setModalVisible(false);
        }}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalBackdropBlurOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.bottomSheetContainer,
                  {
                    backgroundColor: isDark ? colors.background : "#F8F9FA",

                    borderColor: isDark ? colors.border : "#EAEAEA",
                  },
                ]}
              >
                {/* NOTCH HANDLE DRAG OVERLAY INDICATOR DECORATOR */}
                <View
                  style={[
                    styles.sheetNotchHandle,
                    { backgroundColor: isDark ? colors.border : "#E0E0E0" },
                  ]}
                />

                {/* HEADER SECTION LAYOUT CONTEXT */}
                <View style={styles.sheetHeaderBlockRow}>
                  <View style={{ flex: 1 }}>
                    <AppText size={24} weight="bold" color={colors.text}>
                      Recent Chats
                    </AppText>
                    <AppText
                      size={14}
                      color={colors.textMuted}
                      style={{ marginTop: 2 }}
                    >
                      You have {unreadCount} unread interactive chat items
                      pending
                    </AppText>
                  </View>

                  <TouchableOpacity
                    onPress={refresh}
                    activeOpacity={0.7}
                    style={[
                      styles.headerUtilityIconButton,
                      {
                        backgroundColor: isDark ? colors.background : "#F4F6F9",
                      },
                    ]}
                  >
                    <Ionicons name="refresh" size={16} color={colors.text} />
                  </TouchableOpacity>
                </View>

                {/* MESSAGES VIEW CONTAINER FEED LIST */}
                <ScrollView
                  style={styles.sheetScrollFeedWindow}
                  contentContainerStyle={styles.scrollContentLayoutPadding}
                  showsVerticalScrollIndicator={false}
                >
                  {isLoading && messageNotifications.length === 0 ? (
                    <View style={styles.emptyStateContainerPod}>
                      <ActivityIndicator
                        size="small"
                        color={colors.primary}
                        style={{ marginBottom: 10 }}
                      />
                      <AppText
                        size={14}
                        color={colors.textMuted}
                        weight="medium"
                      >
                        Synchronizing real-time conversations...
                      </AppText>
                    </View>
                  ) : messageNotifications.length === 0 ? (
                    <View style={styles.emptyStateContainerPod}>
                      <Ionicons
                        name="chatbubble-ellipses-outline"
                        size={32}
                        color={colors.textMuted}
                        style={{ marginBottom: 8 }}
                      />
                      <AppText size={14} color={colors.textMuted} weight="bold">
                        No active chat instances found
                      </AppText>
                      <AppText
                        size={14}
                        color={colors.textMuted}
                        style={{ marginTop: 2, textAlign: "center" }}
                      >
                        Incoming transactional message packets appear here.
                      </AppText>
                    </View>
                  ) : (
                    messageNotifications.map((notif: any, index: number) => (
                      <TouchableOpacity
                        key={notif._id}
                        style={[
                          styles.messageItemRowCard,
                          {
                            backgroundColor: colors.surface,
                            borderColor: isDark ? colors.border : "#EDF2F7",
                          },
                        ]}
                        onPress={() => handleMessagePress(notif)}
                        activeOpacity={0.8}
                      >
                        <View
                          style={[
                            styles.avatarLayoutFrame,
                            {
                              backgroundColor: notif.read
                                ? isDark
                                  ? colors.border
                                  : "#E2E8F0"
                                : INK,
                            },
                          ]}
                        >
                          <AppText
                            size={14}
                            weight="bold"
                            color={notif.read ? colors.textMuted : "#FFFFFF"}
                          >
                            {getInitial(notif.title)}
                          </AppText>
                        </View>

                        <View style={styles.flexibleTextPayloadColumn}>
                          <View style={styles.metaTimeGroupingRow}>
                            <AppText
                              size={14}
                              weight={notif.read ? "semibold" : "bold"}
                              color={colors.text}
                              numberOfLines={1}
                              style={{ flex: 1 }}
                            >
                              {notif.title}
                            </AppText>
                            <AppText size={10} color={colors.textMuted}>
                              {notif.createdAt
                                ? new Date(notif.createdAt).toLocaleTimeString(
                                    [],
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )
                                : ""}
                            </AppText>
                          </View>
                          <AppText
                            size={12}
                            color={notif.read ? colors.textMuted : colors.text}
                            numberOfLines={1}
                            style={{ marginTop: 2 }}
                          >
                            {notif.body || notif.message}
                          </AppText>
                        </View>

                        {!notif.read && (
                          <View
                            style={[
                              styles.unreadDotBadgeIndicator,
                              { backgroundColor: colors.primary },
                            ]}
                          />
                        )}
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>

                {/* BOTTOM ANCHOR LINK REDIRECT ROUTER TRIGGER FIELD */}
                <View
                  style={[
                    styles.sheetFooterActionPad,
                    {
                      borderTopColor: isDark ? colors.border : "#EAEAEA",
                      marginBottom: 64,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.seeAllRouterAnchorPillButton,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={handleNavigateToAllNotifications}
                    activeOpacity={0.8}
                  >
                    <AppText size={13} weight="bold" color="#FFFFFF">
                      View all notifications history
                    </AppText>
                    <Ionicons
                      name="arrow-forward-sharp"
                      size={14}
                      color="#FFFFFF"
                      style={{ marginLeft: 6 }}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingAnchorWrapper: {
    position: "absolute",
    bottom: 78,
    right: 16,
    zIndex: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingFabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    position: "relative",
  },
  fabNotificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  modalBackdropBlurOverlay: {
    flex: 1,
    backgroundColor: "rgba(17, 19, 24, 0.4)",
    justifyContent: "flex-end",
  },
  bottomSheetContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: SCREEN_HEIGHT * 0.75,
    width: "100%",
    paddingBottom: 34,
  },
  sheetNotchHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
  },
  sheetHeaderBlockRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 14,
  },
  headerUtilityIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetScrollFeedWindow: {
    width: "100%",
  },
  scrollContentLayoutPadding: {
    paddingHorizontal: 24,
    paddingVertical: 6,
    gap: 10,
  },
  messageItemRowCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 18,
  },
  avatarLayoutFrame: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  flexibleTextPayloadColumn: {
    flex: 1,
  },
  metaTimeGroupingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  unreadDotBadgeIndicator: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginLeft: 10,
  },
  emptyStateContainerPod: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  sheetFooterActionPad: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    marginTop: 10,
  },
  seeAllRouterAnchorPillButton: {
    height: 50,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
});
