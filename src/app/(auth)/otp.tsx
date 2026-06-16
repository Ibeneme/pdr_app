import React, { useState, useEffect } from "react";
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
import { useRouter, useLocalSearchParams } from "expo-router";
import { useDispatch } from "react-redux";
import { useTheme } from "@/contexts/ThemeContext";
import { verifyOtp, sendOtp } from "@/api/slices/auth.slice";
import { AppDispatch } from "@/api/store";
import { ArrowLeft, Sun, Moon, AlertCircle } from "lucide-react-native";

export default function OtpVerificationScreen() {
  const { theme, isDark, setMode } = useTheme();
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { email, flow } = useLocalSearchParams();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(false);

  // Timer Configuration States
  const [canResend, setCanResend] = useState(false);
  const [timer, setTimer] = useState(120);

  // Dynamic Alert Bottom Sheet States
  const [alertDialogVisible, setAlertDialogVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const triggerAlertModal = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertDialogVisible(true);
  };

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleVerify = async () => {
    console.log(`[OTP SUBMIT] Initiating verification sequence: ${otp}`);
    if (!otp || otp.length < 6) {
      triggerAlertModal(
        "Incomplete Code",
        "Please input the complete 6-digit confirmation code sequences dispatched to your terminal email address."
      );
      return;
    }

    setLoading(true);
    try {
      await dispatch(verifyOtp({ email, otp })).unwrap();
      console.log(
        "[OTP SUCCESS] Handshake accepted over client-server layout registry."
      );

      if (flow === "reset") {
        router.replace({ pathname: "/(auth)/reset", params: { email } });
      } else if (flow === "login") {
        router.replace("/(tabs)/home");
      } else {
        router.push("/(auth)/sign-in");
      }
    } catch (err) {
      console.error(
        "[OTP ERROR] Verification exception frameworks rejected code packet."
      );
      triggerAlertModal(
        "Verification Failed",
        "The security passkey code provided is invalid or has expired. Please check your mailbox records and retry."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await dispatch(sendOtp({ email })).unwrap();
      setTimer(120);
      setCanResend(false);
      triggerAlertModal(
        "OTP Resend Successful",
        "A fresh security passkey layout code has been forwarded to your terminal inbox destination successfully."
      );
    } catch (error) {
      triggerAlertModal(
        "OTP Resend Failed",
        "Failed to dispatch passkey framework code. Please check network connectivity parameters and try again."
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
      {/* COHESIVE BRAND BACKGROUND LAYER */}
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

      {/* FIXED TOP NAVIGATION BAR WITH SAFEAREAVIEW CONTAINER */}
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

      {/* BODY CONTENT SCROLL CONTAINER */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Title Block - Anchored cleanly to upper layout bounds */}
        {/* Header Title Block - Anchored cleanly to upper layout bounds */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Verify Code</Text>

          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            We sent a code to{" "}
            <Text
              style={[
                styles.emailHighlight,
                { color: theme.text, fontWeight: "600" },
              ]}
            >
              {email || "your email address"}
            </Text>
          </Text>

          <Text
            style={{
              color: theme.textMuted,
              fontSize: 14.5,
              marginTop: 8,
              fontWeight: "500",
          //    textAlign: "center",
              lineHeight: 22,
             // paddingHorizontal: 10, // Better wrapping on small screens
            }}
          >
            Please check your inbox and{" "}
            <Text style={{ color: theme.primary, fontWeight: "600" }}>
              spam/junk folder
            </Text>
            .
          </Text>
        </View>
        {/* Input Interactive Framework Block */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textMuted }]}>
              Secure Passkey Code
            </Text>
            <TextInput
              style={[
                styles.otpInput,
                {
                  backgroundColor: theme.surface,
                  color: theme.text,
                  borderColor: focusedField ? theme.primary : theme.border,
                },
              ]}
              placeholder="000000"
              placeholderTextColor={theme.textMuted}
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
              onFocus={() => setFocusedField(true)}
              onBlur={() => setFocusedField(false)}
            />
          </View>

          {/* Core Action Verify Button Trigger */}
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: theme.primary }]}
            onPress={handleVerify}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.btnText}>Verify Code</Text>
            )}
          </TouchableOpacity>

          {/* Inline Integrated Resend/Timer Content Footer Segment */}
          <View style={styles.resendContainer}>
            {!canResend ? (
              <Text style={[styles.timerText, { color: theme.textMuted }]}>
                Resend code in{" "}
                <Text style={[styles.timerCountdown, { color: theme.text }]}>
                  {Math.floor(timer / 60)}:
                  {(timer % 60).toString().padStart(2, "0")}
                </Text>
              </Text>
            ) : (
              <View style={styles.linkActionWrapper}>
                <Text style={[styles.timerText, { color: theme.textMuted }]}>
                  Didn't receive code?{" "}
                </Text>
                <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
                  <Text
                    style={[styles.resendLinkAction, { color: theme.primary }]}
                  >
                    Resend OTP
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* REUSABLE ERROR / WARNING GENERIC ALERT BOTTOM SHEET MODAL */}
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
              <AlertCircle size={56} color={theme.primary} strokeWidth={2} />
            </View>

            <Text style={[styles.sheetTitle, { color: theme.text }]}>
              {alertTitle}
            </Text>

            <Text style={[styles.sheetSubtitle, { color: theme.textMuted }]}>
              {alertMessage}
            </Text>

            <TouchableOpacity
              style={[styles.sheetBtn, { backgroundColor: theme.primary }]}
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
  form: {
    zIndex: 2,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontFamily: "RethinkSans-Medium",
    fontSize: 13,
    marginBottom: 10,
    paddingLeft: 2,
  },
  otpInput: {
    height: 64,
    borderRadius: 16,
    borderWidth: 1.5,
    textAlign: "center",
    fontSize: 26,
    fontFamily: "RethinkSans-Bold",
    letterSpacing: 8,
  },
  btn: {
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
    marginBottom: 32,
  },
  btnText: {
    color: "#FFF",
    fontFamily: "RethinkSans-Bold",
    fontSize: 16,
  },
  resendContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  linkActionWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  timerText: {
    fontFamily: "RethinkSans-Regular",
    fontSize: 14,
  },
  timerCountdown: {
    fontFamily: "RethinkSans-Bold",
  },
  resendLinkAction: {
    fontFamily: "RethinkSans-Bold",
    fontSize: 14,
  },
  /* MODAL ALERT DRAWER SYSTEM STYLING */
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
