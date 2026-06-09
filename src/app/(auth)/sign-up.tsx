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
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import {
  User,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  Sun,
  Moon,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  Search,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { registerUser } from "@/api/slices/auth.slice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/api/store";

// Define Country Interface for the Code Selector
interface Country {
  code: string;
  flag: string;
  dialCode: string;
  name: string;
}

const COUNTRIES: Country[] = [
  { code: "US", flag: "🇺🇸", dialCode: "+1", name: "United States" },
  { code: "GB", flag: "🇬🇧", dialCode: "+44", name: "United Kingdom" },
  { code: "NG", flag: "🇳🇬", dialCode: "+234", name: "Nigeria" },
  { code: "GH", flag: "🇬🇭", dialCode: "+233", name: "Ghana" },
  { code: "ZA", flag: "🇿🇦", dialCode: "+27", name: "South Africa" },
  { code: "PL", flag: "🇵🇱", dialCode: "+48", name: "Poland" },
  { code: "CA", flag: "🇨🇦", dialCode: "+1", name: "Canada" },
  { code: "CN", flag: "🇨🇳", dialCode: "+86", name: "China" },
  { code: "KE", flag: "🇰🇪", dialCode: "+254", name: "Kenya" },
  { code: "EG", flag: "🇪🇬", dialCode: "+20", name: "Egypt" },
  { code: "DE", flag: "🇩🇪", dialCode: "+49", name: "Germany" },
  { code: "FR", flag: "🇫🇷", dialCode: "+33", name: "France" },
];

export default function SignUpScreen() {
  const { theme, isDark, setMode } = useTheme();
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referral, setReferral] = useState("");
  const [loading, setLoading] = useState(false);

  // Country Code State Elements
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[2]); // Defaults to Nigeria
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Dynamic Alert Bottom Sheet States (Replaces old alert popups)
  const [alertDialogVisible, setAlertDialogVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  // Success Bottom Sheet visibility control toggle state
  const [successSheetVisible, setSuccessSheetVisible] = useState(false);

  // Layout Focus State Registries
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Password Visibility Toggle States
  const [hidePassword, setHidePassword] = useState(true);
  const [hideConfirmPassword, setHideConfirmPassword] = useState(true);

  // Filter countries list based on search bar input query matching name or dial code
  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.dialCode.includes(searchQuery)
  );

  // Helper trigger to dynamically feed and deploy the Bottom Sheet Alert Engine
  const triggerAlertModal = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertDialogVisible(true);
  };

  const handleCreateAccount = async () => {
    console.log("[SIGNUP SUBMIT] Validation process initiated.");

    // 1. Validation Logic
    if (!fullName || !phone || !email || !password || !confirmPassword) {
      triggerAlertModal(
        "Missing Information",
        "Please fill in all required fields."
      );
      return;
    }

    if (password !== confirmPassword) {
      triggerAlertModal(
        "Password Mismatch",
        "Passwords do not match. Please try again."
      );
      return;
    }

    setLoading(true);
    console.log("[SIGNUP REQUEST] Contacting backend systems...");

    try {
      // 2. Dispatch the Redux action
      // We combine dial code and phone here
      const fullPhone = `${selectedCountry.dialCode}${phone}`;

      const resultAction = await dispatch(
        registerUser({
          fullName,
          phone: fullPhone,
          email,
          password,
          referralCode: referral,
        })
      ).unwrap();

      // 3. Success Flow
      console.log("[SIGNUP SUCCESS] Account created. Redirecting to OTP...");

      router.replace({
        pathname: "/(auth)/otp",
        params: { email: email, flow: "register" },
      });
    } catch (error: any) {
      console.error(`[SIGNUP FAILED] ${error || "Unknown error"} ${error}`);
      triggerAlertModal("Signup Failed", error || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToSignIn = () => {
    console.log(
      "[NAVIGATION] Redirecting user interface profile focus over to sign-in terminal window view."
    );
    setSuccessSheetVisible(false);
    router.replace({
      pathname: "/(auth)/otp",
      params: { email: email }, // Passing the email here
    });
  };

  const getBorderColor = (fieldName: string) => {
    return focusedField === fieldName ? theme.primary : theme.border;
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
            onPress={() => {
              console.log(
                "[NAVIGATION] Back button triggered by interactive tap action."
              );
              router.back();
            }}
            activeOpacity={0.8}
          >
            <ArrowLeft size={20} color={theme.text} />
          </TouchableOpacity>

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

      {/* BODY CONTENT SCROLL CONTAINER */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Component */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            Create Account
          </Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Join Padiman Route and start delivering today
          </Text>
        </View>

        {/* Form Input Elements */}
        <View style={styles.form}>
          {/* Full Name field */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textMuted }]}>
              Full Name
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.surface,
                  borderColor: getBorderColor("name"),
                },
              ]}
            >
              <User size={18} color={theme.textMuted} style={styles.icon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="John Doe"
                placeholderTextColor={theme.textMuted}
                value={fullName}
                onChangeText={(val) => {
                  setFullName(val);
                  console.log(
                    `[INPUT DISPATCH] fullName field payload modification tracked: ${val}`
                  );
                }}
                onFocus={() => setFocusedField("name")}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>

          {/* Phone Number field with Dropdown Selector */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textMuted }]}>
              Phone Number
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.surface,
                  borderColor: getBorderColor("phone"),
                },
              ]}
            >
              <TouchableOpacity
                style={styles.countryPickerButton}
                onPress={() => {
                  console.log(
                    "[COUNTRY MODAL ENGINE] Displaying bottom drawer layout selector frame."
                  );
                  setSearchQuery("");
                  setCountryModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.flag}>{selectedCountry.flag}</Text>
                <Text style={[styles.dialCode, { color: theme.text }]}>
                  {selectedCountry.dialCode}
                </Text>
                <ChevronDown size={14} color={theme.textMuted} />
              </TouchableOpacity>

              <View
                style={[styles.divider, { backgroundColor: theme.border }]}
              />

              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="8012345678"
                placeholderTextColor={theme.textMuted}
                value={phone}
                onChangeText={(val) => {
                  setPhone(val);
                  console.log(
                    `[INPUT DISPATCH] phone field dynamic updates captured: ${val}`
                  );
                }}
                keyboardType="phone-pad"
                onFocus={() => setFocusedField("phone")}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>

          {/* Email address field */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textMuted }]}>
              Email Address
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.surface,
                  borderColor: getBorderColor("email"),
                },
              ]}
            >
              <Mail size={18} color={theme.textMuted} style={styles.icon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="you@email.com"
                placeholderTextColor={theme.textMuted}
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  console.log(
                    `[INPUT DISPATCH] email value trace tracking updated: ${val}`
                  );
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>

          {/* Password field */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textMuted }]}>
              Password
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.surface,
                  borderColor: getBorderColor("password"),
                },
              ]}
            >
              <Lock size={18} color={theme.textMuted} style={styles.icon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Create password"
                placeholderTextColor={theme.textMuted}
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  console.log(
                    "[INPUT DISPATCH] password security array payload values updated safely."
                  );
                }}
                secureTextEntry={hidePassword}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
              />
              <TouchableOpacity
                onPress={() => {
                  console.log(
                    `[SECURITY ENCRYPTION SWITCH] Password text obscure mode flipped to: ${!hidePassword}`
                  );
                  setHidePassword(!hidePassword);
                }}
                style={styles.toggleVisibilityBtn}
                activeOpacity={0.7}
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
            </View>
          </View>

          {/* Confirm Password field */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textMuted }]}>
              Confirm Password
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.surface,
                  borderColor: getBorderColor("confirmPassword"),
                },
              ]}
            >
              <Lock size={18} color={theme.textMuted} style={styles.icon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Confirm password"
                placeholderTextColor={theme.textMuted}
                value={confirmPassword}
                onChangeText={(val) => {
                  setConfirmPassword(val);
                  console.log(
                    "[INPUT DISPATCH] confirmPassword protection array parameters matching."
                  );
                }}
                secureTextEntry={hideConfirmPassword}
                onFocus={() => setFocusedField("confirmPassword")}
                onBlur={() => setFocusedField(null)}
              />
              <TouchableOpacity
                onPress={() => {
                  console.log(
                    `[SECURITY ENCRYPTION SWITCH] Confirm password toggle switched to: ${!hideConfirmPassword}`
                  );
                  setHideConfirmPassword(!hideConfirmPassword);
                }}
                style={styles.toggleVisibilityBtn}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.toggleVisibilityText,
                    { color: theme.primary },
                  ]}
                >
                  {hideConfirmPassword ? "Show" : "Hide"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Referral Code field */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textMuted }]}>
              Referral Code (Optional)
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.surface,
                  borderColor: getBorderColor("referral"),
                  paddingLeft: 20,
                },
              ]}
            >
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter referral code"
                placeholderTextColor={theme.textMuted}
                value={referral}
                onChangeText={(val) => {
                  setReferral(val);
                  console.log(
                    `[INPUT DISPATCH] referral input context string logs captured: ${val}`
                  );
                }}
                autoCapitalize="none"
                onFocus={() => setFocusedField("referral")}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[
              styles.btn,
              { backgroundColor: theme.primary, marginTop: 12 },
            ]}
            onPress={handleCreateAccount}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Text style={styles.btnText}>Create Account</Text>
                <ArrowRight size={16} color="#FFF" strokeWidth={3} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer Routing Element */}
        <View style={styles.footerLink}>
          <Text style={[styles.noAccountText, { color: theme.textMuted }]}>
            Already have an account?{" "}
          </Text>
          <TouchableOpacity
            onPress={() => {
              console.log(
                "[NAVIGATION] Rerouting display coordinates back towards existing user signIn screens."
              );
              router.push("/(auth)/sign-in");
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.linkText, { color: theme.primary }]}>
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* COUNTRY CODE PICKER SLIDING BOTTOM SHEET MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={countryModalVisible}
        onRequestClose={() => {
          console.log(
            "[COUNTRY MODAL ENGINE] Overlay closed down via device dismiss triggers."
          );
          setCountryModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => {
              console.log(
                "[COUNTRY MODAL ENGINE] Closing layout canvas window on tap backdrop coordinates."
              );
              setCountryModalVisible(false);
            }}
          />
          <View
            style={[
              styles.bottomSheet,
              { backgroundColor: theme.background, height: height * 0.75 },
            ]}
          >
            <View
              style={[styles.dragHandle, { backgroundColor: theme.border }]}
            />

            <Text
              style={[
                styles.sheetTitle,
                {
                  color: theme.text,
                  alignSelf: "flex-start",
                  paddingHorizontal: 4,
                },
              ]}
            >
              Select Country Code
            </Text>

            {/* SEARCH CONTAINER VIEWBOX */}
            <View
              style={[
                styles.searchContainer,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Search
                size={18}
                color={theme.textMuted}
                style={styles.searchIcon}
              />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search country name or code..."
                placeholderTextColor={theme.textMuted}
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  console.log(
                    `[COUNTRY SEARCH ENGINE] Query string input updated: "${text}". Matches discovered count: ${filteredCountries.length}`
                  );
                }}
                autoCapitalize="none"
                clearButtonMode="while-editing"
              />
            </View>

            {/* COUNTRIES FLATLIST BUILDER SECTION */}
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
              style={{ width: "100%" }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryItem,
                    { borderBottomColor: theme.border },
                  ]}
                  onPress={() => {
                    console.log(
                      `[COUNTRY SELECTION SUCCESS] Code context updated over to: ${item.name} (${item.dialCode})`
                    );
                    setSelectedCountry(item);
                    setCountryModalVisible(false);
                  }}
                >
                  <Text style={styles.modalFlag}>{item.flag}</Text>
                  <Text style={[styles.countryName, { color: theme.text }]}>
                    {item.name}
                  </Text>
                  <Text
                    style={[styles.modalDialCode, { color: theme.textMuted }]}
                  >
                    {item.dialCode}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <View style={styles.emptyResultsWrapper}>
                  <Text
                    style={[
                      styles.emptyResultsText,
                      { color: theme.textMuted },
                    ]}
                  >
                    No countries matching your criteria found.
                  </Text>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

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

      {/* REGISTRATION SUCCESS BOTTOM SHEET MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={successSheetVisible}
        onRequestClose={handleProceedToSignIn}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={handleProceedToSignIn}
          />
          <View
            style={[styles.bottomSheet, { backgroundColor: theme.background }]}
          >
            <View
              style={[styles.dragHandle, { backgroundColor: theme.border }]}
            />

            <View style={styles.successIconWrapper}>
              <CheckCircle2 size={56} color={theme.primary} strokeWidth={2} />
            </View>

            <Text style={[styles.sheetTitle, { color: theme.text }]}>
              Account Created!
            </Text>

            <Text style={[styles.sheetSubtitle, { color: theme.textMuted }]}>
              Your Padiman Route account has been registered successfully.
              Proceed to Verify your account
            </Text>

            <TouchableOpacity
              style={[styles.sheetBtn, { backgroundColor: theme.primary }]}
              onPress={handleProceedToSignIn}
              activeOpacity={0.8}
            >
              <Text style={styles.sheetBtnText}>Verify your account</Text>
              <ArrowRight size={16} color="#FFF" strokeWidth={3} />
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
    paddingHorizontal: 16,
    marginBottom: -24
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
    paddingHorizontal: 16,
    paddingBottom: 80,
    paddingTop: Platform.OS === "ios" ? 130 : 100,

  },
  header: {
    marginBottom: 28,
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
  form: {
    zIndex: 2,
  },
  inputGroup: {
    marginBottom: 18,
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
  icon: {
    marginRight: 12,
  },
  countryPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingRight: 4,
    height: "100%",
  },
  flag: {
    fontSize: 18,
  },
  dialCode: {
    fontFamily: "RethinkSans-Medium",
    fontSize: 15,
    marginLeft: 2,
  },
  divider: {
    width: 1,
    height: 24,
    marginHorizontal: 12,
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
  btn: {
    height: 56,
    borderRadius: 100,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    shadowColor: "#8E24AA",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  btnText: {
    color: "#FFF",
    fontFamily: "RethinkSans-Bold",
    fontSize: 16,
  },
  footerLink: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 36,
    marginTop: "auto",
  },
  noAccountText: {
    fontFamily: "RethinkSans-Regular",
    fontSize: 14,
  },
  linkText: {
    fontFamily: "RethinkSans-Bold",
    fontSize: 14,
  },
  /* MODAL BACKGROUND OVERLAY ENGINE */
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
  /* SLIDING BOTTOM SHEET STRUCTURAL STYLING */
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 16,
    width: "100%",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontFamily: "RethinkSans-Medium",
    fontSize: 14,
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    width: "100%",
  },
  modalFlag: {
    fontSize: 20,
    marginRight: 14,
  },
  countryName: {
    flex: 1,
    fontFamily: "RethinkSans-Medium",
    fontSize: 15,
  },
  modalDialCode: {
    fontFamily: "RethinkSans-Regular",
    fontSize: 14,
  },
  emptyResultsWrapper: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyResultsText: {
    fontFamily: "RethinkSans-Regular",
    fontSize: 14,
    textAlign: "center",
  },
  successIconWrapper: {
    marginBottom: 16,
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
    gap: 12,
    shadowColor: "#8E24AA",
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
