import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";

import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  Modal,
  Linking,
  ActivityIndicator,
  Animated,
} from "react-native";

import { useFocusEffect, useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { AppText } from "@/components/AppText";

import {
  Bell,
  LayoutDashboard,
  ArrowUpRight,
  PackageCheck,
  Truck,
  UserPlus,
  Gauge,
  ChevronRight,
  Clock,
  Activity,
  CheckCircle2,
  Handshake,
  X,
  Info,
} from "lucide-react-native";

import SidebarDrawer from "@/components/SidebarDrawer";
// import RecentMessagesWidget from "@/components/RecentMessagesWidget";

import { useDispatch, useSelector } from "react-redux";
import * as Notifications from "expo-notifications";
import { AppDispatch, RootState } from "@/api/store";

import { getProfile, savePushToken } from "@/api/slices/user.slice";
import { fetchNotifications } from "@/api/slices/notification.slice";
//import { getMyNegotiations } from "@/api/slices/negotiation.slice";
import { getUserRequests } from "@/api/slices/new.request.slice";
import { getUser } from "@/api/secureStore";

const INK = "#111318";

// ==========================================
// SHIMMER LOADING PLACEHOLDER COMPONENT
// ==========================================

function ShimmerBlock({
  width,
  height,
  borderRadius = 12,
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
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseColor,
          opacity,
        },
        style,
      ]}
    />
  );
}

// ==========================================
// STATIC CONFIGURATION DATA
// ==========================================

const QUICK_ACTIONS = [
  {
    key: "SEND_PARCEL",
    title: "Send a Package",
    desc: "Dispatch a parcel to be delivered safely.",
    Icon: PackageCheck,
  },
  {
    key: "REQUEST_DELIVERY",
    title: "Deliver a Package",
    desc: "Offer to deliver items along your route.",
    Icon: Truck,
  },
  {
    key: "JOIN_RIDE",
    title: "Join a Ride",
    desc: "Find available seats for your journey.",
    Icon: UserPlus,
  },
  {
    key: "OFFER_RIDE",
    title: "Offer a Ride",
    desc: "Publish your trip and take passengers.",
    Icon: Gauge,
  },
];

const STATUS_CARDS = [
  {
    key: "pending",
    status: "pending",
    title: "Awaiting and Pending",
    subtitle: "Pending requests",
    Icon: Clock,
    dark: true,
  },
  {
    key: "ongoing",
    status: "in_progress",
    title: "Started and Ongoing",
    subtitle: "Live transits",
    Icon: Activity,
    dark: false,
  },
  {
    key: "assigned",
    status: "assigned",
    title: "Assigned",
    subtitle: "Assigned offers",
    Icon: Handshake,
    dark: false,
  },
  {
    key: "completed",
    status: "completed",
    title: "Done & Finished",
    subtitle: "Full history",
    Icon: CheckCircle2,
    dark: true,
  },
];

type MatchItem = {
  id: string;
  type: "parcel" | "rideoffer";
  pickup: string;
  destination: string;
  matchedRequestType: "parcelrequest" | "joinride";
  fare?: number;
};

const findRouteMatches = (allRequests: any): MatchItem[] => {
  if (!allRequests || !Array.isArray(allRequests)) return [];
  return [];
};

