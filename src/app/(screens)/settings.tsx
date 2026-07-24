import React from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Platform,
  StatusBar,
  Linking,
} from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import {
  ArrowLeft,
  Shield,
  Moon,
  Sun,
  HelpCircle,
  Info,
  ChevronRight,
} from "lucide-react-native";
import { AppText } from "@/components/AppText";
import { router } from "expo-router";

// Soft pastel chip palette, one tint per row, matching the reference mood
// board's colored icon squares.
const PASTELS = {
  sky: { bg: "#DBEAFE", icon: "#2563EB" },
  lavender: { bg: "#EDE9FE", icon: "#7C3AED" },
  mint: { bg: "#D1FAE5", icon: "#059669" },
  peach: { bg: "#FFE4D6", icon: "#EA580C" },
};

export default function SettingsScreen() {
  const { theme, isDark, setMode } = useTheme();
  const [darkMode, setDarkMode] = React.useState(isDark);

  const pageBg = isDark ? theme.background : "#f4f4f4";
  const cardBg = isDark ? theme.surface : "#FFFFFF";

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    setMode(newMode ? "dark" : "light");
  };

  const handleOpenLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      console.error(`Don't know how to open this URL: ${url}`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: pageBg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: cardBg }]}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={theme.text} />
          </TouchableOpacity>

          <AppText size={19} weight="bold" color={theme.text}>
            Settings
          </AppText>

          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={styles.scrollContentLayout}
        showsVerticalScrollIndicator={false}
      >
        {/* ACCOUNT SECTION */}
        <AppText
          size={12}
          weight="bold"
          color={theme.textMuted}
          style={{
            letterSpacing: 1.2,
            marginBottom: 12,
            paddingHorizontal: 4,
            marginTop: 8,
          }}
        >
          ACCOUNT
        </AppText>

        <View style={[styles.settingsCard, { backgroundColor: cardBg }]}>
          <TouchableOpacity
            style={[styles.settingsRow, { borderBottomWidth: 0 }]}
            activeOpacity={0.7}
          >
            <View
              style={[styles.iconChip, { backgroundColor: PASTELS.sky.bg }]}
            >
              <Shield size={20} color={PASTELS.sky.icon} />
            </View>
            <View style={styles.settingsTextContainer}>
              <AppText size={16} weight="bold" color={theme.text}>
                Privacy & Security
              </AppText>
              <AppText
                size={13}
                color={theme.textMuted}
                style={{ marginTop: 2 }}
              >
                Manage your data and visibility
              </AppText>
            </View>
            <ChevronRight size={20} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* PREFERENCES SECTION */}
        <AppText
          size={12}
          weight="bold"
          color={theme.textMuted}
          style={{
            letterSpacing: 1.2,
            marginBottom: 12,
            paddingHorizontal: 4,
            marginTop: 24,
          }}
        >
          PREFERENCES
        </AppText>

        <View style={[styles.settingsCard, { backgroundColor: cardBg }]}>
          <View style={[styles.settingsRow, { borderBottomWidth: 0 }]}>
            <View
              style={[
                styles.iconChip,
                { backgroundColor: PASTELS.lavender.bg },
              ]}
            >
              {isDark ? (
                <Moon size={20} color={PASTELS.lavender.icon} />
              ) : (
                <Sun size={20} color={PASTELS.lavender.icon} />
              )}
            </View>
            <View style={styles.settingsTextContainer}>
              <AppText size={16} weight="bold" color={theme.text}>
                Dark Mode
              </AppText>
              <AppText
                size={13}
                color={theme.textMuted}
                style={{ marginTop: 2 }}
              >
                Switch between light and dark themes
              </AppText>
            </View>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: "#D1D5DB", true: theme.primary + "80" }}
              thumbColor={darkMode ? theme.primary : "#f4f3f4"}
            />
          </View>
        </View>

        {/* SUPPORT & INFO SECTION */}
        <AppText
          size={12}
          weight="bold"
          color={theme.textMuted}
          style={{
            letterSpacing: 1.2,
            marginBottom: 12,
            paddingHorizontal: 4,
            marginTop: 24,
          }}
        >
          SUPPORT & INFO
        </AppText>

        <View style={[styles.settingsCard, { backgroundColor: cardBg }]}>
          <TouchableOpacity
            style={styles.settingsRow}
            activeOpacity={0.7}
            onPress={() => handleOpenLink("https://www.padimanroute.com")}
          >
            <View
              style={[styles.iconChip, { backgroundColor: PASTELS.mint.bg }]}
            >
              <HelpCircle size={20} color={PASTELS.mint.icon} />
            </View>
            <View style={styles.settingsTextContainer}>
              <AppText size={16} weight="bold" color={theme.text}>
                Help Center
              </AppText>
            </View>
            <ChevronRight size={20} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingsRow, { borderBottomWidth: 0 }]}
            activeOpacity={0.7}
            onPress={() => handleOpenLink("https://www.padimanroute.com")}
          >
            <View
              style={[styles.iconChip, { backgroundColor: PASTELS.peach.bg }]}
            >
              <Info size={20} color={PASTELS.peach.icon} />
            </View>
            <View style={styles.settingsTextContainer}>
              <AppText size={16} weight="bold" color={theme.text}>
                About Padiman Route
              </AppText>
              <AppText
                size={13}
                color={theme.textMuted}
                style={{ marginTop: 2 }}
              >
                v1.2.4 • www.padimanroute.com
              </AppText>
            </View>
            <ChevronRight size={20} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSafeArea: {
    paddingTop: Platform.OS === "ios" ? 10 : StatusBar.currentHeight || 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  mainScrollView: { flex: 1 },
  scrollContentLayout: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 40,
  },

  settingsCard: {
    borderRadius: 24,
    marginBottom: 24,
    overflow: "hidden",
    paddingHorizontal: 6,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  settingsTextContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
});
