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
  Handshake,
  CheckCircle2,
  Search,
  X,
} from "lucide-react-native";
import { AppText } from "@/components/AppText";
import { NigeriaCitiesGrid } from "@/components/NigeriaCitiesGrid";

// ---- Shared design tokens -------------------------------------------------
const RADIUS = { sm: 12, md: 16, lg: 20, xl: 24, pill: 999 };
const SHADOW_SM = {
  shadowColor: "#0F0B2E",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevation: 2,
};
const SHADOW_MD = {
  shadowColor: "#0F0B2E",
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.1,
  shadowRadius: 24,
  elevation: 8,
};

const PASTELS = {
  sky: { bg: "#DBEAFE", icon: "#2563EB" },
  lavender: { bg: "#EDE9FE", icon: "#7C3AED" },
  mint: { bg: "#D1FAE5", icon: "#059669" },
  peach: { bg: "#FFE4D6", icon: "#EA580C" },
  rose: { bg: "#FFE1E6", icon: "#E11D48" },
};
// ---------------------------------------------------------------------------

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
  const { id, request } = useLocalSearchParams<{ id?: string; request: any }>();

  const pageBg = isDark ? colors.background : "#f4f4f4";
  const cardBg = isDark ? colors.surface : "#FFFFFF";
  const tileBg = isDark ? colors.background : "#F4F4F1";

  // State
  const [rides, setRides] = useState<AvailableRide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [matchedRequest, setMatchedRequest] = useState<any>(null);

  console.warn(request, "requestrequestrequest");

  // Geographic Filtering States
  const [filterPickup, setFilterPickup] = useState<string | null>(null);
  const [filterDropoff, setFilterDropoff] = useState<string | null>(null);
  const [citySelectorTarget, setCitySelectorTarget] = useState<
    "PICKUP" | "DROPOFF" | null
  >(null);

  // Parse incoming request
  useEffect(() => {
    let parsedRequest = null;
    if (typeof request === "string") {
      try {
        parsedRequest = JSON.parse(request);
      } catch (e) {
        console.error("Failed to parse request param", e);
      }
    } else if (request) {
      parsedRequest = request;
    }

    console.warn("Request details:", JSON.stringify(parsedRequest, null, 2));
    setMatchedRequest(parsedRequest);
  }, [request]);

  const fetchRides = (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    setError("");

    return dispatch(getAllRides())
      .unwrap()
      .then((data: any[]) => {
        console.warn(data, "datadata");
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
    const matchesManualPickup = filterPickup
      ? ride.pickupPoint.toLowerCase().includes(filterPickup.toLowerCase()) ||
        filterPickup.toLowerCase().includes(ride.pickupPoint.toLowerCase())
      : true;

    const matchesManualDropoff = filterDropoff
      ? ride.dropoffPoint.toLowerCase().includes(filterDropoff.toLowerCase()) ||
        filterDropoff.toLowerCase().includes(ride.dropoffPoint.toLowerCase())
      : true;

    if (!matchesManualPickup || !matchesManualDropoff) return false;

    if (matchedRequest) {
      const reqPickup = (
        matchedRequest.route?.pickupAddress ||
        matchedRequest.pickupAddress ||
        matchedRequest.pickupPoint ||
        ""
      )
        .toLowerCase()
        .trim();

      const reqDelivery = (
        matchedRequest.route?.deliveryAddress ||
        matchedRequest.deliveryAddress ||
        matchedRequest.dropoffPoint ||
        matchedRequest.dropoffAddress ||
        matchedRequest.destinationCity ||
        ""
      )
        .toLowerCase()
        .trim();

      if (!reqPickup || !reqDelivery) return true;

      const ridePickup = (ride.pickupPoint || "").toLowerCase().trim();
      const rideDropoff = (ride.dropoffPoint || "").toLowerCase().trim();

      const sameDirection =
        (ridePickup.includes(reqPickup) || reqPickup.includes(ridePickup)) &&
        (rideDropoff.includes(reqDelivery) ||
          reqDelivery.includes(rideDropoff));

      const reverseDirection =
        (ridePickup.includes(reqDelivery) ||
          reqDelivery.includes(ridePickup)) &&
        (rideDropoff.includes(reqPickup) || reqPickup.includes(rideDropoff));

      return sameDirection || reverseDirection;
    }

    return true;
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

  const messageAdmin = () => {
    console.log("💬 Message Admin button clicked - Coming Soon");
  };

  return (
    <View style={[styles.container, { backgroundColor: pageBg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            style={[
              styles.circleButton,
              { backgroundColor: cardBg },
              SHADOW_SM,
            ]}
          >
            <ArrowLeft size={19} color={colors.text} />
          </TouchableOpacity>

          <AppText size={18} weight="bold" color={colors.text}>
            Find a Ride
          </AppText>

          <View style={{ width: 40 }} />
        </View>

        <View style={styles.filterDockRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setCitySelectorTarget("PICKUP")}
            style={[styles.filterPill, { backgroundColor: cardBg }, SHADOW_SM]}
          >
            <View
              style={[
                styles.filterIconWrap,
                { backgroundColor: filterPickup ? PASTELS.sky.bg : tileBg },
              ]}
            >
              <MapPin
                size={14}
                color={filterPickup ? PASTELS.sky.icon : colors.textMuted}
              />
            </View>
            <AppText
              size={13.5}
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
                <X size={14} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setCitySelectorTarget("DROPOFF")}
            style={[styles.filterPill, { backgroundColor: cardBg }, SHADOW_SM]}
          >
            <View
              style={[
                styles.filterIconWrap,
                { backgroundColor: filterDropoff ? PASTELS.rose.bg : tileBg },
              ]}
            >
              <MapPin
                size={14}
                color={filterDropoff ? PASTELS.rose.icon : colors.textMuted}
              />
            </View>
            <AppText
              size={13.5}
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
                <X size={14} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText size={14} color={colors.textMuted} style={{ marginTop: 12 }}>
            Scanning for routes...
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
          ListHeaderComponent={
            <View
              style={[
                styles.sectionCard,
                { backgroundColor: cardBg },
                SHADOW_SM,
              ]}
            >
              <View style={styles.sectionHeadingRow}>
                <View
                  style={[
                    styles.sectionDot,
                    { backgroundColor: colors.primary },
                  ]}
                />
                <AppText
                  style={[styles.sectionHeading, { color: colors.primary }]}
                  weight="bold"
                >
                  AVAILABLE RIDES
                </AppText>
              </View>
              <AppText
                size={13}
                color={colors.text}
                style={{ lineHeight: 19, marginTop: 4 }}
              >
                This space lists active vehicle trips that match your transit
                route. Connect with drivers heading your way to negotiate and
                settle on a mutual fare.
              </AppText>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyWrapper}>
              <View
                style={[
                  styles.alertIconCircle,
                  { backgroundColor: PASTELS.lavender.bg },
                ]}
              >
                <Search
                  size={32}
                  color={PASTELS.lavender.icon}
                  strokeWidth={1.6}
                />
              </View>

              <AppText
                size={18}
                weight="bold"
                color={colors.text}
                style={{ marginBottom: 8 }}
              >
                No matching rides found
              </AppText>

              <AppText
                size={14}
                color={colors.textMuted}
                weight="medium"
                style={{
                  textAlign: "center",
                  lineHeight: 22,
                  marginBottom: 28,
                }}
              >
                We couldn't find any rides that match your current route. Try
                adjusting your filters or check back later.
              </AppText>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: colors.primary, width: "100%" },
                  SHADOW_MD,
                ]}
                activeOpacity={0.85}
                onPress={messageAdmin}
              >
                <AppText size={15} weight="bold" color="#FFFFFF">
                  Message Admin
                </AppText>
              </TouchableOpacity>
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
                  styles.driverCard,
                  { backgroundColor: cardBg },
                  SHADOW_SM,
                ]}
              >
                {item.isNegotiator && (
                  <View
                    style={[
                      styles.tag,
                      styles.negotiationTag,
                      { backgroundColor: PASTELS.lavender.bg },
                    ]}
                  >
                    <Handshake size={13} color={PASTELS.lavender.icon} />
                    <AppText
                      size={12}
                      weight="bold"
                      color={PASTELS.lavender.icon}
                    >
                      Active Negotiation •{" "}
                      {item.myNegotiation?.status || "Pending"}
                    </AppText>
                  </View>
                )}

                <View style={styles.cardProfileRow}>
                  <View style={styles.cardProfileLeft}>
                    <View style={styles.driverAvatarContainer}>
                      {hasImage ? (
                        <Image
                          source={{ uri: driverImage }}
                          style={styles.driverAvatarImg}
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
                      <View style={styles.driverNameRow}>
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

                <View style={[styles.routeBlock, { backgroundColor: tileBg }]}>
                  <View style={styles.reviewLine}>
                    <View
                      style={[
                        styles.reviewIconWrap,
                        { backgroundColor: PASTELS.rose.bg },
                      ]}
                    >
                      <MapPin size={14} color={PASTELS.rose.icon} />
                    </View>
                    <AppText
                      size={14}
                      weight="semibold"
                      color={colors.text}
                      numberOfLines={1}
                      style={styles.routeText}
                    >
                      {item.pickupPoint}
                    </AppText>
                  </View>

                  <View
                    style={[
                      styles.verticalConnector,
                      { borderColor: colors.border },
                    ]}
                  />

                  <View style={styles.reviewLine}>
                    <View
                      style={[
                        styles.reviewIconWrap,
                        { backgroundColor: PASTELS.mint.bg },
                      ]}
                    >
                      <MapPin size={14} color={PASTELS.mint.icon} />
                    </View>
                    <AppText
                      size={14}
                      weight="semibold"
                      color={colors.text}
                      numberOfLines={1}
                      style={styles.routeText}
                    >
                      {item.dropoffPoint}
                    </AppText>
                  </View>
                </View>

                <View style={styles.cardFooterRow}>
                  <View style={{ flexDirection: "row", gap: 14 }}>
                    <View style={styles.inlineMetric}>
                      <Clock size={14} color={colors.textMuted} />
                      <AppText size={12} weight="semibold" color={colors.text}>
                        {item.departureTime}
                      </AppText>
                    </View>
                    <View style={styles.inlineMetric}>
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
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setCitySelectorTarget(null)}
          />
          <View
            style={[
              styles.modalContent,
              { backgroundColor: cardBg, paddingTop: 16, height: "80%" },
              SHADOW_MD,
            ]}
          >
            <View
              style={[styles.modalKnob, { backgroundColor: colors.border }]}
            />

            <AppText
              weight="bold"
              style={{
                fontSize: 18,
                color: colors.text,
                paddingHorizontal: 24,
                marginBottom: 4,
              }}
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
                activeOpacity={0.8}
                style={[styles.cancelModalButton, { backgroundColor: tileBg }]}
                onPress={() => setCitySelectorTarget(null)}
              >
                <AppText weight="bold" style={{ color: colors.text }}>
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
  headerSafeArea: {
    paddingTop: Platform.OS === "ios" ? 10 : StatusBar.currentHeight || 10,
    paddingBottom: 6,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  filterDockRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 10,
  },
  filterPill: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.pill,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  filterIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  pillText: { flex: 1, marginRight: 4 },
  clearPillButton: {
    paddingLeft: 4,
    paddingRight: 6,
  },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 40,
  },

  sectionCard: {
    borderRadius: RADIUS.lg,
    padding: 18,
    marginBottom: 20,
  },
  sectionHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionHeading: {
    fontSize: 12,
    letterSpacing: 0.8,
  },

  emptyWrapper: {
    paddingVertical: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  alertIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  primaryButton: {
    height: 54,
    borderRadius: RADIUS.pill,
    justifyContent: "center",
    alignItems: "center",
  },

  driverCard: {
    padding: 18,
    borderRadius: RADIUS.xl,
    marginBottom: 16,
  },
  tag: {
    alignSelf: "flex-start",
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  negotiationTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
  },
  cardProfileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardProfileLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  driverAvatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    overflow: "hidden",
  },
  driverAvatarImg: { width: 48, height: 48, borderRadius: 16 },
  initialsCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  driverNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  routeBlock: {
    padding: 16,
    borderRadius: RADIUS.lg,
    marginVertical: 16,
  },
  reviewLine: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  routeText: {
    flex: 1,
    marginLeft: 12,
  },
  verticalConnector: {
    height: 18,
    width: 1,
    borderLeftWidth: 1.5,
    borderStyle: "dashed",
    marginLeft: 14,
    marginVertical: 4,
  },

  cardFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  inlineMetric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(10, 8, 20, 0.55)",
  },
  modalDismissArea: { flex: 1 },
  modalContent: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
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
    height: 54,
    borderRadius: RADIUS.pill,
    justifyContent: "center",
    alignItems: "center",
  },
});
