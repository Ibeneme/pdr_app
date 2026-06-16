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
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { AppText } from "@/components/AppText";
import {
  ArrowLeft,
  ArrowDown,
  Search,
  X,
  Package,
  MapPin,
  Clock,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

// Redux
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/api/store";
import { getUserAllRequests } from "@/api/slices/request.slice";

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

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    dispatch(getUserAllRequests());
  }, [dispatch]);

  const getFilteredRequests = () => {
    if (!allRequests) return [];

    let list: any[] = [];

    if (activeTab === "all") {
      list = [
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
      ];
    } else {
      switch (activeTab) {
        case "parcel":
          list = allRequests.parcels.map((item: any) => ({
            ...item,
            type: "parcel",
          }));
          break;
        case "joinride":
          list = allRequests.joinRides.map((item: any) => ({
            ...item,
            type: "joinride",
          }));
          break;
        case "parcelrequest":
          list = allRequests.parcelRequests.map((item: any) => ({
            ...item,
            type: "parcelrequest",
          }));
          break;
        case "rideoffer":
          list = allRequests.rideOffers.map((item: any) => ({
            ...item,
            type: "rideoffer",
          }));
          break;
        default:
          list = [];
      }
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

    return list;
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

  // Fixed: getStatusColor function
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
      case "completed":
      case "active":
        return "#9C2583";
      case "in-transit":
      case "pending":
        return "#9C2583";
      case "cancelled":
        return "#9C2583";
      default:
        return colors.textMuted;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <LinearGradient
        colors={isDark ? [colors.surface, colors.surface] : ["#F8F5FF", "#FFFFFF"]}
        style={styles.headerGradient}
      >
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <AppText size={20} weight="bold" color={colors.text}>
              My Requests
            </AppText>
            <View style={{ width: 40 }} />
          </View>

          <View
            style={[
              styles.searchBarWrapper,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(0,0,0,0.04)",
              },
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
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <X size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

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
                      ? { backgroundColor: colors.primary }
                      : {
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.04)",
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
        </SafeAreaView>
      </LinearGradient>

      {isLoading && !allRequests ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centeredContainer}>
          <AppText size={15} color="#EF4444">
            {error}
          </AppText>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {filteredRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <Package
                size={72}
                color={colors.textMuted}
                style={{ opacity: 0.5, marginBottom: 20 }}
              />
              <AppText size={18} weight="bold" color={colors.textMuted}>
                No Requests Found
              </AppText>
              <AppText
                size={14}
                color={colors.textMuted}
                style={{ textAlign: "center", marginTop: 8 }}
              >
                Your requests will appear here
              </AppText>
            </View>
          ) : (
            groupedKeys.map((monthKey) => (
              <View key={monthKey} style={styles.monthSectionContainer}>
                <View style={styles.monthHeaderRow}>
                  <AppText size={14} weight="bold" color={colors.primary}>
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
                  const isParcel =
                    item.type === "parcel" || item.type === "parcelrequest";
                  const statusColor = getStatusColor(item.status);

                  return (
                    <TouchableOpacity
                      key={item._id}
                      style={[
                        styles.requestCard,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => handleRequestPress(item)}
                      activeOpacity={0.9}
                    >
                      <View
                        style={[
                          styles.accentBar,
                          { backgroundColor: isParcel ? "#8B5CF6" : "#22C55E" },
                        ]}
                      />

                      <View style={styles.cardContent}>
                        <View style={styles.cardHeader}>
                          <View style={styles.typeBadge}>
                            <AppText
                              size={11}
                              weight="bold"
                              color={colors.primary}
                            >
                              {item.type?.toUpperCase()}
                            </AppText>
                          </View>
                          <View style={styles.dateContainer}>
                            <Clock size={14} color={colors.textMuted} />
                            <AppText
                              size={12}
                              color={colors.textMuted}
                              style={{ marginLeft: 4 }}
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

                        <View style={styles.routeContainer}>
                          <View style={styles.locationRow}>
                            <MapPin size={18} color={colors.primary} />
                            <AppText
                              size={15}
                              weight="semibold"
                              color={colors.text}
                              style={{ flex: 1, marginLeft: 10 }}
                              numberOfLines={1}
                            >
                              {item.route?.pickupAddress ||
                                item.pickupPoint ||
                                item.pickupAddress ||
                                "Unknown Pickup"}
                            </AppText>
                          </View>

                          <View style={styles.arrowContainer}>
                            <ArrowDown size={18} color={colors.textMuted} />
                          </View>

                          <View style={styles.locationRow}>
                            <MapPin size={18} color="#EF4444" />
                            <AppText
                              size={15}
                              weight="semibold"
                              color={colors.text}
                              style={{ flex: 1, marginLeft: 10 }}
                              numberOfLines={1}
                            >
                              {item.route?.deliveryAddress ||
                                item.dropoffPoint ||
                                item.destinationCity ||
                                "Unknown Destination"}
                            </AppText>
                          </View>
                        </View>

                        <View style={styles.footerRow}>
                          {/* <View
                            style={[
                              styles.statusPill,
                              { backgroundColor: statusColor + "15" },
                            ]}
                          >
                            <AppText
                              size={12}
                              weight="bold"
                              color={statusColor}
                            >
                              {item.status?.toUpperCase() || "PENDING"}
                            </AppText>
                          </View> */}

                          {item.estimatedFare && (
                            <AppText
                              size={16}
                              weight="bold"
                              color={colors.primary}
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
  headerGradient: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 5,
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

  searchBarWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 20,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15 },

  tabContainer: { paddingHorizontal: 16, paddingBottom: 16 },
  tabButton: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 30,
    marginRight: 8,
  },

  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 40 },

  monthSectionContainer: { marginBottom: 16 },
  monthHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  monthHeaderLine: { flex: 1, height: 1 },

  requestCard: {
    borderRadius: 24,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  accentBar: {
    height: 6,
    width: "100%",
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  typeBadge: {
    backgroundColor: "rgba(139, 92, 246, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 30,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  routeContainer: { marginBottom: 16 },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  arrowContainer: {
    alignItems: "center",
    marginVertical: 8,
  },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
  
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyState: { paddingTop: 120, alignItems: "center" },
});
