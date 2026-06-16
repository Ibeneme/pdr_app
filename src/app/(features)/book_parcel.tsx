import React, { useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  TouchableOpacity,
  Modal,
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
import { ArrowLeft } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import LocationSelector from "@/components/LocationSelector";
import PartyDetailsSection from "@/components/PartyDetailsSection";
import ItemDetailsSection from "@/components/ItemDetailsSection";
import SpecialHandlingSection from "@/components/SpecialHandlingSection";
import DispatchScheduleSection from "@/components/DispatchScheduleSection";
import OrderSummaryModal from "@/components/OrderSummaryModal";

export default function BookParcelDeliveryScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isImpromptu, setIsImpromptu] = useState(true);

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdBooking, setCreatedBooking] = useState<any>(null);

  // Modals
  const [locationSelectionTarget, setLocationSelectionTarget] = useState<
    "PICKUP" | "DELIVERY" | null
  >(null);
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
    const parcelPayload = {
      route: { pickupAddress, deliveryAddress },
      parties: {
        sender: { fullName: senderName, contact: senderContact },
        recipient: { fullName: recipientName, contact: recipientContact },
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

    console.log("🚀 [SUBMIT] Parcel Payload:", parcelPayload);

    setLoading(true);
    setError(null);

    try {
      const resultAction = await dispatch(
        createParcelBooking(parcelPayload as any)
      );

      if (createParcelBooking.fulfilled.match(resultAction)) {
        console.log("✅ [SUCCESS] Booking Created:", resultAction.payload);
        setSubmissionStatus("success");
        setCreatedBooking(resultAction.payload);
      } else {
        console.log("❌ [FAILED] Booking Failed");
        setSubmissionStatus("error");
        setError("We couldn't save your delivery request. Please try again.");
      }
    } catch (err: any) {
      console.error("💥 [ERROR] Submit failed:", err);
      setSubmissionStatus("error");
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectHubValue = (hubName: string) => {
    if (locationSelectionTarget === "PICKUP") setPickupAddress(hubName);
    else if (locationSelectionTarget === "DELIVERY")
      setDeliveryAddress(hubName);
    setLocationSelectionTarget(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* PREMIUM HEADER GRADIENT */}
      <LinearGradient
        colors={isDark ? ["#2A1B4D", theme.surface] : ["#F8F5FF", "#FFFFFF"]}
        style={styles.headerGradient}
      >
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <ArrowLeft size={24} color={theme.text} />
            </TouchableOpacity>

            <AppText size={20} weight="bold" color={theme.text}>
              Send a Delivery
            </AppText>

            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

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
          <LocationSelector
            pickupAddress={pickupAddress}
            deliveryAddress={deliveryAddress}
            onPickupPress={() => setLocationSelectionTarget("PICKUP")}
            onDeliveryPress={() => setLocationSelectionTarget("DELIVERY")}
          />

          <PartyDetailsSection
            type="sender"
            name={senderName}
            contact={senderContact}
            onNameChange={setSenderName}
            onContactChange={setSenderContact}
          />

          <PartyDetailsSection
            type="recipient"
            name={recipientName}
            contact={recipientContact}
            onNameChange={setRecipientName}
            onContactChange={setRecipientContact}
          />

          <ItemDetailsSection
            itemName={itemName}
            onItemNameChange={setItemName}
            isFragile={isFragile}
            isPerishable={isPerishable}
            isInsured={isInsured}
            onFragileChange={setIsFragile}
            onPerishableChange={setIsPerishable}
            onInsuredChange={setIsInsured}
          />

          <SpecialHandlingSection
            isFragile={isFragile}
            isPerishable={isPerishable}
            isInsured={isInsured}
            onFragileChange={setIsFragile}
            onPerishableChange={setIsPerishable}
            onInsuredChange={setIsInsured}
          />

          <DispatchScheduleSection
            isImpromptu={isImpromptu}
            dispatchDate={dispatchDate}
            showDatePicker={showDatePicker}
            onImpromptuChange={setIsImpromptu}
            onSchedulePress={() => {
              setIsImpromptu(false);
              setShowDatePicker(true);
            }}
            onDateChange={onDateChange}
            onClosePicker={() => setShowDatePicker(false)}
          />

          {/* Review Button */}
          <TouchableOpacity
            style={[
              styles.primarySubmitButton,
              { backgroundColor: theme.primary },
            ]}
            onPress={handleOpenOverview}
            activeOpacity={0.85}
          >
            <AppText size={16} weight="bold" color="#FFFFFF">
              Review Order Summary
            </AppText>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Cities Selection Modal */}
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
              {
                backgroundColor: theme.surface,
                paddingTop: 16,
                height: "80%",
              },
            ]}
          >
            <View
              style={[styles.modalKnob, { backgroundColor: theme.border }]}
            />

            <AppText
              size={18}
              weight="bold"
              color={theme.text}
              style={{ paddingHorizontal: 24, marginBottom: 4 }}
            >
              Select{" "}
              {locationSelectionTarget === "PICKUP" ? "Pickup" : "Delivery"} Hub
            </AppText>
            <AppText
              size={13}
              color={theme.textMuted}
              style={{ paddingHorizontal: 24, marginBottom: 16 }}
            >
              Isolate freight routing endpoints within local transit nets.
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
                  styles.cancelModalButton,
                  { backgroundColor: theme.border },
                ]}
                onPress={() => setLocationSelectionTarget(null)}
              >
                <AppText size={15} weight="bold" color={theme.text}>
                  Cancel Selection
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Order Summary Modal */}
      <OrderSummaryModal
        visible={overviewModalVisible}
        onClose={() => setOverviewModalVisible(false)}
        submissionStatus={submissionStatus}
        loading={loading}
        itemName={itemName}
        pickupAddress={pickupAddress}
        deliveryAddress={deliveryAddress}
        senderName={senderName}
        senderContact={senderContact}
        recipientName={recipientName}
        recipientContact={recipientContact}
        isFragile={isFragile}
        isPerishable={isPerishable}
        isInsured={isInsured}
        isImpromptu={isImpromptu}
        dispatchDate={dispatchDate}
        error={error as any}
        createdBooking={createdBooking}
        onConfirm={handleConfirmSubmit}
        onGoToDrivers={() => {
          setOverviewModalVisible(false);
          if (createdBooking) {
            router.push({
              pathname: "/(screens)/one",
              params: { id: createdBooking._id, type: "parcel" },
            });
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardContainer: { flex: 1 },
  headerGradient: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,

  },
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
  backButton: { padding: 8 },
  mainScrollView: { flex: 1 },
  scrollContentLayout: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  primarySubmitButton: {
    height: 56,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
    marginBottom: 40,

  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  modalDismissArea: { flex: 1 },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    width: "100%",
  },
  modalKnob: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
    marginVertical: 12,
  },
  cancelModalButton: {
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
});
