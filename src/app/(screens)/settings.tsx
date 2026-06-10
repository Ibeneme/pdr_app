import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Platform,
  StatusBar,
  Linking, // 1. Import Linking
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
import { router } from "expo-router";

export default function SettingsScreen() {
  const { theme, isDark, setMode } = useTheme();
  const [darkMode, setDarkMode] = React.useState(isDark);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    setMode(newMode ? "dark" : "light");
  };

  // 2. Add the URL handler function
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

      <SafeAreaView
        style={[
          styles.headerSafeArea,
          {
            backgroundColor: theme.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[
              styles.iconButton,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <ArrowLeft size={22} color={theme.text} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Settings
          </Text>

          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
          ACCOUNT
        </Text>

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
              <Text style={[styles.settingsLabel, { color: theme.text }]}>
                Privacy & Security
              </Text>
              <Text
                style={[styles.settingsSubtext, { color: theme.textMuted }]}
              >
                Manage your data and visibility
              </Text>
            </View>
            <ChevronRight size={20} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Preferences Section */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
          PREFERENCES
        </Text>

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
              <Text style={[styles.settingsLabel, { color: theme.text }]}>
                Dark Mode
              </Text>
              <Text
                style={[styles.settingsSubtext, { color: theme.textMuted }]}
              >
                Switch between light and dark themes
              </Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: "#767577", true: theme.primary + "80" }}
              thumbColor={darkMode ? theme.primary : "#f4f3f4"}
            />
          </View>
        </View>

        {/* Support & Info */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
          SUPPORT & INFO
        </Text>

        <View
          style={[
            styles.settingsCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          {/* 3. Updated Help Center Click */}
          <TouchableOpacity
            style={styles.settingsRow}
            activeOpacity={0.7}
            onPress={() => handleOpenLink("https://www.padimanroute.com")}
          >
            <View style={styles.iconWrapper}>
              <HelpCircle size={22} color={theme.textMuted} />
            </View>
            <View style={styles.settingsTextContainer}>
              <Text style={[styles.settingsLabel, { color: theme.text }]}>
                Help Center
              </Text>
            </View>
            <ChevronRight size={20} color={theme.textMuted} />
          </TouchableOpacity>

          {/* 4. Updated About/Policy Click */}
          <TouchableOpacity
            style={styles.settingsRow}
            activeOpacity={0.7}
            onPress={() => handleOpenLink("https://www.padimanroute.com")}
          >
            <View style={styles.iconWrapper}>
              <Info size={22} color={theme.textMuted} />
            </View>
            <View style={styles.settingsTextContainer}>
              <Text style={[styles.settingsLabel, { color: theme.text }]}>
                About Padiman Route
              </Text>
              <Text
                style={[styles.settingsSubtext, { color: theme.textMuted }]}
              >
                v1.2.4 • www.padimanroute.com
              </Text>
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
  headerTitle: {
    fontFamily: "RethinkSans-Bold",
    fontSize: 20,
    letterSpacing: -0.6,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontFamily: "RethinkSans-Bold",
    fontSize: 12,
    letterSpacing: 1.5,
    marginBottom: 12,
    marginTop: 8,
  },
  settingsCard: {
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 28,
    overflow: "hidden",
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  iconWrapper: {
    width: 40,
    alignItems: "center",
  },
  settingsTextContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  settingsLabel: {
    fontFamily: "RethinkSans-Medium",
    fontSize: 16,
  },
  settingsSubtext: {
    fontFamily: "RethinkSans-Regular",
    fontSize: 13,
    marginTop: 2,
  },
});
