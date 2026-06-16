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
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

export default function SettingsScreen() {
  const { theme, isDark, setMode } = useTheme();
  const [darkMode, setDarkMode] = React.useState(isDark);

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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* PREMIUM HEADER GRADIENT */}
      <LinearGradient
        colors={isDark ? ["#2A1B4D", theme.surface] : ["#F8F5FF", "#FFFFFF"]}
        style={styles.headerGradient}
      >
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <ArrowLeft size={24} color={theme.text} />
            </TouchableOpacity>

            <AppText size={20} weight="bold" color={theme.text}>
              Settings
            </AppText>

            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

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

        <View
          style={[
            styles.settingsCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
            <View style={styles.iconWrapper}>
              <Shield size={22} color={theme.textMuted} />
            </View>
            <View style={styles.settingsTextContainer}>
              <AppText size={16} weight="medium" color={theme.text}>
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

        <View
          style={[
            styles.settingsCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.settingsRow}>
            <View style={styles.iconWrapper}>
              {isDark ? (
                <Moon size={22} color={theme.textMuted} />
              ) : (
                <Sun size={22} color={theme.textMuted} />
              )}
            </View>
            <View style={styles.settingsTextContainer}>
              <AppText size={16} weight="medium" color={theme.text}>
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
              trackColor={{ false: "#767577", true: theme.primary + "80" }}
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

        <View
          style={[
            styles.settingsCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <TouchableOpacity
            style={styles.settingsRow}
            activeOpacity={0.7}
            onPress={() => handleOpenLink("https://www.padimanroute.com")}
          >
            <View style={styles.iconWrapper}>
              <HelpCircle size={22} color={theme.textMuted} />
            </View>
            <View style={styles.settingsTextContainer}>
              <AppText size={16} weight="medium" color={theme.text}>
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
            <View style={styles.iconWrapper}>
              <Info size={22} color={theme.textMuted} />
            </View>
            <View style={styles.settingsTextContainer}>
              <AppText size={16} weight="medium" color={theme.text}>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 8 },

  mainScrollView: { flex: 1 },
  scrollContentLayout: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 40,
  },

  settingsCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    marginBottom: 28,
    overflow: "hidden",
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
  
  },
  iconWrapper: {
    width: 40,
    alignItems: "center",
  },
  settingsTextContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
});
