import React, { useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Switch,
  Platform,
  StatusBar,
  Modal,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { useDispatch } from "react-redux";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { createParcelRequest } from "@/api/slices/parcel.request.slice";
import { AppDispatch } from "@/api/store";
import { AppText } from "@/components/AppText";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Flag,
  PackageOpen,
  Wine,
  Banknote,
  CheckCircle,
  XCircle,
} from "lucide-react-native";
import { NigeriaCitiesGrid } from "@/components/NigeriaCitiesGrid";

// ---- Shared design tokens -------------------------------------------------
const RADIUS = { sm: 12, md: 16, lg: 20, xl: 24, pill: 999 };
const SHADOW_SM = {};
const SHADOW_MD = {};

const PASTELS = {
  sky: { bg: "#DBEAFE", icon: "#2563EB" },
  lavender: { bg: "#EDE9FE", icon: "#7C3AED" },
  mint: { bg: "#D1FAE5", icon: "#059669" },
  peach: { bg: "#FFE4D6", icon: "#EA580C" },
  butter: { bg: "#FEF3C7", icon: "#D97706" },
  rose: { bg: "#FFE1E6", icon: "#E11D48" },
};
// ---------------------------------------------------------------------------

export default function SendParcelScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const pageBg = isDark ? theme.background : "#f4f4f4";
  const cardBg = isDark ? theme.surface : "#FFFFFF";
  const tileBg = isDark ? theme.background : "#F4F4F1";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pickupAddress, setPickupAddress] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  const [isPerishable, setIsPerishable] = useState(false);
  const [isFragile, setIsFragile] = useState(false);

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [dispatchDateStart, setDispatchDateStart] = useState(new Date());
  const [dispatchDateEnd, setDispatchDateEnd] = useState(new Date());
  const [availabilityStart, setAvailabilityStart] = useState(new Date());
  const [availabilityEnd, setAvailabilityEnd] = useState(new Date());

  // Modal states
  const [showStartDateModal, setShowStartDateModal] = useState(false);
  const [showEndDateModal, setShowEndDateModal] = useState(false);
  const [showStartTimeModal, setShowStartTimeModal] = useState(false);
  const [showEndTimeModal, setShowEndTimeModal] = useState(false);

  const [tempDate, setTempDate] = useState(new Date());
  const [tempTime, setTempTime] = useState(new Date());

  const [locationSelectionTarget, setLocationSelectionTarget] = useState<
    "PICKUP" | "DESTINATION" | null
  >(null);
  const [overviewModalVisible, setOverviewModalVisible] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const openDateModal = (type: "start" | "end") => {
    if (type === "start") {
      setTempDate(dispatchDateStart);
      setShowStartDateModal(true);
    } else {
      setTempDate(dispatchDateEnd);
      setShowEndDateModal(true);
    }
  };

  const openTimeModal = (type: "start" | "end") => {
    if (type === "start") {
      setTempTime(availabilityStart);
      setShowStartTimeModal(true);
    } else {
      setTempTime(availabilityEnd);
      setShowEndTimeModal(true);
    }
  };

  const confirmDate = (type: "start" | "end") => {
    if (type === "start") setDispatchDateStart(tempDate);
    else setDispatchDateEnd(tempDate);

    setShowStartDateModal(false);
    setShowEndDateModal(false);
  };

  const confirmTime = (type: "start" | "end") => {
    if (type === "start") setAvailabilityStart(tempTime);
    else setAvailabilityEnd(tempTime);

    setShowStartTimeModal(false);
    setShowEndTimeModal(false);
  };

  const handleOpenOverview = () => {
    if (
      !pickupAddress.trim() ||
      !selectedCity.trim() ||
      !minPrice.trim() ||
      !maxPrice.trim()
    ) {
      setError("Please fill out all required fields.");
      setSubmissionStatus("error");
      setOverviewModalVisible(true);
      return;
    }

    setError(null);
    setSubmissionStatus("idle");
    setOverviewModalVisible(true);
  };

  const handleConfirmSubmit = async () => {
    const requestPayload = {
      pickupAddress: pickupAddress.trim(),
      destinationCity: selectedCity,
      properties: { isPerishable, isFragile },
      priceRange: {
        min: Number(minPrice) || 0,
        max: Number(maxPrice) || 0,
      },
      dispatchDateStart: dispatchDateStart.toISOString(),
      dispatchDateEnd: dispatchDateEnd.toISOString(),
      availabilityWindow: {
        from: availabilityStart.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        to: availabilityEnd.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
      status: "pending" as const,
    };

    setLoading(true);
    setError(null);

    try {
      const result = await dispatch(createParcelRequest(requestPayload));
      if (createParcelRequest.fulfilled.match(result)) {
        setSubmissionStatus("success");
      } else {
        setSubmissionStatus("error");
        setError("Failed to post your request. Please try again.");
      }
    } catch (err: any) {
      setSubmissionStatus("error");
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectHubValue = (hubName: string) => {
    if (locationSelectionTarget === "PICKUP") {
      setPickupAddress(hubName);
    } else if (locationSelectionTarget === "DESTINATION") {
      setSelectedCity(hubName);
    }
    setLocationSelectionTarget(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: pageBg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={styles.headerWrap}>
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backButton, { backgroundColor: cardBg }]}
              activeOpacity={0.7}
            >
              <ArrowLeft size={19} color={theme.text} />
            </TouchableOpacity>

            <AppText size={17} weight="bold" color={theme.text}>
              Deliver a Parcel
            </AppText>

            <View style={{ width: 38 }} />
          </View>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
      >
        <ScrollView
          style={styles.mainScrollView}
          contentContainerStyle={styles.scrollContentLayout}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* PICKUP */}
          <AppText
            size={11}
            weight="bold"
            color={theme.textMuted}
            style={styles.sectionTitle}
          >
            PICKUP LOCATION
          </AppText>
          <TouchableOpacity
            activeOpacity={0.75}
            style={[styles.inputCard, { backgroundColor: cardBg }, SHADOW_SM]}
            onPress={() => setLocationSelectionTarget("PICKUP")}
          >
            <View
              style={[
                styles.fieldIconChip,
                { backgroundColor: PASTELS.sky.bg },
              ]}
            >
              <MapPin size={16} color={PASTELS.sky.icon} />
            </View>
            <AppText
              size={15}
              color={pickupAddress ? theme.text : theme.textMuted}
              style={{ flex: 1, marginLeft: 12 }}
            >
              {pickupAddress || "Select pickup terminal hub..."}
            </AppText>
            <View
              style={[
                styles.choosePill,
                { backgroundColor: `${theme.primary}16` },
              ]}
            >
              <AppText size={12} weight="bold" color={theme.primary}>
                Choose
              </AppText>
            </View>
          </TouchableOpacity>

          {/* DESTINATION */}
          <AppText
            size={11}
            weight="bold"
            color={theme.textMuted}
            style={styles.sectionTitle}
          >
            DESTINATION HUB
          </AppText>
          <TouchableOpacity
            activeOpacity={0.75}
            style={[styles.inputCard, { backgroundColor: cardBg }, SHADOW_SM]}
            onPress={() => setLocationSelectionTarget("DESTINATION")}
          >
            <View
              style={[
                styles.fieldIconChip,
                { backgroundColor: PASTELS.rose.bg },
              ]}
            >
              <Flag size={16} color={PASTELS.rose.icon} />
            </View>
            <AppText
              size={15}
              color={selectedCity ? theme.text : theme.textMuted}
              style={{ flex: 1, marginLeft: 12 }}
            >
              {selectedCity || "Select target destination city center..."}
            </AppText>
            <View
              style={[
                styles.choosePill,
                { backgroundColor: `${theme.primary}16` },
              ]}
            >
              <AppText size={12} weight="bold" color={theme.primary}>
                Choose
              </AppText>
            </View>
          </TouchableOpacity>

          {/* SPECIAL HANDLING */}
          <AppText
            size={11}
            weight="bold"
            color={theme.textMuted}
            style={styles.sectionTitle}
          >
            SPECIAL HANDLING
          </AppText>
          <View style={[styles.card, { backgroundColor: cardBg }, SHADOW_SM]}>
            <View style={styles.toggleRow}>
              <View
                style={[
                  styles.fieldIconChip,
                  { backgroundColor: PASTELS.peach.bg },
                ]}
              >
                <PackageOpen size={16} color={PASTELS.peach.icon} />
              </View>
              <View style={[styles.toggleLabel, { marginLeft: 12 }]}>
                <AppText size={16} weight="bold" color={theme.text}>
                  Perishable Goods
                </AppText>
                <AppText
                  size={13}
                  color={theme.textMuted}
                  style={{ marginTop: 2 }}
                >
                  Spoils easily or time-sensitive
                </AppText>
              </View>
              <Switch
                value={isPerishable}
                onValueChange={setIsPerishable}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={Platform.OS === "android" ? "#FFFFFF" : undefined}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.toggleRow}>
              <View
                style={[
                  styles.fieldIconChip,
                  { backgroundColor: PASTELS.lavender.bg },
                ]}
              >
                <Wine size={16} color={PASTELS.lavender.icon} />
              </View>
              <View style={[styles.toggleLabel, { marginLeft: 12 }]}>
                <AppText size={16} weight="bold" color={theme.text}>
                  Fragile Items
                </AppText>
                <AppText
                  size={13}
                  color={theme.textMuted}
                  style={{ marginTop: 2 }}
                >
                  Requires gentle handling
                </AppText>
              </View>
              <Switch
                value={isFragile}
                onValueChange={setIsFragile}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={Platform.OS === "android" ? "#FFFFFF" : undefined}
              />
            </View>
          </View>

          {/* DISPATCH WINDOW */}
          <AppText
            size={11}
            weight="bold"
            color={theme.textMuted}
            style={styles.sectionTitle}
          >
            DISPATCH DATE WINDOW
          </AppText>
          <View style={styles.row}>
            <TouchableOpacity
              activeOpacity={0.75}
              style={[
                styles.dateButton,
                { backgroundColor: cardBg },
                SHADOW_SM,
              ]}
              onPress={() => openDateModal("start")}
            >
              <View
                style={[
                  styles.smallIconChip,
                  { backgroundColor: PASTELS.butter.bg },
                ]}
              >
                <Calendar size={15} color={PASTELS.butter.icon} />
              </View>
              <AppText size={13.5} color={theme.text} style={{ marginLeft: 8 }}>
                Start: {dispatchDateStart.toLocaleDateString()}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              style={[
                styles.dateButton,
                { backgroundColor: cardBg },
                SHADOW_SM,
              ]}
              onPress={() => openDateModal("end")}
            >
              <View
                style={[
                  styles.smallIconChip,
                  { backgroundColor: PASTELS.butter.bg },
                ]}
              >
                <Calendar size={15} color={PASTELS.butter.icon} />
              </View>
              <AppText size={13.5} color={theme.text} style={{ marginLeft: 8 }}>
                End: {dispatchDateEnd.toLocaleDateString()}
              </AppText>
            </TouchableOpacity>
          </View>

          {/* AVAILABILITY WINDOW */}
          <AppText
            size={11}
            weight="bold"
            color={theme.textMuted}
            style={styles.sectionTitle}
          >
            RIDER AVAILABILITY WINDOW
          </AppText>
          <View style={styles.row}>
            <TouchableOpacity
              activeOpacity={0.75}
              style={[
                styles.dateButton,
                { backgroundColor: cardBg },
                SHADOW_SM,
              ]}
              onPress={() => openTimeModal("start")}
            >
              <View
                style={[
                  styles.smallIconChip,
                  { backgroundColor: PASTELS.mint.bg },
                ]}
              >
                <Clock size={15} color={PASTELS.mint.icon} />
              </View>
              <AppText size={13.5} color={theme.text} style={{ marginLeft: 8 }}>
                From:{" "}
                {availabilityStart.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              style={[
                styles.dateButton,
                { backgroundColor: cardBg },
                SHADOW_SM,
              ]}
              onPress={() => openTimeModal("end")}
            >
              <View
                style={[
                  styles.smallIconChip,
                  { backgroundColor: PASTELS.mint.bg },
                ]}
              >
                <Clock size={15} color={PASTELS.mint.icon} />
              </View>
              <AppText size={13.5} color={theme.text} style={{ marginLeft: 8 }}>
                To:{" "}
                {availabilityEnd.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </AppText>
            </TouchableOpacity>
          </View>

          {/* BUDGET */}
          <AppText
            size={11}
            weight="bold"
            color={theme.textMuted}
            style={styles.sectionTitle}
          >
            BUDGET RANGE (₦)
          </AppText>
          <View style={styles.row}>
            <View
              style={[
                styles.priceInput,
                { backgroundColor: cardBg },
                SHADOW_SM,
              ]}
            >
              <View
                style={[
                  styles.smallIconChip,
                  { backgroundColor: PASTELS.mint.bg },
                ]}
              >
                <Banknote size={15} color={PASTELS.mint.icon} />
              </View>
              <TextInput
                placeholder="Min"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                style={[
                  styles.priceTextInput,
                  { color: theme.text, marginLeft: 10 },
                ]}
                value={minPrice}
                onChangeText={setMinPrice}
              />
            </View>

            <View
              style={[
                styles.priceInput,
                { backgroundColor: cardBg },
                SHADOW_SM,
              ]}
            >
              <View
                style={[
                  styles.smallIconChip,
                  { backgroundColor: PASTELS.mint.bg },
                ]}
              >
                <Banknote size={15} color={PASTELS.mint.icon} />
              </View>
              <TextInput
                placeholder="Max"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                style={[
                  styles.priceTextInput,
                  { color: theme.text, marginLeft: 10 },
                ]}
                value={maxPrice}
                onChangeText={setMaxPrice}
              />
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.primaryButton,
              { backgroundColor: theme.primary, marginBottom: 78 },
              SHADOW_MD,
            ]}
            onPress={handleOpenOverview}
          >
            <AppText size={16} weight="bold" color="#fff">
              Review & Post Request
            </AppText>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Location Selection Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={locationSelectionTarget !== null}
        onRequestClose={() => setLocationSelectionTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            onPress={() => setLocationSelectionTarget(null)}
          />
          <View
            style={[
              styles.modalContent,
              { backgroundColor: cardBg, height: "82%" },
              SHADOW_MD,
            ]}
          >
            <View
              style={[styles.modalKnob, { backgroundColor: theme.border }]}
            />

            <AppText
              size={18}
              weight="bold"
              color={theme.text}
              style={{ paddingHorizontal: 24 }}
            >
              Select{" "}
              {locationSelectionTarget === "PICKUP"
                ? "Pickup Hub"
                : "Destination Hub"}
            </AppText>
            <AppText
              size={13}
              color={theme.textMuted}
              style={{ paddingHorizontal: 24, marginBottom: 12 }}
            >
              Choose across all national trade corridors
            </AppText>

            <View style={{ flex: 1 }}>
              <NigeriaCitiesGrid
                onCityPress={(city) => selectHubValue(city.name)}
              />
            </View>

            <View
              style={{
                padding: 24,
                paddingBottom: Platform.OS === "ios" ? 34 : 20,
              }}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.primaryButton, { backgroundColor: tileBg }]}
                onPress={() => setLocationSelectionTarget(null)}
              >
                <AppText size={16} weight="bold" color={theme.text}>
                  Cancel
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Overview / Submission Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={overviewModalVisible}
        onRequestClose={() => setOverviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            onPress={() => setOverviewModalVisible(false)}
          />

          <View
            style={[
              styles.modalContent,
              { backgroundColor: cardBg },
              SHADOW_MD,
            ]}
          >
            <View
              style={[styles.modalKnob, { backgroundColor: theme.border }]}
            />

            {submissionStatus === "idle" && (
              <View style={{ paddingHorizontal: 24 }}>
                <AppText size={19} weight="bold" color={theme.text}>
                  Order Summary
                </AppText>
                <AppText
                  size={13}
                  color={theme.textMuted}
                  style={{ marginTop: 2 }}
                >
                  Please check everything before posting
                </AppText>

                <View style={[styles.summaryCard, { backgroundColor: tileBg }]}>
                  <View style={styles.summaryRow}>
                    <AppText size={13} color={theme.textMuted}>
                      Pickup
                    </AppText>
                    <AppText size={14} weight="semibold" color={theme.text}>
                      {pickupAddress}
                    </AppText>
                  </View>
                  <View style={styles.summaryRow}>
                    <AppText size={13} color={theme.textMuted}>
                      Destination
                    </AppText>
                    <AppText size={14} weight="semibold" color={theme.text}>
                      {selectedCity}
                    </AppText>
                  </View>
                  <View style={styles.summaryRow}>
                    <AppText size={13} color={theme.textMuted}>
                      Handling
                    </AppText>
                    <AppText size={14} weight="semibold" color={theme.text}>
                      {isPerishable ? "Perishable" : "Standard"} •{" "}
                      {isFragile ? "Fragile" : "Normal"}
                    </AppText>
                  </View>
                  <View style={styles.summaryRow}>
                    <AppText size={13} color={theme.textMuted}>
                      Dates
                    </AppText>
                    <AppText size={14} weight="semibold" color={theme.text}>
                      {dispatchDateStart.toLocaleDateString()} —{" "}
                      {dispatchDateEnd.toLocaleDateString()}
                    </AppText>
                  </View>
                  <View style={styles.summaryRow}>
                    <AppText size={13} color={theme.textMuted}>
                      Time
                    </AppText>
                    <AppText size={14} weight="semibold" color={theme.text}>
                      {availabilityStart.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      —{" "}
                      {availabilityEnd.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </AppText>
                  </View>
                  <View
                    style={[
                      styles.summaryRow,
                      { borderBottomWidth: 0, paddingBottom: 0 },
                    ]}
                  >
                    <AppText size={13} color={theme.textMuted}>
                      Budget
                    </AppText>
                    <AppText size={17} weight="bold" color={theme.primary}>
                      ₦{minPrice} — ₦{maxPrice}
                    </AppText>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: theme.primary,
                      marginTop: 4,
                      marginBottom: 78,
                    },
                    SHADOW_MD,
                  ]}
                  onPress={handleConfirmSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <AppText size={16} weight="bold" color="#fff">
                      Confirm & Post
                    </AppText>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {submissionStatus === "success" && (
              <View style={styles.centerContent}>
                <View
                  style={[
                    styles.statusCircle,
                    { backgroundColor: PASTELS.mint.bg },
                  ]}
                >
                  <CheckCircle size={40} color={PASTELS.mint.icon} />
                </View>
                <AppText size={20} weight="bold" color={theme.text}>
                  Request Posted!
                </AppText>
                <AppText
                  size={15}
                  color={theme.textMuted}
                  style={{ textAlign: "center", marginTop: 8 }}
                >
                  Riders will see your parcel request shortly.
                </AppText>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: theme.primary,
                      marginTop: 32,
                      width: "100%",
                    },
                  ]}
                  onPress={() => {
                    setOverviewModalVisible(false);
                    router.back();
                  }}
                >
                  <AppText size={16} weight="bold" color="#fff">
                    Back to Home
                  </AppText>
                </TouchableOpacity>
              </View>
            )}

            {submissionStatus === "error" && (
              <View style={styles.centerContent}>
                <View
                  style={[
                    styles.statusCircle,
                    { backgroundColor: PASTELS.rose.bg },
                  ]}
                >
                  <XCircle size={40} color={PASTELS.rose.icon} />
                </View>
                <AppText size={20} weight="bold" color={theme.text}>
                  Submission Failed
                </AppText>
                <AppText
                  size={15}
                  color={theme.textMuted}
                  style={{ textAlign: "center", marginTop: 8 }}
                >
                  {error}
                </AppText>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: PASTELS.rose.icon,
                      marginTop: 32,
                      width: "90%",
                    },
                  ]}
                  onPress={() => setOverviewModalVisible(false)}
                >
                  <AppText size={16} weight="bold" color="#fff">
                    Try Again
                  </AppText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ==================== DATE & TIME PICKER MODALS ==================== */}

      {/* Start Date Modal */}
      <Modal
        visible={showStartDateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStartDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.pickerModalContent, { backgroundColor: cardBg }]}
          >
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setShowStartDateModal(false)}>
                <AppText size={16} color={theme.textMuted}>
                  Cancel
                </AppText>
              </TouchableOpacity>
              <AppText size={17} weight="bold" color={theme.text}>
                Select Start Date
              </AppText>
              <TouchableOpacity onPress={() => confirmDate("start")}>
                <AppText size={16} weight="bold" color={theme.primary}>
                  Done
                </AppText>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              // If you are on Android, you can also force the theme (optional)
              themeVariant={isDark ? "dark" : "light"}
              onChange={(_, selectedDate) => {
                if (selectedDate) setTempDate(selectedDate);
              }}
            />
          </View>
        </View>
      </Modal>

      {/* End Date Modal */}
      <Modal
        visible={showEndDateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEndDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.pickerModalContent, { backgroundColor: cardBg }]}
          >
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setShowEndDateModal(false)}>
                <AppText size={16} color={theme.textMuted}>
                  Cancel
                </AppText>
              </TouchableOpacity>
              <AppText size={17} weight="bold" color={theme.text}>
                Select End Date
              </AppText>
              <TouchableOpacity onPress={() => confirmDate("end")}>
                <AppText size={16} weight="bold" color={theme.primary}>
                  Done
                </AppText>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              onChange={(_, selectedDate) => {
                if (selectedDate) setTempDate(selectedDate);
              }}
              themeVariant={isDark ? "dark" : "light"}
            />
          </View>
        </View>
      </Modal>

      {/* Start Time Modal */}
      <Modal
        visible={showStartTimeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStartTimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.pickerModalContent, { backgroundColor: cardBg }]}
          >
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setShowStartTimeModal(false)}>
                <AppText size={16} color={theme.textMuted}>
                  Cancel
                </AppText>
              </TouchableOpacity>
              <AppText size={17} weight="bold" color={theme.text}>
                Select Start Time
              </AppText>
              <TouchableOpacity onPress={() => confirmTime("start")}>
                <AppText size={16} weight="bold" color={theme.primary}>
                  Done
                </AppText>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={tempTime}
              mode="time"
              display="spinner"
              onChange={(_, selectedTime) => {
                if (selectedTime) setTempTime(selectedTime);
              }}
              themeVariant={isDark ? "dark" : "light"}
            />
          </View>
        </View>
      </Modal>

      {/* End Time Modal */}
      <Modal
        visible={showEndTimeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEndTimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.pickerModalContent, { backgroundColor: cardBg }]}
          >
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setShowEndTimeModal(false)}>
                <AppText size={16} color={theme.textMuted}>
                  Cancel
                </AppText>
              </TouchableOpacity>
              <AppText size={17} weight="bold" color={theme.text}>
                Select End Time
              </AppText>
              <TouchableOpacity onPress={() => confirmTime("end")}>
                <AppText size={16} weight="bold" color={theme.primary}>
                  Done
                </AppText>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={tempTime}
              mode="time"
              display="spinner"
              onChange={(_, selectedTime) => {
                if (selectedTime) setTempTime(selectedTime);
              }}
              themeVariant={isDark ? "dark" : "light"}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrap: { paddingBottom: 4 },
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
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
  },

  keyboardContainer: { flex: 1 },
  mainScrollView: { flex: 1 },
  scrollContentLayout: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },

  sectionTitle: {
    marginBottom: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    paddingHorizontal: 4,
  },

  inputCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 62,
    borderRadius: 64,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  fieldIconChip: {
    width: 32,
    height: 32,
    borderRadius: 64,
    justifyContent: "center",
    alignItems: "center",
  },
  smallIconChip: {
    width: 26,
    height: 26,
    borderRadius: 64,
    justifyContent: "center",
    alignItems: "center",
  },
  choosePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 64,
  },

  card: {
    borderRadius: 32,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 24,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  toggleLabel: { flex: 1 },
  divider: { height: 1, marginVertical: 4 },

  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  dateButton: {
    flex: 1,
    height: 56,
    borderRadius: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  priceInput: {
    flex: 1,
    height: 56,
    borderRadius: 64,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  priceTextInput: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },

  primaryButton: {
    height: 56,
    borderRadius: 64,
    justifyContent: "center",
    alignItems: "center",
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(10, 8, 20, 0.55)",
  },
  modalDismissArea: { flex: 1 },
  modalContent: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: 0,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
  },
  modalKnob: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
    marginVertical: 12,
  },

  summaryCard: {
    borderRadius: RADIUS.lg,
    padding: 18,
    marginVertical: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(120, 120, 140, 0.14)",
  },

  centerContent: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  statusCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  /* Picker Modals */
  pickerModalContent: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    minHeight: 380,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150,150,170,0.15)",
  },
});
