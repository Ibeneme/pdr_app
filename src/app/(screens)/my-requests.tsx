import React, { useEffect, useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { palette, useTheme } from "@/contexts/ThemeContext";
import { AppText } from "@/components/AppText";
import {
  ArrowLeft,
  Phone,
  Calendar,
  Users,
  Package,
  Shield,
  Clock,
  Copy,
  CheckCircle,
  MapPin,
  Circle,
  Info,
} from "lucide-react-native";
import * as Clipboard from "expo-clipboard";

// Redux
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/api/store";
import { getRequestById } from "@/api/slices/request.slice";

// ---- Warm palette ----
const CREAM = "#f4f4f4";
const ACCENT = {
  orange: "#8A2BE2",
  orangeDark: palette.purpleMain,
  orangeSoft: "#E6E6FA",
};

const INK = ACCENT.orangeDark;

interface InfoRowProps {
  icon?: React.ReactNode;
  label: string;
  description?: string;
  value?: any;
  onPress?: () => void;
  copyable?: boolean;
  copyLabel?: string;
  colors: any;
  onCopy: (text: string, label: string) => void;
}

const InfoRow = ({
  icon,
  label,
  description,
  value,
  onPress,
  copyable = false,
  copyLabel = "",
  colors,
  onCopy,
}: InfoRowProps) => {
  if (value === undefined || value === null || value === "") return null;
  const displayValue =
    typeof value === "object" ? JSON.stringify(value) : String(value);

  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.border + "40" }]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <View style={styles.infoContent}>
        <AppText
          size={12}
          color={colors.textMuted}
          weight="medium"
          style={styles.infoLabel}
        >
          {label}
        </AppText>
        {description && (
          <AppText size={11} color={colors.textMuted} style={styles.infoDesc}>
            {description}
          </AppText>
        )}
        <TouchableOpacity
          onPress={
            copyable ? () => onCopy(displayValue, copyLabel || label) : onPress
          }
          activeOpacity={0.7}
          disabled={!onPress && !copyable}
        >
          <AppText
            size={15}
            color={copyable || onPress ? INK : colors.text}
            weight="semibold"
          >
            {displayValue}
          </AppText>
        </TouchableOpacity>
      </View>
      {copyable && (
        <TouchableOpacity
          onPress={() => onCopy(displayValue, copyLabel || label)}
          style={styles.copyButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Copy size={16} color={INK} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default function RequestDetailsScreen() {
  const { theme: colors, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { id, type } = useLocalSearchParams<{ id: string; type: string }>();

  const [copiedVisible, setCopiedVisible] = useState(false);
  const [copiedLabel, setCopiedLabel] = useState("");

  const {
    currentRequest: request,
    isLoading: detailLoading,
    error,
  } = useSelector((state: RootState) => state.request);

  useEffect(() => {
    if (id && type) {
      dispatch(getRequestById({ id, type }));
    }
  }, [id, type, dispatch]);

  const lowerType = useMemo(() => type?.toLowerCase().trim() || "", [type]);
  const isParcel = lowerType === "parcel";

  const laymanPageDescription = useMemo(() => {
    switch (lowerType) {
      case "parcel":
      case "parcelrequest":
        return "This screen shows the details for a delivery task. You can view what item is being shipped, its security codes, and match it with an available driver to get it delivered.";
      case "joinride":
      case "join ride":
        return "This page contains travel details for a passenger looking to join a trip. You can verify pickup timing, destination layout, and confirm seat placement bookings.";
      case "rideoffer":
      case "offer ride":
        return "This screen shows details for an open driving route offered by a driver looking for passengers along their line of travel.";
      default:
        return "This summary page provides a comprehensive operational breakdown regarding your logistics schedule, tracking routes, and point-of-contact details.";
    }
  }, [lowerType]);

  const handlePhoneCall = (phoneNumber?: string) => {
    if (!phoneNumber) return;
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, "");
    const url = `tel:${cleanPhone}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) Linking.openURL(url);
        else
          Alert.alert("Error", "Phone calls are not supported on this device.");
      })
      .catch((err) => console.error("Phone dialer error:", err));
  };

  const copyToClipboard = async (text: string, label: string) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    setCopiedLabel(label);
    setCopiedVisible(true);
    setTimeout(() => setCopiedVisible(false), 2500);
  };

  // NEW: Check for paid negotiation
  const getPaidNegotiation = () => {
    if (!request?.negotiations || !Array.isArray(request.negotiations))
      return null;
    return request.negotiations.find((neg: any) => neg.isPaid === true);
  };

  const handleActionPress = () => {
    if (!request) return;

    const paidNeg = getPaidNegotiation();

    // If there is a paid negotiation → route to specific details screen
    if (paidNeg) {
      const negotiatorServiceId = paidNeg.negotiatorService || paidNeg.service;

      if (lowerType === "parcelrequest" || lowerType === "parcel") {
        router.push({
          pathname: "/(details)/details",
          params: {
            id: request._id || id,
            type: "parcelrequest",
            negotiatorService: negotiatorServiceId,
          },
        });
      } else {
        // Ride related
        router.push({
          pathname: "/(details)/ride",
          params: {
            id: request._id || id,
            driverName: request.driver?.fullName,
            driverPhone: request.driver?.phone,
            pickup: request.pickupPoint || request.route?.pickupAddress,
            dropoff: request.dropoffPoint || request.route?.deliveryAddress,
            fare: request.estimatedFare,
            time: request.departureTime,
            seats: request.availableSeats,
            negotiatorService: negotiatorServiceId,
          },
        });
      }
      return;
    }

    // Fallback to original behavior if no paid negotiation
    switch (lowerType) {
      case "parcel":
        router.push({
          pathname: "/drivers_menu",
          params: { id: request._id || id, request: JSON.stringify(request) },
        });
        break;
      case "parcelrequest":
        router.push({
          pathname: "/(details)/details",
          params: { id: request._id, type: "parcelrequest" },
        });
        break;
      case "joinride":
      case "join ride":
        router.push({
          pathname: "/join_ride",
          params: { id: request._id || id, request: JSON.stringify(request) },
        });
        break;
      case "rideoffer":
      case "offer ride":
        router.push({ pathname: "/ride", params: { id: request._id || id } });
        break;
      default:
        Alert.alert("Info", "No matching screen for this request type");
    }
  };

  const pickupAddr =
    request?.route?.pickupAddress ||
    request?.pickupAddress ||
    request?.pickupPoint ||
    "Unknown Pickup";
  const dropoffAddr =
    request?.route?.deliveryAddress ||
    request?.destinationCity ||
    request?.dropoffPoint ||
    "Unknown Destination";

  const canvasColor = isDark ? colors.background : CREAM;

  if (detailLoading && !request) {
    return (
      <View style={[styles.center, { backgroundColor: canvasColor }]}>
        <ActivityIndicator size="large" color={ACCENT.orange} />
        <AppText style={styles.loadingText} color={colors.textMuted}>
          Loading Request Details...
        </AppText>
      </View>
    );
  }

  if (error || !request) {
    return (
      <View style={[styles.center, { backgroundColor: canvasColor }]}>
        <AppText color="#EF4444" size={16} weight="semibold">
          {error || "Failed to load request details"}
        </AppText>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <AppText color={INK} weight="bold" size={16}>
            ← Go Back
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: canvasColor }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={styles.headerWrap}>
        <SafeAreaView>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: colors.surface }]}
              onPress={() => router.back()}
            >
              <ArrowLeft size={20} color={colors.text} />
            </TouchableOpacity>
            <AppText size={18} weight="bold" color={colors.text}>
              {type?.toUpperCase()} DETAILS
            </AppText>
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.pageIntroCard, { backgroundColor: ACCENT.orangeSoft }]}
        >
          <View style={styles.introHeader}>
            <Info size={16} color={ACCENT.orangeDark} />
            <AppText
              size={13}
              weight="bold"
              color={ACCENT.orangeDark}
              style={{ marginLeft: 6 }}
            >
              What is this page?
            </AppText>
          </View>
          <AppText size={13} color={ACCENT.orangeDark} style={styles.introText}>
            {laymanPageDescription}
          </AppText>
        </View>

        {/* Hero Timeline Card */}
        <View
          style={[
            styles.heroCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: `${ACCENT.orange}1A` },
            ]}
          >
            <AppText size={11} weight="bold" color={ACCENT.orangeDark}>
              {type?.toUpperCase()} TYPE
            </AppText>
          </View>

          <View style={styles.timelineContainer}>
            <View style={styles.timelineGraphics}>
              <Circle size={10} color={INK} fill={INK} />
              <View
                style={[
                  styles.timelineLine,
                  { backgroundColor: colors.border },
                ]}
              />
              <MapPin size={14} color={colors.textMuted} />
            </View>

            <View style={styles.timelineContent}>
              <View style={styles.timelineStep}>
                <AppText
                  size={11}
                  color={colors.textMuted}
                  weight="bold"
                  style={styles.badgeLabel}
                >
                  STARTPOINT / PICKUP ADDRESS
                </AppText>
                <AppText
                  size={15}
                  weight="semibold"
                  color={colors.text}
                  numberOfLines={2}
                >
                  {pickupAddr}
                </AppText>
              </View>
              <View style={[styles.timelineStep, { marginTop: 24 }]}>
                <AppText
                  size={11}
                  color={colors.textMuted}
                  weight="bold"
                  style={styles.badgeLabel}
                >
                  DESTINATION DROP-OFF POINT
                </AppText>
                <AppText
                  size={15}
                  weight="semibold"
                  color={colors.text}
                  numberOfLines={2}
                >
                  {dropoffAddr}
                </AppText>
              </View>
            </View>
          </View>
        </View>

        {/* Security Section */}
        {((isParcel && request.parties) ||
          (lowerType === "joinride" && request.pickupCode)) && (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.cardHeader}>
              <Shield size={18} color={ACCENT.orangeDark} />
              <View style={{ marginLeft: 10 }}>
                <AppText size={15} weight="bold" color={colors.text}>
                  Security Authorization
                </AppText>
                <AppText size={11} color={colors.textMuted}>
                  Codes required to authenticate transfer validation
                </AppText>
              </View>
            </View>
            {isParcel && request.parties && (
              <>
                <InfoRow
                  label="Sender Pickup Code"
                  value={request.parties.sender?.pickupCode}
                  copyable
                  colors={colors}
                  onCopy={copyToClipboard}
                />
                <InfoRow
                  label="Recipient Pickup Code"
                  value={request.parties.recipient?.pickupCode}
                  copyable
                  colors={colors}
                  onCopy={copyToClipboard}
                />
              </>
            )}
            {lowerType === "joinride" && request.pickupCode && (
              <InfoRow
                label="Ride Secure Code"
                value={request.pickupCode}
                copyable
                colors={colors}
                onCopy={copyToClipboard}
              />
            )}
          </View>
        )}

        {/* Trip Logistics */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardHeader}>
            <Calendar size={18} color={ACCENT.orangeDark} />
            <View style={{ marginLeft: 10 }}>
              <AppText size={15} weight="bold" color={colors.text}>
                Trip Logistics
              </AppText>
              <AppText size={11} color={colors.textMuted}>
                Timeline benchmarks, parameters, and capacity limits
              </AppText>
            </View>
          </View>
          <InfoRow
            icon={<Clock size={16} color={colors.textMuted} />}
            label="Departure Schedule"
            value={request.schedule?.type || request.schedule}
            colors={colors}
            onCopy={copyToClipboard}
          />
          <InfoRow
            icon={<Package size={16} color={colors.textMuted} />}
            label="Estimated Ride Fare"
            value={
              request.estimatedFare
                ? `₦${Number(request.estimatedFare).toLocaleString()}`
                : null
            }
            colors={colors}
            onCopy={copyToClipboard}
          />
          <InfoRow
            icon={<Users size={16} color={colors.textMuted} />}
            label="Available Seats Requested"
            value={request.availableSeats}
            colors={colors}
            onCopy={copyToClipboard}
          />
          <InfoRow
            label="Scheduled Departure Time"
            value={request.departureTime}
            colors={colors}
            onCopy={copyToClipboard}
          />
          <InfoRow
            label="Request Timestamp"
            value={request.createdAt}
            colors={colors}
            onCopy={copyToClipboard}
          />
        </View>

        {/* Package Specification */}
        {(request.item || request.properties) && (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.cardHeader}>
              <Package size={18} color={ACCENT.orangeDark} />
              <View style={{ marginLeft: 10 }}>
                <AppText size={15} weight="bold" color={colors.text}>
                  Package Specification
                </AppText>
                <AppText size={11} color={colors.textMuted}>
                  Physical metrics and handling instructions for freight
                </AppText>
              </View>
            </View>
            <InfoRow
              label="Item Description"
              value={request.item?.name || request.item}
              colors={colors}
              onCopy={copyToClipboard}
            />
            <InfoRow
              label="Fragile Handling"
              value={
                request.item?.properties?.isFragile ??
                request.properties?.isFragile
                  ? "Yes"
                  : "No"
              }
              colors={colors}
              onCopy={copyToClipboard}
            />
            <InfoRow
              label="Perishable Goods"
              value={
                request.item?.properties?.isPerishable ??
                request.properties?.isPerishable
                  ? "Yes"
                  : "No"
              }
              colors={colors}
              onCopy={copyToClipboard}
            />
            <InfoRow
              label="Insured Logistics Value"
              value={request.item?.properties?.isInsured ? "Yes" : "No"}
              colors={colors}
              onCopy={copyToClipboard}
            />
          </View>
        )}

        {/* Assigned Personnel */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardHeader}>
            <Users size={18} color={ACCENT.orangeDark} />
            <View style={{ marginLeft: 10 }}>
              <AppText size={15} weight="bold" color={colors.text}>
                Assigned Personnel
              </AppText>
              <AppText size={11} color={colors.textMuted}>
                Identity matching contact values linked to this entry
              </AppText>
            </View>
          </View>
          <InfoRow
            label="Client Name"
            value={request.requestedBy?.fullName || request.user?.fullName}
            colors={colors}
            onCopy={copyToClipboard}
          />
          <InfoRow
            icon={<Phone size={16} color={ACCENT.orangeDark} />}
            label="Client Phone Contact"
            value={request.requestedBy?.phone || request.user?.phone}
            onPress={() =>
              handlePhoneCall(request.requestedBy?.phone || request.user?.phone)
            }
            colors={colors}
            onCopy={copyToClipboard}
          />
          <InfoRow
            label="Assigned Driver"
            value={request.driver?.fullName}
            colors={colors}
            onCopy={copyToClipboard}
          />
        </View>

        {/* Negotiations */}
        {request.negotiations?.length > 0 && (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.cardHeader}>
              <View>
                <AppText size={15} weight="bold" color={colors.text}>
                  Active Bidding Offers ({request.negotiations.length})
                </AppText>
                <AppText size={11} color={colors.textMuted}>
                  Counter-pricing metrics currently under validation review
                </AppText>
              </View>
            </View>
            {request.negotiations.map((neg: any, index: number) => (
              <View
                key={index}
                style={[
                  styles.negotiationCard,
                  { backgroundColor: colors.background },
                ]}
              >
                <InfoRow
                  label="Bidding Status"
                  value={neg.status}
                  colors={colors}
                  onCopy={copyToClipboard}
                />
                <InfoRow
                  label="Agreed Counter Amount"
                  value={
                    neg.agreedAmount
                      ? `₦${Number(neg.agreedAmount).toLocaleString()}`
                      : null
                  }
                  colors={colors}
                  onCopy={copyToClipboard}
                />
                <InfoRow
                  label="Payment Status"
                  value={neg.isPaid ? "✅ Paid" : "Pending"}
                  colors={colors}
                  onCopy={copyToClipboard}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <View
        style={[
          styles.floatingAction,
          {
            backgroundColor: colors.background + "E6",
            borderTopColor: colors.border,
          },
        ]}
      >
        <View style={styles.actionDescContainer}>
          <AppText size={11} color={colors.textMuted}>
            {getPaidNegotiation()
              ? "This request has been paid. Tap to view full confirmed details."
              : lowerType === "parcel"
              ? "Tap below to scan, match and link this cargo request with active drivers nearby."
              : "Tap below to process transaction verification frameworks and check sub-details."}
          </AppText>
        </View>

        <TouchableOpacity
          style={[
            styles.mainActionButton,
            { backgroundColor: ACCENT.orange, marginBottom: 64 },
          ]}
          onPress={handleActionPress}
          activeOpacity={0.85}
        >
          <AppText size={15} weight="bold" color="#FFF">
            {getPaidNegotiation()
              ? "View Confirmed Details"
              : lowerType === "parcel"
              ? "Find Active Drivers"
              : "View Full Details"}
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Copied Toast */}
      {copiedVisible && (
        <View
          style={[styles.modalOverlay, { backgroundColor: ACCENT.orangeDark }]}
        >
          <CheckCircle size={16} color="#10B981" style={styles.toastIcon} />
          <AppText size={13} weight="semibold" color="#FFF">
            {copiedLabel} copied to clipboard!
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: { marginTop: 12 },
  backBtn: { marginTop: 16, padding: 8 },
  headerWrap: { paddingBottom: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerSpacer: { width: 40 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 180 },
  pageIntroCard: { padding: 16, borderRadius: 20, marginBottom: 20 },
  introHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  introText: { lineHeight: 18 },
  heroCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  typeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 20,
  },
  timelineContainer: { flexDirection: "row" },
  timelineGraphics: { alignItems: "center", width: 24, paddingVertical: 4 },
  timelineLine: { width: 2, flex: 1, marginVertical: 6, borderRadius: 1 },
  timelineContent: { flex: 1, marginLeft: 12 },
  timelineStep: { justifyContent: "center" },
  badgeLabel: { marginBottom: 4, letterSpacing: 0.3 },
  card: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  infoLabel: { marginBottom: 2 },
  infoDesc: {
    marginBottom: 6,
    fontSize: 11,
    fontStyle: "italic",
    opacity: 0.8,
  },
  iconContainer: { marginRight: 12 },
  infoContent: { flex: 1 },
  copyButton: { padding: 6, marginLeft: 8 },
  negotiationCard: { padding: 12, borderRadius: 12, marginTop: 8 },
  floatingAction: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  actionDescContainer: { marginBottom: 10, paddingHorizontal: 10 },
  mainActionButton: {
    width: "100%",
    height: 54,
    borderRadius: 64,
    marginBottom: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    position: "absolute",
    bottom: 140,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 100,
  },
  toastIcon: { marginRight: 8 },
});
