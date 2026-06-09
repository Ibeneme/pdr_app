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
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { AppText } from "@/components/AppText";
import { Bell, LayoutDashboard } from "lucide-react-native";
import SidebarDrawer from "@/components/SidebarDrawer";

// Redux
import { useDispatch, useSelector } from "react-redux";
import * as Notifications from "expo-notifications";
import { AppDispatch, RootState } from "@/api/store";
import { getProfile, savePushToken } from "@/api/slices/user.slice";

export default function HomeScreen() {
  const { theme: colors, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const { profile, isLoading, error } = useSelector(
    (state: RootState) => state.user
  );

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);

  // Fetch profile + register Expo Push Token
  useEffect(() => {
    const initializeUser = async () => {
      try {
        // 1. Fetch user profile (gets ID + saves to secure store)
        await dispatch(getProfile()).unwrap();

        // 2. Get Expo Push Token and send to backend
        const token = await Notifications.getExpoPushTokenAsync();

        if (token?.data) {
          console.log("Expo Push Token:", token.data);
          await dispatch(savePushToken({ expoPushToken: token.data })).unwrap();
        }
      } catch (err: any) {
        console.error("Failed to initialize user data:", err);
        Alert.alert(
          "Error",
          err?.message || "Failed to load profile or push token"
        );
      }
    };

    initializeUser();
  }, [dispatch]);

  const handleAction = (actionType: string) => {
    switch (actionType) {
      case "REQUEST_DELIVERY":
        router.push("/(features)/drivers_menu");
        break;
      case "SEND_PARCEL":
        router.push("/(features)/send_parcel");
        break;
      case "JOIN_RIDE":
        router.push("/(features)/join_ride");
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

      {/* --- HEADER --- */}
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
            onPress={() => setSidebarOpen(true)}
            style={[
              styles.backTextButton,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
            activeOpacity={0.7}
          >
            <LayoutDashboard color={colors.text} size={22} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setNotificationCount(0);
              router.push("/(screens)/notifications");
            }}
            style={[
              styles.backTextButton,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
            activeOpacity={0.7}
          >
            <Bell color={colors.text} size={22} />
            {notificationCount > 0 && (
              <View
                style={[styles.notiBadge, { backgroundColor: colors.primary }]}
              >
                <AppText size={9} weight="bold" color="#FFF">
                  {notificationCount}
                </AppText>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Loading Indicator */}
      {isLoading && (
        <View style={{ padding: 20 }}>
          <AppText>Loading profile...</AppText>
        </View>
      )}

      {error && (
        <View style={{ padding: 20 }}>
          <AppText color="red">Error: {error}</AppText>
        </View>
      )}

      {/* --- MAIN CONTENT --- */}
      <ScrollView
        style={styles.mainScrollContainer}
        contentContainerStyle={styles.scrollContentLayout}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeBanner}>
          {profile?.fullName && (
            <AppText size={18} color={colors.text} style={{ marginTop: 8 }}>
              Welcome back, {profile.fullName.split(" ")[0]}!
            </AppText>
          )}

          <AppText
            size={26}
            weight="bold"
            color={colors.text}
            style={{ letterSpacing: -0.6 }}
          >
            Where are we routing today?
          </AppText>
        </View>

        {/* Rest of your original content unchanged */}
        <TouchableOpacity
          style={[
            styles.dashboardCardFrame,
            { backgroundColor: colors.primary, borderColor: colors.primary },
          ]}
          onPress={() => router.push("/(screens)/order")}
          activeOpacity={0.9}
        >
          <View style={styles.dashboardCardLeft}>
            <View style={styles.textBadgeOverlay}>
              <AppText size={10} weight="bold" color="#FFF">
                ACTIVE
              </AppText>
            </View>
            <View style={styles.dashboardTextContainer}>
              <AppText size={15} weight="bold" color="#FFF">
                2 ONGOING ORDERS
              </AppText>
              <AppText
                size={14}
                color="rgba(255,255,255,0.8)"
                style={{ marginTop: 2 }}
              >
                Estimated runtime arrival: ~30 mins
              </AppText>
            </View>
          </View>
          <AppText size={11} weight="bold" color="#FFF">
            VIEW
          </AppText>
        </TouchableOpacity>

        <AppText
          size={11}
          weight="bold"
          color={colors.textMuted}
          style={styles.sectionTitle}
        >
          PARCEL FREIGHT LOGISTICS
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
              <View
                style={[
                  styles.inlineStaticLabelBadge,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <AppText size={9} weight="bold" color={colors.primary}>
                  RECEIVE
                </AppText>
              </View>
              <AppText
                size={17}
                weight="bold"
                color={colors.text}
                style={styles.cardTitle}
              >
                Send a Delivery
              </AppText>
              <AppText
                size={14}
                color={colors.textMuted}
                style={styles.cardDesc}
              >
                Accept incoming parcels ready for rapid hub dispatch.
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
              <View
                style={[
                  styles.inlineStaticLabelBadge,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <AppText size={9} weight="bold" color={colors.primary}>
                  DISPATCH
                </AppText>
              </View>
              <AppText
                size={17}
                weight="bold"
                color={colors.text}
                style={styles.cardTitle}
              >
                Deliver a Delivery
              </AppText>
              <AppText
                size={14}
                color={colors.textMuted}
                style={styles.cardDesc}
              >
                Secure a dynamic courier node to transport items instantly.
              </AppText>
            </View>
          </TouchableOpacity>
        </View>

        <AppText
          size={11}
          weight="bold"
          color={colors.textMuted}
          style={styles.sectionTitle}
        >
          COMMUTE NETWORK SYSTEM
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
              <View
                style={[
                  styles.inlineStaticLabelBadge,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <AppText size={9} weight="bold" color={colors.primary}>
                  JOIN
                </AppText>
              </View>
              <AppText
                size={17}
                weight="bold"
                color={colors.text}
                style={styles.cardTitle}
              >
                Join a Ride
              </AppText>
              <AppText
                size={14}
                color={colors.textMuted}
                style={styles.cardDesc}
              >
                Book empty seats along matching line routes.
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
              <View
                style={[
                  styles.inlineStaticLabelBadge,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <AppText size={9} weight="bold" color={colors.primary}>
                  OFFER
                </AppText>
              </View>
              <AppText
                size={17}
                weight="bold"
                color={colors.text}
                style={styles.cardTitle}
              >
                Offer a Ride
              </AppText>
              <AppText
                size={14}
                color={colors.textMuted}
                style={styles.cardDesc}
              >
                Publish upcoming vehicular tracks to distribute fuel metrics.
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

// Styles remain exactly the same
const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSafeArea: {
    width: "100%",
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
    paddingBottom: 14,
    paddingTop: Platform.OS === "ios" ? 4 : 8,
  },
  backTextButton: {
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    width: 44,
    position: "relative",
  },
  notiBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  mainScrollContainer: { flex: 1 },
  scrollContentLayout: {
    paddingTop: 32,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  welcomeBanner: { marginBottom: 24 },
  greetingText: { letterSpacing: 0.8, marginBottom: 6 },
  dashboardCardFrame: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: 28,
  },
  dashboardCardLeft: { flexDirection: "row", alignItems: "center" },
  textBadgeOverlay: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginRight: 12,
  },
  dashboardTextContainer: { justifyContent: "center" },
  sectionTitle: { letterSpacing: 1.0, marginBottom: 12, paddingLeft: 2 },
  gridContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  gridCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1.5,
    minHeight: 160,
  },
  cardInternalWrapper: {
    padding: 16,
    flex: 1,
    justifyContent: "flex-start",
  },
  inlineStaticLabelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: "flex-start",
    marginBottom: 14,
  },
  cardTitle: { letterSpacing: -0.3, marginBottom: 4 },
  cardDesc: { lineHeight: 16 },
});
