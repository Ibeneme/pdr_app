import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
} from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { router } from "expo-router";
import { AppText } from "@/components/AppText";

export default function NotificationsScreen() {
  const { theme: colors, isDark } = useTheme();

  const [notifications] = useState([
    {
      id: 1,
      type: "ROUTE",
      title: "Ride Request Accepted",
      message: "Adebayo accepted your offer to join from GRA to Diobu",
      time: "2 min ago",
      read: false,
    },
    {
      id: 2,
      type: "WALLET",
      title: "Payment Received",
      message: "₦4,500 has been credited to your wallet for ride from Woji",
      time: "18 min ago",
      read: false,
    },
    {
      id: 3,
      type: "DISPATCH",
      title: "Parcel Delivered",
      message:
        "Your parcel to Choba was successfully delivered by rider Kelechi",
      time: "1 hr ago",
      read: true,
    },
    {
      id: 4,
      type: "ESCROW",
      title: "Withdrawal Successful",
      message: "₦25,000 withdrawal to your GTBank account was processed",
      time: "Yesterday",
      read: true,
    },
    {
      id: 5,
      type: "ROUTE",
      title: "New Ride Offer Near You",
      message: "Someone is offering a ride from Port Harcourt Town to Elelenwo",
      time: "Yesterday",
      read: true,
    },
    {
      id: 6,
      type: "SYSTEM",
      title: "Account Verified",
      message: "Your rider profile has been successfully verified",
      time: "2 days ago",
      read: true,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* --- HEADER DOCK CONTAINER --- */}
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

          <View style={{ width: 62 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* --- SYSTEM LOG ENTRIES STACK --- */}
        {notifications.map((notif, index) => (
          <View
            key={index}
            style={[
              styles.notificationCardFrame,
              {
                backgroundColor: colors.surface,
                borderColor: notif.read ? colors.border : colors.primary,
                borderWidth: notif.read ? 1 : 1.5,
              },
            ]}
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
                  {notif.type}
                </AppText>
              </View>
              <AppText size={11} weight="medium" color={colors.textMuted}>
                {notif.time}
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
                {notif.message}
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
          </View>
        ))}

        {/* --- HISTORICAL LOG LOADING TRIGGER --- */}
        <TouchableOpacity
          style={styles.loadOlderLogsActionBtn}
          activeOpacity={0.7}
        >
          <AppText size={14} weight="bold" color={colors.primary}>
            Fetch Historical Manifest Runs
          </AppText>
        </TouchableOpacity>
      </ScrollView>
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
  loadOlderLogsActionBtn: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
