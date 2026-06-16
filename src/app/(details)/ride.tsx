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
  Linking,
  Image,
  Modal,
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
  MessageSquare,
  DollarSign,
  Layers,
  AlertCircle,
  X,
} from "lucide-react-native";
import { getUser } from "@/api/secureStore";
import NegotiationManager from "@/components/NegotiationManager";
import { getRideByIdOffer } from "@/api/slices/ride.slice";

// Import the Escrow Release Component
import { EscrowReleaseButton } from "@/components/EscrowReleaseButton"; // Adjust path if needed

export default function RideDetailsScreen() {
  const { theme: colors, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const { id, negotiatorService } = useLocalSearchParams<{
    id: string;
    negotiatorService: any;
  }>();

  console.warn(negotiatorService, "negotiatorServicenegotiatorService");
  // Core System States
  const [ride, setRide] = useState<any | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [isUpdatingAllStatus, setIsUpdatingAllStatus] = useState(false);

  // Bottom Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalIcon, setModalIcon] = useState<any>(null);
  const [modalIconColor, setModalIconColor] = useState(colors.primary);
  const [modalButtons, setModalButtons] = useState<any[]>([]);

  // Load User Context Matrix
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = await getUser();
      setCurrentUser(user);
    };
    fetchCurrentUser();
  }, []);

  // Sync Focus Handler
  const refreshRideDetails = useCallback(() => {
    if (id) {
      setIsLoading(true);
      dispatch(getRideByIdOffer(id))
        .unwrap()
        .then((data: any) => {
          setRide(data);
          setError(null);
        })
        .catch((err: any) => {
          setError(err?.message || "Failed to load current ride parameters.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [id, dispatch]);

  useFocusEffect(
    useCallback(() => {
      refreshRideDetails();
    }, [refreshRideDetails])
  );

  // Fallback visual resolutions
  const displayDriverName =
    ride?.driver?.fullName || "Dispatched Fleet Captain";
  const displayDriverPhone = ride?.driver?.phone || "";
  const displayPickup = ride?.pickupPoint || "Origin Point";
  const displayDropoff = ride?.dropoffPoint || "Destination Point";
  const displayTime = ride?.departureTime || "Scheduled Time";
  const displaySeats = ride?.availableSeats || "1";
  const displayFare = ride?.estimatedFare || 0;

  const currentUserIdStr = currentUser?._id || currentUser?.id;
  const driverIdStr = ride?.driver?._id || ride?.driver?.id;
  const isServiceProvider =
    !!currentUserIdStr && !!driverIdStr && currentUserIdStr === driverIdStr;
  const isRideDisabled =
    ride?.status === "completed" || ride?.status === "cancelled";

  // Check if current user is already in negotiations
  const userHasNegotiation = ride?.negotiations?.some(
    (n: any) =>
      n.negotiator?._id === currentUserIdStr ||
      n.negotiator?.id === currentUserIdStr
  );

  const getInitials = (name: string) => {
    if (!name) return "D";
    const names = name.trim().split(" ");
    if (names.length >= 2) return (names[0][0] + names[1][0]).toUpperCase();
    return names[0].slice(0, 2).toUpperCase();
  };

  // Show Bottom Modal
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

  // Global Bulk Action
  const handleBulkStatusChange = () => {
    const currentStatus = ride?.status || "active";
    const nextStatus = currentStatus === "active" ? "closed" : "active";

    showBottomModal(
      "Batch Status Override",
      `Are you sure you want to shift the ride state to "${nextStatus.toUpperCase()}"? This updates the parameters for all downstream dependencies.`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => setModalVisible(false),
        },
        {
          text: "Confirm Change",
          style: "destructive",
          onPress: () => {
            setIsUpdatingAllStatus(true);
            setTimeout(() => {
              setRide((prev: any) => ({ ...prev, status: nextStatus }));
              setIsUpdatingAllStatus(false);
              setModalVisible(false);
              showBottomModal(
                "Success",
                "Global tracking operational flags shifted successfully.",
                [{ text: "OK", onPress: () => setModalVisible(false) }],
                CheckCircle2,
                "#10B981"
              );
            }, 800);
          },
        },
      ],
      AlertCircle,
      colors.primary
    );
  };

  const handleNegotiateOrChat = async (negotiationId?: string) => {
    if (negotiationId) {
      router.push({
        pathname: "/(details)/ChatScreen",
        params: { id: negotiationId, parcelId: id },
      });
      return;
    }

    const targetServiceProviderId = ride?.driver?._id || ride?.driver || null;
    const payload = {
      serviceProvider: targetServiceProviderId,
      service: id,
      serviceType: "offer_a_ride",
      negotiatorService: negotiatorService,
    };

    setIsNegotiating(true);
    try {
      const result = await dispatch(createNegotiation(payload)).unwrap();
      if (result?._id || result?.id) {
        router.push({
          pathname: "/(details)/ChatScreen",
          params: { id: result._id || result.id },
        });
      }
    } catch (err) {
      showBottomModal(
        "Error",
        "Could not instantiate live communication room.",
        [{ text: "OK", onPress: () => setModalVisible(false) }],
        AlertCircle,
        "#EF4444"
      );
    } finally {
      setIsNegotiating(false);
    }
  };

  // Real Payment Navigation
  const handlePayNow = (negotiation: any) => {
    if (!negotiation?._id) {
      showBottomModal("Error", "Invalid negotiation data.", [
        { text: "OK", onPress: () => setModalVisible(false) },
      ]);
      return;
    }

    router.push({
      pathname: "/(details)/PaymentScreen",
      params: {
        negotiationId: negotiation._id,
        serviceType: ride?.serviceType || "offer_a_ride",
        amount: String(
          negotiation.agreedAmount ||
            negotiation.finalPrice ||
            negotiation.price ||
            0
        ),
        email: currentUser?.email,
      },
    });
  };

  // Receipt Navigation
  const handleShowReceipt = (neg: any) => {
    if (!neg?._id) {
      showBottomModal("Error", "Invalid receipt data.", [
        { text: "OK", onPress: () => setModalVisible(false) },
      ]);
      return;
    }

    router.push({
      pathname: "/(details)/ReceiptScreen",
      params: {
        id: id as string,
        negotiationId: neg._id,
        amount: String(neg.agreedAmount || ""),
        status: neg.status || "",
        pickupAddress:
          neg.negotiatorServiceData?.route?.pickupAddress ||
          ride?.pickupPoint ||
          "",
        destinationCity:
          neg.negotiatorServiceData?.route?.deliveryAddress ||
          ride?.dropoffPoint ||
          "",
        serviceType: ride?.serviceType || "offer_a_ride",
        payerName: neg.negotiator?.fullName || "",
        payerEmail: neg.negotiator?.email || "",
        providerName: neg.serviceProvider?.fullName || "",
        providerEmail: neg.serviceProvider?.email || "",
      },
    });
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
            Ride Management Frame
          </AppText>
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      {/* BATCH STATUS MANAGEMENT CONTROL */}
      {isServiceProvider && (
        <View
          style={[
            styles.bulkStatusCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={{ flex: 1 }}>
            <AppText size={14} weight="bold" color={colors.text}>
              Global Ride Status Matrix
            </AppText>
            <AppText
              size={12}
              color={colors.textMuted}
              style={{ marginTop: 2 }}
            >
              Current Status:{" "}
              <AppText weight="bold" color={colors.primary}>
                {String(ride?.status).toUpperCase()}
              </AppText>
            </AppText>
          </View>
          <TouchableOpacity
            style={[styles.bulkStatusBtn, { backgroundColor: colors.primary }]}
            onPress={handleBulkStatusChange}
            disabled={isUpdatingAllStatus}
          >
            {isUpdatingAllStatus ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Layers size={16} color="#FFF" />
                <AppText size={12} weight="bold" color="#FFF">
                  Toggle Master Status
                </AppText>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scrollFrame}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* DRIVER IDENTITY CARD */}
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
                {ride?.driver?.isVerified && (
                  <ShieldCheck size={16} color={colors.primary} />
                )}
              </View>
              <AppText
                size={13}
                color={colors.textMuted}
                style={{ marginTop: 2 }}
              >
                {ride?.notes || "No extra operational remarks filed."}
              </AppText>
            </View>
          </View>
        </View>

        {/* CORE ROUTE CONFIGURATION */}
        <AppText
          size={13}
          weight="bold"
          color={colors.textMuted}
          style={styles.sectionTitle}
        >
          Core Base Route
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

        {/* DYNAMIC LIST ALL ACTIVE NEGOTIATIONS */}
        <AppText
          size={13}
          weight="bold"
          color={colors.textMuted}
          style={styles.sectionTitle}
        >
          Active Negotiations Stack ({ride?.negotiations?.length || 0})
        </AppText>

        {ride?.negotiations && ride.negotiations.length > 0 ? (
          ride.negotiations.map((item: any) => {
            const hasCustomServiceData = !!item?.negotiatorServiceData;
            const isCurrentUserNegotiation =
              (item.negotiator?._id || item.negotiator?.id) ===
              currentUserIdStr;
            const agreedAmount =
              item?.agreedAmount || item?.finalPrice || item?.price || 0;

            const isPaid =
              item?.isPaid === true ||
              item?.paymentStatus === "paid" ||
              item?.paid === true;

            const isCompleted =
              item?.status === "ride completed" || item?.status === "completed";

            return (
              <View
                key={item._id}
                style={[
                  styles.negotiationCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                {/* Negotiator Identity Row */}
                <View style={styles.negHeaderRow}>
                  <View
                    style={[
                      styles.avatarMini,
                      { backgroundColor: colors.primary + "20" },
                    ]}
                  >
                    <AppText size={14} weight="bold" color={colors.primary}>
                      {getInitials(item?.negotiator?.fullName || "Customer")}
                    </AppText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText size={14} weight="bold" color={colors.text}>
                      {item?.negotiator?.fullName || "Anonymous Participant"}
                    </AppText>
                    <AppText size={11} color={colors.textMuted}>
                      Status: {String(item?.status).toUpperCase()}
                      {isPaid && " • Paid"}
                    </AppText>
                  </View>
                </View>

                {/* Conditional Sub-Service Route Layer Parsing */}
                {hasCustomServiceData && (
                  <View
                    style={[
                      styles.serviceDataBox,
                      { backgroundColor: colors.background },
                    ]}
                  >
                    <AppText
                      size={11}
                      weight="bold"
                      color={colors.primary}
                      style={{ marginBottom: 4 }}
                    >
                      Locations
                    </AppText>
                    <AppText size={12} color={colors.text}>
                      From:{" "}
                      {item.negotiatorServiceData?.route?.pickupAddress ||
                        "N/A"}
                    </AppText>
                    <AppText
                      size={12}
                      color={colors.text}
                      style={{ marginTop: 2 }}
                    >
                      To:{" "}
                      {item.negotiatorServiceData?.route?.deliveryAddress ||
                        "N/A"}
                    </AppText>
                    {item.negotiatorServiceData?.notes && (
                      <AppText
                        size={11}
                        color={colors.textMuted}
                        style={{ fontStyle: "italic", marginTop: 4 }}
                      >
                        Note: "{item.negotiatorServiceData.notes}"
                      </AppText>
                    )}
                  </View>
                )}

                {isServiceProvider && (
                  <View style={{ flex: 1 }}>
                    <NegotiationManager negotiationId={item._id} />
                  </View>
                )}

                {/* INTEGRATED: Escrow release button renders when service is completed, paid, and has NOT yet been confirmed/released */}
                {isPaid && isCompleted && item?.isConfirmed === false && (
                  <EscrowReleaseButton
                    negotiationId={item._id}
                    theme={colors}
                    isServiceProvider={isServiceProvider}
                    onSuccess={() => {
                      console.log(
                        "🔄 Escrow clear finished, updating screen registers..."
                      );
                      refreshRideDetails();
                    }}
                  />
                )}
                {/* Multi-Party Action Vectors */}
                <View style={styles.negActionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.negActionButton,
                      { borderColor: colors.border, borderWidth: 1 },
                    ]}
                    onPress={() => handleNegotiateOrChat(item._id)}
                  >
                    <MessageSquare size={14} color={colors.text} />
                    <AppText size={12} weight="semibold" color={colors.text}>
                      Chat
                    </AppText>
                  </TouchableOpacity>

                  {/* Pay Now / Receipt Button - Now visible to BOTH Customer and Service Provider */}
                  {(isCurrentUserNegotiation || isServiceProvider) &&
                    agreedAmount > 0 && (
                      <TouchableOpacity
                        style={[
                          styles.negActionButton,
                          {
                            backgroundColor: isPaid
                              ? "#10B981"
                              : colors.primary,
                            flex: 1,
                          },
                        ]}
                        onPress={() =>
                          isPaid ? handleShowReceipt(item) : handlePayNow(item)
                        }
                      >
                        {isPaid ? (
                          <>
                            <CheckCircle2 size={14} color="#FFF" />
                            <AppText size={12} weight="semibold" color="#FFF">
                              Receipt
                            </AppText>
                          </>
                        ) : (
                          <>
                            <DollarSign size={14} color="#FFF" />
                            <AppText size={12} weight="semibold" color="#FFF">
                              Pay Now - ₦{Number(agreedAmount).toLocaleString()}
                            </AppText>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                </View>
              </View>
            );
          })
        ) : (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Handshake size={24} color={colors.textMuted} />
            <AppText
              size={13}
              color={colors.textMuted}
              style={{ marginTop: 6, textAlign: "center" }}
            >
              No current custom price negotiation payloads attached to this
              dispatch stream.
            </AppText>
          </View>
        )}

        {/* METRICS DISCLOSURE BLOCK */}
        <AppText
          size={13}
          weight="bold"
          color={colors.textMuted}
          style={styles.sectionTitle}
        >
          Operational Parameters
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

        <View
          style={[
            styles.pricingCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              marginTop: 12,
            },
          ]}
        >
          <View style={styles.priceRowItem}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Wallet size={18} color={colors.textMuted} />
              <AppText size={14} color={colors.textMuted}>
                Base Seat Fare Estimate
              </AppText>
            </View>
            <AppText size={18} weight="bold" color={colors.primary}>
              ₦{Number(displayFare).toLocaleString()}
            </AppText>
          </View>
        </View>
      </ScrollView>

      {/* FOOTER NEGOTIATE BUTTON */}
      {!isServiceProvider && !userHasNegotiation && (
        <View
          style={[
            styles.stickyFooter,
            { backgroundColor: colors.surface, borderTopColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.primaryActionBtn,
              { backgroundColor: isRideDisabled ? "#CBD5E1" : colors.primary },
            ]}
            onPress={() => handleNegotiateOrChat()}
            disabled={isNegotiating || isRideDisabled}
          >
            {isNegotiating ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <AppText size={15} weight="bold" color="#FFF">
                Negotiate New Custom Price
              </AppText>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* BOTTOM MODAL */}
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

            <View style={styles.modalIconContainer}>
              {modalIcon &&
                React.createElement(modalIcon, {
                  size: 48,
                  color: modalIconColor,
                })}
            </View>

            <AppText
              size={20}
              weight="bold"
              color={colors.text}
              style={styles.modalTitle}
            >
              {modalTitle}
            </AppText>

            <AppText
              size={15}
              color={colors.textMuted}
              style={styles.modalMessage}
            >
              {modalMessage}
            </AppText>

            <View style={styles.modalButtons}>
              {modalButtons.map((btn, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.modalButton,
                    btn.style === "cancel" && {
                      backgroundColor: colors.border,
                    },
                    btn.style === "destructive" && {
                      backgroundColor: "#EF4444",
                    },
                  ]}
                  onPress={btn.onPress}
                >
                  <AppText
                    size={16}
                    weight="semibold"
                    color={btn.style === "cancel" ? colors.text : "#FFFFFF"}
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
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
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
  bulkStatusCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  bulkStatusBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  sectionTitle: {
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 20,
    textTransform: "uppercase",
  },
  profileCard: { padding: 16, borderRadius: 20, borderWidth: 1, gap: 14 },
  driverMetaBlock: { flexDirection: "row", alignItems: "center", gap: 12 },
  driverAvatarImage: { width: 48, height: 48, borderRadius: 24 },
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
  negotiationCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    gap: 10,
  },
  negHeaderRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatarMini: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  serviceDataBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E2E8F0",
  },
  negActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  negActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
  },
  emptyCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
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

  // Bottom Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: Platform.OS === "ios" ? 48 : 32,
    alignItems: "center",
  },
  modalCloseButton: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 8,
  },
  modalIconContainer: {
    marginBottom: 16,
    alignItems: "center",
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: 8,
  },
  modalMessage: {
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  modalButtons: {
    width: "100%",
    gap: 12,
  },
  modalButton: {
    height: 54,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#8B5CF6",
  },
});
