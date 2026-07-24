import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { AppText } from "@/components/AppText";
import {
  User,
  History,
  Wallet,
  ArrowUpRight,
  Settings,
  HelpCircle,
  LogOut,
  X,
  ChevronRight,
  Sun,
  Moon,
} from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = Math.min(340, SCREEN_WIDTH * 0.82);

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (route: string) => void;
  userName?: string;
  userEmail?: string;
  profileImage?: string | null;
}

// NOTE: these routes must be the *real* paths your router understands.
// handleNavigate hands them straight to onNavigate (or router.push as a
// fallback), so whatever string lives here is exactly what gets pushed.
const NAV_ITEMS = [
  { label: "My Profile", route: "/(screens)/profile", icon: User },
  { label: "Orders & Logs", route: "/(features)/all_requests", icon: History },
  { label: "Wallet", route: "/(screens)/wallet", icon: Wallet },
  { label: "Withdrawals", route: "/(screens)/withdrawal", icon: ArrowUpRight },
  { label: "System Settings", route: "/(screens)/settings", icon: Settings },
];

const SUPPORT_ROUTE = "/(screens)/support";
const LOGOUT_ACTION = "LOGOUT";

export default function SidebarDrawer({
  isOpen,
  onClose,
  onNavigate,
  userName = "Padiman Operator",
  userEmail = "",
  profileImage,
}: SidebarDrawerProps) {
  const { theme: colors, isDark, setMode } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const [isLoading, setIsLoading] = useState(false);

  // Animation
  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 65,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -DRAWER_WIDTH,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  // Closes the drawer first, then hands the route off (either to the
  // parent's onNavigate, or directly to expo-router as a fallback) once the
  // close animation has had time to start — avoids the drawer and the next
  // screen fighting over the same frame.
  const handleNavigate = (route: string) => {
    onClose();
    setTimeout(() => {
      if (onNavigate) {
        onNavigate(route);
      } else {
        router.push(route as any);
      }
    }, 180);
  };

  const handleLogout = () => {
    console.log("Logging out...");
    handleNavigate(LOGOUT_ACTION);
  };

  const getInitials = () => {
    if (!userName) return "PR";
    const parts = userName.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={StyleSheet.absoluteFill}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "rgba(0,0,0,0.45)", opacity: backdropOpacity },
            ]}
          />
        </TouchableWithoutFeedback>

        {/* Drawer */}
        <Animated.View
          style={[
            styles.drawer,
            {
              backgroundColor: colors.background,
              transform: [{ translateX }],
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: "#111318" }]}>
            <View style={styles.headerContent}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatarRing}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : profileImage ? (
                    <Image
                      source={{ uri: profileImage }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <AppText size={18} weight="bold" color="#fff">
                      {getInitials()}
                    </AppText>
                  )}
                </View>
              </View>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X color="#fff" size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.userInfo}>
              <AppText size={17} weight="bold" color="#fff">
                {userName}
              </AppText>
              {userEmail && (
                <AppText size={13} color="rgba(255,255,255,0.6)">
                  {userEmail}
                </AppText>
              )}
            </View>
          </View>

          {/* Menu Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <AppText
              size={11.5}
              weight="bold"
              color={colors.textMuted}
              style={styles.sectionTitle}
            >
              MENU
            </AppText>

            {NAV_ITEMS.map((item) => {
              const IconComponent = item.icon;
              const isActive = pathname === item.route;

              return (
                <TouchableOpacity
                  key={item.route}
                  style={[
                    styles.menuItem,
                    {
                      backgroundColor: colors.surface,
                      borderColor: isActive ? colors.primary : "transparent",
                    },
                  ]}
                  onPress={() => handleNavigate(item.route)}
                  activeOpacity={0.75}
                >
                  <View style={styles.menuItemLeft}>
                    <View
                      style={[
                        styles.iconBox,
                        { backgroundColor: `${colors.text}0D` },
                      ]}
                    >
                      <IconComponent color={colors.text} size={18} />
                    </View>
                    <AppText size={15} weight="semibold" color={colors.text}>
                      {item.label}
                    </AppText>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>
              );
            })}

            {/* Theme Toggle */}
            <TouchableOpacity
              style={[
                styles.menuItem,
                styles.themeToggle,
                { backgroundColor: colors.surface },
              ]}
              onPress={() => setMode(isDark ? "light" : "dark")}
              activeOpacity={0.75}
            >
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: `${colors.text}0D` },
                  ]}
                >
                  {isDark ? (
                    <Sun size={18} color={colors.text} />
                  ) : (
                    <Moon size={18} color={colors.text} />
                  )}
                </View>
                <AppText size={15} weight="semibold" color={colors.text}>
                  {isDark ? "Light Mode" : "Dark Mode"}
                </AppText>
              </View>
            </TouchableOpacity>

            <AppText
              size={11.5}
              weight="bold"
              color={colors.textMuted}
              style={[styles.sectionTitle, { marginTop: 28 }]}
            >
              SUPPORT
            </AppText>

            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: colors.surface }]}
              onPress={() => handleNavigate(SUPPORT_ROUTE)}
              activeOpacity={0.75}
            >
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: `${colors.text}0D` },
                  ]}
                >
                  <HelpCircle color={colors.text} size={18} />
                </View>
                <AppText size={15} weight="semibold" color={colors.text}>
                  Contact Support
                </AppText>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Logout */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <LogOut color="#EF4444" size={20} />
              <AppText
                size={15}
                weight="bold"
                color="#EF4444"
                style={{ marginLeft: 10 }}
              >
                Log Out
              </AppText>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: -6, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 20) + 12 : 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarRing: {
    width: 68,
    height: 68,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.25)",
    padding: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  userInfo: {
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  sectionTitle: {
    paddingHorizontal: 4,
    marginBottom: 10,
    letterSpacing: 0.6,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 999,
    marginBottom: 6,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  themeToggle: {
    marginTop: 8,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingVertical: 18,
    borderRadius: 999,
    marginTop: 32,
  },
});
