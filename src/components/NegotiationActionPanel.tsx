import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { AppText } from "@/components/AppText";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/api/store";
import {
  getNegotiationById,
  updateNegotiation,
} from "@/api/slices/negotiation.slice";
import { useRouter } from "expo-router";

import NegotiationManager from "@/components/NegotiationManager";
import { EscrowReleaseButton } from "@/components/EscrowReleaseButton";
import { NegotiationStatusBanner } from "@/app/(details)/NegotiationStatusBanner";

interface Props {
  negotiationId: string;
  parcelId?: string;
  isServiceProvider: boolean;
  currentUserId: string;
  accordion?: boolean;
  handleViewChat?: any;
}

const INK = "#111318";

export default function NegotiationActionPanel({
  negotiationId,
  parcelId,
  isServiceProvider,
  currentUserId,
  accordion = false,
  handleViewChat,
}: Props) {
  const { theme, isDark } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const [negotiation, setNegotiation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [priceInput, setPriceInput] = useState("");
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showStatusOptions, setShowStatusOptions] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const agreedAmount = negotiation?.agreedAmount;
  const isPaid =
    negotiation?.isPaid === true ||
    negotiation?.status?.toLowerCase() === "paid";
  const isMyNegotiation =
    (negotiation?.negotiator?._id || negotiation?.negotiator) === currentUserId;

  // Fetch Negotiation
  useEffect(() => {
    const fetchNegotiation = async () => {
      setLoading(true);
      try {
        const res = await dispatch(getNegotiationById(negotiationId)).unwrap();
        const data = res?.data ? res.data : res;
        setNegotiation(data);
      } catch (err: any) {
        console.error("Error fetching negotiation:", err);
        Alert.alert("Error", "Could not load negotiation details");
      } finally {
        setLoading(false);
      }
    };
    if (negotiationId) fetchNegotiation();
  }, [negotiationId, dispatch]);

  // Auto-refresh every 90 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshNegotiation();
    }, 90000);
    return () => clearInterval(interval);
  }, [negotiationId]);

  const refreshNegotiation = async () => {
    try {
      const res = await dispatch(getNegotiationById(negotiationId)).unwrap();
      const data = res?.data ? res.data : res;
      setNegotiation(data);
    } catch (err) {
      console.error("Refresh failed:", err);
    }
  };

  const handleCall = (phone: string) => {
    if (!phone) return Alert.alert("No Phone Number");
    Linking.openURL(`tel:${phone}`).catch(() =>
      Alert.alert("Cannot make call")
    );
  };

  const handleCopy = (text: string, label: string) => {
    Alert.alert("Copied!", `${label} copied to clipboard`);
  };

  const handleUpdateStatus = async (nextStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      await dispatch(
        updateNegotiation({ id: negotiationId, data: { status: nextStatus } })
      ).unwrap();
      Alert.alert("Success", `Status updated to ${nextStatus}`);

      if (nextStatus === "ride completed") {
        Alert.alert("Ride Completed");
      }

      await refreshNegotiation();
      setShowStatusOptions(false);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handlePayPress = () => {
    const amount = Number(agreedAmount);
    if (!negotiationId || !amount || amount <= 0) {
      return Alert.alert("Error", "No valid payment parameters initialized");
    }

    router.push({
      pathname: "/(details)/PaymentScreen",
      params: {
        negotiationId,
        serviceType: "deliver_a_parcel",
        amount: amount.toString(),
        email: negotiation?.negotiator?.email || negotiation?.user?.email || "",
        parcelId: parcelId || "",
        userId: currentUserId,
        payerId: currentUserId,
        receiverId:
          negotiation?.negotiator?._id || negotiation?.negotiator || "",
      },
    });
  };

  const handleViewReceipt = () => {
    setModalVisible(false);

    // The "negotiator" is whoever gets paid out (the service provider on this
    // negotiation), while "user" is the party who requested/pays for it.
    const payer = negotiation?.user;
    const provider = negotiation?.negotiator;
    const route = negotiation?.negotiatorServiceData?.route;

    router.push({
      pathname: "/(details)/ReceiptScreen",
      params: {
        id: String(parcelId || negotiation?._id || ""),
        negotiationId: String(negotiationId || ""),
        amount: String(agreedAmount ?? ""),
        status: String(negotiation?.status || ""),
        pickupAddress: String(route?.pickupAddress || ""),
        destinationCity: String(route?.deliveryAddress || ""),
        notes: String(negotiation?.negotiatorServiceData?.notes || ""),
        serviceType: String(
          negotiation?.serviceType ||
            negotiation?.negotiatorServiceData?.serviceType ||
            "deliver_a_parcel"
        ),
        payerName: String(payer?.fullName || ""),
        payerEmail: String(payer?.email || ""),
        providerName: String(provider?.fullName || ""),
        providerEmail: String(provider?.email || ""),
      },
    });
  };

  // const handleViewChat = () => {
  //   router.push({
  //     pathname: "/(details)/ChatScreen",
  //     params: { id: negotiationId },
  //   });
  // };

  // ==================== ACCORDION PANEL MODE ====================
  if (accordion && !modalVisible) {
    return (
      <View style={styles.accordionContainer}>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={[
            styles.accordionHeaderCard,
            {
              backgroundColor: theme.surface,
              borderColor: isDark ? theme.border : "#EAEAEA",
            },
          ]}
          activeOpacity={0.8}
        >
          <View style={styles.accordionMetaColumn}>
            <AppText size={14} weight="bold" color={theme.text}>
              Negotiation Details
            </AppText>
            {agreedAmount ? (
              <AppText
                size={13}
                weight="bold"
                color={theme.textMuted}
                style={{ marginTop: 2 }}
              >
                Agreed price:{" "}
                <AppText weight="bold" color={theme.text}>
                  ₦{Number(agreedAmount).toLocaleString()}
                </AppText>
              </AppText>
            ) : (
              <AppText size={11.5} color={theme.textMuted}>
                Price not yet agreed
              </AppText>
            )}
          </View>

          <View style={styles.accordionActionsRow}>
            {agreedAmount &&
              !isPaid &&
              isMyNegotiation &&
              !isServiceProvider && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handlePayPress();
                  }}
                  style={styles.microInlinePayButton}
                  activeOpacity={0.7}
                >
                  <AppText weight="bold" color="#FFF" size={12}>
                    Pay Now
                  </AppText>
                </TouchableOpacity>
              )}
            <View
              style={[
                styles.arrowIconContainer,
                { backgroundColor: isDark ? theme.background : "#F0F2F5" },
              ]}
            >
              <Ionicons name="chevron-down" size={16} color={theme.text} />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.spinnerCenterFrame}>
        <ActivityIndicator size="small" color={INK} />
      </View>
    );
  }

  if (!negotiation) {
    return (
      <View style={styles.spinnerCenterFrame}>
        <AppText color={theme.textMuted} weight="medium">
          Couldn't load this negotiation
        </AppText>
      </View>
    );
  }

  // Plain View, not a ScrollView — the surrounding ScrollView (in both the
  // full-page and modal render paths below) owns scrolling. Nesting two
  // vertical ScrollViews here was fighting for the same gesture and made
  // scrolling behave inconsistently.
  const FullPanel = (
    <View style={styles.panelContentColumn}>
      {/* Header Profile Title Row */}
      <View style={styles.profileSummaryRow}>
        <View style={styles.profileTextMeta}>
          <AppText
            size={12}
            weight="bold"
            color={theme.textMuted}
            style={styles.overlineBadge}
          >
            NEGOTIATOR
          </AppText>
          <AppText size={18} weight="bold" color={theme.text}>
            {negotiation.negotiator?.fullName || "Awaiting negotiator"}
          </AppText>
        </View>
        {agreedAmount && (
          <View
            style={[
              styles.priceTagBadge,
              { backgroundColor: isDark ? theme.surface : "#F0F2F5" },
            ]}
          >
            <AppText size={16} weight="bold" color={theme.text}>
              ₦{Number(agreedAmount).toLocaleString()}
            </AppText>
          </View>
        )}
      </View>

      {/* Shipment Details */}
      {negotiation.negotiatorServiceData && (
        <View
          style={[
            styles.metaDataCard,
            {
              backgroundColor: theme.surface,
              borderColor: isDark ? theme.border : "#EDF2F7",
            },
          ]}
        >
          <View style={styles.metaDataHeaderRow}>
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={15}
              color={theme.textMuted}
            />
            <AppText size={12} weight="bold" color={theme.textMuted}>
              SHIPMENT DETAILS
            </AppText>
          </View>

          {/* Item Meta */}
          {negotiation.negotiatorServiceData.item && (
            <View style={styles.metaInfoRowNode}>
              <View style={styles.metaNodeIconBox}>
                <MaterialCommunityIcons
                  name="package-variant-closed"
                  size={14}
                  color={theme.text}
                />
              </View>
              <View style={styles.metaNodeTextFrame}>
                <AppText size={11} color={theme.textMuted}>
                  Item
                </AppText>
                <AppText size={13} weight="bold" color={theme.text}>
                  {negotiation.negotiatorServiceData.item.name || "N/A"}
                </AppText>
              </View>
            </View>
          )}

          {/* Location Routing Node */}
          {negotiation.negotiatorServiceData.route && (
            <View style={styles.routingFlowGrid}>
              <View style={styles.metaInfoRowNode}>
                <View style={styles.metaNodeIconBox}>
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color={theme.text}
                  />
                </View>
                <View style={styles.metaNodeTextFrame}>
                  <AppText size={11} color={theme.textMuted}>
                    Pickup Address
                  </AppText>
                  <AppText size={13} weight="medium" color={theme.text}>
                    {negotiation.negotiatorServiceData.route.pickupAddress ||
                      "N/A"}
                  </AppText>
                </View>
              </View>

              <View
                style={[
                  styles.routingLineDivider,
                  { backgroundColor: isDark ? theme.border : "#E2E8F0" },
                ]}
              />

              <View style={styles.metaInfoRowNode}>
                <View style={styles.metaNodeIconBox}>
                  <Ionicons name="flag-outline" size={14} color={theme.text} />
                </View>
                <View style={styles.metaNodeTextFrame}>
                  <AppText size={11} color={theme.textMuted}>
                    Delivery Address
                  </AppText>
                  <AppText size={13} weight="medium" color={theme.text}>
                    {negotiation.negotiatorServiceData.route.deliveryAddress ||
                      "N/A"}
                  </AppText>
                </View>
              </View>
            </View>
          )}

          {/* Contract Parties Panel */}
          {negotiation.negotiatorServiceData.parties && isPaid && (
            <View
              style={[
                styles.partiesInnerContainer,
                { borderTopColor: isDark ? theme.border : "#EDF2F7" },
              ]}
            >
              {negotiation.negotiatorServiceData.parties.sender && (
                <AppText
                  size={12}
                  color={theme.text}
                  style={styles.partyLabelRow}
                >
                  • Sender:{" "}
                  <AppText weight="bold">
                    {negotiation.negotiatorServiceData.parties.sender.fullName}
                  </AppText>{" "}
                  ({negotiation.negotiatorServiceData.parties.sender.contact})
                </AppText>
              )}
              {negotiation.negotiatorServiceData.parties.recipient && (
                <AppText
                  size={12}
                  color={theme.text}
                  style={styles.partyLabelRow}
                >
                  • Recipient:{" "}
                  <AppText weight="bold">
                    {
                      negotiation.negotiatorServiceData.parties.recipient
                        .fullName
                    }
                  </AppText>{" "}
                  ({negotiation.negotiatorServiceData.parties.recipient.contact}
                  )
                </AppText>
              )}
            </View>
          )}
        </View>
      )}

      {/* Pickup Verification Code */}
      {negotiation.pickupCode && (
        <View
          style={[
            styles.securityCodeBox,
            { backgroundColor: theme.surface, borderColor: INK },
          ]}
        >
          <AppText
            size={11}
            weight="bold"
            color={theme.textMuted}
            style={{ letterSpacing: 0.5 }}
          >
            PICKUP VERIFICATION CODE
          </AppText>
          <TouchableOpacity
            onPress={() => handleCopy(negotiation.pickupCode, "Pickup code")}
            style={styles.securityCodeInteractiveRow}
            activeOpacity={0.7}
          >
            <AppText
              size={22}
              weight="bold"
              color={theme.text}
              style={styles.securityCodeMonospace}
            >
              {negotiation.pickupCode}
            </AppText>
            <Ionicons name="copy-outline" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {/* Internal Component Controls */}
      <NegotiationStatusBanner
        status={negotiation.status}
        isPaid={isPaid}
        isServiceProvider={isServiceProvider}
        theme={theme}
        showDropdown={showStatusOptions}
        isUpdatingStatus={isUpdatingStatus}
        onUpdatePress={() => setShowStatusOptions(!showStatusOptions)}
        onDropdownOptionSelect={handleUpdateStatus}
        //  isCompleted={isCompleted}
      />

      {isPaid &&
        negotiation?.isConfirmed === false &&
        negotiation?.status === "ride completed" &&
        !isServiceProvider && (
          <EscrowReleaseButton
            negotiationId={negotiationId}
            theme={theme}
            isServiceProvider={isServiceProvider}
            onSuccess={refreshNegotiation}
          />
        )}

      {/* Communication Interface Channels */}
      {negotiation.negotiator?.phone && isPaid && (
        <TouchableOpacity
          onPress={() => handleCall(negotiation.negotiator.phone)}
          style={[
            styles.communicationCardRow,
            {
              backgroundColor: theme.surface,
              borderColor: isDark ? theme.border : "#E2E8F0",
            },
          ]}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.phoneIconBox,
              { backgroundColor: isDark ? theme.background : "#F0F2F5" },
            ]}
          >
            <Ionicons name="call" size={16} color={theme.text} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText size={11} color={theme.textMuted}>
              Phone Number
            </AppText>
            <AppText size={14} weight="bold" color={theme.text}>
              {negotiation.negotiator.phone}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
        </TouchableOpacity>
      )}

      {isServiceProvider && (
        <NegotiationManager negotiationId={negotiationId} />
      )}

      {/* Button Interface Systems Block */}
      <View style={styles.actionsButtonStack}>
        {agreedAmount && !isPaid && !isServiceProvider && isMyNegotiation && (
          <TouchableOpacity
            style={[styles.actionButtonBase, { backgroundColor: "#10B981" }]}
            onPress={handlePayPress}
            activeOpacity={0.85}
          >
            <AppText weight="bold" color="#FFF" size={15}>
              Pay Now • ₦{Number(agreedAmount).toLocaleString()}
            </AppText>
          </TouchableOpacity>
        )}

        {isPaid && (
          <TouchableOpacity
            style={[styles.actionButtonBase, { backgroundColor: "#10B981" }]}
            onPress={handleViewReceipt}
            activeOpacity={0.85}
          >
            <AppText weight="bold" color="#FFF" size={15}>
              View Receipt
            </AppText>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.actionButtonBase,
            { backgroundColor: INK, marginBottom: 64 },
          ]}
          onPress={handleViewChat}
          activeOpacity={0.85}
        >
          <AppText weight="bold" color="#FFF" size={15}>
            Back to Chat
          </AppText>
        </TouchableOpacity>

        {/* <TouchableOpacity
          style={[styles.actionButtonBase, { backgroundColor: INK }]}
          onPress={handleViewChat}
          activeOpacity={0.85}
        >
          <AppText weight="bold" color="#FFF" size={15}>
            Back to Chat
          </AppText>
        </TouchableOpacity> */}
      </View>
    </View>
  );

  return (
    <>
      {!accordion ? (
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {FullPanel}
        </ScrollView>
      ) : (
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <View
              style={[
                styles.modalContent,
                {
                  backgroundColor: theme.background,
                },
              ]}
              onStartShouldSetResponder={() => true}
            >
              <View
                style={[
                  styles.notchBarHandle,
                  { backgroundColor: isDark ? theme.border : "#E0E0E0" },
                ]}
              />

              <View
                style={[
                  styles.modalHeader,
                  { borderBottomColor: isDark ? theme.border : "#EDF2F7" },
                ]}
              >
                <AppText size={17} weight="bold" color={theme.text}>
                  Negotiation Details
                </AppText>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  hitSlop={12}
                  style={[
                    styles.modalCloseCircle,
                    { backgroundColor: isDark ? theme.surface : "#F0F2F5" },
                  ]}
                >
                  <Ionicons name="close" size={18} color={theme.text} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                  paddingBottom: Platform.OS === "ios" ? 44 : 24,
                }}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                {FullPanel}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  accordionContainer: { paddingHorizontal: 16, marginVertical: 4 },
  accordionHeaderCard: {
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  accordionMetaColumn: { flex: 1, paddingRight: 12 },
  accordionActionsRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  microInlinePayButton: {
    backgroundColor: "#10B981",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
  },
  arrowIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  spinnerCenterFrame: {
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  panelContentColumn: { padding: 16, gap: 16 },

  profileSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 4,
  },
  profileTextMeta: { flex: 1, paddingRight: 12 },
  overlineBadge: { letterSpacing: 0.5, marginBottom: 2 },
  priceTagBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },

  metaDataCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  metaDataHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  metaInfoRowNode: { flexDirection: "row", alignItems: "center", gap: 12 },
  metaNodeIconBox: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "rgba(17, 19, 24, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  metaNodeTextFrame: { flex: 1 },
  routingFlowGrid: { gap: 10 },
  routingLineDivider: { height: 1, marginLeft: 42, width: "75%" },
  partiesInnerContainer: { borderTopWidth: 1, paddingTop: 12, gap: 4 },
  partyLabelRow: { lineHeight: 18 },

  securityCodeBox: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
  },
  securityCodeInteractiveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 6,
  },
  securityCodeMonospace: { letterSpacing: 2 },

  communicationCardRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  phoneIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },

  actionsButtonStack: { gap: 10, marginTop: 8 },
  actionButtonBase: {
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(17, 19, 24, 0.80)",
    justifyContent: "flex-end",
  },
  modalContent: {
    height: "82%",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderBottomWidth: 0,
  },
  notchBarHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalCloseCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
});
