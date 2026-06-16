import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Alert,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { AppText } from "@/components/AppText";
import { LinearGradient } from "expo-linear-gradient";
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
} from "lucide-react-native";
import * as Clipboard from "expo-clipboard";

// Redux
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/api/store";
import { getRequestById } from "@/api/slices/request.slice";

const { width } = Dimensions.get("window");

export default function RequestDetailsScreen() {
  const { theme: colors, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { id, type } = useLocalSearchParams<{ id: string; type: string }>();

  // State for bottom modal/toast
  const [copiedVisible, setCopiedVisible] = useState(false);
  const [copiedLabel, setCopiedLabel] = useState("");

  const {
    currentRequest,
    isLoading: detailLoading,
    error,
  } = useSelector((state: RootState) => state.request);

  const request = currentRequest;

  useEffect(() => {
    if (id && type) {
      dispatch(getRequestById({ id, type }));
    }
  }, [id, type, dispatch]);

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

    // Trigger custom bottom notification
    setCopiedLabel(label);
    setCopiedVisible(true);

    // Auto-hide after 2.5 seconds
    setTimeout(() => {
      setCopiedVisible(false);
    }, 2500);
  };

  const handleActionPress = () => {
    if (!request) return;

    const lowerType = type?.toLowerCase().trim();

    switch (lowerType) {
      case "parcel":
        router.push({
          pathname: "/drivers_menu",
          params: { id: request._id || id },
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
          params: { id: request._id || id },
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

  if (detailLoading && !request) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText style={{ marginTop: 12, color: colors.textMuted }}>
          Loading Request Details...
        </AppText>
      </View>
    );
  }

  if (error || !request) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <AppText color="red" size={16} weight="semibold">
          {error || "Failed to load request details"}
        </AppText>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <AppText color={colors.primary} weight="bold" size={16}>
            ← Go Back
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  const lowerType = type?.toLowerCase().trim();
  const isParcel = lowerType === "parcel";

  const InfoRow = ({
    icon,
    label,
    value,
    onPress,
    copyable = false,
    copyLabel = "",
  }: {
    icon?: React.ReactNode;
    label: string;
    value?: any;
    onPress?: () => void;
    copyable?: boolean;
    copyLabel?: string;
  }) => {
    if (value === undefined || value === null || value === "") return null;

    const displayValue =
      typeof value === "object" ? JSON.stringify(value) : String(value);

    return (
      <View style={styles.infoRow}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <View style={styles.infoContent}>
          <AppText size={13} color={colors.textMuted} weight="medium">
            {label}
          </AppText>

          <TouchableOpacity
            onPress={
              copyable
                ? () => copyToClipboard(displayValue, copyLabel || label)
                : onPress
            }
            activeOpacity={0.7}
            disabled={!onPress && !copyable}
          >
            <AppText
              size={15}
              color={copyable ? colors.primary : colors.text}
              weight="semibold"
              style={copyable ? { textDecorationLine: "underline" } : {}}
            >
              {displayValue}
            </AppText>
          </TouchableOpacity>
        </View>

        {copyable && (
          <TouchableOpacity
            onPress={() => copyToClipboard(displayValue, copyLabel || label)}
            style={styles.copyButton}
          >
            <Copy size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Premium Header */}
      <LinearGradient
        colors={isDark ? [colors.surface, colors.surface] : ["#F8F5FF", "#FFFFFF"]}
        style={styles.header}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>

            <AppText size={20} weight="bold" color={colors.text}>
              {type?.toUpperCase()} Details
            </AppText>

            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Route Card - Simple Inline */}
        <View style={[styles.heroCard, { backgroundColor: colors.surface }]}>
          <View style={styles.typeBadge}>
            <AppText size={13} weight="bold" color={colors.primary}>
              {type?.toUpperCase()}
            </AppText>
          </View>

          <View style={styles.routeContainer}>
            <AppText size={18} weight="semibold" color={colors.text}>
              Pickup:{" "}
              {request.route?.pickupAddress ||
                request.pickupAddress ||
                request.pickupPoint ||
                "Unknown Pickup"}
            </AppText>

            <AppText
              size={18}
              weight="semibold"
              color={colors.text}
              style={{ marginVertical: 8 }}
            >
              ↓
            </AppText>

            <AppText size={18} weight="semibold" color={colors.text}>
              Destination:{" "}
              {request.route?.deliveryAddress ||
                request.destinationCity ||
                request.dropoffPoint ||
                "Unknown Destination"}
            </AppText>
          </View>
        </View>

        {/* Security Codes - Copyable */}
        {(isParcel && request.parties) ||
        (lowerType === "joinride" && request.pickupCode) ? (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.cardHeader}>
              <Shield size={22} color={colors.primary} />
              <AppText
                size={17}
                weight="bold"
                color={colors.text}
                style={{ marginLeft: 10 }}
              >
                Security Codes
              </AppText>
            </View>

            {isParcel && request.parties && (
              <>
                <InfoRow
                  label="Sender Pickup Code"
                  value={request.parties.sender?.pickupCode}
                  copyable
                  copyLabel="Sender Pickup Code"
                />
                <InfoRow
                  label="Recipient Pickup Code"
                  value={request.parties.recipient?.pickupCode}
                  copyable
                  copyLabel="Recipient Pickup Code"
                />
              </>
            )}

            {lowerType === "joinride" && request.pickupCode && (
              <InfoRow
                label="Ride Secure Code"
                value={request.pickupCode}
                copyable
                copyLabel="Ride Secure Code"
              />
            )}
          </View>
        ) : null}

        {/* Basic Information */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <Calendar size={22} color={colors.primary} />
            <AppText
              size={17}
              weight="bold"
              color={colors.text}
              style={{ marginLeft: 10 }}
            >
              Basic Information
            </AppText>
          </View>

          <InfoRow
            icon={<Clock size={20} color={colors.primary} />}
            label="Departure Schedule"
            value={request.schedule?.type || request.schedule}
          />
          <InfoRow
            icon={<Package size={20} color={colors.primary} />}
            label="Estimated Fare"
            value={
              request.estimatedFare
                ? `₦${Number(request.estimatedFare).toLocaleString()}`
                : null
            }
          />
          <InfoRow
            icon={<Users size={20} color={colors.primary} />}
            label="Available Seats"
            value={request.availableSeats}
          />
          <InfoRow label="Departure Time" value={request.departureTime} />
          <InfoRow label="Created" value={request.createdAt} />
        </View>

        {/* Package Details */}
        {(request.item || request.properties) && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.cardHeader}>
              <Package size={22} color={colors.primary} />
              <AppText
                size={17}
                weight="bold"
                color={colors.text}
                style={{ marginLeft: 10 }}
              >
                Package Details
              </AppText>
            </View>

            <InfoRow label="Item" value={request.item?.name || request.item} />
            <InfoRow
              label="Fragile"
              value={
                request.item?.properties?.isFragile ??
                request.properties?.isFragile
                  ? "Yes"
                  : "No"
              }
            />
            <InfoRow
              label="Perishable"
              value={
                request.item?.properties?.isPerishable ??
                request.properties?.isPerishable
                  ? "Yes"
                  : "No"
              }
            />
            <InfoRow
              label="Insured"
              value={request.item?.properties?.isInsured ? "Yes" : "No"}
            />
          </View>
        )}

        {/* People Involved */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <Users size={22} color={colors.primary} />
            <AppText
              size={17}
              weight="bold"
              color={colors.text}
              style={{ marginLeft: 10 }}
            >
              People Involved
            </AppText>
          </View>

          <InfoRow
            label="Client"
            value={request.requestedBy?.fullName || request.user?.fullName}
          />
          <InfoRow
            icon={<Phone size={20} color={colors.primary} />}
            label="Client Phone"
            value={request.requestedBy?.phone || request.user?.phone}
            onPress={() =>
              handlePhoneCall(request.requestedBy?.phone || request.user?.phone)
            }
          />
          <InfoRow label="Driver" value={request.driver?.fullName} />
        </View>

        {/* Negotiations */}
        {request.negotiations?.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.cardHeader}>
              <AppText size={17} weight="bold" color={colors.text}>
                Active Negotiations ({request.negotiations.length})
              </AppText>
            </View>

            {request.negotiations.map((neg: any, index: number) => (
              <View key={index} style={styles.negotiationCard}>
                <InfoRow label="Status" value={neg.status} />
                <InfoRow
                  label="Agreed Amount"
                  value={
                    neg.agreedAmount
                      ? `₦${Number(neg.agreedAmount).toLocaleString()}`
                      : null
                  }
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.floatingAction}>
        <TouchableOpacity
          style={styles.mainActionButton}
          onPress={handleActionPress}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[colors.primary, "#6D28D9"]}
            style={styles.gradientButton}
          >
            <AppText size={17} weight="bold" color="#fff">
              {lowerType === "parcel" ? "Find Drivers" : "View Full Details"}
            </AppText>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Custom Copied Bottom Modal Overlay */}
      {copiedVisible && (
        <View
          style={[styles.modalOverlay, { backgroundColor: colors.surface }]}
        >
          <CheckCircle size={20} color="#10B981" style={{ marginRight: 10 }} />
          <AppText size={14} weight="semibold" color={colors.text}>
            {copiedLabel} copied to clipboard!
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight || 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: { padding: 8 },

  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 170 }, // Increased padding slightly to stay clear of buttons & notifications

  heroCard: {
    margin: 16,
    padding: 24,
    borderRadius: 28,

  },
  typeBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 30,
  },
  routeContainer: {
    marginTop: 20,
  },

  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 24,
    padding: 20,

  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  iconContainer: { width: 36, alignItems: "center" },
  infoContent: { flex: 1 },
  copyButton: {
    padding: 6,
  },

  negotiationCard: {
    backgroundColor: "rgba(0,0,0,0.03)",
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
  },

  floatingAction: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  mainActionButton: {
    borderRadius: 999,
    overflow: "hidden",
    elevation: 12,
  },
  gradientButton: {
    paddingVertical: 18,
    alignItems: "center",
  },

  /* Added Modal Styles */
  modalOverlay: {
    position: "absolute",
    bottom: 100, // Positions it cleanly right above the floating action button layout
    left: 24,
    right: 24,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  backBtn: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 12,
  },
});
