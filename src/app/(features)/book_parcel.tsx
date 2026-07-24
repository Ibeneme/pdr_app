import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { palette, useTheme } from "@/contexts/ThemeContext";
import { useDispatch } from "react-redux";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { AppDispatch } from "@/api/store";
import { createParcelBooking } from "@/api/slices/parcel.slice";
import { NigeriaCitiesGrid } from "@/components/NigeriaCitiesGrid";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { AppText } from "@/components/AppText";

const FONT_REGULAR = "RethinkSans-Regular";
const DRAFT_KEY = "parcel_booking_draft_v1";

// Android has no home-indicator safe area like iOS, so we pad it manually.
const ANDROID_EXTRA_BOTTOM = Platform.OS === "android" ? 48 : 0;
const SCROLL_BOTTOM_PADDING = 64 + ANDROID_EXTRA_BOTTOM;
const MODAL_BOTTOM_PADDING =
  Platform.OS === "ios" ? 34 : 20 + ANDROID_EXTRA_BOTTOM;
const MODAL_BOTTOM_PADDING_TALL =
  Platform.OS === "ios" ? 34 : 24 + ANDROID_EXTRA_BOTTOM;

// ---- Shared design tokens -------------------------------------------------
const RADIUS = { sm: 12, md: 16, lg: 20, xl: 24, pill: 999 };
const SHADOW_SM = {
  // shadowColor: "#0F0B2E",
  // shadowOffset: { width: 0, height: 2 },
  // shadowOpacity: 0.06,
  // shadowRadius: 8,
  // elevation: 2,
};
const SHADOW_MD = {
  // shadowColor: "#0F0B2E",
  // shadowOffset: { width: 0, height: 10 },
  // shadowOpacity: 0.12,
  // shadowRadius: 24,
  // elevation: 8,
};
const STATUS = {
  danger: "#FF3B30",
  dangerSoft: "rgba(255, 59, 48, 0.12)",
  warning: "#FF9F0A",
  warningSoft: "rgba(255, 159, 10, 0.14)",
  success: "#30D158",
  successSoft: "rgba(48, 209, 88, 0.14)",
};
// Bold black used for primary pill CTAs and selected-state chips — the
// high-contrast look from the reference mockups (black "Send Message"
// button, black "Allocate to Resolution Team" selected bubble).
const INK = palette.purpleMain;
// ---------------------------------------------------------------------------

type Step = 1 | 2 | 3 | 4;

interface DraftShape {
  pickupAddress: string;
  deliveryAddress: string;
  senderName: string;
  senderContact: string;
  recipientName: string;
  recipientContact: string;
  itemName: string;
  isFragile: boolean;
  isPerishable: boolean;
  isInsured: boolean;
  isImpromptu: boolean;
  dispatchDate: string;
  currentStep: Step;
  savedAt: string;
}

