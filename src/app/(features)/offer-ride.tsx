import React, { useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Modal,
  Dimensions,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/api/store";
import { createRide } from "@/api/slices/ride.slice";
import { AppText } from "@/components/AppText";
import { NigeriaCitiesGrid } from "@/components/NigeriaCitiesGrid";
import {
  ArrowLeft,
  MapPin,
  Flag,
  Clock,
  Users,
  Banknote,
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const HOURS = [
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
  "21",
];
const MINUTES = ["00", "15", "30", "45"];
const PERIODS = ["AM", "PM"];

// Soft pastel chip palette, one tint per field, matching the reference mood
// board's colored icon squares.
const PASTELS = {
  sky: { bg: "#DBEAFE", icon: "#2563EB" },
  lavender: { bg: "#EDE9FE", icon: "#7C3AED" },
  mint: { bg: "#D1FAE5", icon: "#059669" },
  peach: { bg: "#FFE4D6", icon: "#EA580C" },
  butter: { bg: "#FEF3C7", icon: "#D97706" },
  rose: { bg: "#FFE1E6", icon: "#E11D48" },
};

export default function OfferRideScreen() {
  const { theme: colors, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const pageBg = isDark ? colors.background : "#f4f4f";
  const cardBg = isDark ? colors.surface : "#FFFFFF";
  const tileBg = isDark ? colors.background : "#F4F4F1";

  // ==================== LOCAL STATE ====================
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Form fields
  const [pickupPoint, setPickupPoint] = useState("");
  const [dropoffPoint, setDropoffPoint] = useState("");
  const [availableSeats, setAvailableSeats] = useState("3");
  const [estimatedFare, setEstimatedFare] = useState("");
  const [notes, setNotes] = useState("");

  const [selectedHour, setSelectedHour] = useState("08");
  const [selectedMinute, setSelectedMinute] = useState("30");
  const [selectedPeriod, setSelectedPeriod] = useState("AM");

  // Modals
  const [locationTargetType, setLocationTargetType] = useState<
    "PICKUP" | "DROPOFF" | null
  >(null);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [overviewModalVisible, setOverviewModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [localError, setLocalError] = useState("");

  const formattedDepartureTime = `${selectedHour}:${selectedMinute} ${selectedPeriod}`;

  // ==================== VALIDATION ====================
  const validateAndOpenOverview = () => {
    console.log("Checking form...");

    if (!pickupPoint || !dropoffPoint || !estimatedFare || !availableSeats) {
      const msg = "Please fill in all fields.";
      setLocalError(msg);
      setErrorModalVisible(true);
      return;
    }

    if (pickupPoint === dropoffPoint) {
      const msg = "Pickup and dropoff cannot be the same place.";
      setLocalError(msg);
      setErrorModalVisible(true);
      return;
    }

    setOverviewModalVisible(true);
  };

  // ==================== SUBMIT RIDE OFFER ====================
  const handleFinalPublishCommit = async () => {
    const rideData = {
      pickupPoint,
      dropoffPoint,
      departureTime: formattedDepartureTime,
      availableSeats: Number(availableSeats),
      estimatedFare: Number(estimatedFare),
      notes: notes.trim(),
      status: "active" as const,
    };

    setOverviewModalVisible(false);
    setIsLoading(true);
    setError("");
    setLocalError("");

    try {
      const result = await dispatch(createRide(rideData));

      if (createRide.fulfilled.match(result)) {
        setSuccessModalVisible(true);
      } else {
        const msg = result.payload || "Failed to post ride. Please try again.";
        setLocalError(msg);
        setErrorModalVisible(true);
      }
    } catch (err: any) {
      const msg =
        "Something went wrong. Please check your internet and try again.";
      setLocalError(msg);
      setErrorModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const openLocationSelection = (type: "PICKUP" | "DROPOFF") => {
    setLocationTargetType(type);
  };

  const selectLocationValue = (location: string) => {
    if (locationTargetType === "PICKUP") setPickupPoint(location);
    else if (locationTargetType === "DROPOFF") setDropoffPoint(location);
    setLocationTargetType(null);
  };

  const resetForm = () => {
    setPickupPoint("");
    setDropoffPoint("");
    setAvailableSeats("3");
    setEstimatedFare("");
    setNotes("");
    setSelectedHour("08");
    setSelectedMinute("30");
    setSelectedPeriod("AM");
  };

  return (
    <View style={[styles.container, { backgroundColor: pageBg }]}>
    
      {/* HEADER */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[styles.circleButton, { backgroundColor: cardBg }]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={19} color={colors.text} />
          </TouchableOpacity>
          <AppText size={17} weight="bold" color={colors.text}>
            Offer a Ride
          </AppText>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <AppText
          size={18}
          weight="bold"
          color={colors.text}
          style={{ marginBottom: 8 }}
        >
          Offer a Ride
        </AppText>
        <AppText
          size={13}
          color={colors.textMuted}
          style={{ marginBottom: 24 }}
        >
          Fill the information below so passengers can see your ride.
        </AppText>

        {/* Pickup */}
        <View style={styles.inputGroupFieldWrapper}>
          <AppText
            size={12}
            weight="bold"
            color={colors.textMuted}
            style={styles.inputLabelHint}
          >
            PICKUP LOCATION
          </AppText>
          <TouchableOpacity
            style={[styles.inputFieldBoxContainer, { backgroundColor: cardBg }]}
            onPress={() => openLocationSelection("PICKUP")}
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
              color={pickupPoint ? colors.text : colors.textMuted}
              style={{ flex: 1, marginLeft: 12 }}
            >
              {pickupPoint || "Choose dynamic city hub"}
            </AppText>
            <AppText size={13} weight="bold" color={colors.primary}>
              Choose
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Dropoff */}
        <View style={styles.inputGroupFieldWrapper}>
          <AppText
            size={12}
            weight="bold"
            color={colors.textMuted}
            style={styles.inputLabelHint}
          >
            DROPOFF LOCATION
          </AppText>
          <TouchableOpacity
            style={[styles.inputFieldBoxContainer, { backgroundColor: cardBg }]}
            onPress={() => openLocationSelection("DROPOFF")}
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
              color={dropoffPoint ? colors.text : colors.textMuted}
              style={{ flex: 1, marginLeft: 12 }}
            >
              {dropoffPoint || "Choose dynamic city hub"}
            </AppText>
            <AppText size={13} weight="bold" color={colors.primary}>
              Choose
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Time and Seats */}
        <View style={styles.twoColumnInputsGridLayout}>
          <View style={[styles.inputGroupFieldWrapper, { flex: 1 }]}>
            <AppText
              size={12}
              weight="bold"
              color={colors.textMuted}
              style={styles.inputLabelHint}
            >
              DEPARTURE TIME
            </AppText>
            <TouchableOpacity
              style={[
                styles.inputFieldBoxContainer,
                { backgroundColor: cardBg },
              ]}
              onPress={() => setTimePickerVisible(true)}
            >
              <View
                style={[
                  styles.fieldIconChip,
                  { backgroundColor: PASTELS.lavender.bg },
                ]}
              >
                <Clock size={16} color={PASTELS.lavender.icon} />
              </View>
              <AppText size={14} color={colors.text} style={{ marginLeft: 10 }}>
                {formattedDepartureTime}
              </AppText>
            </TouchableOpacity>
          </View>

          <View style={[styles.inputGroupFieldWrapper, { flex: 1 }]}>
            <AppText
              size={12}
              weight="bold"
              color={colors.textMuted}
              style={styles.inputLabelHint}
            >
              AVAILABLE SEATS
            </AppText>
            <View
              style={[
                styles.inputFieldBoxContainer,
                { backgroundColor: cardBg },
              ]}
            >
              <View
                style={[
                  styles.fieldIconChip,
                  { backgroundColor: PASTELS.mint.bg },
                ]}
              >
                <Users size={16} color={PASTELS.mint.icon} />
              </View>
              <TextInput
                keyboardType="numeric"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.textInputCore,
                  { color: colors.text, marginLeft: 10 },
                ]}
                value={availableSeats}
                onChangeText={setAvailableSeats}
              />
            </View>
          </View>
        </View>

        {/* Fare */}
        <View style={styles.inputGroupFieldWrapper}>
          <AppText
            size={12}
            weight="bold"
            color={colors.textMuted}
            style={styles.inputLabelHint}
          >
            FARE PER PASSENGER (₦)
          </AppText>
          <View
            style={[styles.inputFieldBoxContainer, { backgroundColor: cardBg }]}
          >
            <View
              style={[
                styles.fieldIconChip,
                { backgroundColor: PASTELS.butter.bg },
              ]}
            >
              <Banknote size={16} color={PASTELS.butter.icon} />
            </View>
            <TextInput
              keyboardType="numeric"
              placeholder="Example: 2500"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.textInputCore,
                { color: colors.text, marginLeft: 12 },
              ]}
              value={estimatedFare}
              onChangeText={setEstimatedFare}
            />
          </View>
        </View>

        {/* Notes */}
        <View style={styles.inputGroupFieldWrapper}>
          <AppText
            size={12}
            weight="bold"
            color={colors.textMuted}
            style={styles.inputLabelHint}
          >
            ADDITIONAL NOTES / SPECIFICATIONS (OPTIONAL)
          </AppText>
          <View
            style={[
              styles.notesFieldInputBoxContainer,
              { backgroundColor: cardBg },
            ]}
          >
            <View
              style={[
                styles.fieldIconChip,
                { backgroundColor: PASTELS.peach.bg, marginTop: 12 },
              ]}
            >
              <FileText size={16} color={PASTELS.peach.icon} />
            </View>
            <TextInput
              placeholder="E.g., No heavy boxes, AC is fully operational..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={[
                styles.textInputCore,
                { color: colors.text, paddingTop: 12, marginLeft: 12 },
              ]}
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </View>

        {/* Main Button */}
        <TouchableOpacity
          style={[
            styles.primaryActionFormSubmitBtn,
            { backgroundColor: colors.primary, marginBottom: 64 },
          ]}
          onPress={validateAndOpenOverview}
          disabled={isLoading}
        >
          <AppText size={16} weight="bold" color="#FFF">
            Review and Post Ride
          </AppText>
        </TouchableOpacity>
      </ScrollView>

      {/* ====================== EXCLUSIVE CITIES SELECTION MODAL ====================== */}
      <Modal
        animationType="fade"
        transparent
        visible={locationTargetType !== null}
        onRequestClose={() => setLocationTargetType(null)}
      >
        <View style={styles.darkBlurBackdropOverlay}>
          <View
            style={[
              styles.bottomSheetPresentationFrame,
              { backgroundColor: cardBg },
            ]}
          >
            <AppText
              size={17}
              weight="bold"
              color={colors.text}
              style={{ marginBottom: 4, paddingHorizontal: 24 }}
            >
              Select City
            </AppText>
            <AppText
              size={13}
              color={colors.textMuted}
              style={{ marginBottom: 16, paddingHorizontal: 24 }}
            >
              Select a city route node to configure parameters.
            </AppText>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: SCREEN_HEIGHT * 0.65 }}
            >
              <View style={styles.gridInModalWrapper}>
                <NigeriaCitiesGrid
                  onCityPress={(city) => selectLocationValue(city.name)}
                />
              </View>
            </ScrollView>

            <View
              style={{
                paddingHorizontal: 24,
                paddingBottom: 24,
                paddingTop: 12,
              }}
            >
              <TouchableOpacity
                style={[
                  styles.dismissActionPillControl,
                  { backgroundColor: tileBg, marginBottom: 64 },
                ]}
                onPress={() => setLocationTargetType(null)}
              >
                <AppText size={14} weight="bold" color={colors.text}>
                  Cancel
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ====================== TIME PICKER MODAL ====================== */}
      <Modal
        animationType="fade"
        transparent
        visible={timePickerVisible}
        onRequestClose={() => setTimePickerVisible(false)}
      >
        <View style={styles.darkBlurBackdropOverlay}>
          <View
            style={[
              styles.timePickerSpinnerCardBox,
              { backgroundColor: cardBg },
            ]}
          >
            <AppText
              size={16}
              weight="bold"
              color={colors.text}
              style={{ textAlign: "center", marginBottom: 16 }}
            >
              Choose Departure Time
            </AppText>
            <View style={styles.spinnerColumnsHorizontalStack}>
              <ScrollView
                style={styles.wheelScrollColumnFrame}
                showsVerticalScrollIndicator={false}
              >
                {HOURS.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[
                      styles.wheelSelectionCellRow,
                      selectedHour === h && {
                        backgroundColor: PASTELS.lavender.bg,
                      },
                    ]}
                    onPress={() => setSelectedHour(h)}
                  >
                    <AppText
                      size={17}
                      weight={selectedHour === h ? "bold" : "medium"}
                      color={
                        selectedHour === h ? PASTELS.lavender.icon : colors.text
                      }
                    >
                      {h}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <ScrollView
                style={styles.wheelScrollColumnFrame}
                showsVerticalScrollIndicator={false}
              >
                {MINUTES.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.wheelSelectionCellRow,
                      selectedMinute === m && {
                        backgroundColor: PASTELS.lavender.bg,
                      },
                    ]}
                    onPress={() => setSelectedMinute(m)}
                  >
                    <AppText
                      size={17}
                      weight={selectedMinute === m ? "bold" : "medium"}
                      color={
                        selectedMinute === m
                          ? PASTELS.lavender.icon
                          : colors.text
                      }
                    >
                      {m}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.wheelScrollColumnFrame}>
                {PERIODS.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.wheelSelectionCellRow,
                      selectedPeriod === p && {
                        backgroundColor: PASTELS.lavender.bg,
                      },
                      { height: 50 },
                    ]}
                    onPress={() => setSelectedPeriod(p)}
                  >
                    <AppText
                      size={17}
                      weight={selectedPeriod === p ? "bold" : "medium"}
                      color={
                        selectedPeriod === p
                          ? PASTELS.lavender.icon
                          : colors.text
                      }
                    >
                      {p}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.primaryActionFormSubmitBtn,
                { backgroundColor: colors.primary, marginTop: 20 },
              ]}
              onPress={() => setTimePickerVisible(false)}
            >
              <AppText size={15} weight="bold" color="#FFF">
                Done
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ====================== REVIEW MODAL ====================== */}
      <Modal
        animationType="slide"
        transparent
        visible={overviewModalVisible}
        onRequestClose={() => setOverviewModalVisible(false)}
      >
        <View style={styles.darkBlurBackdropOverlay}>
          <View
            style={[
              styles.bottomSheetPresentationFrame,
              { backgroundColor: cardBg },
            ]}
          >
            <View style={{ paddingHorizontal: 24 }}>
              <AppText size={18} weight="bold" color={colors.text}>
                Review Your Ride
              </AppText>
              <AppText
                size={13}
                color={colors.textMuted}
                style={{ marginBottom: 20 }}
              >
                Please check everything before posting
              </AppText>
              <View
                style={[
                  styles.overviewDataSheetWrapper,
                  { backgroundColor: tileBg },
                ]}
              >
                <View style={styles.overviewDataMetricRowItem}>
                  <AppText size={14} color={colors.textMuted}>
                    Pickup
                  </AppText>
                  <AppText size={15} weight="bold" color={colors.text}>
                    {pickupPoint}
                  </AppText>
                </View>
                <View style={styles.overviewDataMetricRowItem}>
                  <AppText size={14} color={colors.textMuted}>
                    Dropoff
                  </AppText>
                  <AppText size={15} weight="bold" color={colors.text}>
                    {dropoffPoint}
                  </AppText>
                </View>
                <View style={styles.overviewDataMetricRowItem}>
                  <AppText size={14} color={colors.textMuted}>
                    Time
                  </AppText>
                  <AppText size={15} weight="bold" color={colors.text}>
                    {formattedDepartureTime}
                  </AppText>
                </View>
                <View style={styles.overviewDataMetricRowItem}>
                  <AppText size={14} color={colors.textMuted}>
                    Seats
                  </AppText>
                  <AppText size={15} weight="bold" color={colors.text}>
                    {availableSeats}
                  </AppText>
                </View>
                {notes.trim().length > 0 && (
                  <View style={styles.overviewDataMetricRowItem}>
                    <AppText size={14} color={colors.textMuted}>
                      Notes
                    </AppText>
                    <AppText
                      size={13}
                      weight="semibold"
                      color={colors.text}
                      numberOfLines={2}
                      style={{ flex: 1, textAlign: "right", marginLeft: 20 }}
                    >
                      {notes}
                    </AppText>
                  </View>
                )}
                <View
                  style={[
                    styles.overviewDataMetricRowItem,
                    { borderBottomWidth: 0 },
                  ]}
                >
                  <AppText size={14} color={colors.textMuted}>
                    Fare
                  </AppText>
                  <AppText size={17} weight="bold" color={colors.primary}>
                    ₦{estimatedFare}
                  </AppText>
                </View>
              </View>
            </View>
            <View style={styles.actionModalFooterTwinButtonsLayoutGrid}>
              <TouchableOpacity
                style={[
                  styles.actionModalGridHalfBtn,
                  { backgroundColor: tileBg },
                ]}
                onPress={() => setOverviewModalVisible(false)}
              >
                <AppText size={15} weight="bold" color={colors.text}>
                  Cancel
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionModalGridHalfBtn,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleFinalPublishCommit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <AppText size={15} weight="bold" color="#FFF">
                    Post Ride Now
                  </AppText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ====================== SUCCESS MODAL ====================== */}
      <Modal
        animationType="slide"
        transparent
        visible={successModalVisible}
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.darkBlurBackdropOverlay}>
          <View
            style={[
              styles.bottomSheetPresentationFrame,
              {
                backgroundColor: cardBg,
                alignItems: "center",
                paddingVertical: 40,
                paddingHorizontal: 24,
              },
            ]}
          >
            <View
              style={[
                styles.resultIconCircle,
                { backgroundColor: PASTELS.mint.bg },
              ]}
            >
              <CheckCircle size={40} color={PASTELS.mint.icon} />
            </View>
            <AppText
              size={20}
              weight="bold"
              color={colors.text}
              style={{ marginVertical: 12 }}
            >
              Ride Posted!
            </AppText>
            <AppText
              size={14}
              color={colors.textMuted}
              style={{ textAlign: "center", marginBottom: 30 }}
            >
              Your ride is now visible to passengers.
            </AppText>
            <TouchableOpacity
              style={[
                styles.primaryActionFormSubmitBtn,
                { backgroundColor: colors.primary, width: "100%" },
              ]}
              onPress={() => {
                setSuccessModalVisible(false);
                resetForm();
                router.back();
              }}
            >
              <AppText size={16} weight="bold" color="#FFF">
                Go Back Home
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ====================== ERROR MODAL ====================== */}
      <Modal
        animationType="slide"
        transparent
        visible={errorModalVisible}
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.darkBlurBackdropOverlay}>
          <View
            style={[
              styles.bottomSheetPresentationFrame,
              {
                backgroundColor: cardBg,
                alignItems: "center",
                paddingVertical: 40,
                paddingHorizontal: 24,
              },
            ]}
          >
            <View
              style={[
                styles.resultIconCircle,
                { backgroundColor: PASTELS.rose.bg },
              ]}
            >
              <XCircle size={40} color={PASTELS.rose.icon} />
            </View>
            <AppText
              size={20}
              weight="bold"
              color={colors.text}
              style={{ marginVertical: 12 }}
            >
              Something went wrong
            </AppText>
            <AppText
              size={14}
              color={colors.textMuted}
              style={{ textAlign: "center", marginBottom: 30 }}
            >
              {localError || error || "Please try again"}
            </AppText>
            <TouchableOpacity
              style={[
                styles.primaryActionFormSubmitBtn,
                { backgroundColor: PASTELS.rose.icon, width: "100%" },
              ]}
              onPress={() => setErrorModalVisible(false)}
            >
              <AppText size={16} weight="bold" color="#FFF">
                Try Again
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 80 },
  inputGroupFieldWrapper: { marginBottom: 20 },
  inputLabelHint: { marginBottom: 6, letterSpacing: 0.5, paddingHorizontal: 2 },
  inputFieldBoxContainer: {
    height: 58,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  notesFieldInputBoxContainer: {
    minHeight: 96,
    borderRadius: 16,
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  fieldIconChip: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  textInputCore: { flex: 1, fontSize: 15 },
  twoColumnInputsGridLayout: { flexDirection: "row", gap: 12 },
  primaryActionFormSubmitBtn: {
    height: 56,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 78
  },
  darkBlurBackdropOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  bottomSheetPresentationFrame: {
    width: "100%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    maxHeight: SCREEN_HEIGHT * 0.88,
  },
  gridInModalWrapper: {
    marginTop: -10,
    marginBottom: -10,
  },
  timePickerSpinnerCardBox: {
    width: "88%",
    borderRadius: 24,
    padding: 20,
    alignSelf: "center",
  },
  spinnerColumnsHorizontalStack: {
    flexDirection: "row",
    height: 180,
    gap: 8,
    justifyContent: "center",
  },
  wheelScrollColumnFrame: { flex: 1 },
  wheelSelectionCellRow: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    marginVertical: 2,
  },
  overviewDataSheetWrapper: {
    padding: 18,
    borderRadius: 20,
    gap: 14,
    marginVertical: 16,
  },
  overviewDataMetricRowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  actionModalFooterTwinButtonsLayoutGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 24,
    marginBottom: 78
  },
  actionModalGridHalfBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  dismissActionPillControl: {
    height: 48,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  resultIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: "center",
    alignItems: "center",
  },
});
