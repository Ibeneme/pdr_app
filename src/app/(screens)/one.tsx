import React, { useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { AppText } from "@/components/AppText";

// Redux
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/api/store";
import { getRequestById } from "@/api/slices/request.slice";

export default function RequestDetailsScreen() {
  const { theme: colors, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { id, type } = useLocalSearchParams<{ id: string; type: string }>();

  const {
    currentRequest,
    isLoading: detailLoading,
    error,
  } = useSelector((state: RootState) => state.request);

  useEffect(() => {
    if (id && type) {
      dispatch(getRequestById({ id, type }));
    }
  }, [id, type, dispatch]);

  const request = currentRequest;

  // ==================== CONDITIONAL NAVIGATION ====================
  const handleActionPress = () => {
    const lowerType = type?.toLowerCase();

    console.warn(request, "requestrequest");
    if (lowerType === "parcel") {
      // Pass the current request ID to drivers_menu
      router.push({
        pathname: "/drivers_menu",
        params: { id: request?._id || id }, // Pass ID here
      });
    } else if (lowerType === "parcelrequest") {
      router.push({
        pathname: "/(details)/details",
        params: { id: request._id, type: "parcelrequest" },
      });
    } else if (lowerType === "joinride") {
      // router.push("/join_ride");
      router.push({
        pathname: "/join_ride",
        params: { id: request?._id || id }, // Pass ID here
      });
    } else if (lowerType === "rideoffer") {
      // router.push("/join_ride");
      router.push({
        pathname: "/ride",
        params: { id: request?._id || id }, // Pass ID here
      });
    } else {
      alert("No matching screen for this request type");
    }
  };
  if (detailLoading && !request) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !request) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <AppText color="red" size={16}>
          {error || "Failed to load request details"}
        </AppText>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <AppText color={colors.primary}>Go Back</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
      case "completed":
      case "active":
      case "ride agreed":
        return "#22C55E";
      case "in-transit":
      case "pending":
        return "#EAB308";
      case "cancelled":
        return "#EF4444";
      default:
        return colors.textMuted;
    }
  };

  const getButtonText = (type) => {
    const t = type?.toLowerCase().trim();

    switch (t) {
      case "parcel":
        return "Find Drivers";
      case "parcelrequest":
      case "offerrider":
      case "offer ride":
        return "View Negotiations";
      case "joinride":
      case "join ride":
        return "View Available";
      default:
        return "View Join Ride";
    }
  };

  // Usage in JSX:
  {
    getButtonText(type);
  }

  const InfoRow = ({ label, value }: { label: string; value: any }) => {
    if (value === undefined || value === null) return null;
    return (
      <View style={styles.row}>
        <AppText color={colors.textMuted}>{label}</AppText>
        <AppText color={colors.text} style={{ textAlign: "right" }}>
          {typeof value === "object"
            ? JSON.stringify(value, null, 2)
            : String(value)}
        </AppText>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <SafeAreaView
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <AppText size={16} weight="bold" color={colors.primary}>
              ← Back
            </AppText>
          </TouchableOpacity>
          <AppText size={18} weight="bold" color={colors.text}>
            {type?.toUpperCase()} Details
          </AppText>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.topSection}>
          <View style={styles.badgeContainer}>
            <View style={styles.typeBadge}>
              <AppText size={12} weight="bold" color={colors.primary}>
                {type?.toUpperCase() || "REQUEST"}
              </AppText>
            </View>

            {/* <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(request.status) + "20" },
              ]}
            >
              <AppText
                size={13}
                weight="semibold"
                color={getStatusColor(request.status)}
              >
                {request.status?.toUpperCase() || "PENDING"}
              </AppText>
            </View> */}
          </View>

          <AppText
            size={22}
            weight="bold"
            color={colors.text}
            style={{ marginTop: 12 }}
          >
            {request.pickupAddress ||
              request.pickupPoint ||
              request.route?.pickupAddress ||
              "No Pickup"}
          </AppText>

          <AppText size={16} color={colors.textMuted} style={{ marginTop: 4 }}>
            →{" "}
            {request.destinationCity ||
              request.dropoffPoint ||
              request.route?.deliveryAddress ||
              "No Destination"}
          </AppText>
        </View>

        {/* Basic Information */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <AppText
            size={15}
            weight="bold"
            color={colors.text}
            style={styles.sectionTitle}
          >
            Basic Information
          </AppText>

          <InfoRow label="ID" value={request._id} />
          <InfoRow label="Created At" value={request.createdAt} />
          <InfoRow label="Updated At" value={request.updatedAt} />

          {request.estimatedFare && (
            <InfoRow
              label="Estimated Fare"
              value={`₦${Number(request.estimatedFare).toLocaleString()}`}
            />
          )}
          {request.availableSeats && (
            <InfoRow label="Available Seats" value={request.availableSeats} />
          )}
          {request.departureTime && (
            <InfoRow label="Departure Time" value={request.departureTime} />
          )}
          {request.dispatchDateStart && (
            <InfoRow label="Start" value={request.dispatchDateStart} />
          )}
          {request.dispatchDateEnd && (
            <InfoRow label="End" value={request.dispatchDateEnd} />
          )}
        </View>

        {/* Item / Properties */}
        {(request.properties || request.item) && (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <AppText
              size={15}
              weight="bold"
              color={colors.text}
              style={styles.sectionTitle}
            >
              Item / Properties
            </AppText>
            {request.properties && (
              <>
                <InfoRow
                  label="Perishable"
                  value={request.properties.isPerishable ? "Yes" : "No"}
                />
                <InfoRow
                  label="Fragile"
                  value={request.properties.isFragile ? "Yes" : "No"}
                />
              </>
            )}
            {request.priceRange && (
              <InfoRow
                label="Price Range"
                value={`₦${request.priceRange.min} - ₦${request.priceRange.max}`}
              />
            )}
          </View>
        )}

        {/* User / Driver Info */}
        {(request.user || request.driver) && (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <AppText
              size={15}
              weight="bold"
              color={colors.text}
              style={styles.sectionTitle}
            >
              {request.driver ? "Driver" : "User"} Information
            </AppText>
            {request.user && (
              <>
                <InfoRow label="Name" value={request.user.fullName} />
                <InfoRow label="Phone" value={request.user.phone} />
                <InfoRow label="Email" value={request.user.email} />
              </>
            )}
            {request.driver && (
              <>
                <InfoRow label="Name" value={request.driver.fullName} />
                <InfoRow label="Phone" value={request.driver.phone} />
                <InfoRow label="Email" value={request.driver.email} />
              </>
            )}
          </View>
        )}

        {/* Notes */}
        {request.notes && (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <AppText
              size={15}
              weight="bold"
              color={colors.text}
              style={styles.sectionTitle}
            >
              Notes
            </AppText>
            <AppText color={colors.text}>{request.notes}</AppText>
          </View>
        )}

        {/* Negotiations */}
        {request.negotiations && request.negotiations.length > 0 && (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <AppText
              size={15}
              weight="bold"
              color={colors.text}
              style={styles.sectionTitle}
            >
              Negotiations ({request.negotiations.length})
            </AppText>
            {request.negotiations.map((neg: any, index: number) => (
              <View key={neg._id || index} style={styles.negotiationItem}>
                <InfoRow label="Status" value={neg.status} />
                <InfoRow
                  label="Agreed Amount"
                  value={neg.agreedAmount ? `₦${neg.agreedAmount}` : "N/A"}
                />
                <InfoRow label="Is Paid" value={neg.isPaid ? "Yes" : "No"} />
                <InfoRow
                  label="Is Confirmed"
                  value={neg.isConfirmed ? "Yes" : "No"}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ACTION BUTTON - Conditional Navigation */}
      <View style={styles.actionButtonContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleActionPress}
        >
          <AppText size={16} weight="bold" color="#fff">
            {type?.toLowerCase().trim() === "parcel"
              ? "Find Drivers"
              : ["parcelrequest", "offerrider", "offer ride"].includes(
                  type?.toLowerCase().trim()
                )
              ? "View Negotiations"
              : ["joinride", "join ride"].includes(type?.toLowerCase().trim())
              ? "View Available"
              : "View Join Ride"}
          </AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    ...Platform.select({
      android: { paddingTop: StatusBar.currentHeight || 12 },
    }),
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  scrollView: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 }, // Extra space for button
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  topSection: { marginBottom: 24 },
  badgeContainer: { flexDirection: "row", gap: 10, alignItems: "center" },
  typeBadge: {
    backgroundColor: "rgba(0,0,0,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  card: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: { marginBottom: 14 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  negotiationItem: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  backBtn: { marginTop: 20, padding: 12 },

  // New Action Button Styles
  actionButtonContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  actionButton: {
    backgroundColor: "#22C55E", // Green for action
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
