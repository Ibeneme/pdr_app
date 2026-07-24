import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  StyleSheet,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
  Image,
  Modal,
  Animated,
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/api/store";
import { createNegotiation } from "@/api/slices/negotiation.slice";
import { AppText } from "@/components/AppText";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Wallet,
  ShieldCheck,
  Handshake,
  CheckCircle2,
  MessageSquare,
  DollarSign,
  Layers,
  AlertCircle,
  X,
  ArrowUpRight,
  SlidersHorizontal,
} from "lucide-react-native";
import { getUser } from "@/api/secureStore";
import { getRideByIdOffer } from "@/api/slices/ride.slice";
import { EscrowReleaseButton } from "@/components/EscrowReleaseButton";
import NegotiationActionPanel from "@/components/NegotiationActionPanel";

// Shimmer Block
function ShimmerBlock({
  width,
  height,
  borderRadius = 10,
  baseColor,
  style,
}: {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  baseColor: string;
  style?: any;
}) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: baseColor, opacity },
        style,
      ]}
    />
  );
}

export default function RideDetailsScreen() {
  const { theme: colors, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const { id, negotiatorService } = useLocalSearchParams<{
    id: string;
    negotiatorService?: string;
  }>();

  const shimmerBase = isDark ? "#2A2A2E" : "#E7E7EA";

  const [ride, setRide] = useState<any | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [isUpdatingAllStatus, setIsUpdatingAllStatus] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalIcon, setModalIcon] = useState<any>(null);
  const [modalIconColor, setModalIconColor] = useState(colors.primary);
  const [modalButtons, setModalButtons] = useState<any[]>([]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = await getUser();
      setCurrentUser(user);
    };
    fetchCurrentUser();
  }, []);

  const refreshRideDetails = useCallback(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    dispatch(getRideByIdOffer(id))
      .unwrap()
      .then((data: any) => {
        setRide(data);
        setError(null);
      })
      .catch((err: any) => {
        setError(err?.message || "Failed to load ride details.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id, dispatch]);

  useFocusEffect(
    useCallback(() => {
      refreshRideDetails();
    }, [refreshRideDetails])
  );

  const currentUserId = currentUser?._id || currentUser?.id;
  const driverId = ride?.driver?._id || ride?.driver?.id;
  const isServiceProvider =
    !!currentUserId && !!driverId && currentUserId === driverId;

  const isRideDisabled =
    ride?.status === "completed" || ride?.status === "cancelled";

  const displayDriverName = ride?.driver?.fullName || "Driver";
  const displayPickup = ride?.pickupPoint || "Unknown Pickup";
  const displayDropoff = ride?.dropoffPoint || "Unknown Dropoff";
  const displayTime = ride?.departureTime || "N/A";
  const displaySeats = ride?.availableSeats || 1;
  const displayFare = ride?.estimatedFare || 0;

  const getInitials = (name: string) => {
    if (!name) return "D";
    const parts = name.trim().split(" ");
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
  };

  const showBottomModal = (
    title: string,
    message: string,
    buttons: any[],
    icon?: any,
    iconColor?: string
  ) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalButtons(buttons);
    setModalIcon(icon || null);
    setModalIconColor(iconColor || colors.primary);
    setModalVisible(true);
  };

  const handleNegotiateOrChat = async (negotiationId?: string) => {
    if (negotiationId) {
      router.push({
        pathname: "/(details)/ChatScreen",
        params: { id: negotiationId, rideId: id },
      });
      return;
    }

    const payload = {
      serviceProvider: ride?.driver?._id || ride?.driver?.id,
      service: id,
      serviceType: "offer_a_ride",
      negotiatorService: negotiatorService,
    };

    setIsNegotiating(true);
    try {
      const result = await dispatch(createNegotiation(payload)).unwrap();
      const negId = result?.data?._id || result?.data?.id;
      if (negId) {
        router.push({
          pathname: "/(details)/ChatScreen",
          params: { id: negId },
        });
      }
    } catch (err) {
      showBottomModal(
        "Error",
        "Could not start negotiation.",
        [{ text: "OK", onPress: () => setModalVisible(false) }],
        AlertCircle,
        "#EF4444"
      );
    } finally {
      setIsNegotiating(false);
    }
  };

  const handlePayNow = (negotiation: any) => {
    if (!negotiation?._id) return;
    router.push({
      pathname: "/(details)/PaymentScreen",
      params: {
        negotiationId: negotiation._id,
        serviceType: "offer_a_ride",
        amount: String(negotiation.agreedAmount || negotiation.price || 0),
        email: currentUser?.email,
      },
    });
  };

  const handleShowReceipt = (neg: any) => {
    if (!neg?._id) return;
    router.push({
      pathname: "/(details)/ReceiptScreen",
      params: {
        id: id as string,
        negotiationId: neg._id,
        amount: String(neg.agreedAmount || ""),
        status: neg.status || "",
        pickupAddress: ride?.pickupPoint,
        destinationCity: ride?.dropoffPoint,
        serviceType: "offer_a_ride",
      },
    });
  };

  if (isLoading && !ride) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={[
                styles.circularHeaderButton,
                { backgroundColor: colors.surface },
              ]}
              onPress={() => router.back()}
            >
              <ArrowLeft size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <ScrollView
          style={styles.scrollFrame}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.titleContainer}>
            <ShimmerBlock
              width={190}
              height={32}
              borderRadius={10}
              baseColor={shimmerBase}
            />
          </View>

          <View
            style={[
              styles.contentCard,
              { backgroundColor: colors.surface, padding: 16 },
            ]}
          >
            <View style={styles.driverMetaBlock}>
              <ShimmerBlock
                width={52}
                height={52}
                borderRadius={26}
                baseColor={shimmerBase}
              />
              <View style={{ flex: 1, gap: 8 }}>
                <ShimmerBlock
                  width={160}
                  height={16}
                  borderRadius={8}
                  baseColor={shimmerBase}
                />
                <ShimmerBlock
                  width={120}
                  height={12}
                  borderRadius={6}
                  baseColor={shimmerBase}
                />
              </View>
            </View>
          </View>

          <View
            style={[
              styles.contentCard,
              { backgroundColor: colors.surface, padding: 20, marginTop: 12 },
            ]}
          >
            <ShimmerBlock
              width="100%"
              height={24}
              borderRadius={12}
              baseColor={shimmerBase}
            />
            <ShimmerBlock
              width="70%"
              height={14}
              borderRadius={8}
              baseColor={shimmerBase}
              style={{ marginTop: 12 }}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  if (error || !ride) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <AppText color="#EF4444" size={16}>
          {error || "Failed to load ride"}
        </AppText>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 20 }}
        >
          <AppText>← Go Back</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[
              styles.circularHeaderButton,
              { backgroundColor: colors.surface },
            ]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.rightHeaderControls}>
            <TouchableOpacity
              style={[
                styles.circularHeaderButton,
                { backgroundColor: colors.surface },
              ]}
            >
              <SlidersHorizontal size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollFrame}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleContainer}>
          <AppText
            size={32}
            weight="bold"
            color={colors.text}
            style={styles.screenTitle}
          >
            On{"\n"}Your Ride
          </AppText>
        </View>

        {isServiceProvider && (
          <View
            style={[
              styles.contentCard,
              {
                backgroundColor: colors.surface,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <AppText size={14} weight="bold" color={colors.text}>
                Global Status Management
              </AppText>
              <AppText size={12} color={colors.textMuted}>
                Current: {String(ride?.status).toUpperCase()}
              </AppText>
            </View>
            <TouchableOpacity
              style={[styles.bulkStatusBtn, { backgroundColor: colors.text }]}
              onPress={() => {}}
              disabled={isUpdatingAllStatus}
            >
              {isUpdatingAllStatus ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <>
                  <Layers size={14} color={colors.background} />
                  <AppText size={11} weight="bold" color={colors.background}>
                    Toggle
                  </AppText>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View
          style={[
            styles.contentCard,
            { backgroundColor: colors.surface, padding: 16 },
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
                  { backgroundColor: colors.text },
                ]}
              >
                <AppText size={20} weight="bold" color={colors.background}>
                  {getInitials(displayDriverName)}
                </AppText>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <AppText size={17} weight="bold" color={colors.text}>
                {displayDriverName}
              </AppText>
              {ride?.driver?.isVerified && (
                <ShieldCheck size={16} color={colors.primary} />
              )}
            </View>
          </View>
        </View>

        <View
          style={[
            styles.contentCard,
            { backgroundColor: colors.surface, padding: 20 },
          ]}
        >
          <View style={styles.routePillHeader}>
            <View
              style={[styles.capsuleBadge, { backgroundColor: colors.text }]}
            >
              <MapPin size={12} color={colors.background} />
              <AppText
                size={11}
                weight="bold"
                color={colors.background}
                style={{ marginLeft: 4 }}
              >
                ROUTE
              </AppText>
            </View>
            <ArrowUpRight size={20} color={colors.text} />
          </View>

          <AppText
            size={20}
            weight="bold"
            color={colors.text}
            style={{ marginTop: 16 }}
          >
            {displayPickup} → {displayDropoff}
          </AppText>
          <AppText size={13} color={colors.textMuted} style={{ marginTop: 8 }}>
            Departure: {displayTime}
          </AppText>
        </View>

        <View style={{ marginTop: 28, marginBottom: 8 }}>
          <AppText size={12} weight="bold" color={colors.textMuted}>
            NEGOTIATIONS ({ride?.negotiations?.length || 0})
          </AppText>
        </View>

        {ride?.negotiations && ride.negotiations.length > 0 ? (
          ride.negotiations.map((neg: any) => {
            const isCurrentUserNeg =
              (neg.negotiator?._id || neg.negotiator?.id) === currentUserId;
            const isPaid = neg.isPaid === true;
            const isCompleted = neg.status?.toLowerCase().includes("completed");

            return (
              <View
                key={neg._id}
                style={[
                  styles.contentCard,
                  { backgroundColor: colors.surface },
                ]}
              >
                <NegotiationActionPanel
                  negotiationId={neg._id}
                  parcelId={id as string}
                  isServiceProvider={isServiceProvider}
                  currentUserId={currentUserId}
                  accordion={false}
                  handleViewChat={() => handleNegotiateOrChat(neg._id)}
                />

                <View style={styles.negActionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.negActionButton,
                      { backgroundColor: colors.background },
                    ]}
                    onPress={() => handleNegotiateOrChat(neg._id)}
                  >
                    <MessageSquare size={16} color={colors.text} />
                    <AppText size={13} weight="semibold" color={colors.text}>
                      Chat
                    </AppText>
                  </TouchableOpacity>

                  {(isCurrentUserNeg || isServiceProvider) && (
                    <TouchableOpacity
                      style={[
                        styles.negActionPrimaryBtn,
                        {
                          backgroundColor: isPaid
                            ? colors.primary
                            : colors.text,
                        },
                      ]}
                      onPress={() =>
                        isPaid ? handleShowReceipt(neg) : handlePayNow(neg)
                      }
                    >
                      {isPaid ? (
                        <>
                          <CheckCircle2 size={16} color={colors.background} />
                          <AppText
                            size={13}
                            weight="bold"
                            color={colors.background}
                          >
                            Receipt
                          </AppText>
                        </>
                      ) : (
                        <>
                          <DollarSign size={16} color={colors.background} />
                          <AppText
                            size={13}
                            weight="bold"
                            color={colors.background}
                          >
                            Pay Now
                          </AppText>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {isPaid && isCompleted && !neg.isConfirmed && (
                  <EscrowReleaseButton
                    negotiationId={neg._id}
                    theme={colors}
                    isServiceProvider={isServiceProvider}
                    onSuccess={refreshRideDetails}
                  />
                )}
              </View>
            );
          })
        ) : (
          <View
            style={[
              styles.contentCard,
              {
                backgroundColor: colors.surface,
                padding: 40,
                alignItems: "center",
              },
            ]}
          >
            <Handshake size={36} color={colors.textMuted} />
            <AppText
              size={14}
              color={colors.textMuted}
              style={{ marginTop: 12, textAlign: "center" }}
            >
              No active negotiations yet
            </AppText>
          </View>
        )}

        <View
          style={[
            styles.contentCard,
            { backgroundColor: colors.surface, padding: 20, marginTop: 12 },
          ]}
        >
          <View style={styles.priceRowItem}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Wallet size={18} color={colors.textMuted} />
              <AppText size={14} color={colors.textMuted}>
                Base Fare
              </AppText>
            </View>
            <AppText size={18} weight="bold" color={colors.text}>
              ₦{Number(displayFare).toLocaleString()}
            </AppText>
          </View>
        </View>
      </ScrollView>

      {!isServiceProvider && (
        <SafeAreaView style={styles.stickyFooter}>
          <TouchableOpacity
            style={[
              styles.primaryActionBtn,
              { backgroundColor: colors.primary , margin: 16, marginBottom: 64},
            ]}
            onPress={() => handleNegotiateOrChat()}
            disabled={isNegotiating || isRideDisabled}
          >
            {isNegotiating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <AppText size={16} weight="bold" color="#fff">
                Negotiate New Price
              </AppText>
            )}
          </TouchableOpacity>
        </SafeAreaView>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <X size={24} color={colors.textMuted} />
            </TouchableOpacity>

            {modalIcon && (
              <View style={styles.modalIconContainer}>
                {React.createElement(modalIcon, {
                  size: 48,
                  color: modalIconColor,
                })}
              </View>
            )}

            <AppText
              size={20}
              weight="bold"
              color={colors.text}
              style={{ textAlign: "center", marginBottom: 8 }}
            >
              {modalTitle}
            </AppText>
            <AppText
              size={15}
              color={colors.textMuted}
              style={{ textAlign: "center", lineHeight: 22 }}
            >
              {modalMessage}
            </AppText>

            <View style={styles.modalButtons}>
              {modalButtons.map((btn, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.modalButton,
                    { backgroundColor: colors.primary },
                    btn.style === "cancel" && {
                      backgroundColor: colors.background,
                    },
                  ]}
                  onPress={btn.onPress}
                >
                  <AppText
                    size={16}
                    weight="bold"
                    color={btn.style === "cancel" ? colors.text : "#fff"}
                  >
                    {btn.text}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSafeArea: {},
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  circularHeaderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  rightHeaderControls: { flexDirection: "row", alignItems: "center", gap: 8 },
  titleContainer: { paddingHorizontal: 20, marginVertical: 12 },
  screenTitle: { lineHeight: 38 },
  scrollFrame: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  contentCard: { borderRadius: 28, marginBottom: 16 },
  driverMetaBlock: { flexDirection: "row", alignItems: "center", gap: 12 },
  driverAvatarImage: { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  routePillHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  capsuleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  priceRowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  negActionsRow: { flexDirection: "row", gap: 12, marginTop: 12, padding: 16 },
  negActionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  negActionPrimaryBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  stickyFooter: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
  },
  primaryActionBtn: {
    height: 56,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  bulkStatusBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  modalCloseButton: { position: "absolute", top: 20, right: 20 },
  modalIconContainer: { alignItems: "center", marginBottom: 16 },
  modalButtons: { marginTop: 20, gap: 12 },
  modalButton: {
    height: 52,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
});
