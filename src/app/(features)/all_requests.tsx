import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Animated,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/api/store";
import { getUserRequests } from "@/api/slices/new.request.slice";
import { AppText } from "@/components/AppText";
import { formatDate, formatTime } from "@/utils/data";
import { useTheme } from "@/contexts/ThemeContext";
import { getUser } from "@/api/secureStore";
import { SafeAreaView } from "react-native-safe-area-context";

// ====================== Shimmer Loader Component ======================
function RequestCardShimmer({ theme }: { theme: any }) {
  const shimmerAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  return (
    <Animated.View
      style={[
        styles.shimmerCard,
        { opacity: shimmerAnim, backgroundColor: theme.surface },
      ]}
    >
      <View style={styles.shimmerHeader}>
        <View
          style={[styles.shimmerLineShort, { backgroundColor: theme.border }]}
        />
        <View
          style={[styles.shimmerBadge, { backgroundColor: theme.border }]}
        />
      </View>
      <View
        style={[styles.shimmerLineLong, { backgroundColor: theme.border }]}
      />
      <View
        style={[styles.shimmerLineMedium, { backgroundColor: theme.border }]}
      />
      <View style={styles.shimmerFooter}>
        <View
          style={[styles.shimmerLineShort, { backgroundColor: theme.border }]}
        />
        <View
          style={[styles.shimmerButton, { backgroundColor: theme.border }]}
        />
      </View>
    </Animated.View>
  );
}

