import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  Modal,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";

import { useTheme } from "@/contexts/ThemeContext";

import { ArrowLeft, Mail, Sun, Moon, AlertCircle } from "lucide-react-native";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/api/store";
import { sendOtp } from "@/api/slices/auth.slice";

export default function ForgotPasswordScreen() {
  const { theme, isDark, setMode } = useTheme();
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);

  // Dynamic Alert Bottom Sheet States
  const [alertDialogVisible, setAlertDialogVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const triggerAlertModal = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertDialogVisible(true);
  };

  const handleSend = async () => {
    console.log(
      `[FORGOT PASSWORD] Initiating recovery handshake trace for email structural parameter: ${email}`
    );

    if (!email) {
      triggerAlertModal(
        "Invalid Entry",
        "Please input your registered email address workspace parameters before requesting a secure recovery reset link."
      );
      return;
    }

    setLoading(true);
    try {
      await dispatch(sendOtp({ email })).unwrap();
      console.log(
        "[FORGOT PASSWORD SUCCESS] Target recovery payload matched. Routing user safely onto code entry checks."
      );

      router.push({
        pathname: "/(auth)/otp", // Standardized to match your routing schema
        params: { email, flow: "reset" },
      });
    } catch (err: any) {
      console.error(
        `[FORGOT PASSWORD FAILURE] Identity matching directory exception raised: ${
          err
        }`
      );
      triggerAlertModal(
        "Request Failed",
        err  ||
          "Unable to locate an active delivery terminal matching that specific address framework. Please verify entries and retry."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* BRAND AMBIENT BACKGROUND GLOW GRID */}
      <View
        style={[
          styles.ambientGlow,
          {
            backgroundColor: theme.primary,
            width: width * 0.8,
            height: width * 0.8,
            borderRadius: (width * 0.8) / 2,
            top: -height * 0.1,
            right: -width * 0.1,
            opacity: 0.08,
          },
        ]}
      />

      {/* SYSTEM BAR RUNTIME INTERFACE POSITIONING LAYER */}
      <SafeAreaView
        style={[
          styles.fixedHeaderContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: theme.surface }]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <ArrowLeft size={20} color={theme.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, { backgroundColor: theme.surface }]}
            onPress={() => setMode(isDark ? "light" : "dark")}
            activeOpacity={0.8}
          >
            {isDark ? (
              <Sun size={18} color={theme.primary} />
            ) : (
              <Moon size={18} color={theme.primary} />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* DATA FLOW FRAME SCROLL CONTAINER */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Core Screen Context Headers */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            Reset Password
          </Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Enter your active terminal identifier parameters below to transmit a
            6-digit secure recovery passkey.
          </Text>
        </View>

        {/* Input Interface Block */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textMuted }]}>
              Email Address
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.surface,
                  borderColor: isEmailFocused ? theme.primary : theme.border,
                },
              ]}
            >
              <Mail
                size={18}
                color={theme.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="you@email.com"
                placeholderTextColor={theme.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
              />
            </View>
          </View>

          {/* Action Trigger Button */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: theme.primary }]}
            onPress={handleSend}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Send Recovery Code</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ERROR DRAWER SYSTEM INTEGRATION DIALOG */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={alertDialogVisible}
        onRequestClose={() => setAlertDialogVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setAlertDialogVisible(false)}
          />
          <View
            style={[styles.bottomSheet, { backgroundColor: theme.background }]}
          >
            <View
              style={[styles.dragHandle, { backgroundColor: theme.border }]}
            />

            <View style={styles.errorIconWrapper}>
              <AlertCircle size={56} color="#EF5350" strokeWidth={2} />
            </View>

            <Text style={[styles.sheetTitle, { color: theme.text }]}>
              {alertTitle}
            </Text>

            <Text style={[styles.sheetSubtitle, { color: theme.textMuted }]}>
              {alertMessage}
            </Text>

            <TouchableOpacity
              style={[styles.sheetBtn, { backgroundColor: "#EF5350" }]}
              onPress={() => setAlertDialogVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.sheetBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  ambientGlow: {
    position: "absolute",
    zIndex: 0,
  },
  fixedHeaderContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: Platform.OS === "ios" ? 140 : 110,
  },
  header: {
    marginBottom: 36,
    zIndex: 2,
  },
  title: {
    fontFamily: "RethinkSans-Bold",
    fontSize: 32,
    letterSpacing: -1,
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: "RethinkSans-Regular",
    fontSize: 15,
    lineHeight: 22,
  },
  formContainer: {
    zIndex: 2,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontFamily: "RethinkSans-Medium",
    fontSize: 13,
    marginBottom: 8,
    paddingLeft: 2,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: "100%",
    fontFamily: "RethinkSans-Medium",
    fontSize: 15,
  },
  submitBtn: {
    height: 56,
    borderRadius: 100,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#8E24AA",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
    marginTop: 12,
  },
  submitBtnText: {
    color: "#FFF",
    fontFamily: "RethinkSans-Bold",
    fontSize: 16,
  },
  /* ALERT MODEL SPECIFICATION OVERLAYS */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalDismissArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  bottomSheet: {
    width: "100%",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 44 : 32,
    alignItems: "center",
    zIndex: 2,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    marginBottom: 20,
  },
  errorIconWrapper: {
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: "RethinkSans-Bold",
    fontSize: 24,
    marginBottom: 10,
    textAlign: "center",
  },
  sheetSubtitle: {
    fontFamily: "RethinkSans-Regular",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  sheetBtn: {
    height: 56,
    width: "100%",
    borderRadius: 100,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#EF5350",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  sheetBtnText: {
    color: "#FFF",
    fontFamily: "RethinkSans-Bold",
    fontSize: 16,
  },
});
