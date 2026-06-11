import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { AppText } from "@/components/AppText";

// Redux
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/api/store";
import { getUserAllRequests, getRequestById } from "@/api/slices/request.slice";

export default function MyRequestsScreen() {
  const { theme: colors, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const { allRequests, isLoading, error } = useSelector(
    (state: RootState) => state.request
  );

  const [activeTab, setActiveTab] = useState<
    "all" | "parcel" | "joinride" | "parcelrequest" | "rideoffer"
  >("all");

  // Fetch all requests on mount
  useEffect(() => {
    dispatch(getUserAllRequests());
  }, [dispatch]);

  // Filter requests based on active tab
  const getFilteredRequests = () => {
    if (!allRequests) return [];

    if (activeTab === "all") {
      return [
        ...allRequests.parcels.map((item: any) => ({
          ...item,
          type: "parcel",
        })),
        ...allRequests.joinRides.map((item: any) => ({
          ...item,
          type: "joinride",
        })),
        ...allRequests.parcelRequests.map((item: any) => ({
          ...item,
          type: "parcelrequest",
        })),
        ...allRequests.rideOffers.map((item: any) => ({
          ...item,
          type: "rideoffer",
        })),
      ].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    switch (activeTab) {
      case "parcel":
        return allRequests.parcels.map((item: any) => ({
          ...item,
          type: "parcel",
        }));
      case "joinride":
        return allRequests.joinRides.map((item: any) => ({
          ...item,
          type: "joinride",
        }));
      case "parcelrequest":
        return allRequests.parcelRequests.map((item: any) => ({
          ...item,
          type: "parcelrequest",
        }));
      case "rideoffer":
        return allRequests.rideOffers.map((item: any) => ({
          ...item,
          type: "rideoffer",
        }));
      default:
        return [];
    }
  };

  const filteredRequests = getFilteredRequests();

  const handleRequestPress = (item: any) => {
    if (!item?._id) return;

    // Navigate to details with id and type
    router.push({
      pathname: "/(screens)/one",
      params: {
        id: item._id,
        type: item.type,
      },
    });

    // Optional: Pre-fetch detail
    // dispatch(getRequestById({ id: item._id, type: item.type }));
  };

  const tabs = [
    { key: "all", label: "All" },
    { key: "parcel", label: "Parcels" },
    { key: "joinride", label: "Join Ride" },
    { key: "parcelrequest", label: "Deliver Parcel" },
    { key: "rideoffer", label: "Ride Offers" },
  ] as const;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
      case "completed":
      case "active":
        return colors.text || "#22C55E";
      case "in-transit":
      case "pending":
        return colors.text || "#EAB308";
      case "cancelled":
        return colors.text || "#EF4444";
      default:
        return colors.textMuted;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* HEADER */}
      <SafeAreaView
        style={[
          styles.headerSafeArea,
          {
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[
              styles.backTextButton,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <AppText size={13} weight="bold" color={colors.text}>
              Back
            </AppText>
          </TouchableOpacity>
          <AppText size={18} weight="bold" color={colors.text}>
            My Requests
          </AppText>
          <View style={{ width: 50 }} /> {/* Balance */}
        </View>

        {/* TABS / TOGGLES */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabContainer}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                activeTab === tab.key && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <AppText
                size={13}
                weight={activeTab === tab.key ? "bold" : "medium"}
                color={activeTab === tab.key ? "#FFFFFF" : colors.text}
              >
                {tab.label}
              </AppText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      {/* CONTENT */}
      {isLoading && !allRequests ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centeredContainer}>
          <AppText size={14} color="red" style={{ textAlign: "center" }}>
            {error}
          </AppText>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <AppText size={16} color={colors.textMuted}>
                No requests found in this category
              </AppText>
            </View>
          ) : (
            filteredRequests.map((item: any, index: number) => (
              <TouchableOpacity
                key={item._id || index}
                style={[
                  styles.requestCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleRequestPress(item)}
                activeOpacity={0.85}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.typeBadge}>
                    <AppText size={10} weight="bold" color={colors.primary}>
                      {item.type.toUpperCase()}
                    </AppText>
                  </View>
                  <AppText size={12} color={colors.textMuted}>
                    {item.createdAt}
                  </AppText>
                </View>

                <AppText
                  size={16}
                  weight="bold"
                  color={colors.text}
                  numberOfLines={1}
                >
                  {item.route?.pickupAddress ||
                    item.pickupPoint ||
                    item.pickupAddress ||
                    "No pickup"}
                </AppText>

                <AppText
                  size={14}
                  color={colors.textMuted}
                  style={{ marginTop: 2 }}
                  numberOfLines={1}
                >
                  →{" "}
                  {item.route?.deliveryAddress ||
                    item.dropoffPoint ||
                    item.destinationCity ||
                    "No destination"}
                </AppText>

                <View style={styles.statusRow}>
                  <AppText
                    size={13}
                    weight="medium"
                    color={getStatusColor(item.status)}
                  >
                    {item.status?.toUpperCase() || "PENDING"}
                  </AppText>

                  {item.estimatedFare && (
                    <AppText size={13} weight="semibold" color={colors.primary}>
                      ₦{item.estimatedFare}
                    </AppText>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSafeArea: {
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
    paddingVertical: 14,
  },
  backTextButton: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  tabContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 8,
  },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 80,
  },
  requestCard: {
    borderRadius: 18,
    marginBottom: 14,
    padding: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 6,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyState: {
    paddingTop: 80,
    alignItems: "center",
  },
});
