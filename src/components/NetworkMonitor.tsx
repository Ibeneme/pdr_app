import React, { useEffect, useState } from "react";
import { Modal, View, StyleSheet, Platform } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { BlurView } from "expo-blur";
import { AppText } from "@/components/AppText";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

export const NetworkMonitor = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const { theme, isDark } = useTheme();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  return (
    // Visible ONLY when NOT connected
    <Modal visible={isConnected === false} transparent animationType="fade">
      <BlurView
        style={StyleSheet.absoluteFill} // Ensures it covers the whole screen
        intensity={Platform.OS === "android" ? 50 : 20} // Android often needs higher intensity
        tint={isDark ? "dark" : "light"}
      >
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: theme.surface }]}>
            <Ionicons name="cloud-offline" size={64} color={theme.primary} />
            <AppText
              size={18}
              weight="bold"
              color={theme.text}
              style={styles.title}
            >
              No Connection
            </AppText>
            <AppText size={14} color={theme.textMuted} style={styles.message}>
              Please check your internet settings and try again.
            </AppText>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end", // Aligns the modal to the bottom
  },
  modal: {
    padding: 30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    alignItems: "center",
    paddingBottom: 50,
    // Ensure the modal has a solid background color to hide content behind it
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  title: { marginTop: 20, marginBottom: 10 },
  message: { textAlign: "center", lineHeight: 20 },
});
