import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
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
} from "lucide-react-native";
import SidebarDrawer from "@/components/SidebarDrawer";
import { LinearGradient } from "expo-linear-gradient";

// Redux
import { useDispatch, useSelector } from "react-redux";
import * as Notifications from "expo-notifications";
import { AppDispatch, RootState } from "@/api/store";
import { getProfile, savePushToken } from "@/api/slices/user.slice";
import { fetchNotifications } from "@/api/slices/notification.slice";

export default function HomeScreen() {
  const { theme: colors, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  // Profile Selector
  const {
    profile,
    isLoading: isUserLoading,
    error: userError,
  } = useSelector((state: RootState) => state.user);

  // Notification Selector
  const { unreadCount, isLoading: isNotifLoading } = useSelector(
    (state: RootState) => state.notification
  );

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch profiles, notifications, and register push token safely
  useEffect(() => {
    const initializeUser = async () => {
      try {
        await dispatch(getProfile()).unwrap();
        await dispatch(fetchNotifications()).unwrap();

        try {
          const token = await Notifications.getExpoPushTokenAsync();
          if (token?.data) {
            console.log("Expo Push Token found:", token.data);
            await dispatch(
              savePushToken({ expoPushToken: token.data })
            ).unwrap();
          }
        } catch (pushErr: any) {
          console.log(
            "Expo Push Token registration failed or skipped:",
            pushErr.message
          );
        }
      } catch (err: any) {
        console.error("Failed to initialize system parameters:", err);
        Alert.alert(
          "Initialization Error",
          err?.message ||
            "Failed to establish environment settings or profile pipelines."
        );
      }
    };

    initializeUser();
  }, [dispatch]);

  const handleAction = (actionType: string) => {
    switch (actionType) {
      case "REQUEST_DELIVERY":
        router.push("/(features)/book_parcel");
        break;
      case "SEND_PARCEL":
        router.push("/(features)/send_parcel");
        break;
      case "JOIN_RIDE":
        router.push("/(features)/join");
        break;
      case "OFFER_RIDE":
        router.push("/(features)/offer-ride");
        break;
      default:
        break;
    }
  };

  const handleSidebarNavigation = (route: string) => {
    setSidebarOpen(false);

    if (route === "LOGOUT") {
      router.replace("/Onboarding");
      return;
    }

    switch (route) {
      case "PROFILE":
        router.push("/(screens)/profile");
        break;
      case "HISTORY":
        router.push("/(screens)/order");
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
        break;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* PREMIUM HEADER GRADIENT */}
      <LinearGradient
        colors={isDark ? [colors.surface, colors.surface] : ["#F8F5FF", "#FFFFFF"]}
        style={styles.headerGradient}
      >
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => setSidebarOpen(true)}
              style={[
                styles.iconNavButton,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.04)",
                  borderColor: "transparent",
                },
              ]}
              activeOpacity={0.7}
            >
              <LayoutDashboard color={colors.text} size={22} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(screens)/notifications")}
              style={[
                styles.iconNavButton,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.04)",
                  borderColor: "transparent",
                },
              ]}
              activeOpacity={0.7}
            >
              <Bell color={colors.text} size={22} />
              {unreadCount > 0 && (
                <View
                  style={[
                    styles.notiBadge,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <AppText size={9} weight="bold" color="#FFF">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </AppText>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* System Synchronization Status */}
      {(isUserLoading || isNotifLoading) && (
        <View style={styles.syncIndicator}>
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={{ marginRight: 6 }}
          />
          <AppText size={12} color={colors.textMuted} weight="medium">
            Syncing platform matrix...
          </AppText>
        </View>
      )}

      {/* MAIN CONTENT HERO & PANELS */}
      <ScrollView
        style={styles.mainScrollContainer}
        contentContainerStyle={styles.scrollContentLayout}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeBanner}>
          {profile?.fullName && (
            <AppText
              size={15}
              color={colors.primary}
              weight="bold"
              style={styles.greetingText}
            >
              WELCOME BACK, {profile.fullName.split(" ")[0].toUpperCase()}
            </AppText>
          )}

          <AppText
            size={28}
            weight="bold"
            color={colors.text}
            style={{ letterSpacing: -0.8, lineHeight: 34 }}
          >
            Where are we routing today?
          </AppText>
        </View>

        {/* FEATURE SECTIONS GRID LAYOUT */}
        <AppText
          size={13}
          weight="bold"
          color={colors.textMuted}
          style={styles.sectionLabel}
        >
          PARCEL FREIGHT & LOGISTICS
        </AppText>

        <View style={styles.gridContainer}>
          <TouchableOpacity
            style={[
              styles.gridCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => handleAction("REQUEST_DELIVERY")}
            activeOpacity={0.85}
          >
            <View style={styles.cardInternalWrapper}>
              <View style={styles.cardActionHeaderRow}>
                <View
                  style={[
                    styles.iconIndicatorBox,
                    { backgroundColor: `${colors.primary}15` },
                  ]}
                >
                  <PackageCheck size={20} color={colors.primary} />
                </View>
                <ArrowUpRight size={16} color={colors.textMuted} />
              </View>

              <AppText
                size={16}
                weight="bold"
                color={colors.text}
                style={styles.cardTitle}
              >
                Send a Delivery
              </AppText>
              <AppText
                size={12}
                color={colors.textMuted}
                style={styles.cardDesc}
              >
                Book a freight dispatch across regional node hubs safely.
              </AppText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.gridCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => handleAction("SEND_PARCEL")}
            activeOpacity={0.85}
          >
            <View style={styles.cardInternalWrapper}>
              <View style={styles.cardActionHeaderRow}>
                <View
                  style={[
                    styles.iconIndicatorBox,
                    { backgroundColor: "rgba(34, 197, 94, 0.12)" },
                  ]}
                >
                  <Truck size={20} color="#22C55E" />
                </View>
                <ArrowUpRight size={16} color={colors.textMuted} />
              </View>

              <AppText
                size={16}
                weight="bold"
                color={colors.text}
                style={styles.cardTitle}
              >
                Deliver a Delivery
              </AppText>
              <AppText
                size={12}
                color={colors.textMuted}
                style={styles.cardDesc}
              >
                Secure commercial items to deliver on your route instantly.
              </AppText>
            </View>
          </TouchableOpacity>
        </View>

        <AppText
          size={13}
          weight="bold"
          color={colors.textMuted}
          style={styles.sectionLabel}
        >
          COMMUTE & RIDE SHARING
        </AppText>

        <View style={styles.gridContainer}>
          <TouchableOpacity
            style={[
              styles.gridCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]} 
            onPress={() => handleAction("JOIN_RIDE")}
            activeOpacity={0.85}
          >
            <View style={styles.cardInternalWrapper}>
              <View style={styles.cardActionHeaderRow}>
                <View
                  style={[
                    styles.iconIndicatorBox,
                    { backgroundColor: "rgba(59, 130, 246, 0.12)" },
                  ]}
                >
                  <UserPlus size={20} color="#3B82F6" />
                </View>
                <ArrowUpRight size={16} color={colors.textMuted} />
              </View>

              <AppText
                size={16}
                weight="bold"
                color={colors.text}
                style={styles.cardTitle}
              >
                Join a Ride
              </AppText>
              <AppText
                size={12}
                color={colors.textMuted}
                style={styles.cardDesc}
              >
                Find empty commuter seats along matching destination paths.
              </AppText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.gridCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => handleAction("OFFER_RIDE")}
            activeOpacity={0.85}
          >
            <View style={styles.cardInternalWrapper}>
              <View style={styles.cardActionHeaderRow}>
                <View
                  style={[
                    styles.iconIndicatorBox,
                    { backgroundColor: "rgba(168, 85, 247, 0.12)" },
                  ]}
                >
                  <Gauge size={20} color="#A855F7" />
                </View>
                <ArrowUpRight size={16} color={colors.textMuted} />
              </View>

              <AppText
                size={16}
                weight="bold"
                color={colors.text}
                style={styles.cardTitle}
              >
                Offer a Ride
              </AppText>
              <AppText
                size={12}
                color={colors.textMuted}
                style={styles.cardDesc}
              >
                Publish trip tracking pipelines to distribute travel overhead.
              </AppText>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <SidebarDrawer
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={handleSidebarNavigation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerSafeArea: {
    paddingTop: Platform.OS === "ios" ? 10 : StatusBar.currentHeight || 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
  },
  iconNavButton: {
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    width: 44,
    position: "relative",
  },
  notiBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  syncIndicator: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  mainScrollContainer: { flex: 1 },
  scrollContentLayout: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  welcomeBanner: {
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  greetingText: {
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  sectionLabel: {
    letterSpacing: 1,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  gridContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
    gap: 14,
  },
  gridCard: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    minHeight: 160,
  },
  cardInternalWrapper: {
    padding: 18,
    flex: 1,
    justifyContent: "space-between",
  },
  cardActionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  iconIndicatorBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  cardDesc: {
    lineHeight: 16,
  },
});