// ==========================================
// MAIN HOME SCREEN COMPONENT
// ==========================================
export default function HomeScreen() {
  const { theme: colors, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const shimmerBase = isDark ? "#2A2A2E" : "#E7E7EA";

  const { profile, isLoading: isUserLoading } = useSelector(
    (state: RootState) => state.user
  );
  const { unreadCount, isLoading: isNotifLoading } = useSelector(
    (state: RootState) => state.notification
  );
  const {
    requests,
    isLoading: isRequestsLoading,
    error,
  } = useSelector((state: RootState) => state.request);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [actionsSheetOpen, setActionsSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeUser = async () => {
      setLoading(true);
      try {
        await dispatch(getProfile()).unwrap();
        await dispatch(fetchNotifications()).unwrap();
        // await dispatch(getMyNegotiations()).unwrap();
        await dispatch(getUserRequests()).unwrap();
        await getUser()

        try {
          const token = await Notifications.getExpoPushTokenAsync();
          if (token?.data) {
            await dispatch(
              savePushToken({ expoPushToken: token.data })
            ).unwrap();
          }
        } catch (pushErr) {
          console.log("Push token registration skipped:", pushErr);
        }
      } catch (err: any) {
        console.error("Initialization error:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      dispatch(getUserRequests());
    }, [dispatch])
  );

  const orderCounts = useMemo(() => {
    const list = requests || [];
    return list.reduce(
      (acc, item) => {
        const status = (item.status || "").toLowerCase();
        if (status === "pending") acc.pending += 1;
        if (status === "in_progress" || status.includes("ongoing"))
          acc.ongoing += 1;
        if (status === "assigned") acc.assigned += 1;

        // --- UPDATED LOGIC HERE ---
        if (status === "completed" || status === "confirmed")
          acc.completed += 1;

        return acc;
      },
      { pending: 0, ongoing: 0, assigned: 0, completed: 0 }
    );
  }, [requests]);

  const totalOngoing = orderCounts.ongoing;
  const routeMatches = useMemo(() => findRouteMatches(requests), [requests]);

  const handleAction = (actionType: string) => {
    setActionsSheetOpen(false);
    const typeMap: Record<string, string> = {
      REQUEST_DELIVERY: "deliver-package",
      SEND_PARCEL: "send-package",
      JOIN_RIDE: "join-ride",
      OFFER_RIDE: "offer-ride",
    };

    const requestType = typeMap[actionType];
    if (requestType) {
      router.push({
        pathname: "/(features)/create_request",
        params: { type: requestType },
      });
    } else {
      console.warn(`Unknown action type: ${actionType}`);
    }
  };

  const handleSidebarNavigation = (route: string) => {
    setSidebarOpen(false);

    if (route === "LOGOUT") {
      router.replace("/Onboarding");
      return;
    }

    if (route.startsWith("/")) {
      router.push(route as any);
      return;
    }

    switch (route) {
      case "PROFILE":
        router.push("/(screens)/profile");
        break;
      case "HISTORY":
        router.push("/(features)/all_requests");
        break;
      case "WALLET":
        router.push("/(screens)/wallet");
        break;
      case "WITHDRAWALS":
        router.push("/(screens)/withdrawal");
        break;
      case "SETTINGS":
        router.push("/(screens)/settings");
        break;
      case "SUPPORT":
        router.push("/(screens)/support");
        break;
      default:
        console.warn(`Unknown route: ${route}`);
        break;
    }
  };

  const firstName = profile?.fullName?.split(" ")[0];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header Bar */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => setSidebarOpen(true)}
            style={[styles.iconNavButton, { backgroundColor: colors.surface }]}
            activeOpacity={0.7}
          >
            <LayoutDashboard color={colors.text} size={19} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/(screens)/notifications")}
            style={[styles.iconNavButton, { backgroundColor: colors.surface }]}
            activeOpacity={0.7}
          >
            <Bell color={colors.text} size={19} />
            {unreadCount > 0 && (
              <View
                style={[styles.notiDot, { borderColor: colors.background }]}
              />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Main Content Area */}
      <ScrollView
        style={styles.mainScrollContainer}
        contentContainerStyle={styles.scrollContentLayout}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={{ gap: 16 }}>
            <View style={styles.welcomeBanner}>
              <ShimmerBlock
                width={120}
                height={14}
                borderRadius={7}
                baseColor={shimmerBase}
                style={{ marginBottom: 10 }}
              />
              <ShimmerBlock
                width="80%"
                height={27}
                borderRadius={8}
                baseColor={shimmerBase}
                style={{ marginBottom: 6 }}
              />
              <ShimmerBlock
                width="55%"
                height={27}
                borderRadius={8}
                baseColor={shimmerBase}
              />
            </View>

            <ShimmerBlock
              width="100%"
              height={62}
              borderRadius={40}
              baseColor={shimmerBase}
            />

            <View style={styles.sectionHeaderRow}>
              <ShimmerBlock
                width={100}
                height={15}
                borderRadius={7}
                baseColor={shimmerBase}
              />
              <ShimmerBlock
                width={50}
                height={13}
                borderRadius={7}
                baseColor={shimmerBase}
              />
            </View>

            <View style={styles.statusGrid}>
              {[0, 1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.gridCard,
                    { backgroundColor: isDark ? "#1B1B1F" : "#F1F1F3" },
                  ]}
                >
                  <ShimmerBlock
                    width={34}
                    height={34}
                    borderRadius={17}
                    baseColor={shimmerBase}
                    style={{ marginBottom: 14 }}
                  />
                  <ShimmerBlock
                    width={48}
                    height={30}
                    borderRadius={8}
                    baseColor={shimmerBase}
                    style={{ marginBottom: 8 }}
                  />
                  <ShimmerBlock
                    width="80%"
                    height={13}
                    borderRadius={6}
                    baseColor={shimmerBase}
                    style={{ marginBottom: 6 }}
                  />
                  <ShimmerBlock
                    width="55%"
                    height={11}
                    borderRadius={6}
                    baseColor={shimmerBase}
                  />
                </View>
              ))}
            </View>

            <View
              style={[
                styles.aboutCard,
                { backgroundColor: isDark ? "#1B1B1F" : "#F1F1F3" },
              ]}
            >
              <View style={styles.aboutHeaderRow}>
                <ShimmerBlock
                  width={26}
                  height={26}
                  borderRadius={13}
                  baseColor={shimmerBase}
                />
                <ShimmerBlock
                  width={140}
                  height={11}
                  borderRadius={6}
                  baseColor={shimmerBase}
                />
              </View>
              <ShimmerBlock
                width="100%"
                height={14}
                borderRadius={6}
                baseColor={shimmerBase}
                style={{ marginTop: 14 }}
              />
              <ShimmerBlock
                width="100%"
                height={14}
                borderRadius={6}
                baseColor={shimmerBase}
                style={{ marginTop: 8 }}
              />
              <ShimmerBlock
                width="70%"
                height={14}
                borderRadius={6}
                baseColor={shimmerBase}
                style={{ marginTop: 8 }}
              />
              <ShimmerBlock
                width={150}
                height={13}
                borderRadius={6}
                baseColor={shimmerBase}
                style={{ marginTop: 16 }}
              />
            </View>
          </View>
        ) : (
          <>
            <View style={styles.welcomeBanner}>
              <AppText
                size={15}
                color={colors.textMuted}
                style={styles.greetingText}
              >
                {firstName ? `Hi, ${firstName} 👋` : "Welcome back 👋"}
              </AppText>

              <AppText
                size={27}
                weight="bold"
                color={colors.text}
                style={styles.heroLineText}
              >
                Where are we routing today?
              </AppText>
            </View>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => setActionsSheetOpen(true)}
              style={[styles.primaryPill, { backgroundColor: colors.primary }]}
            >
              <View style={styles.primaryPillIcon}>
                <PackageCheck size={20} color="#fff" />
              </View>

              <View style={styles.primaryPillText}>
                <AppText size={16} weight="bold" color="#fff">
                  Create a new request
                </AppText>
                <AppText size={12.5} color="rgba(255,255,255,0.6)">
                  Book a delivery or set up a ride
                </AppText>
              </View>

              <View style={styles.primaryPillChevron}>
                <ChevronRight size={17} color="#fff" />
              </View>
            </TouchableOpacity>

            {totalOngoing > 0 && (
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() =>
                  router.push({
                    pathname: "/(features)/all_requests",
                    params: { status: "pending" },
                  })
                }
                style={[
                  styles.primaryPill,
                  { marginTop: -10, backgroundColor: INK },
                ]}
              >
                <View style={styles.primaryPillIcon}>
                  <Activity size={20} color="#fff" />
                </View>

                <View style={styles.primaryPillText}>
                  <AppText size={16} weight="bold" color="#fff">
                    {totalOngoing} Ongoing requests
                  </AppText>
                  <AppText size={12.5} color="rgba(255,255,255,0.6)">
                    View your live transits
                  </AppText>
                </View>

                <View style={styles.primaryPillChevron}>
                  <ChevronRight size={17} color="#fff" />
                </View>
              </TouchableOpacity>
            )}

            <View style={styles.sectionHeaderRow}>
              <AppText size={15} weight="bold" color={colors.text}>
                Quick Access
              </AppText>

              {isRequestsLoading ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <TouchableOpacity
                  onPress={() => router.push("/(features)/all_requests")}
                >
                  <AppText size={13} weight="bold" color={colors.textMuted}>
                    See all
                  </AppText>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.statusGrid}>
              {STATUS_CARDS.map((card) => {
                const count = orderCounts[card.key as keyof typeof orderCounts];
                const isCardDark = card.dark;

                return (
                  <TouchableOpacity
                    key={card.key}
                    style={[
                      styles.gridCard,
                      isCardDark
                        ? { backgroundColor: INK }
                        : {
                            backgroundColor: colors.surface,
                            borderWidth: 1,
                            borderColor: colors.border,
                          },
                    ]}
                    onPress={() =>
                      router.push({
                        pathname: "/(features)/all_requests",
                        params: { status: card.status },
                      })
                    }
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.gridIconContainer,
                        {
                          backgroundColor: isCardDark
                            ? "rgba(255,255,255,0.14)"
                            : `${colors.text}0D`,
                        },
                      ]}
                    >
                      <card.Icon
                        size={17}
                        color={isCardDark ? "#fff" : colors.text}
                      />
                    </View>

                    <AppText
                      size={30}
                      weight="bold"
                      color={isCardDark ? "#fff" : colors.text}
                      style={styles.countValue}
                    >
                      {count}
                    </AppText>

                    <AppText
                      size={13.5}
                      weight="bold"
                      color={isCardDark ? "#fff" : colors.text}
                    >
                      {card.title}
                    </AppText>

                    <AppText
                      size={11.5}
                      color={
                        isCardDark ? "rgba(255,255,255,0.55)" : colors.textMuted
                      }
                    >
                      {card.subtitle}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View
              style={[styles.aboutCard, { backgroundColor: colors.surface }]}
            >
              <View style={styles.aboutHeaderRow}>
                <View
                  style={[
                    styles.aboutIconBox,
                    { backgroundColor: `${colors.text}0D` },
                  ]}
                >
                  <Info size={15} color={colors.text} />
                </View>

                <AppText
                  size={11}
                  weight="bold"
                  color={colors.textMuted}
                  style={styles.aboutLabel}
                >
                  ABOUT PADIMAN ROUTE
                </AppText>
              </View>

              <AppText size={13} color={colors.text} style={styles.aboutBody}>
                Padiman Route puts parcel delivery and ride sharing on one
                platform, so people across Nigeria can move things — and get
                around themselves — quickly, safely, and at a fair price.
              </AppText>

              <TouchableOpacity
                onPress={() => Linking.openURL("https://www.padimanroute.com/")}
                activeOpacity={0.7}
                style={styles.aboutLinkRow}
              >
                <AppText size={12} weight="bold" color={colors.text}>
                  Visit padimanroute.com
                </AppText>
                <ArrowUpRight size={13} color={colors.text} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* <RecentMessagesWidget /> */}

      {/* ACTIONS MODAL SHEET */}
      <Modal
        visible={actionsSheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setActionsSheetOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setActionsSheetOpen(false)}
        >
          <View style={styles.modalCenteredView} pointerEvents="box-none">
            <TouchableOpacity
              activeOpacity={1}
              style={[
                styles.modalSheet,
                {
                  borderColor: isDark ? colors.border : "#EAEAEA",
                  backgroundColor: isDark ? colors.background : "#F8F9FA",
                },
              ]}
            >
              <View
                style={[
                  styles.modalHandle,
                  { backgroundColor: isDark ? colors.border : "#E0E0E0" },
                ]}
              />

              <View style={styles.modalHeaderRow}>
                <View style={styles.modalHeaderTextContainer}>
                  <View style={styles.headerTitleBadgeRow}>
                    <AppText size={24} weight="bold" color={colors.text}>
                      What are we moving today?
                    </AppText>
                    <View style={styles.verifiedDotBadge} />
                  </View>

                  <AppText
                    size={13}
                    color={colors.textMuted}
                    style={styles.modalSubtitle}
                  >
                    Select an operations vector payload below to initialize
                    deployment routing.
                  </AppText>
                </View>

                <TouchableOpacity
                  onPress={() => setActionsSheetOpen(false)}
                  hitSlop={12}
                  style={[
                    styles.modalCloseButton,
                    { backgroundColor: isDark ? colors.background : "#F4F6F9" },
                  ]}
                >
                  <X size={15} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={[styles.modalActionsColumn, { marginBottom: 64 }]}>
                {QUICK_ACTIONS.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.modalActionRow,
                      {
                        backgroundColor: colors.surface,
                        borderColor: isDark ? colors.border : "#EDF2F7",
                      },
                    ]}
                    onPress={() => handleAction(item.key)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.modalActionIconBox,
                        {
                          backgroundColor: isDark ? colors.surface : "#EAEAEA",
                        },
                      ]}
                    >
                      <item.Icon size={18} color={colors.text} />
                    </View>

                    <View style={styles.modalActionTextContainer}>
                      <AppText size={16} weight="bold" color={colors.text}>
                        {item.title}
                      </AppText>

                      <AppText
                        size={13}
                        color={colors.textMuted}
                        numberOfLines={1}
                        style={{ marginTop: 1 }}
                      >
                        {item.desc}
                      </AppText>
                    </View>

                    <ChevronRight size={15} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <SidebarDrawer
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={handleSidebarNavigation}
        userName={profile?.fullName || "Padiman Operator"}
        userEmail={profile?.email || ""}
        profileImage={profile?.profileImage || null}
      />
    </View>
  );
}

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSafeArea: {
    paddingTop: Platform.OS === "ios" ? 6 : StatusBar.currentHeight || 6,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 8,
  },
  iconNavButton: {
    height: 42,
    width: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  notiDot: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
    borderWidth: 1.5,
  },
  mainScrollContainer: {
    flex: 1,
  },
  scrollContentLayout: {
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 110 : 96,
    gap: 16,
  },
  welcomeBanner: {
    marginBottom: 4,
  },
  greetingText: {
    marginBottom: 4,
  },
  heroLineText: {
    letterSpacing: -0.6,
    lineHeight: 33,
  },
  primaryPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 40,
    padding: 8,
    paddingRight: 16,
    gap: 12,
  },
  primaryPillIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.14)",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryPillText: {
    flex: 1,
    gap: 1,
  },
  primaryPillChevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    marginTop: 8,
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  gridCard: {
    width: "48.5%",
    padding: 16,
    borderRadius: 22,
  },
  gridIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  countValue: {
    letterSpacing: -1,
    marginBottom: 4,
    lineHeight: 32,
  },
  aboutCard: {
    padding: 18,
    borderRadius: 22,
    marginTop: 4,
  },
  aboutHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  aboutIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  aboutLabel: {
    letterSpacing: 0.6,
  },
  aboutBody: {
    lineHeight: 20,
    marginTop: 10,
  },
  aboutLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(17, 19, 24, 0.45)",
    justifyContent: "flex-end",
  },
  modalCenteredView: {
    width: "100%",
  },
  modalSheet: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 44 : 32,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderBottomWidth: 0,
    width: "100%",
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  modalHeaderTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  headerTitleBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  verifiedDotBadge: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  modalSubtitle: {
    marginTop: 2,
    lineHeight: 17,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalActionsColumn: {
    gap: 10,
  },
  modalActionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 18,
  },
  modalActionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  modalActionTextContainer: {
    flex: 1,
    paddingRight: 8,
  },
});
