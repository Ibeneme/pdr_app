import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  SafeAreaView,
  Image,
  StatusBar,
  FlatList,
  ActivityIndicator,
  Modal,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/api/store";
import { getAllRides } from "@/api/slices/ride.slice";
import {
  ArrowLeft,
  Clock,
  User,
  MapPin,
  XCircle,
  Handshake,
  CheckCircle2,
} from "lucide-react-native";
import { AppText } from "@/components/AppText";
import { NigeriaCitiesGrid } from "@/components/NigeriaCitiesGrid";
import { LinearGradient } from "expo-linear-gradient";

interface DriverDetails {
  _id: string;
  fullName: string;
  phone: string;
  email: string;
  isVerified: boolean;
  profileImage?: string;
}

interface AvailableRide {
  _id: string;
  driver: DriverDetails;
  pickupPoint: string;
  dropoffPoint: string;
  departureTime: string;
  availableSeats: number;
  estimatedFare: number;
  rating?: string;
  isNegotiator?: boolean;
  myNegotiation?: {
    status: string;
    agreedAmount: number;
    isConfirmed: boolean;
    isPaid: boolean;
  };
}

export default function JoinRideScreen() {
  const { theme: colors, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useLocalSearchParams<{ id?: string }>();

  // State
  const [rides, setRides] = useState<AvailableRide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Geographic Filtering States
  const [filterPickup, setFilterPickup] = useState<string | null>(null);
  const [filterDropoff, setFilterDropoff] = useState<string | null>(null);
  const [citySelectorTarget, setCitySelectorTarget] = useState<
    "PICKUP" | "DROPOFF" | null
  >(null);

  const fetchRides = (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    setError("");

    return dispatch(getAllRides())
      .unwrap()
      .then((data: any[]) => {
        setRides(data || []);
      })
      .catch((err) => {
        console.error("❌ [JoinRideScreen] Failed to fetch rides:", err);
        setError("Failed to load rides. Please check your connection.");
      })
      .finally(() => {
        setIsLoading(false);
        setIsRefreshing(false);
      });
  };

  useEffect(() => {
    fetchRides(true);
  }, [dispatch]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchRides(false);
  };

  const handleSelectCity = (cityName: string) => {
    if (citySelectorTarget === "PICKUP") {
      setFilterPickup(cityName);
    } else if (citySelectorTarget === "DROPOFF") {
      setFilterDropoff(cityName);
    }
    setCitySelectorTarget(null);
  };

  const filteredRides = rides.filter((ride: AvailableRide) => {
    const matchesPickup = filterPickup
      ? ride.pickupPoint.toLowerCase().includes(filterPickup.toLowerCase()) ||
        filterPickup.toLowerCase().includes(ride.pickupPoint.toLowerCase())
      : true;
    const matchesDropoff = filterDropoff
      ? ride.dropoffPoint.toLowerCase().includes(filterDropoff.toLowerCase()) ||
        filterDropoff.toLowerCase().includes(ride.dropoffPoint.toLowerCase())
      : true;
    return matchesPickup && matchesDropoff;
  });

  const getInitials = (name: string = "Driver") => {
    const names = name.trim().split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0].slice(0, 2).toUpperCase();
  };

  const handleRideSelection = (ride: AvailableRide) => {
    router.push({
      pathname: "/(details)/ride",
      params: {
        id: ride._id,
        driverName: ride.driver?.fullName,
        driverPhone: ride.driver?.phone,
        pickup: ride.pickupPoint,
        dropoff: ride.dropoffPoint,
        fare: ride.estimatedFare,
        time: ride.departureTime,
        seats: ride.availableSeats,
        negotiatorService: id,
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* PREMIUM GRADIENT HEADER SECTION */}
      <LinearGradient
        colors={isDark ? ["#2A1B4D", colors.surface] : ["#F8F5FF", "#FFFFFF"]}
        style={styles.headerGradient}
      >
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>

            <AppText size={20} weight="bold" color={colors.text}>
              Find a Ride
            </AppText>

            <View style={{ width: 40 }} />
          </View>

          {/* GEOGRAPHIC ROUTE DOCK CONTROLS */}
          <View style={styles.filterDockRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setCitySelectorTarget("PICKUP")}
              style={[
                styles.filterPill,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.04)",
                  borderColor: filterPickup ? colors.primary : "transparent",
                },
              ]}
            >
              <MapPin
                size={14}
                color={filterPickup ? colors.primary : colors.textMuted}
              />
              <AppText
                size={13}
                weight="medium"
                numberOfLines={1}
                style={styles.pillText}
                color={filterPickup ? colors.text : colors.textMuted}
              >
                {filterPickup ? `From: ${filterPickup}` : "Select Pickup..."}
              </AppText>
              {filterPickup && (
                <TouchableOpacity
                  onPress={() => setFilterPickup(null)}
                  hitSlop={12}
                  style={styles.clearPillButton}
                >
                  <AppText size={11} weight="bold" color={colors.textMuted}>
                    ✕
                  </AppText>
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setCitySelectorTarget("DROPOFF")}
              style={[
                styles.filterPill,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.04)",
                  borderColor: filterDropoff ? colors.primary : "transparent",
                },
              ]}
            >
              <MapPin
                size={14}
                color={filterDropoff ? colors.primary : colors.textMuted}
              />
              <AppText
                size={13}
                weight="medium"
                numberOfLines={1}
                style={styles.pillText}
                color={filterDropoff ? colors.text : colors.textMuted}
              >
                {filterDropoff ? `To: ${filterDropoff}` : "Select Dropoff..."}
              </AppText>
              {filterDropoff && (
                <TouchableOpacity
                  onPress={() => setFilterDropoff(null)}
                  hitSlop={12}
                  style={styles.clearPillButton}
                >
                  <AppText size={11} weight="bold" color={colors.textMuted}>
                    ✕
                  </AppText>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText size={14} color={colors.textMuted} style={{ marginTop: 12 }}>
            Scanning national grid for routes...
          </AppText>
        </View>
      ) : error ? (
        <View style={styles.loadingContainer}>
          <AppText size={14} color={colors.textMuted}>
            {error}
          </AppText>
          <TouchableOpacity onPress={() => fetchRides(true)}>
            <AppText size={14} color={colors.primary} style={{ marginTop: 12 }}>
              Try Again
            </AppText>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredRides}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyListStateFrame}>
              <XCircle size={48} color={colors.textMuted} strokeWidth={1.5} />
              <AppText
                size={17}
                weight="bold"
                color={colors.text}
                style={{ marginTop: 16, marginBottom: 6 }}
              >
                No drivers heading that way
              </AppText>
              <AppText
                size={14}
                color={colors.textMuted}
                style={{ textAlign: "center", lineHeight: 20 }}
              >
                We couldn't find matches connecting these hubs. Try clearing
                your route filters or check back shortly.
              </AppText>
            </View>
          }
          renderItem={({ item }) => {
            const driverName = item.driver?.fullName || "Unknown Driver";
            const driverImage = item.driver?.profileImage;
            const hasImage = !!driverImage;
            const isVerified = item.driver?.isVerified;

            return (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleRideSelection(item)}
                style={[
                  styles.driverMarketplaceCardBox,
                  {
                    backgroundColor: colors.surface,
                    borderColor: item.isNegotiator
                      ? colors.primary
                      : "transparent",
                    borderWidth: item.isNegotiator ? 1.5 : 1,
                  },
                ]}
              >
                {/* Visual indicator header card for active negotiations */}
                {item.isNegotiator && (
                  <View
                    style={[
                      styles.negotiationHeaderBadge,
                      { backgroundColor: colors.primary + "15" },
                    ]}
                  >
                    <Handshake size={14} color={colors.primary} />
                    <AppText size={12} weight="bold" color={colors.primary}>
                      Active Negotiation •{" "}
                      {item.myNegotiation?.status || "Pending"}
                    </AppText>
                  </View>
                )}

                <View style={styles.cardProfileRowHeaderLayout}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <View style={styles.driverAvatarContainer}>
                      {hasImage ? (
                        <Image
                          source={{ uri: driverImage }}
                          style={styles.driverAvatarProfileThumbnail}
                        />
                      ) : (
                        <View
                          style={[
                            styles.initialsCircle,
                            { backgroundColor: colors.primary },
                          ]}
                        >
                          <AppText size={16} weight="bold" color="#FFF">
                            {getInitials(driverName)}
                          </AppText>
                        </View>
                      )}
                    </View>
                    <View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <AppText size={15} weight="bold" color={colors.text}>
                          {driverName}
                        </AppText>
                        {isVerified && (
                          <CheckCircle2 size={14} color={colors.primary} />
                        )}
                      </View>
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <AppText size={18} weight="bold" color={colors.primary}>
                      ₦
                      {item.isNegotiator && item.myNegotiation?.agreedAmount
                        ? Number(
                            item.myNegotiation.agreedAmount
                          ).toLocaleString()
                        : Number(item.estimatedFare).toLocaleString()}
                    </AppText>
                    <AppText size={11} color={colors.textMuted}>
                      {item.isNegotiator ? "offered fare" : "per seat"}
                    </AppText>
                  </View>
                </View>

                <View
                  style={[
                    styles.routePathsDataDisplayBlock,
                    { backgroundColor: colors.background },
                  ]}
                >
                  <View style={styles.routeWaypointTrackingRowItem}>
                    <View
                      style={[
                        styles.bulletDotNodeIndicator,
                        { backgroundColor: "#EF4444" },
                      ]}
                    />
                    <AppText
                      size={14}
                      weight="semibold"
                      color={colors.text}
                      numberOfLines={1}
                      style={{ flex: 1, marginLeft: 8 }}
                    >
                      {item.pickupPoint}
                    </AppText>
                  </View>

                  <View
                    style={[
                      styles.verticalConnectorLineDashed,
                      { borderColor: colors.border },
                    ]}
                  />

                  <View style={styles.routeWaypointTrackingRowItem}>
                    <View
                      style={[
                        styles.bulletDotNodeIndicator,
                        { backgroundColor: "#22C55E" },
                      ]}
                    />
                    <AppText
                      size={14}
                      weight="semibold"
                      color={colors.text}
                      numberOfLines={1}
                      style={{ flex: 1, marginLeft: 8 }}
                    >
                      {item.dropoffPoint}
                    </AppText>
                  </View>
                </View>

                <View style={styles.cardListSubfooterMetricsActionRow}>
                  <View style={{ flexDirection: "row", gap: 14 }}>
                    <View style={styles.inlineIconLabelUnitMetric}>
                      <Clock size={14} color={colors.textMuted} />
                      <AppText size={12} weight="semibold" color={colors.text}>
                        {item.departureTime}
                      </AppText>
                    </View>
                    <View style={styles.inlineIconLabelUnitMetric}>
                      <User size={14} color={colors.textMuted} />
                      <AppText size={12} weight="semibold" color={colors.text}>
                        {item.availableSeats} seats left
                      </AppText>
                    </View>
                  </View>
                  <AppText size={12} weight="bold" color={colors.primary}>
                    {item.isNegotiator ? "View Offer →" : "Join Ride →"}
                  </AppText>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={citySelectorTarget !== null}
        onRequestClose={() => setCitySelectorTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.dismissArea}
            activeOpacity={1}
            onPress={() => setCitySelectorTarget(null)}
          />
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface,
                paddingTop: 16,
                height: "80%",
              },
            ]}
          >
            <View
              style={[styles.modalKnob, { backgroundColor: colors.border }]}
            />

            <AppText
              size={18}
              weight="bold"
              color={colors.text}
              style={{ paddingHorizontal: 24, marginBottom: 4 }}
            >
              Filter by{" "}
              {citySelectorTarget === "PICKUP" ? "Origin" : "Destination"} City
            </AppText>
            <AppText
              size={13}
              color={colors.textMuted}
              style={{ paddingHorizontal: 24, marginBottom: 16 }}
            >
              Isolate routes spanning across specific regional networks.
            </AppText>

            <View style={{ flex: 1 }}>
              <NigeriaCitiesGrid
                onCityPress={(city) => handleSelectCity(city.name)}
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
                  styles.cancelButton,
                  { backgroundColor: colors.border },
                ]}
                onPress={() => setCitySelectorTarget(null)}
              >
                <AppText size={15} weight="bold" color={colors.text}>
                  Cancel Filter
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
    paddingVertical: 8,
  },
  backButton: {
    padding: 8,
  },
  filterDockRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 6,
    gap: 10,
  },
  filterPill: {
    flex: 1,
    height: 44,
    borderRadius: 20,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  pillText: { flex: 1, marginLeft: 6, marginRight: 2 },
  clearPillButton: {
    paddingLeft: 4,
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  emptyListStateFrame: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 30,
  },
  driverMarketplaceCardBox: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 14,

    overflow: "hidden",
  },
  negotiationHeaderBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  cardProfileRowHeaderLayout: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  driverAvatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
  },
  driverAvatarProfileThumbnail: { width: 44, height: 44, borderRadius: 22 },
  initialsCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  routePathsDataDisplayBlock: {
    padding: 14,
    borderRadius: 16,
    marginVertical: 14,
  },
  routeWaypointTrackingRowItem: { flexDirection: "row", alignItems: "center" },
  bulletDotNodeIndicator: { width: 8, height: 8, borderRadius: 4 },
  verticalConnectorLineDashed: {
    height: 14,
    width: 1,
    borderLeftWidth: 1.5,
    borderStyle: "dashed",
    marginLeft: 3,
    marginVertical: 2,
  },
  cardListSubfooterMetricsActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inlineIconLabelUnitMetric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  dismissArea: { flex: 1 },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  modalKnob: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
    marginVertical: 12,
  },
  cancelButton: {
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
});
