import React, { useEffect, useRef, useState } from "react";
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
  Animated,
  Easing,
} from "react-native";
import { useRouter } from "expo-router";
import { useDispatch } from "react-redux";
import { useTheme } from "@/contexts/ThemeContext";
import { loginUser } from "@/api/slices/auth.slice";
import { AppDispatch } from "@/api/store";
import {
  ArrowRight,
  Mail,
  Lock,
  Sun,
  Moon,
  AlertCircle,
  MapPin,
  Flag,
} from "lucide-react-native";
import { saveAuthToken, saveUser } from "@/api/secureStore";

export default function SignInScreen() {
  const { theme, isDark, setMode } = useTheme();
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Focus state trackers
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Password Visibility Toggle State
  const [hidePassword, setHidePassword] = useState(true);

  // Dynamic Alert Bottom Sheet States
  const [alertDialogVisible, setAlertDialogVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  // ---- Motion ----
  const entranceAnim = useRef(new Animated.Value(0)).current;
  const emailFocusAnim = useRef(new Animated.Value(0)).current;
  const passwordFocusAnim = useRef(new Animated.Value(0)).current;
  const routeDotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entranceAnim, {
      toValue: 1,
      duration: 480,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(routeDotAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(routeDotAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(600),
      ])
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animateFocus = (anim: Animated.Value, focused: boolean) => {
    Animated.timing(anim, {
      toValue: focused ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false, // color interpolation
    }).start();
  };

  const emailBorderColor = emailFocusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.border, theme.primary],
  });
  const passwordBorderColor = passwordFocusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.border, theme.primary],
  });

  const triggerAlertModal = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertDialogVisible(true);
  };

  const handleSignIn = async () => {
    console.log(
      `[SIGNIN SUBMIT] Attempting credentials authorization handshakes for: ${email}`
    );

    if (!email || !password) {
      triggerAlertModal(
        "Missing Credentials",
        "Please provide both your email address and password parameters before continuing."
      );
      return;
    }

    setLoading(true);
    try {
      const result = await dispatch(loginUser({ email, password })).unwrap();
      console.log(
        "[SIGNIN SUCCESS] Authentication handshake completely verified.",
        result
      );

      if (result && result.token) {
        await saveAuthToken(result.token);
        console.log("[SIGNIN SUCCESS] Token stored successfully");

        if (result.user) {
          await saveUser(result.user);
          console.log(
            "[SIGNIN SUCCESS] User profile saved to secure storage:",
            {
              id: result.user.id,
              fullName: result.user.fullName,
              email: result.user.email,
            }
          );
        } else {
          console.warn("[SIGNIN WARNING] User data missing from response");
        }
      } else {
        console.error("[SIGNIN ERROR] Token missing from server response.");
      }

      router.replace("/(tabs)/home");
    } catch (err: any) {
      console.warn(
        `[SIGNIN REJECTED] Remote backend endpoint parsing failure: ${
          err?.message || err
        }`
      );

      if (
        err === "Account not verified. A new OTP has been sent to your email."
      ) {
        console.log(
          "[SIGNIN REDIRECT] Account unverified status identified. Forwarding user over to OTP portal views."
        );
        router.push({
          pathname: "/(auth)/otp",
          params: { email, flow: "login" },
        });
      } else {
        triggerAlertModal("Authentication Failed", err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* AMBIENT MESH GRAPHIC */}
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

      {/* FIXED TOP NAVIGATION BAR */}
      <SafeAreaView
        style={[
          styles.fixedHeaderContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={[styles.toggleBtn, { backgroundColor: theme.surface }]}
            onPress={() => {
              const nextMode = isDark ? "light" : "dark";
              console.log(
                `[THEME PROFILE CHANGE] Shifting interface display parameters over to: ${nextMode}`
              );
              setMode(nextMode);
            }}
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: entranceAnim,
            transform: [
              {
                translateY: entranceAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 0],
                }),
              },
            ],
          }}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.eyebrowRow}>
              <View
                style={[styles.eyebrowDot, { backgroundColor: theme.primary }]}
              />
              <Text style={[styles.eyebrowText, { color: theme.textMuted }]}>
                PADIMAN ROUTE
              </Text>
            </View>
            <Text style={[styles.welcomeText, { color: theme.text }]}>
              Welcome back
            </Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              Sign in to continue delivering
            </Text>
          </View>

          {/* SIGNATURE: route strip */}
          <View style={styles.routeStrip}>
            <View
              style={[
                styles.routeNodeStart,
                { backgroundColor: theme.primary },
              ]}
            >
              <MapPin size={11} color="#FFF" strokeWidth={2.5} />
            </View>
            <View style={styles.routeLineTrack}>
              <View
                style={[styles.routeLineDashed, { borderColor: theme.border }]}
              />
              <Animated.View
                style={[
                  styles.routeDot,
                  {
                    backgroundColor: theme.primary,
                    transform: [
                      {
                        translateX: routeDotAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 220], // Adjust this translation limit based on track width
                        }),
                      },
                    ],
                  },
                ]}
              />
            </View>
            <View
              style={[
                styles.routeNodeEnd,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Flag size={11} color={theme.primary} strokeWidth={2.5} />
            </View>
          </View>
        </Animated.View>

        {/* Form Structure */}
        <View style={styles.formContainer}>
          {/* Email input field */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textMuted }]}>
              Email address
            </Text>
            <Animated.View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.surface,
                  borderColor: emailBorderColor,
                },
              ]}
            >
              <Mail
                size={18}
                color={isEmailFocused ? theme.primary : theme.textMuted}
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
                onFocus={() => {
                  setIsEmailFocused(true);
                  animateFocus(emailFocusAnim, true);
                }}
                onBlur={() => {
                  setIsEmailFocused(false);
                  animateFocus(emailFocusAnim, false);
                }}
              />
            </Animated.View>
          </View>

          {/* Password input field */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textMuted }]}>
              Password
            </Text>
            <Animated.View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.surface,
                  borderColor: passwordBorderColor,
                },
              ]}
            >
              <Lock
                size={18}
                color={isPasswordFocused ? theme.primary : theme.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="••••••••"
                placeholderTextColor={theme.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={hidePassword}
                onFocus={() => {
                  setIsPasswordFocused(true);
                  animateFocus(passwordFocusAnim, true);
                }}
                onBlur={() => {
                  setIsPasswordFocused(false);
                  animateFocus(passwordFocusAnim, false);
                }}
              />
              <TouchableOpacity
                onPress={() => setHidePassword(!hidePassword)}
                style={styles.toggleVisibilityBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text
                  style={[
                    styles.toggleVisibilityText,
                    { color: theme.primary },
                  ]}
                >
                  {hidePassword ? "Show" : "Hide"}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Forgot Link Button */}
          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => router.push("/(auth)/forgot-password")}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.forgotText, { color: theme.primary }]}>
              Forgot password?
            </Text>
          </TouchableOpacity>

          {/* Action CTA */}
          <TouchableOpacity
            style={[
              styles.signInBtn,
              {
                backgroundColor: theme.primary,
                opacity: loading ? 0.85 : 1,
              },
            ]}
            onPress={handleSignIn}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Text style={styles.signInBtnText}>Sign in</Text>
                <ArrowRight size={16} color="#FFF" strokeWidth={2.5} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer Registration Segment */}
        <View style={styles.footerLink}>
          <Text style={[styles.noAccountText, { color: theme.textMuted }]}>
            Don't have an account?{" "}
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(auth)/sign-up")}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Text style={[styles.createAccountText, { color: theme.primary }]}>
              Create account
            </Text>
          </TouchableOpacity>
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

            <View
              style={[
                styles.errorIconWrapper,
                { backgroundColor: "rgba(239,83,80,0.12)" },
              ]}
            >
              <AlertCircle size={40} color="#EF5350" strokeWidth={2} />
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
              activeOpacity={0.85}
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
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: Platform.OS === "ios" ? 130 : 100,
  },
  header: {
    marginBottom: 20,
    zIndex: 2,
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 7,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  eyebrowText: {
    fontFamily: "RethinkSans-Bold",
    fontSize: 11,
    letterSpacing: 1.6,
  },
  welcomeText: {
    fontFamily: "RethinkSans-Bold",
    fontSize: 32,
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "RethinkSans-Regular",
    fontSize: 15,
    lineHeight: 22,
  },
  routeStrip: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
    zIndex: 2,
  },
  routeNodeStart: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  routeNodeEnd: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  routeLineTrack: {
    flex: 1,
    height: 8,
    marginHorizontal: 8,
    justifyContent: "center",
  },
  routeLineDashed: {
    height: 0,
    borderTopWidth: 1.5,
    borderStyle: "dashed",
  },
  routeDot: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 2.5,
    top: 1.5,
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
    letterSpacing: 0,
  },
  toggleVisibilityBtn: {
    paddingVertical: 10,
    paddingLeft: 10,
  },
  toggleVisibilityText: {
    fontFamily: "RethinkSans-Bold",
    fontSize: 14,
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginBottom: 28,
    paddingVertical: 4,
  },
  forgotText: {
    fontFamily: "RethinkSans-Bold",
    fontSize: 14,
  },
  signInBtn: {
    height: 56,
    borderRadius: 100,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 4,
  },
  signInBtnText: {
    color: "#FFF",
    fontFamily: "RethinkSans-Bold",
    fontSize: 16,
  },
  footerLink: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "auto",
    paddingTop: 40,
  },
  noAccountText: {
    fontFamily: "RethinkSans-Regular",
    fontSize: 14,
  },
  createAccountText: {
    fontFamily: "RethinkSans-Bold",
    fontSize: 14,
  },
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
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: "RethinkSans-Bold",
    fontSize: 22,
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
  },
  sheetBtnText: {
    color: "#FFF",
    fontFamily: "RethinkSans-Bold",
    fontSize: 16,
  },
});
