import { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Image,
  Platform,
  Alert,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/api/store";
import { getRequestById } from "@/api/slices/parcel.request.slice";
import {
  createNegotiation,
  updateNegotiation,
} from "@/api/slices/negotiation.slice";
import { AppText } from "@/components/AppText";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { getUser } from "@/api/secureStore";
import NegotiationManager from "@/components/NegotiationManager";
import { NegotiationStatusBanner } from "./NegotiationStatusBanner";
import { EscrowReleaseButton } from "@/components/EscrowReleaseButton"; // Adjust path if needed

export default function RequestDetailsScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { id, negotiatorService } = useLocalSearchParams<{
    id: string;
    negotiatorService: any;
  }>();

  // Local State
  const [parcel, setParcel] = useState<any | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [isUpdatingPrice, setIsUpdatingPrice] = useState<
    Record<string, boolean>
  >({});
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<
    Record<string, boolean>
  >({});
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
  const [showStatusOptions, setShowStatusOptions] = useState<
    Record<string, boolean>
  >({});

  const ridedStatuses = [
    "ride pending",
    "ride agreed",
    "ride started",
    "ride ongoing",
    "ride completed",
    "ride cancelled",
  ];

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = await getUser();
      setCurrentUser(user);
    };
    fetchCurrentUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (id) {
        setIsLoading(true);
        dispatch(getRequestById(id))
          .unwrap()
          .then((res: any) => {
            const incomingData = res?.data ? res.data : res;
            setParcel(incomingData);
            setError(null);
          })
          .catch((err: any) => {
            setError(err?.message || "Failed to fetch request");
          })
          .finally(() => setIsLoading(false));
      }
    }, [id, dispatch])
  );

  const isOwner = parcel?.isOwner === true;
  const currentUserIdStr = currentUser?._id || currentUser?.id;
  const parcelProviderIdStr = parcel?.user?._id || parcel?.user?.id;
  const isServiceProvider =
    !!currentUserIdStr &&
    !!parcelProviderIdStr &&
    currentUserIdStr === parcelProviderIdStr;

  const getCurrentUserNegotiation = () => {
    if (!parcel?.negotiations || !currentUser) return null;
    return parcel.negotiations.find((neg: any) => {
      const negotiatorId = neg?.negotiator?._id || neg?.negotiator;
      return negotiatorId === currentUserIdStr;
    });
  };

  const activeNegotiation = getCurrentUserNegotiation();
  const hasExistingNegotiation = !!activeNegotiation;

  const refreshParcel = async () => {
    if (id) {
      setIsLoading(true);
      dispatch(getRequestById(id))
        .unwrap()
        .then((res: any) => {
          const incomingData = res?.data ? res.data : res;
          setParcel(incomingData);
          setError(null);
        })
        .catch((err: any) => {
          setError(err?.message || "Failed to fetch request");
        })
        .finally(() => setIsLoading(false));
    }
  };

  const handlePayPress = (negotiation: any) => {
    if (!negotiation?._id) return;
    router.push({
      pathname: "/(details)/PaymentScreen",
      params: {
        negotiationId: negotiation._id,
        serviceType: parcel?.serviceType || "deliver_a_parcel",
        amount: String(negotiation.agreedAmount),
        email: currentUser?.email,
      },
    });
  };

  const handleViewChat = (negotiationId: string) => {
    router.push({
      pathname: "/(details)/ChatScreen",
      params: { id: negotiationId, parcelId: id },
    });
  };

  const handleViewReceipt = (neg: any) => {
    if (!neg?._id) return;
    router.push({
      pathname: "/(details)/ReceiptScreen",
      params: {
        id: id,
        negotiationId: neg._id,
        amount: String(neg.agreedAmount || ""),
        status: neg.status || "",
        pickupAddress:
          neg.negotiatorServiceData?.route?.pickupAddress ||
          parcel?.pickupAddress ||
          "",
        destinationCity:
          neg.negotiatorServiceData?.route?.deliveryAddress ||
          parcel?.destinationCity ||
          "",
        serviceType: parcel?.serviceType || "deliver_a_parcel",
        payerName: neg.negotiator?.fullName || "",
        payerEmail: neg.negotiator?.email || "",
        providerName: neg.serviceProvider?.fullName || "",
        providerEmail: neg.serviceProvider?.email || "",
      },
    });
  };

  const handleUpdateStatus = async (
    negotiationId: string,
    nextStatus: string
  ) => {
    setIsUpdatingStatus((prev) => ({ ...prev, [negotiationId]: true }));
    try {
      await dispatch(
        updateNegotiation({
          id: negotiationId,
          data: { status: nextStatus },
        })
      ).unwrap();

      Alert.alert("Status Updated", `Ride transitioned to: ${nextStatus}`);
      const updatedRes = await dispatch(getRequestById(id)).unwrap();
      const nextData = updatedRes?.data ? updatedRes.data : updatedRes;
      setParcel(nextData);
      setShowStatusOptions((prev) => ({ ...prev, [negotiationId]: false }));
    } catch (err: any) {
      Alert.alert("Error", err || "Failed to update tracking state.");
    } finally {
      setIsUpdatingStatus((prev) => ({ ...prev, [negotiationId]: false }));
    }
  };

  const handleSetPrice = async (negotiationId: string) => {
    const priceStr = priceInputs[negotiationId];
    const price = parseFloat(priceStr);

    if (!price || isNaN(price) || price <= 0) {
      Alert.alert(
        "Invalid Price",
        "Please enter a valid amount greater than 0"
      );
      return;
    }

    setIsUpdatingPrice((prev) => ({ ...prev, [negotiationId]: true }));
    try {
      await dispatch(
        updateNegotiation({
          id: negotiationId,
          data: { agreedAmount: price, status: "ride agreed" },
        })
      ).unwrap();

      Alert.alert(
        "Price Set",
        `Starting price ₦${price.toLocaleString()} has been updated successfully.`
      );
      const updatedRes = await dispatch(getRequestById(id)).unwrap();
      const nextData = updatedRes?.data ? updatedRes.data : updatedRes;
      setParcel(nextData);
      setPriceInputs((prev) => ({ ...prev, [negotiationId]: "" }));
    } catch (err: any) {
      Alert.alert(
        "Error",
        err || "Failed to update target negotiation pricing."
      );
    } finally {
      setIsUpdatingPrice((prev) => ({ ...prev, [negotiationId]: false }));
    }
  };

  const handleNegotiate = async () => {
    if (!parcel) return;
    if (hasExistingNegotiation && activeNegotiation?._id) {
      handleViewChat(activeNegotiation._id);
      return;
    }
    const payload = {
      serviceProvider: parcel.user?._id,
      service: id,
      serviceType: "deliver_a_parcel",
      negotiatorService: negotiatorService,
    };
    setIsNegotiating(true);
    try {
      const result = await dispatch(createNegotiation(payload)).unwrap();
      if (result?._id) {
        handleViewChat(result._id);
      }
    } catch (err: any) {
      Alert.alert("Error", "Failed to initialize new contract interaction.");
    } finally {
      setIsNegotiating(false);
    }
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.centeredContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (error || !parcel) {
    return (
      <View
        style={[
          styles.centeredContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <AppText size={15} color={theme.text} style={styles.errorText}>
          {error || "Record missing"}
        </AppText>
      </View>
    );
  }

  const clientName = parcel.user?.fullName || "Anonymous Operator";

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <SafeAreaView
        style={[
          styles.headerArea,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconCircle}
          >
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <AppText size={16} weight="bold" color={theme.text}>
            Request Details
          </AppText>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View
          style={[
            styles.contentCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              {parcel.user?.profileImage ? (
                <Image
                  source={{ uri: parcel.user.profileImage }}
                  style={styles.avatarImg}
                />
              ) : (
                <View
                  style={[
                    styles.initialsAvatar,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <AppText color="#FFF" weight="bold" size={16}>
                    {clientName.slice(0, 2).toUpperCase()}
                  </AppText>
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <AppText size={16} weight="bold" color={theme.text}>
                {clientName}
              </AppText>
              <AppText size={12} color={theme.textMuted}>
                {parcel.user?.email}
              </AppText>
              {parcel.user?.phone && (
                <AppText size={12} color={theme.textMuted}>
                  {parcel.user.phone}
                </AppText>
              )}
            </View>
          </View>
        </View>

        {/* Logistics Address Details */}
        <View style={styles.sectionTitleRow}>
          <AppText size={11} weight="bold" color={theme.textMuted}>
            LOGISTICS DETAILS
          </AppText>
        </View>
        <View
          style={[
            styles.contentCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.timelineRow}>
            <View style={styles.timelineIndicators}>
              <Ionicons
                name="radio-button-on"
                size={18}
                color={theme.primary}
              />
              <View
                style={[styles.dashedLine, { backgroundColor: theme.border }]}
              />
              <Ionicons name="location" size={18} color="#EF4444" />
            </View>
            <View style={styles.timelineContent}>
              <View>
                <AppText size={11} color={theme.textMuted}>
                  PICKUP ADDRESS
                </AppText>
                <AppText size={15} weight="bold" color={theme.text}>
                  {parcel.pickupAddress}
                </AppText>
              </View>
              <View style={{ marginTop: 24 }}>
                <AppText size={11} color={theme.textMuted}>
                  DESTINATION CITY
                </AppText>
                <AppText size={15} weight="bold" color={theme.text}>
                  {parcel.destinationCity}
                </AppText>
              </View>
            </View>
          </View>
        </View>

        {/* Budget Range Context */}
        <View style={styles.sectionTitleRow}>
          <AppText size={11} weight="bold" color={theme.textMuted}>
            PRICING & BUDGET
          </AppText>
        </View>
        <View
          style={[
            styles.contentCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.metaParamRow}>
            <MaterialCommunityIcons
              name="cash-multiple"
              size={22}
              color={theme.textMuted}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <AppText size={12} color={theme.textMuted}>
                Budget Range
              </AppText>
              <AppText size={18} weight="bold" color={theme.primary}>
                ₦{parcel.priceRange?.min?.toLocaleString()} - ₦
                {parcel.priceRange?.max?.toLocaleString()}
              </AppText>
            </View>
          </View>
        </View>

        {/* NEGOTIATIONS COMPLETE MAP OUT */}
        {parcel.negotiations && parcel.negotiations.length > 0 && (
          <>
            <AppText
              size={11}
              weight="bold"
              color={theme.textMuted}
              style={styles.sectionTitleLabel}
            >
              NEGOTIATIONS ({parcel.negotiations.length})
            </AppText>
            {parcel.negotiations.map((neg: any, index: number) => {
              const agreed = neg.agreedAmount;
              const isPaid =
                neg.isPaid === true || neg.status?.toLowerCase() === "paid";
              const isMyNegotiation =
                (neg.negotiator?._id || neg.negotiator) === currentUserIdStr;
              const serviceData = neg.negotiatorServiceData;
              const processingPrice = isUpdatingPrice[neg._id] === true;
              const processingStatus = isUpdatingStatus[neg._id] === true;
              const statusOpen = showStatusOptions[neg._id] === true;

              return (
                <View
                  key={neg._id || index}
                  style={[
                    styles.contentCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <NegotiationStatusBanner
                    status={neg.status}
                    isPaid={neg.isPaid}
                    isServiceProvider={isServiceProvider}
                    theme={theme}
                    showDropdown={showStatusOptions[neg._id]}
                    isUpdatingStatus={isUpdatingStatus[neg._id]}
                    onUpdatePress={() =>
                      setShowStatusOptions((prev) => ({
                        ...prev,
                        [neg._id]: !prev[neg._id],
                      }))
                    }
                    onDropdownOptionSelect={(nextStatus) =>
                      handleUpdateStatus(neg._id, nextStatus)
                    }
                  />
                  {isPaid && neg?.isConfirmed === false && (
                    <EscrowReleaseButton
                      negotiationId={neg._id}
                      theme={theme}
                      isServiceProvider={isServiceProvider}
                      onSuccess={refreshParcel}
                    />
                  )}

                  {/* Paid & Receipt Banners */}
                  {isPaid && (
                    <View style={styles.receiptBannerContainer}>
                      <View style={styles.receiptBannerLeft}>
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color="#10B981"
                        />
                        <AppText size={13} weight="bold" color="#10B981">
                          Payment Confirmed
                        </AppText>
                      </View>
                      <TouchableOpacity
                        style={styles.receiptActionBtn}
                        onPress={() => handleViewReceipt(neg)}
                      >
                        <Ionicons
                          name="receipt-outline"
                          size={14}
                          color="#10B981"
                        />
                        <AppText size={12} weight="bold" color="#10B981">
                          View Receipt
                        </AppText>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Operational Ride Track Control Banner */}
                  {isPaid && isServiceProvider && (
                    <View
                      style={[
                        styles.rideStatusBanner,
                        {
                          backgroundColor: theme.background,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <View style={styles.statusBannerHeader}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <MaterialCommunityIcons
                            name="car-connected"
                            size={18}
                            color={theme.primary}
                          />
                          <View>
                            <AppText size={11} color={theme.textMuted}>
                              TRACKING STATUS
                            </AppText>
                            <AppText
                              size={13}
                              weight="bold"
                              color={theme.text}
                              style={{ textTransform: "capitalize" }}
                            >
                              {neg.status || "ride pending"}
                            </AppText>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.updateTriggerBtn,
                            { backgroundColor: theme.primary },
                          ]}
                          onPress={() =>
                            setShowStatusOptions((prev) => ({
                              ...prev,
                              [neg._id]: !prev[neg._id],
                            }))
                          }
                        >
                          <AppText size={12} weight="bold" color="#FFF">
                            Update
                          </AppText>
                          <Ionicons
                            name={statusOpen ? "chevron-up" : "chevron-down"}
                            size={14}
                            color="#FFF"
                          />
                        </TouchableOpacity>
                      </View>

                      {statusOpen && (
                        <View
                          style={[
                            styles.statusDropdown,
                            { borderTopColor: theme.border },
                          ]}
                        >
                          {processingStatus ? (
                            <ActivityIndicator
                              size="small"
                              color={theme.primary}
                              style={{ marginVertical: 10 }}
                            />
                          ) : (
                            ridedStatuses.map((st) => (
                              <TouchableOpacity
                                key={st}
                                style={[
                                  styles.statusOptionRow,
                                  neg.status === st && {
                                    backgroundColor: theme.surface,
                                  },
                                ]}
                                onPress={() => handleUpdateStatus(neg._id, st)}
                              >
                                <AppText
                                  size={13}
                                  color={
                                    neg.status === st
                                      ? theme.primary
                                      : theme.text
                                  }
                                  weight={
                                    neg.status === st ? "bold" : "regular"
                                  }
                                >
                                  {st}
                                </AppText>
                                {neg.status === st && (
                                  <Ionicons
                                    name="checkmark"
                                    size={16}
                                    color={theme.primary}
                                  />
                                )}
                              </TouchableOpacity>
                            ))
                          )}
                        </View>
                      )}
                    </View>
                  )}

                  {/* Negotiator Profile Info Header */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 4,
                    }}
                  >
                    <View>
                      <AppText size={15} weight="bold" color={theme.text}>
                        {neg.negotiator?.fullName || "Negotiator"}
                      </AppText>
                      {neg.negotiator?.email && (
                        <AppText size={12} color={theme.textMuted}>
                          {neg.negotiator.email}
                        </AppText>
                      )}
                    </View>
                    {agreed && (
                      <AppText size={16} weight="bold" color={theme.primary}>
                        ₦{Number(agreed).toLocaleString()}
                      </AppText>
                    )}
                  </View>

                  {/* Dynamic negotiatorServiceData Mapping Structure */}
                  {serviceData && (
                    <View
                      style={{
                        marginTop: 14,
                        padding: 12,
                        backgroundColor: theme.background,
                        borderRadius: 12,
                        gap: 12,
                      }}
                    >
                      <AppText size={13} weight="bold" color={theme.primary}>
                        Parcel Info & Bookings
                      </AppText>

                      {/* Item details */}
                      {serviceData.item && (
                        <View style={styles.subDataBlock}>
                          <View style={styles.iconHeadingRow}>
                            <MaterialCommunityIcons
                              name="package-variant-closed"
                              size={16}
                              color={theme.text}
                            />
                            <AppText size={12} weight="bold" color={theme.text}>
                              Item Information
                            </AppText>
                          </View>
                          <AppText
                            size={13}
                            color={theme.text}
                            style={{ paddingLeft: 4 }}
                          >
                            Item Name:{" "}
                            <AppText weight="bold" color={theme.text}>
                              {serviceData.item.name || "N/A"}
                            </AppText>
                          </AppText>
                        </View>
                      )}

                      {/* Route Specs / Locations */}
                      {serviceData.route && (
                        <View style={styles.subDataBlock}>
                          <View style={styles.iconHeadingRow}>
                            <Ionicons
                              name="location-outline"
                              size={16}
                              color={theme.text}
                            />
                            <AppText size={12} weight="bold" color={theme.text}>
                              Locations
                            </AppText>
                          </View>
                          <AppText
                            size={13}
                            color={theme.text}
                            style={{ paddingLeft: 4 }}
                          >
                            Pickup:{" "}
                            <AppText weight="bold" color={theme.text}>
                              {serviceData.route.pickupAddress || "N/A"}
                            </AppText>
                          </AppText>
                          <AppText
                            size={13}
                            color={theme.text}
                            style={{ paddingLeft: 4 }}
                          >
                            Delivery:{" "}
                            <AppText weight="bold" color={theme.text}>
                              {serviceData.route.deliveryAddress || "N/A"}
                            </AppText>
                          </AppText>
                        </View>
                      )}

                      {/* Contact Parties (Sender & Receiver) */}
                      {serviceData.parties && (
                        <View style={styles.subDataBlock}>
                          <View style={styles.iconHeadingRow}>
                            <Ionicons
                              name="people-outline"
                              size={16}
                              color={theme.text}
                            />
                            <AppText size={12} weight="bold" color={theme.text}>
                              Parties Involved
                            </AppText>
                          </View>
                          {serviceData.parties.sender && (
                            <View style={{ paddingLeft: 4, marginTop: 2 }}>
                              <AppText size={13} color={theme.text}>
                                Sender:{" "}
                                <AppText weight="bold" color={theme.text}>
                                  {serviceData.parties.sender.fullName}
                                </AppText>{" "}
                                ({serviceData.parties.sender.contact})
                              </AppText>
                            </View>
                          )}
                          {serviceData.parties.recipient && (
                            <View style={{ paddingLeft: 4, marginTop: 2 }}>
                              <AppText size={13} color={theme.text}>
                                Receiver:{" "}
                                <AppText weight="bold" color={theme.text}>
                                  {serviceData.parties.recipient.fullName}
                                </AppText>{" "}
                                ({serviceData.parties.recipient.contact})
                              </AppText>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  )}

                  {/* Pricing Actions Form Interface */}
                  {isServiceProvider && !isPaid && (
                    <View style={{ marginTop: 12 }}>
                      <AppText size={12} color={theme.textMuted}>
                        Set Starting Price
                      </AppText>
                      <View
                        style={{ flexDirection: "row", gap: 8, marginTop: 6 }}
                      >
                        <TextInput
                          style={{
                            flex: 1,
                            borderWidth: 1,
                            borderColor: theme.border,
                            borderRadius: 10,
                            padding: 10,
                            color: theme.text,
                            backgroundColor: theme.background,
                          }}
                          placeholder="Enter amount (₦)"
                          keyboardType="numeric"
                          value={priceInputs[neg._id] || ""}
                          editable={!processingPrice}
                          onChangeText={(text) =>
                            setPriceInputs((prev) => ({
                              ...prev,
                              [neg._id]: text,
                            }))
                          }
                        />
                        <TouchableOpacity
                          style={{
                            backgroundColor: theme.primary,
                            paddingHorizontal: 20,
                            justifyContent: "center",
                            borderRadius: 10,
                          }}
                          onPress={() => handleSetPrice(neg._id)}
                          disabled={processingPrice}
                        >
                          {processingPrice ? (
                            <ActivityIndicator color="#FFF" size="small" />
                          ) : (
                            <AppText size={14} weight="bold" color="#FFF">
                              Set
                            </AppText>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {isServiceProvider && (
                    <TouchableOpacity
                      style={[
                        styles.primaryActionBtn,
                        { backgroundColor: theme.primary, marginTop: 12 },
                      ]}
                      onPress={() => handleViewChat(neg._id)}
                    >
                      <AppText size={15} weight="bold" color="#FFF">
                        Open Chat
                      </AppText>
                    </TouchableOpacity>
                  )}

                  {agreed &&
                    !isPaid &&
                    !isServiceProvider &&
                    isMyNegotiation && (
                      <TouchableOpacity
                        style={[
                          styles.primaryActionBtn,
                          { backgroundColor: "#10B981", marginTop: 8 },
                        ]}
                        onPress={() => handlePayPress(neg)}
                      >
                        <AppText size={15} weight="bold" color="#FFF">
                          Pay Now - ₦{Number(agreed).toLocaleString()}
                        </AppText>
                      </TouchableOpacity>
                    )}
                </View>
              );
            })}
          </>
        )}

        {isServiceProvider && (
          <NegotiationManager negotiationId={activeNegotiation?._id} />
        )}
      </ScrollView>

      {/* Bottom Floating Menu Anchor */}
      {!isOwner && (
        <View
          style={[
            styles.stickyFooter,
            { backgroundColor: theme.surface, borderTopColor: theme.border },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.primaryActionBtn,
              { backgroundColor: theme.primary },
              isNegotiating && { opacity: 0.7 },
            ]}
            onPress={handleNegotiate}
            disabled={isNegotiating}
          >
            {isNegotiating ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : hasExistingNegotiation ? (
              <AppText size={15} weight="bold" color="#FFF">
                Go to My Chat
              </AppText>
            ) : (
              <AppText size={15} weight="bold" color="#FFF">
                Negotiate Now
              </AppText>
            )}
          </TouchableOpacity>
        </View>
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
  errorText: { marginVertical: 12, textAlign: "center" },
  headerArea: { width: "100%", borderBottomWidth: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: { padding: 20 },
  contentCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  profileSection: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%", resizeMode: "cover" },
  initialsAvatar: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitleLabel: { letterSpacing: 1, marginBottom: 8 },
  timelineRow: { flexDirection: "row", gap: 14 },
  timelineIndicators: { alignItems: "center", paddingVertical: 4 },
  dashedLine: { width: 2, flex: 1, marginVertical: 4 },
  timelineContent: { flex: 1 },
  metaParamRow: { flexDirection: "row", alignItems: "center" },
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
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  subDataBlock: { gap: 1, marginTop: 4 },
  iconHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },

  // Paid Receipt Banner Component Styles
  receiptBannerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    marginBottom: 12,
  },
  receiptBannerLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  receiptActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#10B981",
  },

  // Track Status Controller Dropdown Styles
  rideStatusBanner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    marginTop: 4,
  },
  statusBannerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  updateTriggerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  statusDropdown: { marginTop: 10, paddingTop: 6, borderTopWidth: 1 },
  statusOptionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 1,
  },
});
