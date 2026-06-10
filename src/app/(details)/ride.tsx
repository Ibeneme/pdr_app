// app/(details)/ride.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
  Alert,
  Linking,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/api/store";
import { createNegotiation } from "@/api/slices/negotiation.slice";
import { AppText } from "@/components/AppText";
import {
  ArrowLeft,
  Phone,
  MapPin,
  Calendar,
  Users,
  Wallet,
  ShieldCheck,
  Handshake,
  CheckCircle2,
} from "lucide-react-native";
import { getUser } from "@/api/secureStore";
import NegotiationManager from "@/components/NegotiationManager";
import { getRideByIdOffer } from "@/api/slices/ride.slice";

export default function RideDetailsScreen() {
  const { theme: colors, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  // Safe extraction of params pushed via handleRideSelection pipeline
  const params = useLocalSearchParams<{
    id: string;
    driverName: string;
    driverPhone: string;
    pickup: string;
    dropoff: string;
    fare: string;
    time: string;
    seats: string;
  }>();

  const id = params.id;

  // Core System States
  const [ride, setRide] = useState<any | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNegotiating, setIsNegotiating] = useState(false);

  // Load User Context Matrix
  useEffect(() => {
    const fetchCurrentUser = async () => {
      console.log("👤 Fetching current user context info...");
      const user = await getUser();
      setCurrentUser(user);
    };
    fetchCurrentUser();
  }, []);

  // Sync Focus Handler to capture updated negotiation layers across stacks
  useFocusEffect(
    useCallback(() => {
      if (id) {
        console.log(
          `🔄 [FOCUS] Refreshing data stream for ride instance: ${id}`
        );
        setIsLoading(true);
        dispatch(getRideByIdOffer(id))
          .unwrap()
          .then((data: any) => {
            setRide(data);
            setError(null);
          })
          .catch((err: any) => {
            console.error(
              "❌ [FETCH_ERROR] Failure loading ride context details:",
              err
            );
            setError(err?.message || "Failed to load current ride parameters.");
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    }, [id, dispatch])
  );

  // Dynamic Resolution Engine: Extracts the active negotiation context block
  const getActiveNegotiation = () => {
    const activeRide = ride || {};
    const negData = activeRide.negotiations || activeRide.negotiation;
    if (!negData || !currentUser) return null;

    if (Array.isArray(negData)) {
      if (negData.length === 0) return null;
      const currentUserId = currentUser._id || currentUser.id;
      return (
        negData.find(
          (n: any) =>
            n?.negotiator === currentUserId ||
            n?.negotiator?._id === currentUserId ||
            n?.negotiator?.id === currentUserId
        ) || null
      );
    }
    if (typeof negData === "object" && negData !== null) return negData;
    return null;
  };

  const activeNegotiation = getActiveNegotiation();
  const existingNegotiationId =
    activeNegotiation?._id || activeNegotiation?.id || null;
  const hasExistingNegotiation = !!existingNegotiationId;
  const negotiationAgreedAmount = activeNegotiation?.agreedAmount;

  // Payment Status Resolution
  const isPaid =
    activeNegotiation?.isPaid === true ||
    String(activeNegotiation?.status).toUpperCase() === "PAID" ||
    String(ride?.status).toUpperCase() === "PAID";

  const negotiationStatus = isPaid
    ? "PAID"
    : activeNegotiation?.status
    ? String(activeNegotiation.status).toUpperCase()
    : "PENDING";

  const hasAgreedAmount =
    negotiationAgreedAmount !== undefined && negotiationAgreedAmount !== null;

  // Strict Actor Isolation Rules matched with backend "driver" population path
  const currentUserIdStr = currentUser?._id || currentUser?.id;
  const driverIdStr = ride?.driver?._id || ride?.driver?.id;
  const isServiceProvider =
    !!currentUserIdStr && !!driverIdStr && currentUserIdStr === driverIdStr;

  // Runtime clean fallbacks for rendering immediately before full API stream payload mounts
  const displayDriverName =
    ride?.driver?.fullName || params.driverName || "Dispatched Fleet Captain";
  const displayDriverPhone = ride?.driver?.phone || params.driverPhone || "";
  const displayPickup =
    ride?.pickupPoint || ride?.pickup || params.pickup || "Origin Point";
  const displayDropoff =
    ride?.dropoffPoint ||
    ride?.dropoff ||
    params.dropoff ||
    "Destination Point";
  const displayTime =
    ride?.departureTime || ride?.time || params.time || "Scheduled Time";
  const displaySeats =
    ride?.availableSeats || ride?.seats || params.seats || "1";
  const displayFare =
    ride?.estimatedFare || ride?.fare || ride?.price || params.fare || 0;

  // Get initials for driver avatar
  const getInitials = (name: string) => {
    if (!name) return "D";
    const names = name.trim().split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0].slice(0, 2).toUpperCase();
  };

  const handlePayPress = () => {
    console.log("💳 Redirecting to checkout framework pipeline...");
    router.push({
      pathname: "/(details)/PaymentScreen",
      params: {
        negotiationId: existingNegotiationId,
        serviceType: "offer_a_ride",
        amount: String(negotiationAgreedAmount),
        email: currentUser?.email || "customer@padiman.com",
      },
    });
  };

  const handleNegotiate = async () => {
    const targetServiceProviderId = ride?.driver?._id || ride?.driver || null;

    if (!id) {
      Alert.alert(
        "Error",
        "Missing configuration target parameter identifier."
      );
      return;
    }

    if (hasExistingNegotiation && existingNegotiationId) {
      router.push({
        pathname: "/(details)/ChatScreen",
        params: { id: existingNegotiationId, parcelId: id },
      });
      return;
    }

    const payload = {
      serviceProvider: targetServiceProviderId,
      service: id,
      serviceType: "offer_a_ride",
      negotiatorService: "Ride Route Share Negotiation",
    };

    setIsNegotiating(true);
    try {
      const result = await dispatch(createNegotiation(payload)).unwrap();
      if (result?._id || result?.id) {
        const targetRoomId = result._id || result.id;
        router.push({
          pathname: "/(details)/ChatScreen",
          params: { id: targetRoomId },
        });
      }
    } catch (err: any) {
      console.error("❌ Failed starting active room link parameters:", err);
      Alert.alert(
        "Error",
        "Could not instantiate live communication negotiation arrays."
      );
    } finally {
      setIsNegotiating(false);
    }
  };

  if (isLoading && !ride) {
    return (
      <View
        style={[
          styles.centeredContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error && !ride) {
    return (
      <View
        style={[
          styles.centeredContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <AppText size={15} color={colors.text} style={styles.errorText}>
          {error}
        </AppText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* HEADER BAR */}
      <SafeAreaView
        style={[
          styles.headerSafeArea,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[
              styles.iconButton,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <AppText size={18} weight="bold" color={colors.text}>
            Ride Manifest
          </AppText>
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      {/* STICKY INTERACTIVE STATUS BANNER */}
      {hasExistingNegotiation && (
        <View
          style={[
            styles.agreedBanner,
            {
              backgroundColor: isPaid ? "#10B98115" : colors.primary + "15",
              borderColor: isPaid ? "#10B981" : colors.primary,
              margin: 16,
              marginBottom: 4,
            },
          ]}
        >
          {isPaid ? (
            <CheckCircle2 size={24} color="#10B981" />
          ) : (
            <Handshake size={24} color={colors.primary} />
          )}
          <View style={{ flex: 1, marginLeft: 10 }}>
            <AppText
              size={14}
              weight="bold"
              color={isPaid ? "#10B981" : colors.text}
            >
              {hasAgreedAmount
                ? `${isPaid ? "Seat Secured" : "Agreed Price"}: ₦${Number(
                    negotiationAgreedAmount
                  ).toLocaleString()}`
                : "Active Negotiations Ongoing"}
            </AppText>
            <AppText
              size={11}
              color={colors.textMuted}
              style={{ marginTop: 1 }}
            >
              Status: {negotiationStatus}
            </AppText>
          </View>

          {hasAgreedAmount && !isPaid && (
            <TouchableOpacity
              style={[styles.bannerPayBtn, { backgroundColor: colors.primary }]}
              onPress={handlePayPress}
            >
              <AppText size={12} weight="bold" color="#FFF">
                Pay Now
              </AppText>
            </TouchableOpacity>
          )}

          {hasAgreedAmount && isPaid && (
            <TouchableOpacity
              style={[styles.bannerPayBtn, { backgroundColor: "#10B981" }]}
              onPress={() => {
                router.push({
                  pathname: "/(details)/ReceiptScreen",
                  params: {
                    id: id,
                    negotiationId: existingNegotiationId,
                    amount: String(negotiationAgreedAmount),
                    status: negotiationStatus,
                    pickupAddress: displayPickup,
                    destinationCity: displayDropoff,
                    serviceType: "offer_a_ride",
                    payerName: currentUser?.fullName,
                    payerEmail: currentUser?.email,
                    providerName: ride?.driver?.fullName,
                    providerEmail: ride?.driver?.email,
                  },
                });
              }}
            >
              <AppText size={12} weight="bold" color="#FFF">
                View Receipt
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView
        style={styles.scrollFrame}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* DRIVER IDENTITY CARD - WITH PROFILE IMAGE OR INITIALS */}
        <View
          style={[
            styles.profileCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.driverMetaBlock}>
            {ride?.driver?.profileImage ? (
              <Image
                source={{ uri: ride.driver.profileImage }}
                style={styles.driverAvatarImage}
              />
            ) : (
              <View
                style={[
                  styles.avatarFallback,
                  { backgroundColor: colors.primary },
                ]}
              >
                <AppText size={20} weight="bold" color="#FFF">
                  {getInitials(displayDriverName)}
                </AppText>
              </View>
            )}

            <View style={{ flex: 1 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <AppText size={17} weight="bold" color={colors.text}>
                  {displayDriverName}
                </AppText>
                <ShieldCheck size={16} color={colors.primary} />
              </View>
              <AppText
                size={13}
                color={colors.textMuted}
                style={{ marginTop: 2 }}
              >
                Verified
              </AppText>
            </View>
          </View>

          {displayDriverPhone && !isServiceProvider ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                Linking.openURL(`tel:${displayDriverPhone}`).catch(() => {})
              }
              style={[
                styles.callButton,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <Phone size={16} color={colors.primary} />
              <AppText size={14} weight="bold" color={colors.primary}>
                Call Operator
              </AppText>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* TRANSIT MANIFEST STOPS */}
        <AppText
          size={13}
          weight="bold"
          color={colors.textMuted}
          style={styles.sectionTitle}
        >
          ROUTE PATTERNS
        </AppText>

        <View
          style={[
            styles.routeBlock,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.waypointItem}>
            <MapPin size={18} color="#EF4444" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <AppText size={11} color={colors.textMuted} weight="medium">
                PICKUP NODE
              </AppText>
              <AppText
                size={15}
                weight="semibold"
                color={colors.text}
                style={{ marginTop: 2 }}
              >
                {displayPickup}
              </AppText>
            </View>
          </View>

          <View
            style={[styles.lineConnector, { borderColor: colors.border }]}
          />

          <View style={styles.waypointItem}>
            <MapPin size={18} color="#22C55E" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <AppText size={11} color={colors.textMuted} weight="medium">
                DROPOFF HUB
              </AppText>
              <AppText
                size={15}
                weight="semibold"
                color={colors.text}
                style={{ marginTop: 2 }}
              >
                {displayDropoff}
              </AppText>
            </View>
          </View>
        </View>

        {/* DETAILS GRID LAYOUT */}
        <AppText
          size={13}
          weight="bold"
          color={colors.textMuted}
          style={styles.sectionTitle}
        >
          MANIFEST QUANTITIES
        </AppText>

        <View style={styles.metricsGridRow}>
          <View
            style={[
              styles.metricGridItem,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Calendar size={18} color={colors.textMuted} />
            <View style={{ flex: 1 }}>
              <AppText size={11} color={colors.textMuted}>
                DEPARTURE
              </AppText>
              <AppText
                size={13}
                weight="bold"
                color={colors.text}
                style={{ marginTop: 2 }}
                numberOfLines={1}
              >
                {displayTime}
              </AppText>
            </View>
          </View>

          <View
            style={[
              styles.metricGridItem,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Users size={18} color={colors.textMuted} />
            <View style={{ flex: 1 }}>
              <AppText size={11} color={colors.textMuted}>
                AVAILABILITY
              </AppText>
              <AppText
                size={13}
                weight="bold"
                color={colors.text}
                style={{ marginTop: 2 }}
                numberOfLines={1}
              >
                {displaySeats} Seats Left
              </AppText>
            </View>
          </View>
        </View>

        {/* PRICING DISCLOSURE BOX */}
        <AppText
          size={13}
          weight="bold"
          color={colors.textMuted}
          style={styles.sectionTitle}
        >
          PRICING STRUCTURE
        </AppText>
        <View
          style={[
            styles.pricingCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.priceRowItem}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Wallet size={18} color={colors.textMuted} />
              <AppText size={14} color={colors.textMuted}>
                Base Estimate Seat Fare
              </AppText>
            </View>
            <AppText size={18} weight="bold" color={colors.primary}>
              ₦{Number(displayFare).toLocaleString()}
            </AppText>
          </View>
        </View>

        {/* RENDER NEGOTIATION MANAGER IN-LINE ONLY FOR BASE OWNER OPERATORS */}
        {hasExistingNegotiation && isServiceProvider && (
          <View style={{ marginTop: 8 }}>
            <NegotiationManager negotiationId={existingNegotiationId} />
          </View>
        )}
      </ScrollView>

      {/* STICKY CHAT ENTRY NAV BAR TRIGGER */}
      <View
        style={[
          styles.stickyFooter,
          { backgroundColor: colors.surface, borderTopColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.primaryActionBtn,
            { backgroundColor: colors.primary },
            isNegotiating && { opacity: 0.8 },
          ]}
          onPress={handleNegotiate}
          disabled={isNegotiating}
        >
          {isNegotiating ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : hasExistingNegotiation ? (
            <AppText size={15} weight="bold" color="#FFF">
              Go to Chats
            </AppText>
          ) : (
            <AppText size={15} weight="bold" color="#FFF">
              Negotiate Base Price
            </AppText>
          )}
        </TouchableOpacity>
      </View>
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
  errorText: { textAlign: "center" },
  headerSafeArea: { borderBottomWidth: 1 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  scrollFrame: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  agreedBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  bannerPayBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 20,
    textTransform: "uppercase",
  },
  profileCard: { padding: 16, borderRadius: 20, borderWidth: 1, gap: 14 },
  driverMetaBlock: { flexDirection: "row", alignItems: "center", gap: 12 },
  driverAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  callButton: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  routeBlock: { padding: 16, borderRadius: 20, borderWidth: 1 },
  waypointItem: { flexDirection: "row", alignItems: "center" },
  lineConnector: {
    height: 20,
    width: 1,
    borderLeftWidth: 1.5,
    borderStyle: "dashed",
    marginLeft: 8,
    marginVertical: 4,
  },
  metricsGridRow: { flexDirection: "row", gap: 12 },
  metricGridItem: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pricingCard: { padding: 16, borderRadius: 20, borderWidth: 1 },
  priceRowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stickyFooter: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 36 : 20,
    borderTopWidth: 1,
  },
  primaryActionBtn: {
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
});
