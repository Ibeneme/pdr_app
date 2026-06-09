import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
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
import { NigeriaCitiesGrid } from "@/components/NigeriaCitiesGrid";

export default function SendParcelScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  // ==========================================
  // FORM & PACKAGING STATE
  // ==========================================
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Both pickup and destination are mapped to structural hub names chosen from the grid component
  const [pickupAddress, setPickupAddress] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  const [isPerishable, setIsPerishable] = useState(false);
  const [isFragile, setIsFragile] = useState(false);

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // ==========================================
  // TEMPORAL LOGISTICS WINDOWS
  // ==========================================
  const [dispatchDateStart, setDispatchDateStart] = useState(new Date());
  const [dispatchDateEnd, setDispatchDateEnd] = useState(new Date());
  const [availabilityStart, setAvailabilityStart] = useState(new Date());
  const [availabilityEnd, setAvailabilityEnd] = useState(new Date());

  // Picker visibility toggles
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // ==========================================
  // MODAL CONTEXT SWITCHERS
  // ==========================================
  // Tracks which input field targeted the geographic selector layout context
  const [locationSelectionTarget, setLocationSelectionTarget] = useState<
    "PICKUP" | "DESTINATION" | null
  >(null);

  const [overviewModalVisible, setOverviewModalVisible] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  // ==========================================
  // DATETIME EVENT HANDLERS
  // ==========================================
  const onDateChange = (
    type: "start" | "end",
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    // Android dismisses immediately on spinner action; iOS requires explicit confirmation interaction
    if (Platform.OS !== "ios") {
      if (type === "start") setShowStartDatePicker(false);
      else setShowEndDatePicker(false);
    }
    if (selectedDate) {
      if (type === "start") setDispatchDateStart(selectedDate);
      else setDispatchDateEnd(selectedDate);
    }
  };

  const onTimeChange = (
    type: "start" | "end",
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (Platform.OS !== "ios") {
      if (type === "start") setShowStartTimePicker(false);
      else setShowEndTimePicker(false);
    }
    if (selectedDate) {
      if (type === "start") setAvailabilityStart(selectedDate);
      else setAvailabilityEnd(selectedDate);
    }
  };

  // ==========================================
  // VALIDATION & DISPATCH PIPELINE
  // ==========================================
  const handleOpenOverview = () => {
    // Absolute field coverage gating prior to rendering summary parameters
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
    console.log("🚀 [SUBMIT STARTED] handleConfirmSubmit called");

    // Map structural component primitives into the core API schema architecture
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
      // Intercept and assert status utilizing Thunk action matchers
      if (createParcelRequest.fulfilled.match(result)) {
        setSubmissionStatus("success");
      } else {
        setSubmissionStatus("error");
        setError("Failed to post your request. Please try again.");
      }
    } catch (err: any) {
      console.error("💥 [SUBMIT ERROR]", err);
      setSubmissionStatus("error");
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Assign chosen hub back to the correct form state variable depending on intent
  const selectHubValue = (hubName: string) => {
    if (locationSelectionTarget === "PICKUP") {
      setPickupAddress(hubName);
    } else if (locationSelectionTarget === "DESTINATION") {
      setSelectedCity(hubName);
    }
    setLocationSelectionTarget(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* HEADER SECTION */}
      <SafeAreaView
        style={[
          styles.headerSafeArea,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.backButton,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}
            activeOpacity={0.7}
          >
            <Text style={[styles.backText, { color: theme.text }]}>←</Text>
          </TouchableOpacity>

          <Text style={[styles.brandText, { color: theme.text }]}>
            Deliver a Parcel
          </Text>

          <View style={{ width: 42 }} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* PICKUP LOCATION SELECTION FIELD */}
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
            PICKUP LOCATION
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.clickableInputContainer,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={() => setLocationSelectionTarget("PICKUP")}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.selectTextLabel,
                { color: pickupAddress ? theme.text : theme.textMuted },
              ]}
            >
              {pickupAddress || "Select pickup terminal hub..."}
            </Text>
            <Text
              style={{ fontSize: 13, color: theme.primary, fontWeight: "bold" }}
            >
              Choose
            </Text>
          </TouchableOpacity>

          {/* DESTINATION LOCATION SELECTION FIELD */}
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
            DESTINATION HUB
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.clickableInputContainer,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={() => setLocationSelectionTarget("DESTINATION")}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.selectTextLabel,
                { color: selectedCity ? theme.text : theme.textMuted },
              ]}
            >
              {selectedCity || "Select target destination city center..."}
            </Text>
            <Text
              style={{ fontSize: 13, color: theme.primary, fontWeight: "bold" }}
            >
              Choose
            </Text>
          </TouchableOpacity>

          {/* SPECIAL HANDLING MODES */}
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.textMuted, marginTop: 14 },
            ]}
          >
            SPECIAL HANDLING
          </Text>

          <View
            style={[
              styles.card,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.toggleRow}>
              <View style={styles.toggleLabel}>
                <Text style={[styles.toggleTitle, { color: theme.text }]}>
                  Perishable Goods
                </Text>
                <Text style={[styles.toggleDesc, { color: theme.textMuted }]}>
                  Spoils easily or time-sensitive
                </Text>
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
              <View style={styles.toggleLabel}>
                <Text style={[styles.toggleTitle, { color: theme.text }]}>
                  Fragile Items
                </Text>
                <Text style={[styles.toggleDesc, { color: theme.textMuted }]}>
                  Requires gentle handling
                </Text>
              </View>
              <Switch
                value={isFragile}
                onValueChange={setIsFragile}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={Platform.OS === "android" ? "#FFFFFF" : undefined}
              />
            </View>
          </View>

          {/* DISPATCH TARGET DATE SELECTION GRID */}
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.textMuted, marginTop: 14 },
            ]}
          >
            DISPATCH DATE WINDOW
          </Text>

          <View style={styles.row}>
            <TouchableOpacity
              style={[
                styles.dateButton,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Text style={[styles.dateText, { color: theme.text }]}>
                Start: {dispatchDateStart.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.dateButton,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Text style={[styles.dateText, { color: theme.text }]}>
                End: {dispatchDateEnd.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          </View>

          {showStartDatePicker && (
            <View
              style={[
                styles.pickerContainer,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <DateTimePicker
                value={dispatchDateStart}
                mode="date"
                display="spinner"
                onChange={(e, d) => onDateChange("start", e, d)}
                minimumDate={new Date()}
              />
            </View>
          )}

          {showEndDatePicker && (
            <View
              style={[
                styles.pickerContainer,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <DateTimePicker
                value={dispatchDateEnd}
                mode="date"
                display="spinner"
                onChange={(e, d) => onDateChange("end", e, d)}
                minimumDate={dispatchDateStart}
              />
            </View>
          )}

          {/* DAILY OPERATIONAL AVAILABILITY TIMEOFFS */}
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.textMuted, marginTop: 14 },
            ]}
          >
            RIDER AVAILABILITY WINDOW
          </Text>

          <View style={styles.row}>
            <TouchableOpacity
              style={[
                styles.dateButton,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              onPress={() => setShowStartTimePicker(true)}
            >
              <Text style={[styles.dateText, { color: theme.text }]}>
                From:{" "}
                {availabilityStart.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.dateButton,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              onPress={() => setShowEndTimePicker(true)}
            >
              <Text style={[styles.dateText, { color: theme.text }]}>
                To:{" "}
                {availabilityEnd.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </TouchableOpacity>
          </View>

          {showStartTimePicker && (
            <View
              style={[
                styles.pickerContainer,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <DateTimePicker
                value={availabilityStart}
                mode="time"
                display="spinner"
                onChange={(e, d) => onTimeChange("start", e, d)}
              />
            </View>
          )}

          {showEndTimePicker && (
            <View
              style={[
                styles.pickerContainer,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <DateTimePicker
                value={availabilityEnd}
                mode="time"
                display="spinner"
                onChange={(e, d) => onTimeChange("end", e, d)}
              />
            </View>
          )}

          {/* ECONOMIC PRICING RANGE MATRICES */}
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.textMuted, marginTop: 14 },
            ]}
          >
            BUDGET RANGE (₦)
          </Text>

          <View style={styles.row}>
            <View
              style={[
                styles.priceInput,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <TextInput
                placeholder="Min"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                style={[styles.priceTextInput, { color: theme.text }]}
                value={minPrice}
                onChangeText={setMinPrice}
              />
            </View>

            <View
              style={[
                styles.priceInput,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <TextInput
                placeholder="Max"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                style={[styles.priceTextInput, { color: theme.text }]}
                value={maxPrice}
                onChangeText={setMaxPrice}
              />
            </View>
          </View>

          {/* TRIGGER PRIMARY PRE-FLIGHT VALIDATION CARD */}
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: theme.primary, marginTop: 12 },
            ]}
            onPress={handleOpenOverview}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Review & Post Request</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ======================================================================
          SUB-MODAL: NIGERIAN NATIONAL HUBS REGIONAL GEOGRAPHIC SELECTOR
          ====================================================================== */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={locationSelectionTarget !== null}
        onRequestClose={() => setLocationSelectionTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.dismissArea}
            activeOpacity={1}
            onPress={() => setLocationSelectionTarget(null)}
          />
          <View
            style={[
             // styles.modalContent, // Fixed the commented style chunk selector here
              { backgroundColor: theme.surface, paddingTop: 16, height: "82%" },
            ]}
          >
            <View
              style={[styles.modalKnob, { backgroundColor: theme.border }]}
            />

            <Text
              style={[
                styles.modalTitle,
                { color: theme.text, paddingHorizontal: 24, marginBottom: 4 },
              ]}
            >
              Select{" "}
              {locationSelectionTarget === "PICKUP"
                ? "Pickup Hub"
                : "Destination Hub"}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: theme.textMuted,
                paddingHorizontal: 24,
                marginBottom: 12,
              }}
            >
              Choose across all national trade corridors and regional centers.
            </Text>

            <View style={{ flex: 1 }}>
              <NigeriaCitiesGrid
                onCityPress={(city) => selectHubValue(city.name)}
              />
            </View>

            <View
              style={{
                paddingHorizontal: 24,
                paddingBottom: Platform.OS === "ios" ? 34 : 20,
              }}
            >
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: theme.border },
                ]}
                onPress={() => setLocationSelectionTarget(null)}
              >
                <Text style={[styles.buttonText, { color: theme.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ======================================================================
          SUB-MODAL: TRANSACTION OVERVIEW SUMMARY & LOGISTICS ACKNOWLEDGEMENT
          ====================================================================== */}
      <Modal
        animationType="slide"
        transparent
        visible={overviewModalVisible}
        onRequestClose={() => setOverviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.dismissArea}
            onPress={() => setOverviewModalVisible(false)}
          />

          <View
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
          >
            <View
              style={[styles.modalKnob, { backgroundColor: theme.border }]}
            />

            {submissionStatus === "idle" && (
              <>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Order Summary
                </Text>

                <View
                  style={[styles.summaryCard, { borderColor: theme.border }]}
                >
                  <Text style={[styles.summaryText, { color: theme.text }]}>
                    <Text style={{ color: theme.textMuted }}>Pickup:</Text>{" "}
                    {pickupAddress}
                  </Text>
                  <Text style={[styles.summaryText, { color: theme.text }]}>
                    <Text style={{ color: theme.textMuted }}>Destination:</Text>{" "}
                    {selectedCity}
                  </Text>
                  <Text style={[styles.summaryText, { color: theme.text }]}>
                    <Text style={{ color: theme.textMuted }}>Handling:</Text>{" "}
                    {isPerishable ? "Perishable" : "Standard"} •{" "}
                    {isFragile ? "Fragile" : "Normal"}
                  </Text>
                  <Text style={[styles.summaryText, { color: theme.text }]}>
                    <Text style={{ color: theme.textMuted }}>Dates:</Text>{" "}
                    {dispatchDateStart.toLocaleDateString()} —{" "}
                    {dispatchDateEnd.toLocaleDateString()}
                  </Text>
                  <Text style={[styles.summaryText, { color: theme.text }]}>
                    <Text style={{ color: theme.textMuted }}>Time:</Text>{" "}
                    {availabilityStart.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    —{" "}
                    {availabilityEnd.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  <Text style={[styles.summaryText, { color: theme.text }]}>
                    <Text style={{ color: theme.textMuted }}>Budget:</Text> ₦
                    {minPrice} — ₦{maxPrice}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    { backgroundColor: theme.primary, marginTop: 16 },
                  ]}
                  onPress={handleConfirmSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.buttonText}>Confirm & Post</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* TRANSIENT COMPONENT POST SUCCESS TERMINATION CONTAINER */}
            {submissionStatus === "success" && (
              <View style={styles.centerContent}>
                <View
                  style={[
                    styles.statusCircle,
                    { backgroundColor: "#34C75920" },
                  ]}
                >
                  <Text style={{ color: "#34C759", fontSize: 40 }}>✓</Text>
                </View>
                <Text style={[styles.statusTitle, { color: theme.text }]}>
                  Request Posted!
                </Text>
                <Text style={[styles.statusBody, { color: theme.textMuted }]}>
                  Riders will see your parcel request shortly.
                </Text>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: theme.text,
                      marginTop: 24,
                      width: "100%",
                    },
                  ]}
                  onPress={() => {
                    setOverviewModalVisible(false);
                    router.back();
                  }}
                >
                  <Text
                    style={[styles.buttonText, { color: theme.background }]}
                  >
                    Back to Home
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* TRANSIENT COMPONENT NETWORK ERROR FALLBACKS */}
            {submissionStatus === "error" && (
              <View style={styles.centerContent}>
                <View
                  style={[
                    styles.statusCircle,
                    { backgroundColor: "#FF3B3020" },
                  ]}
                >
                  <Text style={{ color: "#FF3B30", fontSize: 40 }}>✕</Text>
                </View>
                <Text style={[styles.statusTitle, { color: theme.text }]}>
                  Submission Failed
                </Text>
                <Text style={[styles.statusBody, { color: theme.textMuted }]}>
                  {error}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: "#FF3B30",
                      marginTop: 24,
                      width: "100%",
                    },
                  ]}
                  onPress={() => setOverviewModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Fix & Try Again</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ==========================================
// SCALABLE FLEXBOX SHEET DESIGNS
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  headerSafeArea: {
    borderBottomWidth: 1,
    ...Platform.select({
      android: { paddingTop: StatusBar.currentHeight ?? 12 },
    }),
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  backText: { fontSize: 20, fontWeight: "bold" },
  brandText: {
    fontFamily: "RethinkSans-Bold",
    fontSize: 20,
    letterSpacing: -0.6,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontFamily: "RethinkSans-Bold",
    fontSize: 13,
    letterSpacing: 1.2,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  inputContainer: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    justifyContent: "center",
    marginBottom: 20,
  },
  clickableInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  selectTextLabel: { flex: 1, fontSize: 15, fontFamily: "RethinkSans-Medium" },
  textInput: {
    fontFamily: "RethinkSans-Medium",
    fontSize: 16,
    flex: 1,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 20,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  toggleLabel: { flex: 1 },
  toggleTitle: { fontFamily: "RethinkSans-Bold", fontSize: 16 },
  toggleDesc: { fontFamily: "RethinkSans-Regular", fontSize: 14 },
  divider: { height: 1, marginVertical: 4 },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  dateButton: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  dateText: {
    fontFamily: "RethinkSans-Medium",
    fontSize: 15.5,
  },
  pickerContainer: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 10,
    marginBottom: 20,
  },
  priceInput: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  priceTextInput: {
    fontFamily: "RethinkSans-Medium",
    fontSize: 16,
  },
  primaryButton: {
    height: 58,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  buttonText: {
    fontFamily: "RethinkSans-Bold",
    fontSize: 16.5,
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  dismissArea: { flex: 1 },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 44 : 32,
  },
  modalKnob: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
    marginVertical: 12,
  },
  modalTitle: {
    fontFamily: "RethinkSans-Bold",
    fontSize: 21,
    marginBottom: 16,
  },
  summaryCard: {
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 18,
    gap: 14,
  },
  summaryText: {
    fontFamily: "RethinkSans-Medium",
    fontSize: 16,
    lineHeight: 24,
  },
  centerContent: { alignItems: "center", paddingVertical: 20 },
  statusCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  statusTitle: {
    fontFamily: "RethinkSans-Bold",
    fontSize: 19,
    marginBottom: 8,
    textAlign: "center",
  },
  statusBody: {
    fontSize: 15.5,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 10,
  },
});
