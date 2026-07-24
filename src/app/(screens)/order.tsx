import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { AppText } from "@/components/AppText";
import {
  ArrowLeft,
  Search,
  X,
  Package,
  Clock,
  Car,
  Truck,
  Navigation,
  Info,
} from "lucide-react-native";

// Redux
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/api/store";
import { getUserAllRequests } from "@/api/slices/request.slice";

// ---- Warm palette, matching the reference ----
const CREAM = "#FBF4EA";
const ACCENT = {
  orange: "#8A2BE2",
  orangeDark: "#4B0082",
  orangeSoft: "#E6E6FA",
};

const TYPE_STYLE: Record<string, { bg: string; fg: string; Icon: any }> = {
  parcel: { bg: "#FDEBD9", fg: "#C96A2E", Icon: Package },
  parcelrequest: { bg: "#F3E1EC", fg: "#A6467A", Icon: Package },
  joinride: { bg: "#E9F1DC", fg: "#5C7A3B", Icon: Navigation },
  rideoffer: { bg: "#ECE0D6", fg: "#5A4032", Icon: Car },
};

const getTypeMeta = (type: string) => TYPE_STYLE[type] || TYPE_STYLE.parcel;

export default function MyRequestsScreen() {
  const { theme: colors, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { status: statusParam } = useLocalSearchParams<{ status?: string }>();
  const { allRequests, isLoading, error } = useSelector(
    (state: RootState) => state.request
  );

  const [activeTab, setActiveTab] = useState<
    "parcel" | "joinride" | "parcelrequest" | "rideoffer"
  >("all");

  // Use status from params as default if it exists
  const [selectedStatus, setSelectedStatus] = useState<string>(() => {
    if (statusParam && typeof statusParam === "string") {
      const normalized = statusParam.toLowerCase().trim();
      const validStatuses = [
        "all",
        "pending",
        "ongoing",
        "completed",
        "cancelled",
        "expired",
      ];
      return validStatuses.includes(normalized) ? normalized : "all";
    }
    return "all";
  });

  const [searchQuery, setSearchQuery] = useState("");

  // Update status when params change
  useEffect(() => {
    if (statusParam && typeof statusParam === "string") {
      const normalized = statusParam.toLowerCase().trim();
      const validStatuses = [
        "all",
        "pending",
        "ongoing",
        "completed",
        "cancelled",
        "expired",
      ];
      if (validStatuses.includes(normalized)) {
        setSelectedStatus(normalized);
      }
    }
  }, [statusParam]);

  useFocusEffect(
    useCallback(() => {
      dispatch(getUserAllRequests());
    }, [dispatch])
  );

  const laymanPageDescription = useMemo(() => {
    switch (activeTab) {
      case "all":
        return "This screen keeps track of all your personal bookings, packages, and ride schedules. Select any request card below to check live statuses or match drivers.";
      case "parcel":
        return "This tab filters down to your active cargo package updates. You can check processing transit records, recipient codes, or link items to local couriers.";
      case "joinride":
        return "This lists travel bookings you have joined as a passenger. Review your target pickup points, departure slots, and vehicle seat verification parameters.";
      case "parcelrequest":
        return "This section handles delivery tasks you have created. Tap into a card to manage specific handling rules or track current carrier operations.";
      case "rideoffer":
        return "This updates you on travel routes you are currently offering to passengers. View empty seating inventory layouts or coordinate counter-bids.";
      default:
        return "Review and manage the logistical pipeline history for your account profiles, tracking tags, and delivery operations.";
    }
  }, [activeTab]);

  // Merged Status Options (as requested)
  const statusOptions = [
    { key: "all", label: "All Status" },
    { key: "pending", label: "Pending" },
    { key: "ongoing", label: "Ongoing" }, // Merged: ride started + ride ongoing
    { key: "completed", label: "Completed" }, // Merged: ride completed + completed
    { key: "cancelled", label: "Cancelled" },
    { key: "expired", label: "Expired" },
  ];

  // Helper to parse date for sorting
  const parseDate = (dateStr: string): Date => {
    if (!dateStr) return new Date(0);
    return new Date(dateStr);
  };

  const getFilteredRequests = () => {
    if (!allRequests) return [];

    let list: any[] = [];

    if (activeTab === "all") {
      list = [
        ...(allRequests.parcels?.map((item: any) => ({
          ...item,
          type: "parcel",
        })) || []),
        ...(allRequests.joinRides?.map((item: any) => ({
          ...item,
          type: "joinride",
        })) || []),
        ...(allRequests.parcelRequests?.map((item: any) => ({
          ...item,
          type: "parcelrequest",
        })) || []),
        ...(allRequests.rideOffers?.map((item: any) => ({
          ...item,
          type: "rideoffer",
        })) || []),
      ];
    } else {
      switch (activeTab) {
        case "parcel":
          list =
            allRequests.parcels?.map((item: any) => ({
              ...item,
              type: "parcel",
            })) || [];
          break;
        case "joinride":
          list =
            allRequests.joinRides?.map((item: any) => ({
              ...item,
              type: "joinride",
            })) || [];
          break;
        case "parcelrequest":
          list =
            allRequests.parcelRequests?.map((item: any) => ({
              ...item,
              type: "parcelrequest",
            })) || [];
          break;
        case "rideoffer":
          list =
            allRequests.rideOffers?.map((item: any) => ({
              ...item,
              type: "rideoffer",
            })) || [];
          break;
        default:
          list = [];
      }
    }

    if (selectedStatus !== "all") {
      list = list.filter((item) => {
        const itemStatus = (item.status || "").toLowerCase();

        if (selectedStatus === "ongoing") {
          return (
            itemStatus.includes("ongoing") ||
            itemStatus.includes("started") ||
            itemStatus === "ride started"
          );
        }
        if (selectedStatus === "completed") {
          return (
            itemStatus.includes("completed") || itemStatus.includes("delivered")
          );
        }  

        const filterStatus = selectedStatus.toLowerCase();
        return itemStatus === filterStatus || itemStatus.includes(filterStatus);
      });
    }

    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter((item) => {
        const pickup = (
          item.route?.pickupAddress ||
          item.pickupPoint ||
          item.pickupAddress ||
          ""
        ).toLowerCase();
        const dropoff = (
          item.route?.deliveryAddress ||
          item.dropoffPoint ||
          item.destinationCity ||
          ""
        ).toLowerCase();
        const status = (item.status || "").toLowerCase();
        const fare = item.estimatedFare ? String(item.estimatedFare) : "";

        return (
          pickup.includes(query) ||
          dropoff.includes(query) ||
          status.includes(query) ||
          fare.includes(query)
        );
      });
    }

    return list.sort((a, b) => {
      return (
        parseDate(b.createdAt).getTime() - parseDate(a.createdAt).getTime()
      );
    });
  };

  const filteredRequests = getFilteredRequests();

  const groupRequestsByMonth = (items: any[]) => {
    const groups: { [key: string]: any[] } = {};
    const monthOrder = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ];

    items.forEach((item) => {
      let monthName = "Other";
      if (item.createdAt) {
        const lower = item.createdAt.toLowerCase();
        const found = monthOrder.find((m) => lower.includes(m));
        if (found) monthName = found.charAt(0).toUpperCase() + found.slice(1);
      }
      if (!groups[monthName]) groups[monthName] = [];
      groups[monthName].push(item);
    });

    return Object.keys(groups).sort((a, b) => {
      if (a === "Other") return 1;
      if (b === "Other") return -1;
      return (
        monthOrder.indexOf(b.toLowerCase()) -
        monthOrder.indexOf(a.toLowerCase())
      );
    });
  };

  const groupedKeys = groupRequestsByMonth(filteredRequests);

  const groupedData = groupedKeys.reduce((acc, key) => {
    acc[key] = filteredRequests.filter((item) =>
      key === "Other"
        ? !item.createdAt
        : item.createdAt?.toLowerCase().includes(key.toLowerCase())
    );
    return acc;
  }, {} as { [key: string]: any[] });

  const handleRequestPress = (item: any) => {
    if (!item?._id) return;
    router.push({
      pathname: "/(screens)/one",
      params: { id: item._id, type: item.type },
    });
  };

  const tabs = [
    { key: "all", label: "All" },
    { key: "parcel", label: "Parcels" },
    { key: "joinride", label: "Join Ride" },
    { key: "parcelrequest", label: "Deliveries" },
    { key: "rideoffer", label: "Offers" },
  ] as const;

  const canvasColor = isDark ? colors.background : "#f4f4f4";

  const isStatusDone = (status: string) => {
    const s = status?.toLowerCase() || "";
    return s.includes("completed") || s.includes("delivered");
  };

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
              My Requests
            </AppText>
            <View style={styles.headerSpacer} />
          </View>

          <View
            style={[
              styles.searchBarWrapper,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Search
              size={18}
              color={colors.textMuted}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search requests..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={styles.clearSearchButton}
              >
                <X size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabContainer}
          >
            {tabs.map((tab) => {
              const isSelected = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.tabButton,
                    isSelected
                      ? { backgroundColor: ACCENT.orange }
                      : {
                          backgroundColor: colors.surface,
                          borderWidth: 1,
                          borderColor: colors.border,
                        },
                  ]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <AppText
                    size={13}
                    weight={isSelected ? "bold" : "semibold"}
                    color={isSelected ? "#FFF" : colors.textMuted}
                  >
                    {tab.label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Status Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statusFilterContainer}
          >
            {statusOptions.map((status) => {
              const isActive = selectedStatus === status.key;
              return (
                <TouchableOpacity
                  key={status.key}
                  style={[
                    styles.statusChip,
                    isActive
                      ? {
                          backgroundColor: ACCENT.orange,
                          borderColor: "transparent",
                        }
                      : {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                        },
                  ]}
                  onPress={() => setSelectedStatus(status.key)}
                >
                  <AppText
                    size={13}
                    weight={isActive ? "bold" : "semibold"}
                    color={isActive ? "#FFF" : colors.textMuted}
                  >
                    {status.label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </View>

      {isLoading && !allRequests ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={ACCENT.orange} />
        </View>
      ) : error ? (
        <View style={styles.centeredContainer}>
          <AppText size={15} color="#EF4444" weight="semibold">
            {error}
          </AppText>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.pageIntroCard,
              { backgroundColor: ACCENT.orangeSoft },
            ]}
          >
            <View style={styles.introHeader}>
              <Info size={16} color={ACCENT.orangeDark} />
              <AppText
                size={13}
                weight="bold"
                color={ACCENT.orangeDark}
                style={{ marginLeft: 6 }}
              >
                About This List
              </AppText>
            </View>
            <AppText
              size={13}
              color={ACCENT.orangeDark}
              style={styles.introText}
            >
              {laymanPageDescription}
            </AppText>
          </View>

          {filteredRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <View
                style={[
                  styles.emptyIconContainer,
                  { backgroundColor: colors.surface },
                ]}
              >
                <Package size={36} color={colors.textMuted} />
              </View>
              <AppText size={16} weight="bold" color={colors.text}>
                No Requests Found
              </AppText>
              <AppText
                size={14}
                color={colors.textMuted}
                style={styles.emptySubText}
              >
                Try changing filters or search term
              </AppText>
            </View>
          ) : (
            groupedKeys.map((monthKey) => (
              <View key={monthKey} style={styles.monthSectionContainer}>
                <View style={styles.monthHeaderRow}>
                  <AppText
                    size={12}
                    weight="bold"
                    color={colors.text}
                    style={styles.monthLabel}
                  >
                    {monthKey.toUpperCase()}
                  </AppText>
                  <View
                    style={[
                      styles.monthHeaderLine,
                      { backgroundColor: colors.border },
                    ]}
                  />
                </View>

                {groupedData[monthKey].map((item: any) => {
                  const typeMeta = getTypeMeta(item.type);
                  const done = isStatusDone(item.status);

                  return (
                    <TouchableOpacity
                      key={item._id}
                      style={[
                        styles.requestCard,
                        { backgroundColor: colors.surface },
                      ]}
                      onPress={() => handleRequestPress(item)}
                      activeOpacity={0.85}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          done
                            ? { backgroundColor: ACCENT.orange }
                            : {
                                backgroundColor: "transparent",
                                borderWidth: 2,
                                borderColor: colors.border,
                              },
                        ]}
                      />

                      <View
                        style={[
                          styles.typeIconCircle,
                          { backgroundColor: typeMeta.bg },
                        ]}
                      >
                        <typeMeta.Icon size={18} color={typeMeta.fg} />
                      </View>

                      <View style={styles.cardContent}>
                        <View style={styles.cardHeader}>
                          <AppText
                            size={10}
                            weight="bold"
                            color={colors.textMuted}
                            style={styles.typeBadgeText}
                          >
                            {item.type?.toUpperCase()}
                          </AppText>
                          <View style={styles.dateContainer}>
                            <Clock size={12} color={colors.textMuted} />
                            <AppText
                              size={12}
                              color={colors.textMuted}
                              style={styles.dateText}
                            >
                              {item.createdAt
                                ? item.createdAt
                                    .split(" ")
                                    .slice(0, 3)
                                    .join(" ")
                                : ""}
                            </AppText>
                          </View>
                        </View>

                        <AppText
                          size={15}
                          weight="bold"
                          color={colors.text}
                          numberOfLines={1}
                        >
                          {item.route?.pickupAddress ||
                            item.pickupPoint ||
                            item.pickupAddress ||
                            "Unknown Pickup"}
                          {"  →  "}
                          {item.route?.deliveryAddress ||
                            item.dropoffPoint ||
                            item.destinationCity ||
                            "Unknown Destination"}
                        </AppText>

                        <View style={styles.footerRow}>
                          <View
                            style={[
                              styles.statusPill,
                              { backgroundColor: ACCENT.orange },
                            ]}
                          >
                            <AppText size={11} weight="bold" color="#fff">
                              {item.status?.toUpperCase() || "PENDING"}
                            </AppText>
                          </View>

                          {item.estimatedFare && (
                            <AppText
                              size={15}
                              weight="bold"
                              color={colors.text}
                            >
                              ₦{Number(item.estimatedFare).toLocaleString()}
                            </AppText>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
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
  searchBarWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  clearSearchButton: { padding: 4 },
  tabContainer: { paddingHorizontal: 20, marginTop: 16, gap: 8 },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 18,
    marginRight: 4,
  },
  statusFilterContainer: {
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  pageIntroCard: { padding: 16, borderRadius: 20, marginBottom: 20 },
  introHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  introText: { lineHeight: 18 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptySubText: { textAlign: "center", marginTop: 6, opacity: 0.8 },
  monthSectionContainer: { marginBottom: 24 },
  monthHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  monthLabel: { letterSpacing: 0.5 },
  monthHeaderLine: { flex: 1, height: 1, marginLeft: 12, opacity: 0.5 },
  requestCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    marginBottom: 12,
    padding: 14,
    gap: 12,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  typeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: { flex: 1 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  typeBadgeText: { letterSpacing: 0.4 },
  dateContainer: { flexDirection: "row", alignItems: "center" },
  dateText: { marginLeft: 5 },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
});
