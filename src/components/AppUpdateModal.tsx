import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  StyleSheet,
  Platform,
  Linking,
  TouchableOpacity,
  BackHandler,
} from "react-native";
import { BlurView } from "expo-blur";
import { AppText } from "@/components/AppText";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import axiosInstance from "@/api/axiosInstance";

export const AppUpdateModal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const { theme, isDark } = useTheme();

  useEffect(() => {
    // 1. Fetch update status
    axiosInstance
      .get("/padiman_route/user/app-updates")
      .then((response) => {
        const { data } = response.data;
        // Check if there is an update available
        if (data && data.isUpdateAvailable) {
          setUpdateInfo(data);
          setIsVisible(true);
        }
      })
      .catch((err) => {
        console.error("Failed to check for updates:", err);
      });
  }, []);

  // 2. Prevent Android Back Button from closing the modal ONLY if forceUpdate is true
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (isVisible && updateInfo?.forceUpdate) {
          return true; // Block back button
        }
        return false; // Allow closing if not forced
      }
    );

    return () => backHandler.remove();
  }, [isVisible, updateInfo]);

  const handleUpdate = () => {
    if (updateInfo?.links) {
      const link = Platform.select({
        ios: updateInfo.links.ios,
        android: updateInfo.links.android,
      });
      if (link) Linking.openURL(link);
    }
  };

  if (!isVisible || !updateInfo) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <BlurView
        style={StyleSheet.absoluteFill}
        intensity={Platform.OS === "android" ? 70 : 30}
        tint={isDark ? "dark" : "light"}
      >
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: theme.surface }]}>
            <Ionicons
              name="cloud-download-outline"
              size={64}
              color={theme.primary}
            />

            <AppText
              size={20}
              weight="bold"
              color={theme.text}
              style={styles.title}
            >
              {updateInfo.forceUpdate ? "Update Required" : "Update Available"}
            </AppText>

            <AppText size={16} color={theme.text} style={styles.version}>
              New Version: {updateInfo.latestVersion}
            </AppText>

            <AppText size={14} color={theme.textMuted} style={styles.changelog}>
              {updateInfo.updateDescription}
            </AppText>

            <View style={styles.buttonContainer}>
              {/* Only show "Later" if it is NOT a forced update */}
              {!updateInfo.forceUpdate && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setIsVisible(false)}
                  style={[
                    styles.button,
                    styles.outlineButton,
                    { borderColor: theme.border },
                  ]}
                >
                  <AppText size={15} weight="bold" color={theme.textMuted}>
                    Later
                  </AppText>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleUpdate}
                style={[styles.button, { backgroundColor: theme.primary }]}
              >
                <AppText size={15} weight="bold" color="#FFF">
                  Update Now
                </AppText>
              </TouchableOpacity>
            </View>

            {updateInfo.forceUpdate && (
              <AppText
                size={13}
                color={theme.textMuted}
                style={styles.required}
              >
                This update is mandatory to continue using the app.
              </AppText>
            )}
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    padding: 30,
    alignItems: "center",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  title: { marginTop: 16, marginBottom: 4 },
  version: { marginBottom: 20 },
  changelog: { textAlign: "center", lineHeight: 22, marginBottom: 28 },
  buttonContainer: { flexDirection: "row", gap: 12, width: "100%" },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  outlineButton: {
    borderWidth: 1,
    backgroundColor: "transparent",
    
  },
  required: { marginTop: 16, textAlign: "center" },
});