export default function BookParcelDeliveryScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  // Step Management (1: Route, 2: Contacts, 3: Items & Timing, 4: Review)
  const [currentStep, setCurrentStep] = useState<Step>(1);

  // Form States
  const [pickupAddress, setPickupAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const [senderName, setSenderName] = useState("");
  const [senderContact, setSenderContact] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientContact, setRecipientContact] = useState("");

  const [itemName, setItemName] = useState("");
  const [isFragile, setIsFragile] = useState(false);
  const [isPerishable, setIsPerishable] = useState(false);
  const [isInsured, setIsInsured] = useState(false);

  const [dispatchDate, setDispatchDate] = useState(new Date());
  const [isImpromptu, setIsImpromptu] = useState(true);
  // Add this with the other states
  const [createdBooking, setCreatedBooking] = useState<any>(null);

  // Schedule Modal (date + time picker together)
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [tempScheduleDate, setTempScheduleDate] = useState(new Date());
  const [tempScheduleTime, setTempScheduleTime] = useState(new Date());

  // UI & Bottom Modal States
  const [loading, setLoading] = useState(false);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const [locationSelectionTarget, setLocationSelectionTarget] = useState<
    "PICKUP" | "DELIVERY" | null
  >(null);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  // Draft flow states
  const [draftCheckModalVisible, setDraftCheckModalVisible] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<DraftShape | null>(null);
  const [exitModalVisible, setExitModalVisible] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  // Check for an existing draft the moment the screen opens
  useEffect(() => {
    checkForExistingDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkForExistingDraft = async () => {
    try {
      const raw = await AsyncStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed: DraftShape = JSON.parse(raw);
        setPendingDraft(parsed);
        setDraftCheckModalVisible(true);
      }
    } catch (err) {
      // If the draft is unreadable, silently ignore it.
    }
  };

  const hasAnyInput = () =>
    Boolean(
      pickupAddress.trim() ||
        deliveryAddress.trim() ||
        senderName.trim() ||
        senderContact.trim() ||
        recipientName.trim() ||
        recipientContact.trim() ||
        itemName.trim()
    );

  const buildDraftPayload = (): DraftShape => ({
    pickupAddress,
    deliveryAddress,
    senderName,
    senderContact,
    recipientName,
    recipientContact,
    itemName,
    isFragile,
    isPerishable,
    isInsured,
    isImpromptu,
    dispatchDate: dispatchDate.toISOString(),
    currentStep,
    savedAt: new Date().toISOString(),
  });

  const persistDraft = async () => {
    const payload = buildDraftPayload();
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  };

  const clearDraft = async () => {
    await AsyncStorage.removeItem(DRAFT_KEY);
  };

  const handleContinueDraft = () => {
    if (!pendingDraft) return;
    setPickupAddress(pendingDraft.pickupAddress || "");
    setDeliveryAddress(pendingDraft.deliveryAddress || "");
    setSenderName(pendingDraft.senderName || "");
    setSenderContact(pendingDraft.senderContact || "");
    setRecipientName(pendingDraft.recipientName || "");
    setRecipientContact(pendingDraft.recipientContact || "");
    setItemName(pendingDraft.itemName || "");
    setIsFragile(Boolean(pendingDraft.isFragile));
    setIsPerishable(Boolean(pendingDraft.isPerishable));
    setIsInsured(Boolean(pendingDraft.isInsured));
    setIsImpromptu(pendingDraft.isImpromptu ?? true);
    if (pendingDraft.dispatchDate) {
      setDispatchDate(new Date(pendingDraft.dispatchDate));
    }
    setCurrentStep(pendingDraft.currentStep || 1);
    setDraftCheckModalVisible(false);
  };

  const handleCreateNewRequest = async () => {
    await clearDraft();
    setPendingDraft(null);
    setDraftCheckModalVisible(false);
  };

  const handleBackPress = () => {
    if (currentStep === 1) {
      if (hasAnyInput()) {
        setExitModalVisible(true);
      } else {
        router.back();
      }
    } else {
      prevStep();
    }
  };

  const handleExitIconPress = () => {
    setExitModalVisible(true);
  };

  const handleSaveDraftAndExit = async () => {
    setSavingDraft(true);
    try {
      await persistDraft();
    } finally {
      setSavingDraft(false);
      setExitModalVisible(false);
      router.back();
    }
  };

  const handleDiscardAndExit = async () => {
    await clearDraft();
    setExitModalVisible(false);
    router.back();
  };

  const triggerBottomAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertModalVisible(true);
  };

  const formatNigerianPhone = (text: string): string => {
    let cleaned = text.replace(/\D/g, "");
    if (cleaned.startsWith("0")) cleaned = cleaned.slice(1);
    if (cleaned.startsWith("234")) cleaned = cleaned.slice(3);
    return cleaned.slice(0, 10);
  };

  const openScheduleModal = () => {
    const base = isImpromptu ? new Date() : dispatchDate;
    setTempScheduleDate(base);
    setTempScheduleTime(base);
    setShowScheduleModal(true);
  };

  const handleConfirmSchedule = () => {
    const combined = new Date(
      tempScheduleDate.getFullYear(),
      tempScheduleDate.getMonth(),
      tempScheduleDate.getDate(),
      tempScheduleTime.getHours(),
      tempScheduleTime.getMinutes()
    );
    setDispatchDate(combined);
    setIsImpromptu(false);
    setShowScheduleModal(false);
  };

  const handleScheduleNow = () => {
    setIsImpromptu(true);
    setShowScheduleModal(false);
  };

  const handleConfirmSubmit = async () => {
    const parcelPayload = {
      route: { pickupAddress, deliveryAddress },
      parties: {
        sender: { fullName: senderName, contact: `+234${senderContact}` },
        recipient: {
          fullName: recipientName,
          contact: `+234${recipientContact}`,
        },
      },
      item: {
        name: itemName,
        properties: { isFragile, isPerishable, isInsured },
      },
      schedule: {
        type: isImpromptu ? "immediate" : "scheduled",
        date: isImpromptu
          ? new Date().toISOString()
          : dispatchDate.toISOString(),
      },
      status: "pending",
      notes: "Parcel booked via mobile app",
    };

    setLoading(true);
    setCreatedBooking(null); // reset

    try {
      const resultAction = await dispatch(
        createParcelBooking(parcelPayload as any)
      );

      if (createParcelBooking.fulfilled.match(resultAction)) {
        const bookingData = resultAction.payload; // ← This is the created booking
        setCreatedBooking(bookingData);
        setSubmissionStatus("success");
        await clearDraft();
      } else {
        setSubmissionStatus("error");
        setAlertMessage(
          "We couldn't save your delivery request. Please try again."
        );
      }
    } catch (err: any) {
      setSubmissionStatus("error");
      setAlertMessage(
        err?.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
      setResultModalVisible(true);
    }
  };

  const selectHubValue = (hubName: string) => {
    if (locationSelectionTarget === "PICKUP") setPickupAddress(hubName);
    else if (locationSelectionTarget === "DELIVERY")
      setDeliveryAddress(hubName);
    setLocationSelectionTarget(null);
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!pickupAddress.trim() || !deliveryAddress.trim()) {
        triggerBottomAlert(
          "Where should we go?",
          "Please pick a starting station and where we are carrying it to."
        );
        return;
      }
    }
    if (currentStep === 2) {
      if (
        !senderName.trim() ||
        !senderContact.trim() ||
        !recipientName.trim() ||
        !recipientContact.trim()
      ) {
        triggerBottomAlert(
          "Who are we meeting?",
          "Please provide names and active phone numbers for both ends."
        );
        return;
      }
    }
    if (currentStep === 3) {
      if (!itemName.trim()) {
        triggerBottomAlert(
          "What is inside?",
          "Please write a simple description of the items you are sending."
        );
        return;
      }
      setSubmissionStatus("idle");
      setCurrentStep(4);
      return;
    }
    setCurrentStep((prev) => Math.min(4, prev + 1) as Step);
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1) as Step);
  };

  const renderProgress = () => (
    <View style={styles.progressContainer}>
      {[
        { label: "Route", icon: "map-outline" },
        { label: "Contacts", icon: "people-outline" },
        { label: "Items", icon: "cube-outline" },
        { label: "Review", icon: "document-text-outline" },
      ].map((step, index) => {
        const isActive = currentStep === index + 1;
        const isPassed = currentStep > index + 1;
        return (
          <View key={index} style={styles.progressStep}>
            <View
              style={[
                styles.progressCircle,
                {
                  backgroundColor: isPassed || isActive ? INK : theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              {isPassed ? (
                <Ionicons name="checkmark" size={16} color="#FFF" />
              ) : (
                <Ionicons
                  name={step.icon as any}
                  size={15}
                  color={isActive ? "#FFF" : theme.textMuted}
                />
              )}
            </View>
            <AppText
              weight={isActive ? "medium" : "regular"}
              style={{
                fontSize: 11,
                color: isActive ? theme.text : theme.textMuted,
                marginTop: 6,
                letterSpacing: 0,
              }}
            >
              {step.label}
            </AppText>
          </View>
        );
      })}
    </View>
  );

  const formattedScheduleLabel = !isImpromptu
    ? dispatchDate.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
      }) +
      " · " +
      dispatchDate.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Schedule";

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <LinearGradient
        colors={isDark ? ["#1A1235", theme.surface] : ["#F4F1FF", "#FFFFFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={handleBackPress}
              activeOpacity={0.7}
              style={[
                styles.headerIconButton,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Ionicons name="arrow-back" size={20} color={theme.text} />
            </TouchableOpacity>

            <AppText
              weight="bold"
              style={[styles.brandText, { color: theme.text }]}
            >
              Book Delivery
            </AppText>

            <TouchableOpacity
              onPress={handleExitIconPress}
              activeOpacity={0.7}
              style={[
                styles.headerIconButton,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Ionicons name="bookmark-outline" size={19} color={theme.text} />
            </TouchableOpacity>
          </View>
          {renderProgress()}
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <ScrollView
          style={styles.mainScrollView}
          contentContainerStyle={styles.scrollContentLayout}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* STEP 1: ROUTE */}
          {currentStep === 1 && (
            <View>
              <AppText
                weight="bold"
                style={[styles.stepTitle, { color: theme.text }]}
              >
                Choose Pickup{"\n"}& Dropoff
              </AppText>
              <AppText style={[styles.stepDesc, { color: theme.textMuted }]}>
                Tell us where we are collecting the package from, and where it
                is going to.
              </AppText>

              <AppText style={styles.label} weight="medium" color={theme.text}>
                Starting Point (Pickup)
              </AppText>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.selectButton,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  SHADOW_SM,
                ]}
                onPress={() => setLocationSelectionTarget("PICKUP")}
              >
                <View
                  style={[
                    styles.selectIconWrap,
                    { backgroundColor: `${theme.primary}14` },
                  ]}
                >
                  <Ionicons name="location" size={16} color={theme.primary} />
                </View>
                <AppText
                  style={{
                    color: pickupAddress ? theme.text : theme.textMuted,
                    flex: 1,
                    letterSpacing: 0,
                    marginLeft: 12,
                  }}
                >
                  {pickupAddress || "Select Origin Hub"}
                </AppText>
                {pickupAddress ? (
                  <View style={styles.doneCheckBadge}>
                    <Ionicons name="checkmark" size={12} color="#FFF" />
                  </View>
                ) : (
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={theme.textMuted}
                  />
                )}
              </TouchableOpacity>

              <AppText style={styles.label} weight="medium" color={theme.text}>
                Destination (Delivery)
              </AppText>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.selectButton,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  SHADOW_SM,
                ]}
                onPress={() => setLocationSelectionTarget("DELIVERY")}
              >
                <View
                  style={[
                    styles.selectIconWrap,
                    { backgroundColor: `${STATUS.danger}14` },
                  ]}
                >
                  <Ionicons name="flag" size={16} color={STATUS.danger} />
                </View>
                <AppText
                  style={{
                    color: deliveryAddress ? theme.text : theme.textMuted,
                    flex: 1,
                    letterSpacing: 0,
                    marginLeft: 12,
                  }}
                >
                  {deliveryAddress || "Select Destination Hub"}
                </AppText>
                {deliveryAddress ? (
                  <View style={styles.doneCheckBadge}>
                    <Ionicons name="checkmark" size={12} color="#FFF" />
                  </View>
                ) : (
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={theme.textMuted}
                  />
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: CONTACTS */}
          {currentStep === 2 && (
            <View>
              <AppText
                weight="bold"
                style={[styles.stepTitle, { color: theme.text }]}
              >
                Sender &{"\n"}Receiver
              </AppText>
              <AppText style={[styles.stepDesc, { color: theme.textMuted }]}>
                Provide names and phone numbers so our dispatch riders can reach
                both ends easily.
              </AppText>

              <View
                style={[
                  styles.sectionCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  SHADOW_SM,
                ]}
              >
                <View style={styles.sectionHeadingRow}>
                  <View
                    style={[
                      styles.sectionDot,
                      { backgroundColor: theme.primary },
                    ]}
                  />
                  <AppText
                    style={[styles.sectionHeading, { color: theme.primary }]}
                    weight="bold"
                  >
                    SENDER DETAILS
                  </AppText>
                </View>

                <AppText
                  style={styles.label}
                  weight="medium"
                  color={theme.text}
                >
                  Full Name
                </AppText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.background,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  placeholder="Your full name"
                  placeholderTextColor={theme.textMuted}
                  value={senderName}
                  onChangeText={setSenderName}
                />

                <AppText
                  style={styles.label}
                  weight="medium"
                  color={theme.text}
                >
                  Phone Number
                </AppText>
                <View
                  style={[
                    styles.phoneContainer,
                    {
                      backgroundColor: theme.background,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.countryBadge,
                      { backgroundColor: `${theme.primary}16` },
                    ]}
                  >
                    <AppText
                      weight="medium"
                      style={{
                        fontSize: 11,
                        color: theme.primary,
                        letterSpacing: 0,
                      }}
                    >
                      NG
                    </AppText>
                  </View>
                  <AppText
                    style={{
                      color: theme.text,
                      marginLeft: 8,
                      letterSpacing: 0,
                    }}
                  >
                    +234
                  </AppText>
                  <TextInput
                    style={[styles.phoneInput, { color: theme.text }]}
                    placeholder="8012345678"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="numeric"
                    maxLength={10}
                    value={senderContact}
                    onChangeText={(t) =>
                      setSenderContact(formatNigerianPhone(t))
                    }
                  />
                </View>
              </View>

              <View
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    marginTop: 16,
                  },
                  SHADOW_SM,
                ]}
              >
                <View style={styles.sectionHeadingRow}>
                  <View
                    style={[styles.sectionDot, { backgroundColor: "#FF9F0A" }]}
                  />
                  <AppText
                    style={[styles.sectionHeading, { color: "#FF9F0A" }]}
                    weight="bold"
                  >
                    RECEIVER DETAILS
                  </AppText>
                </View>

                <AppText
                  style={styles.label}
                  weight="medium"
                  color={theme.text}
                >
                  Full Name
                </AppText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.background,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  placeholder="Who is collecting the parcel?"
                  placeholderTextColor={theme.textMuted}
                  value={recipientName}
                  onChangeText={setRecipientName}
                />

                <AppText
                  style={styles.label}
                  weight="medium"
                  color={theme.text}
                >
                  Phone Number
                </AppText>
                <View
                  style={[
                    styles.phoneContainer,
                    {
                      backgroundColor: theme.background,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.countryBadge,
                      { backgroundColor: `${theme.primary}16` },
                    ]}
                  >
                    <AppText
                      weight="medium"
                      style={{
                        fontSize: 11,
                        color: theme.primary,
                        letterSpacing: 0,
                      }}
                    >
                      NG
                    </AppText>
                  </View>
                  <AppText
                    style={{
                      color: theme.text,
                      marginLeft: 8,
                      letterSpacing: 0,
                    }}
                  >
                    +234
                  </AppText>
                  <TextInput
                    style={[styles.phoneInput, { color: theme.text }]}
                    placeholder="8012345678"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="numeric"
                    maxLength={10}
                    value={recipientContact}
                    onChangeText={(t) =>
                      setRecipientContact(formatNigerianPhone(t))
                    }
                  />
                </View>
              </View>
            </View>
          )}

          {/* STEP 3: ITEM DETAILS & TIMING */}
          {currentStep === 3 && (
            <View>
              <AppText
                weight="bold"
                style={[styles.stepTitle, { color: theme.text }]}
              >
                Parcel Info{"\n"}& Timing
              </AppText>
              <AppText style={[styles.stepDesc, { color: theme.textMuted }]}>
                Describe your package and select when our riders should come
                pick it up.
              </AppText>

              <AppText style={styles.label} weight="medium" color={theme.text}>
                What are you sending?
              </AppText>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                  SHADOW_SM,
                ]}
                placeholder="E.g. A box of clothes, documents, laptop accessories..."
                placeholderTextColor={theme.textMuted}
                value={itemName}
                onChangeText={setItemName}
                multiline
              />

              <View
                style={[
                  styles.card,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  SHADOW_SM,
                ]}
              >
                <View style={styles.toggleRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <AppText
                      weight="medium"
                      style={{ color: theme.text, letterSpacing: 0 }}
                    >
                      Fragile Item
                    </AppText>
                    <AppText
                      style={{
                        fontSize: 12,
                        color: theme.textMuted,
                        letterSpacing: 0,
                        marginTop: 2,
                      }}
                    >
                      Breaks easily, needs careful handling
                    </AppText>
                  </View>
                  <Switch
                    value={isFragile}
                    onValueChange={setIsFragile}
                    trackColor={{ true: INK, false: theme.border }}
                  />
                </View>

                <View
                  style={[
                    styles.toggleDivider,
                    { backgroundColor: theme.border },
                  ]}
                />

                <View style={styles.toggleRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <AppText
                      weight="medium"
                      style={{ color: theme.text, letterSpacing: 0 }}
                    >
                      Perishable Goods
                    </AppText>
                    <AppText
                      style={{
                        fontSize: 12,
                        color: theme.textMuted,
                        letterSpacing: 0,
                        marginTop: 2,
                      }}
                    >
                      Spoils fast (like food or fresh items)
                    </AppText>
                  </View>
                  <Switch
                    value={isPerishable}
                    onValueChange={setIsPerishable}
                    trackColor={{ true: INK, false: theme.border }}
                  />
                </View>

                <View
                  style={[
                    styles.toggleDivider,
                    { backgroundColor: theme.border },
                  ]}
                />

                <View style={styles.toggleRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <AppText
                      weight="medium"
                      style={{ color: theme.text, letterSpacing: 0 }}
                    >
                      Secure & Insure
                    </AppText>
                    <AppText
                      style={{
                        fontSize: 12,
                        color: theme.textMuted,
                        letterSpacing: 0,
                        marginTop: 2,
                      }}
                    >
                      Add cover protecting against transit loss
                    </AppText>
                  </View>
                  <Switch
                    value={isInsured}
                    onValueChange={setIsInsured}
                    trackColor={{ true: INK, false: theme.border }}
                  />
                </View>
              </View>

              <AppText style={styles.label} weight="medium" color={theme.text}>
                Dispatch Timing
              </AppText>
              <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[
                    styles.timingTab,
                    {
                      backgroundColor: isImpromptu ? INK : theme.surface,
                      borderColor: isImpromptu ? INK : theme.border,
                    },
                  ]}
                  onPress={() => setIsImpromptu(true)}
                >
                  <Ionicons
                    name="flash"
                    size={18}
                    color={isImpromptu ? "#FFF" : theme.text}
                  />
                  <AppText
                    weight="medium"
                    style={{
                      color: isImpromptu ? "#FFF" : theme.text,
                      marginTop: 6,
                      letterSpacing: 0,
                    }}
                  >
                    Immediate
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[
                    styles.timingTab,
                    {
                      backgroundColor: !isImpromptu ? INK : theme.surface,
                      borderColor: !isImpromptu ? INK : theme.border,
                    },
                  ]}
                  onPress={openScheduleModal}
                >
                  <Ionicons
                    name="calendar"
                    size={18}
                    color={!isImpromptu ? "#FFF" : theme.text}
                  />
                  <AppText
                    weight="medium"
                    style={{
                      color: !isImpromptu ? "#FFF" : theme.text,
                      marginTop: 6,
                      letterSpacing: 0,
                    }}
                  >
                    {formattedScheduleLabel}
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 4: FULL-SCREEN REVIEW */}
          {currentStep === 4 && (
            <View>
              <AppText
                weight="bold"
                style={[styles.stepTitle, { color: theme.text }]}
              >
                Review &{"\n"}Confirm
              </AppText>
              <AppText style={[styles.stepDesc, { color: theme.textMuted }]}>
                Please check everything below carefully before you send this out
                for pickup.
              </AppText>

              <View
                style={[
                  styles.sectionCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  SHADOW_SM,
                ]}
              >
                <View style={styles.sectionHeadingRow}>
                  <View
                    style={[
                      styles.sectionDot,
                      { backgroundColor: theme.primary },
                    ]}
                  />
                  <AppText
                    style={[styles.sectionHeading, { color: theme.primary }]}
                    weight="bold"
                  >
                    ROUTE
                  </AppText>
                </View>
                <View style={styles.reviewLine}>
                  <View
                    style={[
                      styles.reviewIconWrap,
                      { backgroundColor: `${theme.primary}14` },
                    ]}
                  >
                    <Ionicons name="location" size={15} color={theme.primary} />
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <AppText
                      style={{
                        fontSize: 12,
                        color: theme.textMuted,
                        letterSpacing: 0,
                      }}
                    >
                      Pickup
                    </AppText>
                    <AppText
                      weight="medium"
                      style={{ color: theme.text, letterSpacing: 0 }}
                    >
                      {pickupAddress || "—"}
                    </AppText>
                  </View>
                </View>
                <View style={styles.reviewLine}>
                  <View
                    style={[
                      styles.reviewIconWrap,
                      { backgroundColor: `${STATUS.danger}14` },
                    ]}
                  >
                    <Ionicons name="flag" size={15} color={STATUS.danger} />
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <AppText
                      style={{
                        fontSize: 12,
                        color: theme.textMuted,
                        letterSpacing: 0,
                      }}
                    >
                      Delivery
                    </AppText>
                    <AppText
                      weight="medium"
                      style={{ color: theme.text, letterSpacing: 0 }}
                    >
                      {deliveryAddress || "—"}
                    </AppText>
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    marginTop: 16,
                  },
                  SHADOW_SM,
                ]}
              >
                <View style={styles.sectionHeadingRow}>
                  <View
                    style={[
                      styles.sectionDot,
                      { backgroundColor: theme.primary },
                    ]}
                  />
                  <AppText
                    style={[styles.sectionHeading, { color: theme.primary }]}
                    weight="bold"
                  >
                    SENDER & RECEIVER
                  </AppText>
                </View>
                <View style={styles.reviewLine}>
                  <View
                    style={[
                      styles.reviewIconWrap,
                      { backgroundColor: theme.background },
                    ]}
                  >
                    <Ionicons name="person" size={15} color={theme.textMuted} />
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <AppText
                      style={{
                        fontSize: 12,
                        color: theme.textMuted,
                        letterSpacing: 0,
                      }}
                    >
                      Sender
                    </AppText>
                    <AppText
                      weight="medium"
                      style={{ color: theme.text, letterSpacing: 0 }}
                    >
                      {senderName || "—"}
                      {senderContact ? `  ·  +234${senderContact}` : ""}
                    </AppText>
                  </View>
                </View>
                <View style={styles.reviewLine}>
                  <View
                    style={[
                      styles.reviewIconWrap,
                      { backgroundColor: theme.background },
                    ]}
                  >
                    <Ionicons name="people" size={15} color={theme.textMuted} />
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <AppText
                      style={{
                        fontSize: 12,
                        color: theme.textMuted,
                        letterSpacing: 0,
                      }}
                    >
                      Receiver
                    </AppText>
                    <AppText
                      weight="medium"
                      style={{ color: theme.text, letterSpacing: 0 }}
                    >
                      {recipientName || "—"}
                      {recipientContact ? `  ·  +234${recipientContact}` : ""}
                    </AppText>
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    marginTop: 16,
                  },
                  SHADOW_SM,
                ]}
              >
                <View style={styles.sectionHeadingRow}>
                  <View
                    style={[
                      styles.sectionDot,
                      { backgroundColor: theme.primary },
                    ]}
                  />
                  <AppText
                    style={[styles.sectionHeading, { color: theme.primary }]}
                    weight="bold"
                  >
                    PARCEL
                  </AppText>
                </View>
                <View style={styles.reviewLine}>
                  <View
                    style={[
                      styles.reviewIconWrap,
                      { backgroundColor: `${theme.primary}14` },
                    ]}
                  >
                    <Ionicons name="cube" size={15} color={theme.primary} />
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <AppText
                      style={{
                        fontSize: 12,
                        color: theme.textMuted,
                        letterSpacing: 0,
                      }}
                    >
                      Contents
                    </AppText>
                    <AppText
                      weight="medium"
                      style={{ color: theme.text, letterSpacing: 0 }}
                    >
                      {itemName || "—"}
                    </AppText>
                  </View>
                </View>

                <View style={styles.tagRow}>
                  {isFragile && (
                    <View
                      style={[
                        styles.tag,
                        {
                          borderColor: STATUS.warning,
                          backgroundColor: STATUS.warningSoft,
                        },
                      ]}
                    >
                      <AppText
                        weight="medium"
                        style={{
                          fontSize: 12,
                          color: STATUS.warning,
                          letterSpacing: 0,
                        }}
                      >
                        Fragile
                      </AppText>
                    </View>
                  )}
                  {isPerishable && (
                    <View
                      style={[
                        styles.tag,
                        {
                          borderColor: STATUS.success,
                          backgroundColor: STATUS.successSoft,
                        },
                      ]}
                    >
                      <AppText
                        weight="medium"
                        style={{
                          fontSize: 12,
                          color: STATUS.success,
                          letterSpacing: 0,
                        }}
                      >
                        Perishable
                      </AppText>
                    </View>
                  )}
                  {isInsured && (
                    <View
                      style={[
                        styles.tag,
                        {
                          borderColor: theme.primary,
                          backgroundColor: `${theme.primary}14`,
                        },
                      ]}
                    >
                      <AppText
                        weight="medium"
                        style={{
                          fontSize: 12,
                          color: theme.primary,
                          letterSpacing: 0,
                        }}
                      >
                        Insured
                      </AppText>
                    </View>
                  )}
                  {!isFragile && !isPerishable && !isInsured && (
                    <AppText
                      style={{
                        fontSize: 12,
                        color: theme.textMuted,
                        letterSpacing: 0,
                      }}
                    >
                      No special handling selected
                    </AppText>
                  )}
                </View>

                <View style={[styles.reviewLine, { marginTop: 10 }]}>
                  <View
                    style={[
                      styles.reviewIconWrap,
                      { backgroundColor: `${theme.primary}14` },
                    ]}
                  >
                    <Ionicons
                      name={isImpromptu ? "flash" : "calendar"}
                      size={15}
                      color={theme.primary}
                    />
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <AppText
                      style={{
                        fontSize: 12,
                        color: theme.textMuted,
                        letterSpacing: 0,
                      }}
                    >
                      Timing
                    </AppText>
                    <AppText
                      weight="medium"
                      style={{ color: theme.text, letterSpacing: 0 }}
                    >
                      {isImpromptu
                        ? "Immediate pickup"
                        : `${dispatchDate.toLocaleDateString()} · ${dispatchDate.toLocaleTimeString(
                            undefined,
                            { hour: "2-digit", minute: "2-digit" }
                          )}`}
                    </AppText>
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.disclaimerCard,
                  {
                    backgroundColor: isDark
                      ? "rgba(122, 106, 255, 0.14)"
                      : "rgba(122, 106, 255, 0.08)",
                    borderColor: `${theme.primary}33`,
                  },
                ]}
              >
                <Ionicons
                  name="information-circle"
                  size={18}
                  color={theme.primary}
                  style={{ marginRight: 10, marginTop: 1 }}
                />
                <AppText
                  style={{
                    color: theme.text,
                    fontSize: 13,
                    lineHeight: 19,
                    flex: 1,
                    letterSpacing: 0,
                  }}
                >
                  Once you confirm, we'll search for available riders or drivers
                  nearby to handle this pickup. You'll be taken to the next page
                  to track matching in real time, and assignment depends on who
                  is available in your area.
                </AppText>
              </View>
            </View>
          )}

          {/* Navigation Controls */}
          <View style={styles.bottomNav}>
            {currentStep > 1 && (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.navButton,
                  styles.navButtonSecondary,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.surface,
                  },
                ]}
                onPress={prevStep}
              >
                <Ionicons
                  name="arrow-back"
                  size={18}
                  color={theme.text}
                  style={{ marginRight: 6 }}
                />
                <AppText
                  weight="medium"
                  style={{ color: theme.text, letterSpacing: 0 }}
                >
                  Back
                </AppText>
              </TouchableOpacity>
            )}

            {currentStep < 4 ? (
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.navButton,
                  {
                    backgroundColor: INK,
                    borderColor: INK,
                  },
                  SHADOW_MD,
                ]}
                onPress={nextStep}
              >
                <AppText
                  weight="medium"
                  style={[styles.buttonText, { letterSpacing: 0 }]}
                >
                  {currentStep === 3 ? "Review Summary" : "Continue"}
                </AppText>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color="#FFF"
                  style={{ marginLeft: 6 }}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.navButton,
                  {
                    backgroundColor: INK,
                    borderColor: INK,
                  },
                  SHADOW_MD,
                ]}
                onPress={handleConfirmSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <AppText
                      weight="bold"
                      style={[styles.buttonText, { letterSpacing: 0 }]}
                    >
                      Confirm & Book
                    </AppText>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#FFF"
                      style={{ marginLeft: 6 }}
                    />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* DYNAMIC ALERT BOTTOM MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={alertModalVisible}
        onRequestClose={() => setAlertModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setAlertModalVisible(false)}
          />
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.surface },
              SHADOW_MD,
            ]}
          >
            <View
              style={[styles.modalKnob, { backgroundColor: theme.border }]}
            />

            <View
              style={{
                alignItems: "center",
                paddingHorizontal: 24,
                paddingBottom: MODAL_BOTTOM_PADDING_TALL,
              }}
            >
              <View
                style={[
                  styles.alertIconCircle,
                  { backgroundColor: STATUS.warningSoft },
                ]}
              >
                <Ionicons
                  name="warning-outline"
                  size={30}
                  color={STATUS.warning}
                />
              </View>
              <AppText
                weight="bold"
                style={{
                  fontSize: 19,
                  color: theme.text,
                  marginBottom: 8,
                  textAlign: "center",
                  letterSpacing: 0,
                }}
              >
                {alertTitle}
              </AppText>
              <AppText
                style={{
                  color: theme.textMuted,
                  textAlign: "center",
                  lineHeight: 20,
                  marginBottom: 24,
                  letterSpacing: 0,
                }}
              >
                {alertMessage}
              </AppText>

              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.primarySubmitButton,
                  {
                    backgroundColor: INK,
                    width: "100%",
                    marginTop: 0,
                    marginBottom: 64,
                  },
                ]}
                onPress={() => setAlertModalVisible(false)}
              >
                <AppText
                  weight="bold"
                  style={[styles.buttonText, { letterSpacing: 0 }]}
                >
                  Got it
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CITIES SELECTION MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={locationSelectionTarget !== null}
        onRequestClose={() => setLocationSelectionTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setLocationSelectionTarget(null)}
          />
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.surface, paddingTop: 16, height: "80%" },
              SHADOW_MD,
            ]}
          >
            <View
              style={[styles.modalKnob, { backgroundColor: theme.border }]}
            />

            <AppText
              weight="bold"
              style={{
                fontSize: 18,
                color: theme.text,
                paddingHorizontal: 24,
                marginBottom: 12,
                letterSpacing: 0,
              }}
            >
              Select{" "}
              {locationSelectionTarget === "PICKUP" ? "Pickup" : "Delivery"}{" "}
              Location Hub
            </AppText>

            <View style={{ flex: 1 }}>
              <NigeriaCitiesGrid
                onCityPress={(city) => selectHubValue(city.name)}
              />
            </View>

            <View
              style={{
                paddingHorizontal: 24,
                paddingBottom: MODAL_BOTTOM_PADDING,
              }}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.cancelModalButton,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => setLocationSelectionTarget(null)}
              >
                <AppText
                  weight="bold"
                  style={{ color: theme.text, letterSpacing: 0 }}
                >
                  Cancel
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* SCHEDULE PICKUP MODAL: DATE + TIME */}
      <Modal
        animationType="slide"
        transparent
        visible={showScheduleModal}
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setShowScheduleModal(false)}
          />
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.surface },
              SHADOW_MD,
            ]}
          >
            <View
              style={[styles.modalKnob, { backgroundColor: theme.border }]}
            />

            <View
              style={{
                paddingHorizontal: 24,
                paddingBottom: MODAL_BOTTOM_PADDING_TALL,
              }}
            >
              <View style={styles.scheduleHeaderRow}>
                <View
                  style={[
                    styles.scheduleIconCircle,
                    { backgroundColor: `${theme.primary}16` },
                  ]}
                >
                  <Ionicons name="calendar" size={20} color={theme.primary} />
                </View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <AppText
                    weight="bold"
                    style={{
                      fontSize: 19,
                      color: theme.text,
                      letterSpacing: 0,
                    }}
                  >
                    Schedule Pickup
                  </AppText>
                  <AppText
                    style={{
                      color: theme.textMuted,
                      fontSize: 13,
                      letterSpacing: 0,
                    }}
                  >
                    Pick a date and time for your rider to arrive
                  </AppText>
                </View>
              </View>

              <View
                style={[
                  styles.pickerCard,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={styles.pickerCardHeader}>
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={theme.primary}
                  />
                  <AppText
                    weight="medium"
                    style={{
                      color: theme.text,
                      marginLeft: 8,
                      letterSpacing: 0,
                    }}
                  >
                    Date
                  </AppText>
                </View>
                <DateTimePicker
                  value={tempScheduleDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  minimumDate={new Date()}
                  onChange={(_: DateTimePickerEvent, date?: Date) =>
                    date && setTempScheduleDate(date)
                  }
                  style={styles.inlinePicker}
                  themeVariant={isDark ? "dark" : "light"}
                />
              </View>

              <View
                style={[
                  styles.pickerCard,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                    marginTop: 14,
                  },
                ]}
              >
                <View style={styles.pickerCardHeader}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={theme.primary}
                  />
                  <AppText
                    weight="medium"
                    style={{
                      color: theme.text,
                      marginLeft: 8,
                      letterSpacing: 0,
                    }}
                  >
                    Time
                  </AppText>
                </View>
                <DateTimePicker
                  value={tempScheduleTime}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(_: DateTimePickerEvent, date?: Date) =>
                    date && setTempScheduleTime(date)
                  }
                  style={styles.inlinePicker}
                  themeVariant={isDark ? "dark" : "light"}
                />
              </View>

              <View style={{ flexDirection: "row", gap: 12, marginTop: 22 }}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.navButton,
                    styles.navButtonSecondary,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.background,
                      flex: 1,
                    },
                  ]}
                  onPress={() => setShowScheduleModal(false)}
                >
                  <AppText style={{ color: theme.text, letterSpacing: 0 }}>
                    Cancel
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.navButton,
                    styles.navButtonSecondary,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.background,
                      flex: 1,
                    },
                  ]}
                  onPress={handleScheduleNow}
                >
                  <AppText style={{ color: theme.text, letterSpacing: 0 }}>
                    Send Now Instead
                  </AppText>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.primarySubmitButton,
                  { backgroundColor: INK, marginTop: 12 },
                  SHADOW_MD,
                ]}
                onPress={handleConfirmSchedule}
              >
                <AppText
                  weight="bold"
                  style={[styles.buttonText, { letterSpacing: 0 }]}
                >
                  Confirm Schedule
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* EXIT / SAVE TO DRAFTS MODAL */}
      <Modal
        animationType="slide"
        transparent
        visible={exitModalVisible}
        onRequestClose={() => setExitModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setExitModalVisible(false)}
          />
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.surface },
              SHADOW_MD,
            ]}
          >
            <View
              style={[styles.modalKnob, { backgroundColor: theme.border }]}
            />
            <View
              style={{
                paddingHorizontal: 24,
                paddingBottom: MODAL_BOTTOM_PADDING_TALL,
              }}
            >
              <View style={styles.scheduleHeaderRow}>
                <View
                  style={[
                    styles.scheduleIconCircle,
                    { backgroundColor: `${theme.primary}16` },
                  ]}
                >
                  <Ionicons
                    name="bookmark-outline"
                    size={20}
                    color={theme.primary}
                  />
                </View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <AppText
                    weight="bold"
                    style={{
                      fontSize: 19,
                      color: theme.text,
                      letterSpacing: 0,
                    }}
                  >
                    Leave Booking?
                  </AppText>
                  <AppText
                    style={{
                      color: theme.textMuted,
                      fontSize: 13,
                      letterSpacing: 0,
                    }}
                  >
                    Save your progress as a draft, or discard it entirely.
                  </AppText>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.primarySubmitButton,
                  { backgroundColor: INK, marginTop: 4 },
                  SHADOW_MD,
                ]}
                onPress={handleSaveDraftAndExit}
                disabled={savingDraft}
              >
                {savingDraft ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name="save-outline"
                      size={18}
                      color="#FFF"
                      style={{ marginRight: 8 }}
                    />
                    <AppText
                      weight="bold"
                      style={[styles.buttonText, { letterSpacing: 0 }]}
                    >
                      Save as Draft
                    </AppText>
                  </>
                )}
              </TouchableOpacity>

              <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.navButton,
                    styles.navButtonSecondary,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.background,
                      flex: 1,
                    },
                  ]}
                  onPress={() => setExitModalVisible(false)}
                >
                  <AppText style={{ color: theme.text, letterSpacing: 0 }}>
                    Keep Editing
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.navButton,
                    styles.navButtonSecondary,
                    {
                      borderColor: STATUS.danger,
                      backgroundColor: STATUS.dangerSoft,
                      flex: 1,
                    },
                  ]}
                  onPress={handleDiscardAndExit}
                >
                  <AppText
                    weight="medium"
                    style={{ color: STATUS.danger, letterSpacing: 0 }}
                  >
                    Discard
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* CONTINUE FROM DRAFT MODAL (shown on open if a draft exists) */}
      <Modal
        animationType="slide"
        transparent
        visible={draftCheckModalVisible}
        onRequestClose={() => setDraftCheckModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.surface },
              SHADOW_MD,
            ]}
          >
            <View
              style={[styles.modalKnob, { backgroundColor: theme.border }]}
            />
            <View
              style={{
                paddingHorizontal: 24,
                paddingBottom: MODAL_BOTTOM_PADDING_TALL,
              }}
            >
              <View style={styles.scheduleHeaderRow}>
                <View
                  style={[
                    styles.scheduleIconCircle,
                    { backgroundColor: `${theme.primary}16` },
                  ]}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={20}
                    color={theme.primary}
                  />
                </View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <AppText
                    weight="bold"
                    style={{
                      fontSize: 19,
                      color: theme.text,
                      letterSpacing: 0,
                    }}
                  >
                    Continue where you left off?
                  </AppText>
                  <AppText
                    style={{
                      color: theme.textMuted,
                      fontSize: 13,
                      letterSpacing: 0,
                    }}
                  >
                    You have an unfinished parcel booking draft.
                  </AppText>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.primarySubmitButton,
                  { backgroundColor: INK, marginTop: 4 },
                  SHADOW_MD,
                ]}
                onPress={handleContinueDraft}
              >
                <Ionicons
                  name="arrow-forward-circle-outline"
                  size={18}
                  color="#FFF"
                  style={{ marginRight: 8 }}
                />
                <AppText
                  weight="bold"
                  style={[styles.buttonText, { letterSpacing: 0 }]}
                >
                  Continue Draft
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.navButton,
                  styles.navButtonSecondary,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.background,
                    marginTop: 12,
                  },
                ]}
                onPress={handleCreateNewRequest}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={18}
                  color={theme.text}
                  style={{ marginRight: 8 }}
                />
                <AppText style={{ color: theme.text, letterSpacing: 0 }}>
                  Create New Request
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* SUBMISSION RESULT MODAL */}
      <Modal
        animationType="slide"
        transparent
        visible={resultModalVisible}
        onRequestClose={() => setResultModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.surface },
              SHADOW_MD,
            ]}
          >
            <View
              style={[styles.modalKnob, { backgroundColor: theme.border }]}
            />

            {submissionStatus === "success" && (
              <View
                style={{
                  alignItems: "center",
                  paddingHorizontal: 24,
                  paddingBottom: MODAL_BOTTOM_PADDING_TALL,
                  paddingTop: 16,
                }}
              >
                <View
                  style={[
                    styles.alertIconCircle,
                    {
                      backgroundColor: STATUS.successSoft,
                      width: 72,
                      height: 72,
                      borderRadius: 36,
                    },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={44}
                    color={STATUS.success}
                  />
                </View>
                <AppText
                  weight="bold"
                  style={{
                    fontSize: 20,
                    color: theme.text,
                    marginTop: 14,
                    letterSpacing: 0,
                  }}
                >
                  Booking Request Sent!
                </AppText>
                <AppText
                  style={{
                    color: theme.textMuted,
                    textAlign: "center",
                    marginTop: 8,
                    marginBottom: 24,
                    letterSpacing: 0,
                  }}
                >
                  We're now finding available riders or drivers nearby. You'll
                  see live matching on the next page.
                </AppText>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[
                    styles.primarySubmitButton,
                    {
                      backgroundColor: INK,
                      width: "100%",
                      marginTop: 0,
                      marginBottom: 0,
                    },
                  ]}
                  onPress={() => {
                    setResultModalVisible(false);
                    if (createdBooking) {
                      router.push({
                        pathname: "/(screens)/one",
                        params: {
                          id: createdBooking._id,
                          type: "parcel",
                          parcel: createdBooking,
                        },
                      });
                    } else {
                      // Fallback
                      router.back();
                    }
                  }}
                >
                  <AppText
                    weight="bold"
                    style={[styles.buttonText, { letterSpacing: 0 }]}
                  >
                    Done
                  </AppText>
                </TouchableOpacity>
              </View>
            )}

            {submissionStatus === "error" && (
              <View
                style={{
                  alignItems: "center",
                  paddingHorizontal: 24,
                  paddingBottom: MODAL_BOTTOM_PADDING_TALL,
                  paddingTop: 16,
                }}
              >
                <View
                  style={[
                    styles.alertIconCircle,
                    {
                      backgroundColor: STATUS.dangerSoft,
                      width: 72,
                      height: 72,
                      borderRadius: 36,
                    },
                  ]}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={44}
                    color={STATUS.danger}
                  />
                </View>
                <AppText
                  weight="bold"
                  style={{
                    fontSize: 20,
                    color: theme.text,
                    marginTop: 14,
                    letterSpacing: 0,
                  }}
                >
                  Booking Failed
                </AppText>
                <AppText
                  style={{
                    color: theme.textMuted,
                    textAlign: "center",
                    marginTop: 8,
                    marginBottom: 24,
                    letterSpacing: 0,
                  }}
                >
                  {alertMessage}
                </AppText>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[
                    styles.primarySubmitButton,
                    {
                      backgroundColor: STATUS.danger,
                      width: "100%",
                      marginTop: 0,
                      marginBottom: 0,
                    },
                  ]}
                  onPress={() => setResultModalVisible(false)}
                >
                  <AppText
                    weight="bold"
                    style={[styles.buttonText, { letterSpacing: 0 }]}
                  >
                    Try Again
                  </AppText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardContainer: { flex: 1 },
  headerGradient: {
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
    paddingBottom: 6,
  },
  headerSafeArea: {
    paddingTop: Platform.OS === "ios" ? 10 : StatusBar.currentHeight || 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerIconButton: {
    height: 38,
    width: 38,
    borderRadius: RADIUS.pill,
    justifyContent: "center",
    alignItems: "center",
  },
  brandText: { fontSize: 18, letterSpacing: 0 },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  progressStep: { alignItems: "center" },
  progressCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  mainScrollView: { flex: 1 },
  scrollContentLayout: {
    paddingTop: 22,
    paddingHorizontal: 18,
    paddingBottom: SCROLL_BOTTOM_PADDING,
  },
  stepTitle: {
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.6,
    marginBottom: 10,
  },
  stepDesc: {
    fontSize: 14,
    lineHeight: 19,
    marginBottom: 22,
    letterSpacing: 0,
  },
  label: {
    marginTop: 14,
    marginBottom: 7,
    fontSize: 13,
    letterSpacing: 0,
  },
  sectionCard: {
    borderRadius: RADIUS.xl,
    padding: 16,
  },
  sectionHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 6,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionHeading: {
    fontSize: 12,
    letterSpacing: 0.8,
  },
  input: {
    height: 52,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: FONT_REGULAR,
    letterSpacing: 0,
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
  },
  countryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  phoneInput: {
    flex: 1,
    marginLeft: 12,
    height: "100%",
    fontSize: 15,
    fontFamily: FONT_REGULAR,
    letterSpacing: 0,
  },
  selectButton: {
    height: 56,
    borderRadius: RADIUS.xl,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  selectIconWrap: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.pill,
    justifyContent: "center",
    alignItems: "center",
  },
  doneCheckBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#30D158",
    justifyContent: "center",
    alignItems: "center",
  },
  textArea: {
    height: 106,
    borderRadius: RADIUS.lg,
    padding: 16,
    textAlignVertical: "top",
    fontSize: 15,
    fontFamily: FONT_REGULAR,
    letterSpacing: 0,
  },
  card: {
    borderRadius: RADIUS.xl,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginVertical: 18,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  toggleDivider: {
    height: 1,
  },
  timingTab: {
    flex: 1,
    height: 68,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  primarySubmitButton: {
    height: 54,
    borderRadius: RADIUS.pill,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    marginTop: 20,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    letterSpacing: 0,
  },
  bottomNav: {
    flexDirection: "row",
    gap: 12,
    marginTop: 30,
  },
  navButton: {
    flex: 1,
    height: 56,
    borderRadius: RADIUS.pill,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  navButtonSecondary: {
    borderWidth: 1.5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(10, 8, 20, 0.6)",
  },
  modalDismissArea: { flex: 1 },
  modalContent: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    width: "100%",
  },
  modalKnob: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    alignSelf: "center",
    marginVertical: 12,
  },
  alertIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  cancelModalButton: {
    height: 52,
    borderRadius: RADIUS.pill,
    justifyContent: "center",
    alignItems: "center",
  },
  reviewLine: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 12,
  },
  reviewIconWrap: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.pill,
    justifyContent: "center",
    alignItems: "center",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  tag: {
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  disclaimerCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: RADIUS.lg,
    padding: 16,
    marginTop: 22,
  },
  scheduleHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  scheduleIconCircle: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.pill,
    justifyContent: "center",
    alignItems: "center",
  },
  pickerCard: {
    borderRadius: RADIUS.lg,
    padding: 12,
  },
  pickerCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  inlinePicker: {
    alignSelf: "stretch",
  },
});
