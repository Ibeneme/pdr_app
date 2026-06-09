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
import { createParcelBooking } from "@/api/slices/parcel.slice";
import { NigeriaCitiesGrid } from "@/components/NigeriaCitiesGrid";
import { AppText } from "@/components/AppText";

export default function BookParcelDeliveryScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  // Local state for tracking loading and errors
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Form Local State Management ---
  const [pickupAddress, setPickupAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const [senderName, setSenderName] = useState("");
  const [senderContact, setSenderContact] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientContact, setRecipientContact] = useState("");

  const [itemName, setItemName] = useState("");
  const [isFragile, setIsFragile] = useState(false);
  const [isPerishable, setIsPerishable] = useState(false);

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

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== "ios") setShowDatePicker(false);
    if (selectedDate) {
      setDispatchDate(selectedDate);
      setIsImpromptu(false);
    }
  };

  const handleOpenOverview = () => {
    if (
      !pickupAddress.trim() ||
      !deliveryAddress.trim() ||
      !senderName.trim() ||
      !senderContact.trim() ||
      !recipientName.trim() ||
      !recipientContact.trim() ||
      !itemName.trim()
    ) {
      setError("Please fill out all missing details before continuing.");
      setSubmissionStatus("error");
      setOverviewModalVisible(true);
      return;
    }

    setError(null);
    setSubmissionStatus("idle");
    setOverviewModalVisible(true);
  };

  const handleConfirmSubmit = async () => {
    const parcelPayload = {
      senderName,
      senderPhone: senderContact,
      recipientName,
      recipientPhone: recipientContact,
      pickupAddress,
      deliveryAddress,
      parcelType: itemName,
      status: "pending" as const,
    };

    setLoading(true);
    setError(null);

    try {
      const resultAction = await dispatch(createParcelBooking(parcelPayload));

      if (createParcelBooking.fulfilled.match(resultAction)) {
        setSubmissionStatus("success");
      } else {
        setSubmissionStatus("error");
        setError("We couldn't save your delivery request. Please try again.");
      }
    } catch (err) {
      console.error("[FORM SUBMIT]", err);
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
            Send a Delivery
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
            DELIVERY ROUTE
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
              {pickupAddress || "Where should we pick up from?"}
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
              {deliveryAddress || "Where should we deliver to?"}
            </AppText>
            <AppText
              style={{ fontSize: 12, color: theme.primary, fontWeight: "bold" }}
            >
              Select
            </AppText>
          </TouchableOpacity>

          {/* SECTION 2: SENDER DETAILS */}
          <AppText
            style={[
              styles.sectionTitle,
              { color: theme.textMuted, marginTop: 14 },
            ]}
          >
            SENDER INFORMATION
          </AppText>
          <View style={styles.gridContainer}>
            <View
              style={[
                styles.flexInputWrapper,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <TextInput
                placeholder="Your Name"
                placeholderTextColor={theme.textMuted}
                style={[styles.flexTextInput, { color: theme.text }]}
                value={senderName}
                onChangeText={setSenderName}
              />
            </View>
            <View
              style={[
                styles.flexInputWrapper,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <TextInput
                placeholder="Phone Number"
                placeholderTextColor={theme.textMuted}
                keyboardType="phone-pad"
                style={[styles.flexTextInput, { color: theme.text }]}
                value={senderContact}
                onChangeText={setSenderContact}
              />
            </View>
          </View>

          {/* SECTION 3: RECIPIENT DETAILS */}
          <AppText
            style={[
              styles.sectionTitle,
              { color: theme.textMuted, marginTop: 6 },
            ]}
          >
            RECIPIENT INFORMATION
          </AppText>
          <View style={styles.gridContainer}>
            <View
              style={[
                styles.flexInputWrapper,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <TextInput
                placeholder="Receiver's Name"
                placeholderTextColor={theme.textMuted}
                style={[styles.flexTextInput, { color: theme.text }]}
                value={recipientName}
                onChangeText={setRecipientName}
              />
            </View>
            <View
              style={[
                styles.flexInputWrapper,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <TextInput
                placeholder="Phone Number"
                placeholderTextColor={theme.textMuted}
                keyboardType="phone-pad"
                style={[styles.flexTextInput, { color: theme.text }]}
                value={recipientContact}
                onChangeText={setRecipientContact}
              />
            </View>
          </View>

          {/* SECTION 4: ITEM DESCRIPTION */}
          <AppText
            style={[
              styles.sectionTitle,
              { color: theme.textMuted, marginTop: 14 },
            ]}
          >
            ITEM DETAILS
          </AppText>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <TextInput
              placeholder="What are you sending? (e.g. Documents, Clothes)"
              placeholderTextColor={theme.textMuted}
              style={[styles.textInput, { color: theme.text }]}
              value={itemName}
              onChangeText={setItemName}
            />
          </View>

          {/* SECTION 5: TOGGLE PREFERENCES */}
          <AppText
            style={[
              styles.sectionTitle,
              { color: theme.textMuted, marginTop: 14 },
            ]}
          >
            SPECIAL HANDLING
          </AppText>
          <View
            style={[
              styles.toggleBlockCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextContent}>
                <AppText style={[styles.toggleTitle, { color: theme.text }]}>
                  Fragile Item
                </AppText>
                <AppText
                  style={[styles.toggleDesc, { color: theme.textMuted }]}
                >
                  Needs gentle handling and extra care
                </AppText>
              </View>
              <Switch
                value={isFragile}
                onValueChange={setIsFragile}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={Platform.OS === "android" ? "#FFFFFF" : undefined}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.toggleRow}>
              <View style={styles.toggleTextContent}>
                <AppText style={[styles.toggleTitle, { color: theme.text }]}>
                  Perishable Item
                </AppText>
                <AppText
                  style={[styles.toggleDesc, { color: theme.textMuted }]}
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
          </View>

          {/* SECTION 6: DISPATCH SCHEDULER */}
          <AppText
            style={[
              styles.sectionTitle,
              { color: theme.textMuted, marginTop: 14 },
            ]}
          >
            WHEN SHOULD WE SEND IT?
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
                Send Now
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
                {isImpromptu
                  ? "Schedule Later"
                  : dispatchDate.toLocaleDateString()}
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
                    Select Date
                  </AppText>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* REVIEW ACTION SUBMIT */}
          <TouchableOpacity
            style={[
              styles.primarySubmitButton,
              { backgroundColor: theme.primary, marginTop: 20 },
            ]}
            onPress={handleOpenOverview}
            activeOpacity={0.85}
          >
            <AppText style={styles.submitButtonText}>
              Review Order Summary
            </AppText>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ====================== GEOGRAPHIC CITIES CONFIGURATOR MODAL ====================== */}
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
                ? "Pickup Hub"
                : "Delivery Hub"}
            </AppText>
            <AppText
              style={{
                fontSize: 13,
                color: theme.textMuted,
                paddingHorizontal: 24,
                marginBottom: 12,
              }}
            >
              Choose a specific city center or state logistical point.
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
                  Order Summary
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
                    <AppText style={{ color: theme.textMuted }}>Item:</AppText>{" "}
                    {itemName || "Not specified"}
                  </AppText>
                  <AppText
                    style={[styles.summaryItemText, { color: theme.text }]}
                  >
                    <AppText style={{ color: theme.textMuted }}>Route:</AppText>{" "}
                    {pickupAddress || "Empty"} ➔ {deliveryAddress || "Empty"}
                  </AppText>
                  <AppText
                    style={[styles.summaryItemText, { color: theme.text }]}
                  >
                    <AppText style={{ color: theme.textMuted }}>
                      Sender:
                    </AppText>{" "}
                    {senderName} ({senderContact})
                  </AppText>
                  <AppText
                    style={[styles.summaryItemText, { color: theme.text }]}
                  >
                    <AppText style={{ color: theme.textMuted }}>
                      Receiver:
                    </AppText>{" "}
                    {recipientName} ({recipientContact})
                  </AppText>
                  <AppText
                    style={[styles.summaryItemText, { color: theme.text }]}
                  >
                    <AppText style={{ color: theme.textMuted }}>
                      Handling:
                    </AppText>{" "}
                    {isFragile ? "Fragile" : "Normal Care"} /{" "}
                    {isPerishable ? "Perishable" : "Non-perishable"}
                  </AppText>
                  <AppText
                    style={[styles.summaryItemText, { color: theme.text }]}
                  >
                    <AppText style={{ color: theme.textMuted }}>
                      Delivery Time:
                    </AppText>{" "}
                    {isImpromptu
                      ? "As soon as possible (Now)"
                      : dispatchDate.toDateString()}
                  </AppText>
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
                      Confirm and Book Order
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
                  Delivery Booked Successfully!
                </AppText>
                <AppText
                  style={[styles.statusBodyText, { color: theme.textMuted }]}
                >
                  Your delivery has been logged. You can now track your rider
                  and package details.
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
                    router.push("/(features)/drivers_menu");
                  }}
                >
                  <AppText
                    style={[
                      styles.submitButtonText,
                      { color: theme.background },
                    ]}
                  >
                    Go to Available Drivers
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
                  Something Went Wrong
                </AppText>
                <AppText
                  style={[styles.statusBodyText, { color: theme.textMuted }]}
                >
                  {error ||
                    "We couldn't set up your delivery. Please verify form details."}
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
                  <AppText style={styles.submitButtonText}>
                    Check Fields and Fix
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
    height: 54,
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
  flexInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  flexTextInput: { flex: 1, fontSize: 15 },
  toggleBlockCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  toggleTextContent: { flex: 1, paddingRight: 8 },
  toggleTitle: { fontSize: 16, marginBottom: 2, fontWeight: "bold" },
  toggleDesc: { fontSize: 14, lineHeight: 14 },
  divider: { height: 1, width: "100%" },
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
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
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
