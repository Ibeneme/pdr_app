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
import { AppDispatch } from "@/api/store";
import { createJoinRide } from "@/api/slices/parcel.slice"; // Adjust path if needed
import { NigeriaCitiesGrid } from "@/components/NigeriaCitiesGrid";
import { AppText } from "@/components/AppText";

export interface JoinRideData {
  _id: string;
  requestedBy: string | any;
  route: {
    pickupAddress: string;
    deliveryAddress: string;
  };
  schedule: {
    type: string;
    date: string;
  };
  status: "pending" | "assigned" | "in-transit" | "delivered" | "cancelled";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function JoinRideScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  // Local state for tracking loading and errors
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Form Local State Management ---
  const [pickupAddress, setPickupAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const [notes, setNotes] = useState("");

  // Dispatch Date Configurations
  const [dispatchDate, setDispatchDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isImpromptu, setIsImpromptu] = useState(true);

  // Dynamic Location Selector Modal Targets
  const [locationSelectionTarget, setLocationSelectionTarget] = useState<
    "PICKUP" | "DELIVERY" | null
  >(null);

  // Bottom Sheet Modal Management
  const [overviewModalVisible, setOverviewModalVisible] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [createdRide, setCreatedRide] = useState<any>(null);

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== "ios") setShowDatePicker(false);
    if (selectedDate) {
      setDispatchDate(selectedDate);
      setIsImpromptu(false);
    }
  };

  const handleOpenOverview = () => {
    if (!pickupAddress.trim() || !deliveryAddress.trim()) {
      setError("Please select both pickup and delivery locations.");
      setSubmissionStatus("error");
      setOverviewModalVisible(true);
      return;
    }

    setError(null);
    setSubmissionStatus("idle");
    setOverviewModalVisible(true);
  };

  const handleConfirmSubmit = async () => {
    const joinRidePayload: Partial<JoinRideData> = {
      route: {
        pickupAddress,
        deliveryAddress,
      },
      schedule: {
        type: isImpromptu ? "immediate" : "scheduled",
        date: isImpromptu
          ? new Date().toISOString()
          : dispatchDate.toISOString(),
      },
      status: "pending",
      notes: notes.trim() || "Joining ride via mobile app",
    };

    setLoading(true);
    setError(null);

    try {
      const resultAction = await dispatch(createJoinRide(joinRidePayload));

      console.warn(resultAction, "resultActionresultAction");
      if (createJoinRide.fulfilled.match(resultAction)) {
        setCreatedRide(resultAction.payload); // Core payload capture
        setSubmissionStatus("success");
      } else {
        setSubmissionStatus("error");
        setError("We couldn't create your ride request. Please try again.");
      }
    } catch (err) {
      console.error("[JOIN RIDE SUBMIT]", err);
      setSubmissionStatus("error");
      setError("Something went wrong on our end. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectHubValue = (hubName: string) => {
    if (locationSelectionTarget === "PICKUP") {
      setPickupAddress(hubName);
    } else if (locationSelectionTarget === "DELIVERY") {
      setDeliveryAddress(hubName);
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
          {
            backgroundColor: theme.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.iconButton,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}
            activeOpacity={0.6}
          >
            <AppText style={[styles.backTextButton, { color: theme.text }]}>
              ←
            </AppText>
          </TouchableOpacity>
          <AppText style={[styles.brandText, { color: theme.text }]}>
            Join a Ride
          </AppText>
          <View style={{ width: 42 }} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <ScrollView
          style={styles.mainScrollContainer}
          contentContainerStyle={styles.scrollContentLayout}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* SECTION 1: ROUTE LOCATIONS */}
          <AppText style={[styles.sectionTitle, { color: theme.textMuted }]}>
            YOUR ROUTE
          </AppText>

          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.clickableInputContainer,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={() => setLocationSelectionTarget("PICKUP")}
          >
            <AppText
              numberOfLines={1}
              style={[
                styles.selectTextLabel,
                { color: pickupAddress ? theme.text : theme.textMuted },
              ]}
            >
              {pickupAddress || "Pickup Location"}
            </AppText>
            <AppText
              style={{ fontSize: 12, color: theme.primary, fontWeight: "bold" }}
            >
              Select
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.clickableInputContainer,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={() => setLocationSelectionTarget("DELIVERY")}
          >
            <AppText
              numberOfLines={1}
              style={[
                styles.selectTextLabel,
                { color: deliveryAddress ? theme.text : theme.textMuted },
              ]}
            >
              {deliveryAddress || "Destination"}
            </AppText>
            <AppText
              style={{ fontSize: 12, color: theme.primary, fontWeight: "bold" }}
            >
              Select
            </AppText>
          </TouchableOpacity>

          {/* NOTES */}
          <AppText
            style={[
              styles.sectionTitle,
              { color: theme.textMuted, marginTop: 14 },
            ]}
          >
            ADDITIONAL NOTES
          </AppText>
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                height: 100,
              },
            ]}
          >
            <TextInput
              placeholder="Any special requests? (e.g. number of passengers, luggage, etc.)"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.textInput,
                { color: theme.text, height: 90, textAlignVertical: "top" },
              ]}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>

          {/* SECTION: DISPATCH SCHEDULER */}
          <AppText
            style={[
              styles.sectionTitle,
              { color: theme.textMuted, marginTop: 14 },
            ]}
          >
            WHEN DO YOU WANT TO TRAVEL?
          </AppText>
          <View style={styles.gridContainer}>
            <TouchableOpacity
              style={[
                styles.selectableTab,
                {
                  backgroundColor: isImpromptu ? theme.primary : theme.surface,
                  borderColor: isImpromptu ? theme.primary : theme.border,
                },
              ]}
              onPress={() => setIsImpromptu(true)}
            >
              <AppText
                style={[
                  styles.tabText,
                  { color: isImpromptu ? "#FFFFFF" : theme.text },
                ]}
              >
                Leave Now
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.selectableTab,
                {
                  backgroundColor: !isImpromptu ? theme.primary : theme.surface,
                  borderColor: !isImpromptu ? theme.primary : theme.border,
                },
              ]}
              onPress={() => {
                setIsImpromptu(false);
                setShowDatePicker(true);
              }}
            >
              <AppText
                style={[
                  styles.tabText,
                  { color: !isImpromptu ? "#FFFFFF" : theme.text },
                ]}
              >
                {isImpromptu ? "Schedule" : dispatchDate.toLocaleDateString()}
              </AppText>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <View
              style={[
                styles.pickerInlineContainer,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <DateTimePicker
                value={dispatchDate}
                mode="date"
                display="spinner"
                onChange={onDateChange}
                minimumDate={new Date()}
              />
              {Platform.OS === "ios" && (
                <TouchableOpacity
                  style={styles.closePickerBtn}
                  onPress={() => setShowDatePicker(false)}
                >
                  <AppText
                    style={{
                      color: theme.primary,
                      fontWeight: "bold",
                    }}
                  >
                    Done
                  </AppText>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* REVIEW ACTION SUBMIT */}
          <TouchableOpacity
            style={[
              styles.primarySubmitButton,
              {
                backgroundColor: theme.primary,
                marginTop: 30,
                marginBottom: 20,
              },
            ]}
            onPress={handleOpenOverview}
            activeOpacity={0.85}
          >
            <AppText style={styles.submitButtonText}>
              Review & Join Ride
            </AppText>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ====================== LOCATION MODAL ====================== */}
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
              {
                backgroundColor: theme.surface,
                paddingTop: 16,
                height: "80%",
                width: "100%",
              },
            ]}
          >
            <View
              style={[styles.modalKnob, { backgroundColor: theme.border }]}
            />
            <AppText
              style={[
                styles.modalTitle,
                { color: theme.text, paddingHorizontal: 24, marginBottom: 4 },
              ]}
            >
              Select{" "}
              {locationSelectionTarget === "PICKUP"
                ? "Pickup Location"
                : "Destination"}
            </AppText>
            <AppText
              style={{
                fontSize: 13,
                color: theme.textMuted,
                paddingHorizontal: 24,
                marginBottom: 12,
              }}
            >
              Choose a city center or logistical point
            </AppText>

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
                  styles.primarySubmitButton,
                  { backgroundColor: theme.border },
                ]}
                onPress={() => setLocationSelectionTarget(null)}
              >
                <AppText
                  style={[styles.submitButtonText, { color: theme.text }]}
                >
                  Cancel
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* BOTTOM MODAL SHEET FOR OVERVIEW, SUCCESS & ERRORS */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={overviewModalVisible}
        onRequestClose={() => setOverviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setOverviewModalVisible(false)}
          />
          <View
            style={[
              styles.bottomModalContainer,
              { backgroundColor: theme.surface },
            ]}
          >
            <View
              style={[styles.modalKnob, { backgroundColor: theme.border }]}
            />

            {submissionStatus === "idle" && (
              <View>
                <AppText style={[styles.modalTitle, { color: theme.text }]}>
                  Ride Request Summary
                </AppText>

                <View
                  style={[
                    styles.modalOverviewBlock,
                    { borderColor: theme.border },
                  ]}
                >
                  <AppText
                    style={[styles.summaryItemText, { color: theme.text }]}
                  >
                    <AppText style={{ color: theme.textMuted }}>From:</AppText>{" "}
                    {pickupAddress || "Not selected"}
                  </AppText>
                  <AppText
                    style={[styles.summaryItemText, { color: theme.text }]}
                  >
                    <AppText style={{ color: theme.textMuted }}>To:</AppText>{" "}
                    {deliveryAddress || "Not selected"}
                  </AppText>
                  <AppText
                    style={[styles.summaryItemText, { color: theme.text }]}
                  >
                    <AppText style={{ color: theme.textMuted }}>When:</AppText>{" "}
                    {isImpromptu
                      ? "As soon as possible"
                      : dispatchDate.toDateString()}
                  </AppText>
                  {notes.trim() && (
                    <AppText
                      style={[styles.summaryItemText, { color: theme.text }]}
                    >
                      <AppText style={{ color: theme.textMuted }}>
                        Notes:
                      </AppText>{" "}
                      {notes}
                    </AppText>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.primarySubmitButton,
                    { backgroundColor: theme.primary, marginTop: 12 },
                  ]}
                  onPress={handleConfirmSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <AppText style={styles.submitButtonText}>
                      Confirm & Request to Join
                    </AppText>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {submissionStatus === "success" && (
              <View style={styles.statusWrapper}>
                <View
                  style={[
                    styles.statusIndicatorCircle,
                    { backgroundColor: "#34C75920" },
                  ]}
                >
                  <AppText
                    style={{
                      color: "#34C759",
                      fontSize: 32,
                      fontWeight: "bold",
                    }}
                  >
                    ✓
                  </AppText>
                </View>
                <AppText
                  style={[styles.statusTitleText, { color: theme.text }]}
                >
                  Ride Request Created!
                </AppText>
                <AppText
                  style={[styles.statusBodyText, { color: theme.textMuted }]}
                >
                  Your request to join a ride has been submitted. We'll match
                  you with available drivers soon.
                </AppText>

                <TouchableOpacity
                  style={[
                    styles.primarySubmitButton,
                    {
                      backgroundColor: theme.text,
                      marginTop: 24,
                      width: "100%",
                    },
                  ]}
                  onPress={() => {
                    setOverviewModalVisible(false);
                    
                    // Conditionally routing only if payload exists to avoid null reference parameters
                    if (createdRide) {
                      router.push({
                        pathname: "/(screens)/one",
                        params: {
                          id: createdRide._id,
                          type: "joinride", 
                        },
                      });
                    }
                  }}
                >
                  <AppText
                    style={[
                      styles.submitButtonText,
                      { color: theme.background },
                    ]}
                  >
                    Browse Available Rides
                  </AppText>
                </TouchableOpacity>
              </View>
            )}

            {submissionStatus === "error" && (
              <View style={styles.statusWrapper}>
                <View
                  style={[
                    styles.statusIndicatorCircle,
                    { backgroundColor: "#FF3B3020" },
                  ]}
                >
                  <AppText
                    style={{
                      color: "#FF3B30",
                      fontSize: 32,
                      fontWeight: "bold",
                    }}
                  >
                    ✕
                  </AppText>
                </View>
                <AppText
                  style={[styles.statusTitleText, { color: theme.text }]}
                >
                  Request Failed
                </AppText>
                <AppText
                  style={[styles.statusBodyText, { color: theme.textMuted }]}
                >
                  {error || "Please check your details and try again."}
                </AppText>

                <TouchableOpacity
                  style={[
                    styles.primarySubmitButton,
                    {
                      backgroundColor: "#FF3B30",
                      marginTop: 24,
                      width: "100%",
                    },
                  ]}
                  onPress={() => {
                    setOverviewModalVisible(false);
                    setSubmissionStatus("idle");
                  }}
                >
                  <AppText style={styles.submitButtonText}>Try Again</AppText>
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
  headerSafeArea: {
    width: "100%",
    ...Platform.select({
      android: {
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 4 : 12,
      },
    }),
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    paddingTop: Platform.OS === "ios" ? 4 : 8,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  backTextButton: { fontSize: 18, fontWeight: "bold" },
  brandText: { fontSize: 20, letterSpacing: -0.8, fontWeight: "bold" },
  mainScrollContainer: { flex: 1 },
  scrollContentLayout: {
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  sectionTitle: {
    fontSize: 14,
    letterSpacing: 1.5,
    marginBottom: 12,
    fontWeight: "bold",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  clickableInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  selectTextLabel: { flex: 1, fontSize: 15 },
  textInput: { flex: 1, fontSize: 15 },
  gridContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 12,
  },
  selectableTab: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: { fontSize: 16, fontWeight: "bold" },
  pickerInlineContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 8,
    marginBottom: 20,
    justifyContent: "center",
  },
  closePickerBtn: { alignSelf: "flex-end", padding: 8, marginRight: 8 },
  primarySubmitButton: {
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",

  },
  submitButtonText: { fontSize: 16, color: "#FFFFFF", fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalDismissArea: { flex: 1 },
  bottomModalContainer: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 44 : 32,
  },
  modalKnob: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    letterSpacing: -0.5,
    marginBottom: 16,
    fontWeight: "bold",
  },
  modalOverviewBlock: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  summaryItemText: { fontSize: 13, lineHeight: 18 },
  statusWrapper: { alignItems: "center", paddingVertical: 12 },
  statusIndicatorCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  statusTitleText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "bold",
  },
  statusBodyText: {
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 16,
    lineHeight: 18,
  },
});