export default function MyRequestsScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { requests, isLoading } = useSelector(
    (state: RootState) => state.request
  );

  const { theme, isDark } = useTheme();

  // Get status from navigation params
  const { status: paramStatus } = useLocalSearchParams<{ status?: string }>();

  // Filter states
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All Status");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Pull-to-refresh state
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      const user = await getUser();
      setCurrentUser(user);
    };
    loadUser();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(getUserRequests()).unwrap();
    } catch (error) {
      console.error("Failed to refresh requests:", error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (paramStatus) {
      const statusMap: Record<string, string> = {
        pending: "Pending",
        talking: "Pending", // or handle separately
        in_progress: "Ongoing",
        assigned: "Ongoing",
        completed: "Completed",
        cancelled: "Cancelled",
        expired: "Cancelled",
        confirmed: "Completed",
      };
      setSelectedStatus(statusMap[paramStatus] || "All Status");
    }
  }, [paramStatus]);

  useEffect(() => {
    dispatch(getUserRequests());
  }, [dispatch]);

  const filteredRequests = useMemo(() => {
    return requests.filter((item: any) => {
      if (selectedType === "Parcels" && item.type !== "send-package")
        return false;
      if (selectedType === "Join Ride" && item.type !== "join-ride")
        return false;
      if (selectedType === "Deliveries" && item.type !== "deliver-package")
        return false;
      if (selectedType === "Offer Ride" && item.type !== "offer-ride")
        return false;

      if (
        selectedStatus === "Pending" &&
        item.status !== "pending" &&
        item.status !== "talking"
      )
        return false;
      if (
        selectedStatus === "Ongoing" &&
        item.status !== "in_progress" &&
        item.status !== "assigned"
      )
        return false;
      if (
        selectedStatus === "Completed" &&
        item.status !== "completed" &&
        item.status !== "confirmed"
      )
        return false;
      if (
        selectedStatus === "Cancelled" &&
        item.status !== "cancelled" &&
        item.status !== "expired"
      )
        return false;

      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const idMatch = item._id?.toLowerCase().includes(query) || false;
        const pickupMatch =
          item.pickupLocation?.address?.toLowerCase().includes(query) || false;
        const deliveryMatch =
          item.deliveryLocation?.address?.toLowerCase().includes(query) ||
          false;
        const typeMatch = item.type?.toLowerCase().includes(query) || false;

        if (!idMatch && !pickupMatch && !deliveryMatch && !typeMatch)
          return false;
      }
      return true;
    });
  }, [requests, selectedType, selectedStatus, searchQuery]);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "send-package":
        return "Send Package";
      case "deliver-package":
        return "Deliver Package";
      case "join-ride":
        return "Join Ride";
      case "offer-ride":
        return "Offer Ride";
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
      case "talking":
        return { bg: "rgba(255, 193, 7, 0.15)", text: "#D9A000" };
      case "assigned":
      case "in_progress":
        return { bg: "rgba(156, 39, 176, 0.15)", text: "#9C27B0" };
      case "completed":
      case "confirmed":
        return { bg: "rgba(76, 175, 80, 0.15)", text: "#4CAF50" };
      case "cancelled":
      case "expired":
        return { bg: "rgba(244, 67, 54, 0.15)", text: "#F44336" };
      default:
        return { bg: "rgba(150, 150, 150, 0.15)", text: "#888888" };
    }
  };

  const handleRequestPress = async (item: any) => {
    console.warn("Item clicked:", item);

    if (!currentUser?._id) {
      Alert.alert("Error", "User profile not loaded. Please try again.");
      return;
    }

    const isPending = item.status === "pending";
    const hasNegotiation = !!item.negotiation;

    // Types that support pairing requests
    const pairingSupportedTypes = ["send-package", "join-ride"];

    if (isPending && !hasNegotiation) {
      if (pairingSupportedTypes.includes(item.type)) {
        router.push({
          pathname: "/(features)/pairing_requests",
          params: { requestData: JSON.stringify(item) },
        });
      } else if (hasNegotiation) {
        // For other types (offer-ride, deliver-package, etc.) → go to details
        router.push({
          pathname: "/(features)/chat_screen",
          params: {
            id: item.negotiation,
            currentId: currentUser._id,
          },
        });
      } else {
        router.push({
          pathname: "/(features)/details",
          params: { requestData: JSON.stringify(item) },
        });
      }
    } else if (item.status === "talking" && hasNegotiation) {
      // Go to chat for talking status
      router.push({
        pathname: "/(features)/chat_screen",
        params: {
          id: item.negotiation,
          currentId: currentUser._id,
        },
      });
    } else if (
      [
        "assigned",
        "in_progress",
        "completed",
        "confirmed",
        "cancelled",
        "expired",
      ].includes(item.status)
    ) {
      // Already in progress or finished → prefer chat if negotiation exists
      if (hasNegotiation) {
        router.push({
          pathname: "/(features)/chat_screen",
          params: {
            id: item.negotiation,
            currentId: currentUser._id,
          },
        });
      } else {
        router.push({
          pathname: "/(features)/details",
          params: { requestData: JSON.stringify(item) },
        });
      }
    } else {
      router.push({
        pathname: "/(features)/details",
        params: { requestData: JSON.stringify(item) },
      });
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? theme.background : "#F4F6F9" },
      ]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? theme.background : "#F4F6F9"}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("/home")}
          style={[
            styles.backButton,
            { backgroundColor: isDark ? theme.surface : "#FFFFFF" },
          ]}
        >
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <AppText
          size={20}
          weight="bold"
          color={theme.text}
          style={styles.headerTitle}
        >
          My Requests
        </AppText>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Ionicons
          name="search-outline"
          size={20}
          color={theme.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search requests..."
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Type Filter Chips */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {["All", "Parcels", "Join Ride", "Deliveries", "Offer Ride"].map(
            (type) => {
              const isActive = selectedType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isActive
                        ? isDark
                          ? "#FFFFFF"
                          : "#1A1A1A"
                        : theme.surface,
                    },
                    !isActive && { borderColor: theme.border, borderWidth: 1 },
                  ]}
                  onPress={() => setSelectedType(type)}
                >
                  <AppText
                    size={14}
                    color={
                      isActive
                        ? isDark
                          ? "#000000"
                          : "#FFFFFF"
                        : theme.textMuted
                    }
                    weight={isActive ? "bold" : "medium"}
                  >
                    {type}
                  </AppText>
                </TouchableOpacity>
              );
            }
          )}
        </ScrollView>
      </View>

      {/* Status Filter Chips */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.filterScroll,
            {
              marginBottom: 8,
            },
          ]}
        >
          {["All Status", "Pending", "Ongoing", "Completed", "Cancelled"].map(
            (status) => {
              const isActive = selectedStatus === status;
              return (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor: isActive
                        ? isDark
                          ? theme.text
                          : "#E5E7EB"
                        : theme.surface,
                      borderColor: isActive ? "transparent" : theme.border,
                    },
                  ]}
                  onPress={() => setSelectedStatus(status)}
                >
                  <AppText
                    size={13}
                    color={isActive ? (isDark ? "#000" : "#111") : theme.text}
                    weight={isActive ? "bold" : "regular"}
                  >
                    {status}
                  </AppText>
                </TouchableOpacity>
              );
            }
          )}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* Info Banner */}
        <View
          style={[
            styles.infoBanner,
            {
              backgroundColor: isDark ? "rgba(156, 39, 176, 0.1)" : "#FDF5FF",
              borderColor: isDark ? "rgba(156, 39, 176, 0.2)" : "#F4D8F9",
            },
          ]}
        >
          <Ionicons
            name="sparkles"
            size={20}
            color={theme.primary}
            style={{ marginTop: 2 }}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <AppText
              size={14}
              weight="bold"
              color={isDark ? theme.text : "#333"}
              style={styles.infoTitle}
            >
              Request Insights
            </AppText>
            <AppText size={13} color={theme.textMuted} style={styles.infoText}>
              This screen keeps track of all your personal bookings, packages,
              and ride schedules in one place.
            </AppText>
          </View>
        </View>

        {/* Loading / Empty / List */}
        {isLoading && !refreshing ? (
          <>
            <RequestCardShimmer theme={theme} />
            <RequestCardShimmer theme={theme} />
            <RequestCardShimmer theme={theme} />
          </>
        ) : filteredRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View
              style={[styles.emptyIconBox, { backgroundColor: theme.surface }]}
            >
              <MaterialCommunityIcons
                name="inbox-outline"
                size={42}
                color={theme.textMuted}
              />
            </View>
            <AppText
              size={18}
              weight="bold"
              color={theme.text}
              style={styles.emptyTitle}
            >
              No Requests Found
            </AppText>
            <AppText size={14} color={theme.textMuted}>
              Try changing filters or search term
            </AppText>
          </View>
        ) : (
          filteredRequests.map((item: any) => {
            const statusStyle = getStatusColor(item.status);
            return (
              <TouchableOpacity
                key={item._id}
                style={[
                  styles.requestCard,
                  { backgroundColor: theme.surface },
                  !isDark && styles.cardShadow,
                ]}
                activeOpacity={0.7}
                onPress={() => handleRequestPress(item)}
              >
                <View style={styles.cardHeaderRow}>
                  <View
                    style={[
                      styles.cardTypeBadge,
                      { backgroundColor: "rgba(156, 39, 176, 0.08)" },
                    ]}
                  >
                    <AppText
                      size={12}
                      weight="bold"
                      color={theme.primary}
                      style={styles.cardTypeText}
                    >
                      {getTypeLabel(item.type)}
                    </AppText>
                  </View>
                  <View
                    style={[
                      styles.statusPillBadge,
                      { backgroundColor: statusStyle.bg },
                    ]}
                  >
                    <AppText size={11} weight="bold" color={statusStyle.text}>
                      {item.status === "confirmed"
                        ? "COMPLETED"
                        : item.status.toUpperCase()}
                    </AppText>
                  </View>
                </View>

                <View style={styles.locationsContainer}>
                  <View style={styles.cardLocationRow}>
                    <View
                      style={[
                        styles.iconCircle,
                        { backgroundColor: "rgba(76, 175, 80, 0.1)" },
                      ]}
                    >
                      <Ionicons
                        name="location-sharp"
                        size={14}
                        color="#4CAF50"
                      />
                    </View>
                    <AppText
                      size={14}
                      color={theme.text}
                      style={styles.cardLocationText}
                      numberOfLines={1}
                    >
                      {item.pickupLocation?.address || "N/A"}
                    </AppText>
                  </View>

                  <View style={styles.locationConnector} />

                  <View style={styles.cardLocationRow}>
                    <View
                      style={[
                        styles.iconCircle,
                        { backgroundColor: "rgba(156, 39, 176, 0.1)" },
                      ]}
                    >
                      <Ionicons name="flag" size={14} color={theme.primary} />
                    </View>
                    <AppText
                      size={14}
                      color={theme.text}
                      style={styles.cardLocationText}
                      numberOfLines={1}
                    >
                      {item.deliveryLocation?.address || "N/A"}
                    </AppText>
                  </View>
                </View>

                <View
                  style={[
                    styles.cardFooterRow,
                    { borderTopColor: isDark ? theme.border : "#F0F0F0" },
                  ]}
                >
                  <View style={styles.cardMetaInfo}>
                    <View
                      style={[
                        styles.metaPill,
                        { backgroundColor: isDark ? theme.border : "#F9FAFB" },
                      ]}
                    >
                      <Ionicons
                        name="calendar-clear-outline"
                        size={14}
                        color={theme.textMuted}
                      />
                      <AppText
                        size={12}
                        color={theme.textMuted}
                        weight="medium"
                      >
                        {formatDate(item.pickupDate)}
                      </AppText>
                    </View>
                    <View
                      style={[
                        styles.metaPill,
                        { backgroundColor: isDark ? theme.border : "#F9FAFB" },
                      ]}
                    >
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={theme.textMuted}
                      />
                      <AppText
                        size={12}
                        color={theme.textMuted}
                        weight="medium"
                      >
                        {formatTime(item.pickupTime)}
                      </AppText>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.actionButton,
                      { backgroundColor: isDark ? theme.border : "#F9FAFB" },
                    ]}
                  >
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color={theme.text}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    borderRadius: 26,
    paddingHorizontal: 18,
    height: 52,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  filterScroll: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
  },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: "row",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  requestCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  cardShadow: {},
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  cardTypeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  statusPillBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  locationsContainer: {
    marginBottom: 8,
  },
  cardLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  locationConnector: {
    width: 2,
    height: 12,
    backgroundColor: "#E5E7EB",
    marginLeft: 13,
    marginVertical: 2,
  },
  cardLocationText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    fontWeight: "500",
  },
  cardFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  cardMetaInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  shimmerCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    height: 160,
    justifyContent: "space-between",
  },
  shimmerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  shimmerLineShort: {
    width: 90,
    height: 20,
    borderRadius: 10,
  },
  shimmerBadge: {
    width: 70,
    height: 20,
    borderRadius: 10,
  },
  shimmerLineLong: {
    width: "100%",
    height: 16,
    borderRadius: 8,
    marginTop: 10,
  },
  shimmerLineMedium: {
    width: "80%",
    height: 16,
    borderRadius: 8,
    marginTop: 6,
  },
  shimmerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  shimmerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});
