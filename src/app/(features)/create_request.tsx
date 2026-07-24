import React, { useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/api/store";
import {
  createRequest,
  CreateRequestPayload,
} from "@/api/slices/new.request.slice";
import { useTheme } from "@/contexts/ThemeContext";
import { AppText } from "@/components/AppText";
import {
  ArrowLeft,
  PackageCheck,
  Truck,
  UserPlus,
  Gauge,
  ChevronRight,
  Check,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  FileText,
  Zap,
} from "lucide-react-native";
import {
  DateTimePickerModal,
  FONT_FAMILY,
  LocationPickerModal,
  MONTHS,
  NotificationModal,
  StepDef,
  StepIndicator,
  pad2,
} from "@/components/RequestExports";
import { SafeAreaView } from "react-native-safe-area-context";

type RequestType =
  | "send-package"
  | "deliver-package"
  | "join-ride"
  | "offer-ride";

const STEP_DEFINITIONS: Record<RequestType, StepDef[]> = {
  "send-package": [
    { key: "route", label: "Route" },
    { key: "sender", label: "Sender" },
    { key: "receiver", label: "Receiver" },
    { key: "review", label: "Review" },
  ],
  "deliver-package": [
    { key: "route", label: "Route" },
    { key: "pricing", label: "Pricing" },
    { key: "review", label: "Review" },
  ],
  "join-ride": [
    { key: "route", label: "Route" },
    { key: "notes", label: "Notes" },
    { key: "review", label: "Review" },
  ],
  "offer-ride": [
    { key: "route", label: "Route" },
    { key: "ride", label: "Ride Details" },
    { key: "review", label: "Review" },
  ],
};

export default function CreateRequestScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { theme: colors, isDark } = useTheme();
  const { isLoading } = useSelector((state: RootState) => state.request);

  const requestType = type as RequestType;

  const [formData, setFormData] = useState<any>({
    pickupLocation: { address: "" },
    deliveryLocation: { address: "" },
    pickupDate: "",
    pickupTime: "",
    agreedPrice: "",
    meta: {},
  });

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const [locationModal, setLocationModal] = useState<{
    visible: boolean;
    field: "pickup" | "delivery" | null;
  }>({ visible: false, field: null });

  const [dateTimeModalVisible, setDateTimeModalVisible] = useState(false);

  const [notification, setNotification] = useState<{
    visible: boolean;
    type: "error" | "success";
    title: string;
    messages: string[];
  }>({ visible: false, type: "error", title: "", messages: [] });

  const typeConfig = {
    "send-package": {
      title: "Send a Package",
      subtitle: "Dispatch a parcel to be delivered safely.",
      icon: PackageCheck,
      accent: "#10B981",
    },
    "deliver-package": {
      title: "Deliver a Package",
      subtitle: "Offer to deliver items along your route.",
      icon: Truck,
      accent: "#3B82F6",
    },
    "join-ride": {
      title: "Join a Ride",
      subtitle: "Find available seats for your journey.",
      icon: UserPlus,
      accent: "#8B5CF6",
    },
    "offer-ride": {
      title: "Offer a Ride",
      subtitle: "Publish your trip and take passengers.",
      icon: Gauge,
      accent: "#F59E0B",
    },
  };

  const config = typeConfig[requestType];
  const accentTint = `${config.accent}1A`;
  const steps = STEP_DEFINITIONS[requestType];
  const currentStepKey = steps[currentStepIndex].key;
  const isReviewStep = currentStepKey === "review";
  const isFirstStep = currentStepIndex === 0;

  const inputStyle = [
    styles.input,
    {
      backgroundColor: colors.surface,
      color: colors.text,
      borderColor: colors.border,
      fontFamily: FONT_FAMILY,
    },
  ];

  const updateMeta = (key: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      meta: { ...prev.meta, [key]: value },
    }));
  };

  const openLocationPicker = (field: "pickup" | "delivery") => {
    setLocationModal({ visible: true, field });
  };

  const handleSelectCity = (city: any) => {
    const address = `${city.name}, ${city.state} State`;
    if (locationModal.field === "pickup") {
      setFormData((prev: any) => ({ ...prev, pickupLocation: { address } }));
    } else if (locationModal.field === "delivery") {
      setFormData((prev: any) => ({ ...prev, deliveryLocation: { address } }));
    }
  };

  const handleUseNow = () => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(
      now.getDate()
    )}`;
    const timeStr = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
    setFormData((prev: any) => ({
      ...prev,
      pickupDate: dateStr,
      pickupTime: timeStr,
    }));
  };

  const handleConfirmDateTime = (dateStr: string, timeStr: string) => {
    setFormData((prev: any) => ({
      ...prev,
      pickupDate: dateStr,
      pickupTime: timeStr,
    }));
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-").map(Number);
    return `${d} ${MONTHS[m - 1]?.slice(0, 3)} ${y}`;
  };

  const formatDisplayTime = (timeStr: string) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${pad2(m)} ${period}`;
  };

  // Validation
  const validateStep = (stepKey: string): string[] => {
    const missing: string[] = [];

    if (stepKey === "route") {
      if (!formData.pickupLocation.address) missing.push("Pickup location");
      if (!formData.deliveryLocation.address) missing.push("Delivery location");
      if (!formData.pickupDate) missing.push("Date");
      if (!formData.pickupTime) missing.push("Time");
    }
    if (stepKey === "sender") {
      if (!formData.meta.senderFullName) missing.push("Sender full name");
      if (!formData.meta.senderPhone) missing.push("Sender phone number");
    }
    if (stepKey === "receiver") {
      if (!formData.meta.receiverFullName) missing.push("Receiver full name");
      if (!formData.meta.receiverPhone) missing.push("Receiver phone number");
      if (!formData.meta.note) missing.push("Note");
    }
    if (stepKey === "pricing") {
      if (!formData.agreedPrice) missing.push("Average price");
    }
    if (stepKey === "notes") {
      if (!formData.meta.notes) missing.push("Trip notes");
    }
    if (stepKey === "ride") {
      if (!formData.meta.numberOfPassengers)
        missing.push("Number of passengers");
    }

    return missing;
  };

  const validateAllSteps = (): string[] => {
    let allMissing: string[] = [];
    steps.forEach((step) => {
      if (step.key !== "review") {
        allMissing = allMissing.concat(validateStep(step.key));
      }
    });
    return allMissing;
  };

  // Navigation
  const handleNext = () => {
    const missing = validateStep(currentStepKey);
    if (missing.length > 0) {
      setNotification({
        visible: true,
        type: "error",
        title: "Missing Required Fields",
        messages: missing,
      });
      return;
    }
    setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    if (isFirstStep) {
      router.back();
      return;
    }
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };

  // Submission
  const handleCreate = async () => {
    const missing = validateAllSteps();
    if (missing.length > 0) {
      console.log(
        "❌ Missing Required Fields:",
        JSON.stringify(missing, null, 2)
      );
      setNotification({
        visible: true,
        type: "error",
        title: "Missing Required Fields",
        messages: missing,
      });
      return;
    }

    let payload: CreateRequestPayload;

    if (requestType === "send-package") {
      payload = {
        type: "send-package",
        pickupLocation: formData.pickupLocation,
        deliveryLocation: formData.deliveryLocation,
        pickupDate: formData.pickupDate,
        pickupTime: formData.pickupTime,
        meta: {
          isPerishable: false,
          isFragile: false,
          senderFullName: formData.meta.senderFullName || "",
          senderPhone: formData.meta.senderPhone || "",
          receiverFullName: formData.meta.receiverFullName || "",
          receiverPhone: formData.meta.receiverPhone || "",
          note: formData.meta.note || "",
        },
      };
    } else if (requestType === "deliver-package") {
      const price = Number(formData.agreedPrice) || 0;
      payload = {
        type: "deliver-package",
        pickupLocation: formData.pickupLocation,
        deliveryLocation: formData.deliveryLocation,
        pickupDate: formData.pickupDate,
        pickupTime: formData.pickupTime,
        agreedPrice: price,
        meta: {
          pickupLocation: formData.pickupLocation,
          deliveryLocation: formData.deliveryLocation,
          isPerishable: false,
          isFragile: false,
          pickupDate: formData.pickupDate,
          pickupTime: formData.pickupTime,
          agreedPrice: price,
        },
      };
    } else if (requestType === "join-ride") {
      payload = {
        type: "join-ride",
        pickupLocation: formData.pickupLocation,
        deliveryLocation: formData.deliveryLocation,
        pickupDate: formData.pickupDate,
        pickupTime: formData.pickupTime,
        meta: {
          notes: formData.meta.notes || "",
        },
      };
    } else {
      payload = {
        type: "offer-ride",
        pickupLocation: formData.pickupLocation,
        deliveryLocation: formData.deliveryLocation,
        pickupDate: formData.pickupDate,
        pickupTime: formData.pickupTime,
        meta: {
          numberOfPassengers: Number(formData.meta.numberOfPassengers) || 1,
          notes: formData.meta.notes || "",
        },
      };
    }

    console.log("📤 Submitting Payload:", JSON.stringify(payload, null, 2));

    try {
      const result = await dispatch(createRequest(payload)).unwrap();
      console.log("📥 Raw Dispatch Result:", JSON.stringify(result, null, 2));

      const createdData = result.data || result;
      console.log(
        "📦 Extracted Request Data:",
        JSON.stringify(createdData, null, 2)
      );

      if (payload.type === "send-package" || payload.type === "join-ride") {
        console.log(
          "🔀 Routing to next page with params for type:",
          payload.type
        );
        router.push({
          pathname: "/(features)/pairing_requests",
          params: {
            requestData: JSON.stringify(createdData),
          },
        });
      } else {
        setNotification({
          visible: true,
          type: "success",
          title: "Request Created",
          messages: ["Your request was created successfully!"],
        });

        console.log("ℹ️ Skipping routing for type:", payload.type);
      }
    } catch (err: any) {
      console.error("❌ Catch Error Object:", JSON.stringify(err, null, 2));
      setNotification({
        visible: true,
        type: "error",
        title: "Something Went Wrong",
        messages: [
          err?.message || "Failed to create request. Please try again.",
        ],
      });
    }
  };
  const handleNotificationClose = () => {
    const wasSuccess = notification.type === "success";
    setNotification((prev) => ({ ...prev, visible: false }));
    if (wasSuccess) router.back();
  };

  // Render helpers
  const renderLocationField = (
    label: string,
    field: "pickup" | "delivery",
    address: string
  ) => (
    <View style={styles.inputGroup}>
      <AppText
        size={13}
        weight="bold"
        color={colors.textMuted}
        style={styles.label}
      >
        {label}
      </AppText>
      <TouchableOpacity
        style={[
          styles.input,
          styles.locationInputTouchable,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        activeOpacity={0.75}
        onPress={() => openLocationPicker(field)}
      >
        <MapPin size={16} color={colors.textMuted} />
        <AppText
          size={15}
          color={address ? colors.text : colors.textMuted}
          style={{ marginLeft: 10, flex: 1, fontFamily: FONT_FAMILY }}
          numberOfLines={1}
        >
          {address || `Select ${field} city`}
        </AppText>
        <ChevronRight size={16} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );

  const renderRouteAndSchedule = () => (
    <>
      <AppText
        size={11}
        weight="bold"
        color={colors.textMuted}
        style={styles.sectionLabel}
      >
        ROUTE
      </AppText>
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {renderLocationField(
          "Pickup Location",
          "pickup",
          formData.pickupLocation.address
        )}
        {renderLocationField(
          "Delivery Location",
          "delivery",
          formData.deliveryLocation.address
        )}
      </View>

      <AppText
        size={11}
        weight="bold"
        color={colors.textMuted}
        style={styles.sectionLabel}
      >
        SCHEDULE
      </AppText>
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <AppText
              size={13}
              weight="bold"
              color={colors.textMuted}
              style={styles.label}
            >
              Date
            </AppText>
            <TouchableOpacity
              style={[
                styles.input,
                styles.locationInputTouchable,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setDateTimeModalVisible(true)}
            >
              <Calendar size={15} color={colors.textMuted} />
              <AppText
                size={13.5}
                color={formData.pickupDate ? colors.text : colors.textMuted}
                style={{ marginLeft: 8, flex: 1, fontFamily: FONT_FAMILY }}
                numberOfLines={1}
              >
                {formData.pickupDate
                  ? formatDisplayDate(formData.pickupDate)
                  : "Select date"}
              </AppText>
            </TouchableOpacity>
          </View>

          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <AppText
              size={13}
              weight="bold"
              color={colors.textMuted}
              style={styles.label}
            >
              Time
            </AppText>
            <TouchableOpacity
              style={[
                styles.input,
                styles.locationInputTouchable,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setDateTimeModalVisible(true)}
            >
              <Clock size={15} color={colors.textMuted} />
              <AppText
                size={13.5}
                color={formData.pickupTime ? colors.text : colors.textMuted}
                style={{ marginLeft: 8, flex: 1, fontFamily: FONT_FAMILY }}
                numberOfLines={1}
              >
                {formData.pickupTime
                  ? formatDisplayTime(formData.pickupTime)
                  : "Select time"}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.useNowButton, { borderColor: config.accent }]}
          onPress={handleUseNow}
        >
          <Zap size={14} color={config.accent} />
          <AppText
            size={12.5}
            weight="bold"
            color={config.accent}
            style={{ marginLeft: 6 }}
          >
            Use Today & Now
          </AppText>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderSenderStep = () => (
    <>
      <AppText
        size={11}
        weight="bold"
        color={colors.textMuted}
        style={styles.sectionLabel}
      >
        SENDER DETAILS
      </AppText>
      <View
        style={[
          styles.sectionCard,
          styles.senderCard,
          {
            backgroundColor: colors.surface,
            borderColor: config.accent + "55",
          },
        ]}
      >
        <View style={styles.inputGroup}>
          <AppText
            size={13}
            weight="bold"
            color={colors.textMuted}
            style={styles.label}
          >
            Sender Full Name
          </AppText>
          <View
            style={[
              styles.input,
              styles.iconInputRow,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <User size={16} color={colors.textMuted} />
            <TextInput
              style={[
                styles.iconInputText,
                { color: colors.text, fontFamily: FONT_FAMILY },
              ]}
              placeholder="Your full name"
              placeholderTextColor={colors.textMuted}
              value={formData.meta.senderFullName || ""}
              onChangeText={(v) => updateMeta("senderFullName", v)}
            />
          </View>
        </View>
        <View style={[styles.inputGroup, { marginBottom: 0 }]}>
          <AppText
            size={13}
            weight="bold"
            color={colors.textMuted}
            style={styles.label}
          >
            Sender Phone
          </AppText>
          <View
            style={[
              styles.input,
              styles.iconInputRow,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <Phone size={16} color={colors.textMuted} />
            <TextInput
              style={[
                styles.iconInputText,
                { color: colors.text, fontFamily: FONT_FAMILY },
              ]}
              placeholder="080xxxxxxxx"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={formData.meta.senderPhone || ""}
              onChangeText={(v) => updateMeta("senderPhone", v)}
            />
          </View>
        </View>
      </View>
    </>
  );

  const renderReceiverStep = () => (
    <>
      <AppText
        size={11}
        weight="bold"
        color={colors.textMuted}
        style={styles.sectionLabel}
      >
        RECEIVER DETAILS
      </AppText>
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.inputGroup}>
          <AppText
            size={13}
            weight="bold"
            color={colors.textMuted}
            style={styles.label}
          >
            Receiver Full Name
          </AppText>
          <View
            style={[
              styles.input,
              styles.iconInputRow,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <User size={16} color={colors.textMuted} />
            <TextInput
              style={[
                styles.iconInputText,
                { color: colors.text, fontFamily: FONT_FAMILY },
              ]}
              placeholder="Receiver name"
              placeholderTextColor={colors.textMuted}
              value={formData.meta.receiverFullName || ""}
              onChangeText={(v) => updateMeta("receiverFullName", v)}
            />
          </View>
        </View>
        <View style={[styles.inputGroup, { marginBottom: 0 }]}>
          <AppText
            size={13}
            weight="bold"
            color={colors.textMuted}
            style={styles.label}
          >
            Receiver Phone
          </AppText>
          <View
            style={[
              styles.input,
              styles.iconInputRow,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <Phone size={16} color={colors.textMuted} />
            <TextInput
              style={[
                styles.iconInputText,
                { color: colors.text, fontFamily: FONT_FAMILY },
              ]}
              placeholder="080xxxxxxxx"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={formData.meta.receiverPhone || ""}
              onChangeText={(v) => updateMeta("receiverPhone", v)}
            />
          </View>
        </View>
      </View>

      <AppText
        size={11}
        weight="bold"
        color={colors.textMuted}
        style={styles.sectionLabel}
      >
        NOTE
      </AppText>
      <View
        style={[
          styles.sectionCard,
          styles.noteCard,
          {
            backgroundColor: isDark ? colors.surface : "#FFFBEB",
            borderColor: colors.border,
          },
        ]}
      >
        <View style={[styles.inputGroup, { marginBottom: 0 }]}>
          <View style={styles.iconInputRowHeader}>
            <FileText size={14} color={colors.textMuted} />
            <AppText
              size={13}
              weight="bold"
              color={colors.textMuted}
              style={{ marginLeft: 6 }}
            >
              Additional Instructions
            </AppText>
          </View>
          <TextInput
            style={[
              inputStyle,
              {
                height: 100,
                textAlignVertical: "top",
                marginTop: 8,
                color: colors.text,
              },
            ]}
            multiline
            placeholder="e.g. Handle with care, call before arrival..."
            placeholderTextColor={"#666"}
            value={formData.meta.note || ""}
            onChangeText={(v) => updateMeta("note", v)}
          />
        </View>
      </View>
    </>
  );

  const renderPricingStep = () => (
    <>
      <AppText
        size={11}
        weight="bold"
        color={colors.textMuted}
        style={styles.sectionLabel}
      >
        PRICING
      </AppText>
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={[styles.inputGroup, { marginBottom: 0 }]}>
          <AppText
            size={13}
            weight="bold"
            color={colors.textMuted}
            style={styles.label}
          >
            Average Price (₦)
          </AppText>
          <TextInput
            style={inputStyle}
            keyboardType="numeric"
            placeholder="5000"
            placeholderTextColor={colors.textMuted}
            value={formData.agreedPrice}
            onChangeText={(v) => setFormData({ ...formData, agreedPrice: v })}
          />
        </View>
      </View>
    </>
  );

  const renderNotesStep = () => (
    <>
      <AppText
        size={11}
        weight="bold"
        color={colors.textMuted}
        style={styles.sectionLabel}
      >
        TRIP NOTES
      </AppText>
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={[styles.inputGroup, { marginBottom: 0 }]}>
          <AppText
            size={13}
            weight="bold"
            color={colors.textMuted}
            style={styles.label}
          >
            Notes
          </AppText>
          <TextInput
            style={[inputStyle, { height: 100, textAlignVertical: "top" }]}
            multiline
            placeholder="Any details about your trip..."
            placeholderTextColor={colors.textMuted}
            value={formData.meta.notes || ""}
            onChangeText={(v) => updateMeta("notes", v)}
          />
        </View>
      </View>
    </>
  );

  const renderRideDetailsStep = () => (
    <>
      <AppText
        size={11}
        weight="bold"
        color={colors.textMuted}
        style={styles.sectionLabel}
      >
        RIDE DETAILS
      </AppText>
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.inputGroup}>
          <AppText
            size={13}
            weight="bold"
            color={colors.textMuted}
            style={styles.label}
          >
            Number of Passengers
          </AppText>
          <TextInput
            style={inputStyle}
            keyboardType="numeric"
            placeholder="1-4"
            placeholderTextColor={colors.textMuted}
            value={formData.meta.numberOfPassengers || ""}
            onChangeText={(v) => updateMeta("numberOfPassengers", v)}
          />
        </View>
        <View style={[styles.inputGroup, { marginBottom: 0 }]}>
          <AppText
            size={13}
            weight="bold"
            color={colors.textMuted}
            style={styles.label}
          >
            Notes
          </AppText>
          <TextInput
            style={[inputStyle, { height: 90, textAlignVertical: "top" }]}
            multiline
            placeholder="Anything else riders should know..."
            placeholderTextColor={colors.textMuted}
            value={formData.meta.notes || ""}
            onChangeText={(v) => updateMeta("notes", v)}
          />
        </View>
      </View>
    </>
  );

  const renderReviewRow = (label: string, value: string) => (
    <View style={styles.reviewRow}>
      <AppText size={13} color={colors.textMuted}>
        {label}
      </AppText>
      <AppText
        size={14}
        weight="bold"
        color={colors.text}
        style={{ flex: 1, textAlign: "right", marginLeft: 12 }}
        numberOfLines={2}
      >
        {value || "—"}
      </AppText>
    </View>
  );

  const renderReviewStep = () => (
    <>
      <AppText
        size={11}
        weight="bold"
        color={colors.textMuted}
        style={styles.sectionLabel}
      >
        ROUTE & SCHEDULE
      </AppText>
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {renderReviewRow("Pickup", formData.pickupLocation.address)}
        {renderReviewRow("Delivery", formData.deliveryLocation.address)}
        {renderReviewRow(
          "Date",
          formData.pickupDate ? formatDisplayDate(formData.pickupDate) : ""
        )}
        {renderReviewRow(
          "Time",
          formData.pickupTime ? formatDisplayTime(formData.pickupTime) : ""
        )}
      </View>

      {requestType === "send-package" && (
        <>
          <AppText
            size={11}
            weight="bold"
            color={colors.textMuted}
            style={styles.sectionLabel}
          >
            SENDER
          </AppText>
          <View
            style={[
              styles.sectionCard,
              styles.senderCard,
              {
                backgroundColor: colors.surface,
                borderColor: config.accent + "55",
              },
            ]}
          >
            {renderReviewRow("Full name", formData.meta.senderFullName)}
            {renderReviewRow("Phone", formData.meta.senderPhone)}
          </View>

          <AppText
            size={11}
            weight="bold"
            color={colors.textMuted}
            style={styles.sectionLabel}
          >
            RECEIVER
          </AppText>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {renderReviewRow("Full name", formData.meta.receiverFullName)}
            {renderReviewRow("Phone", formData.meta.receiverPhone)}
          </View>

          <AppText
            size={11}
            weight="bold"
            color={colors.textMuted}
            style={styles.sectionLabel}
          >
            NOTE
          </AppText>
          <View
            style={[
              styles.sectionCard,
              styles.noteCard,
              {
                backgroundColor: isDark ? colors.surface : "#FFFBEB",
                borderColor: colors.border,
              },
            ]}
          >
            <AppText
              size={13.5}
              color={colors.text}
              style={{ fontFamily: FONT_FAMILY }}
            >
              {formData.meta.note || "—"}
            </AppText>
          </View>
        </>
      )}

      {requestType === "deliver-package" && (
        <>
          <AppText
            size={11}
            weight="bold"
            color={colors.textMuted}
            style={styles.sectionLabel}
          >
            PRICING
          </AppText>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {renderReviewRow(
              "Average Price",
              `₦${formData.agreedPrice || "0"}`
            )}
          </View>
        </>
      )}

      {requestType === "join-ride" && (
        <>
          <AppText
            size={11}
            weight="bold"
            color={colors.textMuted}
            style={styles.sectionLabel}
          >
            TRIP NOTES
          </AppText>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <AppText
              size={13.5}
              color={colors.text}
              style={{ fontFamily: FONT_FAMILY }}
            >
              {formData.meta.notes || "—"}
            </AppText>
          </View>
        </>
      )}

      {requestType === "offer-ride" && (
        <>
          <AppText
            size={11}
            weight="bold"
            color={colors.textMuted}
            style={styles.sectionLabel}
          >
            RIDE DETAILS
          </AppText>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {renderReviewRow("Passengers", formData.meta.numberOfPassengers)}
            {renderReviewRow("Notes", formData.meta.notes)}
          </View>
        </>
      )}
    </>
  );

  const renderStepContent = () => {
    switch (currentStepKey) {
      case "route":
        return renderRouteAndSchedule();
      case "sender":
        return renderSenderStep();
      case "receiver":
        return renderReceiverStep();
      case "pricing":
        return renderPricingStep();
      case "notes":
        return renderNotesStep();
      case "ride":
        return renderRideDetailsStep();
      case "review":
        return renderReviewStep();
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleBack}
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          activeOpacity={0.7}
        >
          <ArrowLeft size={19} color={colors.text} />
        </TouchableOpacity>
        <AppText size={17} weight="bold" color={colors.text}>
          {config.title}
        </AppText>
      </View>

      <StepIndicator
        steps={steps}
        currentIndex={currentStepIndex}
        accent={config.accent}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isFirstStep && (
          <View
            style={[
              styles.introCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View
              style={[styles.introIconBox, { backgroundColor: accentTint }]}
            >
              <config.icon size={26} color={config.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText size={16} weight="bold" color={colors.text}>
                {config.title}
              </AppText>
              <AppText
                size={12.5}
                color={colors.textMuted}
                style={{ marginTop: 2 }}
              >
                {config.subtitle}
              </AppText>
            </View>
          </View>
        )}

        {renderStepContent()}

        <View style={styles.navRow}>
          {!isFirstStep && (
            <TouchableOpacity
              style={[
                styles.prevButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={handleBack}
            >
              <AppText size={15} weight="bold" color={colors.text}>
                Previous
              </AppText>
            </TouchableOpacity>
          )}

          {!isReviewStep ? (
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: colors.text }]}
              onPress={handleNext}
            >
              <AppText size={15} weight="bold" color={colors.background}>
                Continue
              </AppText>
              <View
                style={[
                  styles.submitChevron,
                  { backgroundColor: `${colors.background}1F` },
                ]}
              >
                <ChevronRight size={16} color={colors.background} />
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: config.accent }]}
              onPress={handleCreate}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <AppText size={15} weight="bold" color="#FFFFFF">
                    Create Request
                  </AppText>
                  <View
                    style={[
                      styles.submitChevron,
                      { backgroundColor: "#FFFFFF33" },
                    ]}
                  >
                    <Check size={16} color="#FFFFFF" />
                  </View>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <LocationPickerModal
        visible={locationModal.visible}
        onClose={() => setLocationModal({ visible: false, field: null })}
        title={
          locationModal.field === "pickup"
            ? "Select Pickup City"
            : "Select Delivery City"
        }
        onSelectCity={handleSelectCity}
      />

      <DateTimePickerModal
        visible={dateTimeModalVisible}
        onClose={() => setDateTimeModalVisible(false)}
        onConfirm={handleConfirmDateTime}
      />

      <NotificationModal
        visible={notification.visible}
        onClose={handleNotificationClose}
        type={notification.type}
        title={notification.title}
        messages={notification.messages}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    paddingTop: Platform.OS === "ios" ? 54 : 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 60, gap: 4 },
  introCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 20,
  },
  introIconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  sectionCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  senderCard: { padding: 24, borderWidth: 1.5 },
  noteCard: { padding: 16 },
  inputGroup: { marginBottom: 16 },
  label: { marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 15 },
  iconInputRow: { flexDirection: "row", alignItems: "center" },
  iconInputText: { flex: 1, marginLeft: 10, fontSize: 15, padding: 0 },
  iconInputRowHeader: { flexDirection: "row", alignItems: "center" },
  locationInputTouchable: { flexDirection: "row", alignItems: "center" },
  row: { flexDirection: "row" },
  useNowButton: {
    marginTop: 4,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  navRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  prevButton: {
    flex: 1,
    height: 56,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 56,
    borderRadius: 999,
  },
  submitChevron: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
  },
});
