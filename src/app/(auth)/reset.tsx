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
import { useLocalSearchParams, useRouter } from "expo-router";

import { useTheme } from "@/contexts/ThemeContext";
import { ArrowLeft, Lock, Sun, Moon, AlertCircle } from "lucide-react-native";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/api/store";
import { resetPassword } from "@/api/slices/auth.slice";

export default function ResetPasswordScreen() {
  const { theme, isDark, setMode } = useTheme();
  const { width, height } = useWindowDimensions();
  const { email } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  // Field focus status parameters
  const [isPassFocused, setIsPassFocused] = useState(false);
  const [isConfirmFocused, setIsConfirmFocused] = useState(false);

  // Secure entry element visibilities
  const [hidePass, setHidePass] = useState(true);
  const [hideConfirm, setHideConfirm] = useState(true);

  // Dynamic Alert Bottom Sheet States
  const [alertDialogVisible, setAlertDialogVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const triggerAlertModal = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertDialogVisible(true);
  };

  const handleReset = async () => {
    console.log(
      `[PASSWORD RESET] Dispatching security modification sequence for: ${email}`
    );

    if (!pass || !confirm) {
      triggerAlertModal(
        "Required Fields",
        "Please populate both password inputs before finalizing the system override routine."
      );
      return;
    }

    if (pass !== confirm) {
      triggerAlertModal(
        "Mismatched Credentials",
        "The credential signatures provided do not match. Please verify string values and try again."
      );
      return;
    }

    setLoading(true);
    try {
      await dispatch(
        resetPassword({ email, newPassword: pass, confirmPassword: confirm })
      ).unwrap();
      console.log(
        "[PASSWORD RESET SUCCESS] Credentials modified successfully. Purging state cache, routing back to gate."
      );

      router.replace("/(auth)/sign-in");
    } catch (err: any) {
      console.error(
        `[PASSWORD RESET ERROR] Server slice handshake execution failure exception: ${
          err?.message || err
        }`
      );
      triggerAlertModal(
        "Submission Rejected",
        err?.message ||
          "The password reset link has expired or the target server parameters rejected the update packet request."
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
      {/* COHESIVE MESH BACKGROUND BRAND LAYER */}
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

      {/* HEADER CONTROL SHELF PORTAL */}
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

      {/* MAIN DATA INPUT SHEET SCROLL CONTAINER */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            New Credentials
          </Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Establish your updated access key token parameters for the terminal
            identifier{" "}
            <Text style={[styles.emailHighlight, { color: theme.text }]}>
              {email || "account link"}
            </Text>
            .
          </Text>
        </View>

        {/* INPUT STACK INTERACTION SPACE */}
        <View style={styles.formContainer}>
          {/* New Password input field */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textMuted }]}>
              New Password
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.surface,
                  borderColor: isPassFocused ? theme.primary : theme.border,
                },
              ]}
            >
              <Lock
                size={18}
                color={theme.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="••••••••"
                placeholderTextColor={theme.textMuted}
                value={pass}
                onChangeText={setPass}
                secureTextEntry={hidePass}
                onFocus={() => setIsPassFocused(true)}
                onBlur={() => setIsPassFocused(false)}
              />
              <TouchableOpacity
                onPress={() => setHidePass(!hidePass)}
                style={styles.toggleVisibilityBtn}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.toggleVisibilityText,
                    { color: theme.primary },
                  ]}
                >
                  {hidePass ? "Show" : "Hide"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password input field */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textMuted }]}>
              Confirm New Password
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.surface,
                  borderColor: isConfirmFocused ? theme.primary : theme.border,
                },
              ]}
            >
              <Lock
                size={18}
                color={theme.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="••••••••"
                placeholderTextColor={theme.textMuted}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={hideConfirm}
                onFocus={() => setIsConfirmFocused(true)}
                onBlur={() => setIsConfirmFocused(false)}
              />
              <TouchableOpacity
                onPress={() => setHideConfirm(!hideConfirm)}
                style={styles.toggleVisibilityBtn}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.toggleVisibilityText,
                    { color: theme.primary },
                  ]}
                >
                  {hideConfirm ? "Show" : "Hide"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Call to Action Execute Trigger */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: theme.primary }]}
            onPress={handleReset}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* REUSABLE SHEET OVERLAY DIALOG ARCHITECTURE */}
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
  emailHighlight: {
    fontFamily: "RethinkSans-Medium",
  },
  formContainer: {
    zIndex: 2,
  },
  inputGroup: {
    marginBottom: 20,
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
  toggleVisibilityBtn: {
    paddingVertical: 10,
    paddingLeft: 10,
  },
  toggleVisibilityText: {
    fontFamily: "RethinkSans-Bold",
    fontSize: 14,
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
    marginTop: 16,
  },
  submitBtnText: {
    color: "#FFF",
    fontFamily: "RethinkSans-Bold",
    fontSize: 16,
  },
  /* MODAL MODELLING DESIGN DECOR */
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
