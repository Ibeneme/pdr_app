import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  Platform,
  StatusBar,
  useWindowDimensions,
  ActivityIndicator,
  Image,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
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
import { AppDispatch, RootState } from "@/api/store";
import { clearUser, getProfile } from "@/api/slices/user.slice";
import { removeAuthToken } from "@/api/secureStore";
import { logout } from "@/api/slices/auth.slice";

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
}

export default function SidebarDrawer({
  isOpen,
  onClose,
  onNavigate,
}: SidebarDrawerProps) {
  const { theme: colors, isDark, setMode } = useTheme();
  const { width } = useWindowDimensions();

  const dispatch = useDispatch<AppDispatch>();
  const { profile } = useSelector((state: RootState) => state.user);

  // Local State for Loading Profile
  const [isLoading, setIsLoading] = useState(false);

  // Fetch profile when drawer opens
  useEffect(() => {
    if (isOpen && !profile) {
      setIsLoading(true);
      dispatch(getProfile())
        .unwrap()
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, profile, dispatch]);

  // Compute initials for the avatar placeholder layout block
  const getInitials = () => {
    if (!profile?.fullName) return "PR";

    const nameParts = profile.fullName.trim().split(" ");

    if (nameParts.length === 1) {
      return nameParts[0].substring(0, 2).toUpperCase();
    }

    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  };

  const hasProfileImage = !!profile?.profileImage;

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={isOpen}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlayContainer}>
        {/* Dismissal Click Area Backdrop curtain */}
        <TouchableOpacity
          style={styles.backdropClickArea}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.sidebarMenuPanel,
            { backgroundColor: colors.background, width: width * 0.78 },
          ]}
        >
          {/* Header Block featuring Operator Metadata Profiles */}
          <SafeAreaView
            style={[
              styles.drawerHeaderContainer,
              {
                backgroundColor: colors.surface,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <View style={styles.drawerHeaderProfileRow}>
              <View
                style={[
                  styles.avatarTextBadgePlaceholder,
                  { backgroundColor: colors.primary },
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : hasProfileImage ? (
                  <Image
                    source={{ uri: profile.profileImage }}
                    style={styles.avatarImageThumbnail}
                  />
                ) : (
                  <AppText size={16} weight="bold" color="#FFF">
                    {getInitials()}
                  </AppText>
                )}
              </View>

              <TouchableOpacity
                onPress={onClose}
                style={[
                  styles.closeDrawerBtn,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
                activeOpacity={0.7}
              >
                <X color={colors.text} size={18} />
              </TouchableOpacity>
            </View>

            <View style={styles.userMetaTextContainer}>
              <AppText
                size={16}
                weight="bold"
                color={colors.text}
                numberOfLines={1}
              >
                {isLoading
                  ? "Loading profile..."
                  : profile?.fullName || "Padiman Operator"}
              </AppText>
              <AppText
                size={12}
                color={colors.textMuted}
                numberOfLines={1}
                style={{ marginTop: 2 }}
              >
                {isLoading
                  ? "Fetching details..."
                  : profile?.email || "No credentials found"}
              </AppText>
            </View>
          </SafeAreaView>

          {/* Structured Navigation Lists */}
          <ScrollView
            style={styles.sidebarLinkScroller}
            showsVerticalScrollIndicator={false}
          >
            {[
              { label: "My Profile", route: "PROFILE", icon: User },
              { label: "Orders & Logs", route: "HISTORY", icon: History },
              { label: "Wallet Core", route: "WALLET", icon: Wallet },
              {
                label: "Withdrawals",
                route: "WITHDRAWALS",
                icon: ArrowUpRight,
              },
              { label: "System Settings", route: "SETTINGS", icon: Settings },
              { label: "Support Terminal", route: "SUPPORT", icon: HelpCircle },
            ].map((item, index) => {
              const IconComponent = item.icon;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.sidebarLinkRow,
                    { borderBottomColor: colors.border },
                  ]}
                  onPress={() => onNavigate(item.route)}
                  activeOpacity={0.7}
                >
                  <View style={styles.sidebarLinkLeft}>
                    <IconComponent
                      color={colors.textMuted}
                      size={20}
                      style={styles.sidebarLinkIcon}
                    />
                    <AppText size={14} weight="medium" color={colors.text}>
                      {item.label}
                    </AppText>
                  </View>
                  <ChevronRight color={colors.border} size={16} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Bottom Controls Footnote Row */}
          <View
            style={[
              styles.sidebarFooterControl,
              {
                borderTopColor: colors.border,
                backgroundColor: colors.surface,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.themeRowToggle,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setMode(isDark ? "light" : "dark")}
              activeOpacity={0.8}
            >
              <View style={styles.sidebarLinkLeft}>
                {isDark ? (
                  <Sun size={18} color={colors.textMuted} />
                ) : (
                  <Moon size={18} color={colors.textMuted} />
                )}
                <AppText
                  size={13}
                  weight="medium"
                  color={colors.text}
                  style={{ marginLeft: 10 }}
                >
                  Interface Mode
                </AppText>
              </View>
              <AppText size={11} weight="bold" color={colors.primary}>
                {isDark ? "LIGHT" : "DARK"}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.logOutButton,
                { backgroundColor: isDark ? "rgba(239,68,68,0.1)" : "#FEF2F2" },
              ]}
              onPress={async () => {
                await removeAuthToken();
                dispatch(logout());
                dispatch(clearUser());
              }}
              activeOpacity={0.8}
            >
              <LogOut color="#EF4444" size={18} style={{ marginRight: 8 }} />
              <AppText size={14} weight="bold" color="#EF4444">
                Log Out Session
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlayContainer: {
    flex: 1,
    flexDirection: "row-reverse",
    backgroundColor: "rgba(0, 0, 0, 0.40)",
  },
  backdropClickArea: {
    flex: 1,
  },
  sidebarMenuPanel: {
    height: "100%",
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  drawerHeaderContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    paddingTop:
      Platform.OS === "android"
        ? StatusBar.currentHeight
          ? StatusBar.currentHeight + 24
          : 32
        : 20,
  },
  drawerHeaderProfileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  avatarTextBadgePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImageThumbnail: {
    width: 48,
    height: 48,
    resizeMode: "cover",
  },
  closeDrawerBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  userMetaTextContainer: {
    width: "100%",
    paddingLeft: 16,
    paddingBottom: 32,
  },
  sidebarLinkScroller: {
    flex: 1,
    paddingTop: 12,
    paddingHorizontal: 8,
  },
  sidebarLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  sidebarLinkLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  sidebarLinkIcon: {
    marginRight: 14,
  },
  sidebarFooterControl: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    borderTopWidth: 1,
    paddingTop: 16,
  },
  themeRowToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  logOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 14,
    marginTop: 2,
  },
});
