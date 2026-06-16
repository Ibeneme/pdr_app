// components/NegotiationActionPanel.tsx
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
}

const ridedStatuses = [
  "ride pending",
  "ride agreed",
  "ride started",
  "ride ongoing",
  "ride completed",
  "ride cancelled",
];

export default function NegotiationActionPanel({
  negotiationId,
  parcelId,
  isServiceProvider,
  currentUserId,
  accordion = false,
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
        console.log(res, "neg");
        setNegotiation(data);
      } catch (err: any) {
        Alert.alert("Error", "Could not load negotiation details");
      } finally {
        setLoading(false);
      }
    };

    if (negotiationId) fetchNegotiation();
  }, [negotiationId, dispatch]);

  const refreshNegotiation = async () => {
    try {
      const res = await dispatch(getNegotiationById(negotiationId)).unwrap();
      setNegotiation(res?.data ? res.data : res);
    } catch (err) {
      console.error(err);
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
        Alert.alert(
          "Ride Completed",
          "Notification sent to admin@padimanroute.com"
        );
      }

      await refreshNegotiation();
      setShowStatusOptions(false);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSetPrice = async () => {
    const price = parseFloat(priceInput);
    if (!price || isNaN(price) || price <= 0) {
      return Alert.alert("Invalid Price", "Enter amount greater than 0");
    }

    setIsUpdatingPrice(true);
    try {
      await dispatch(
        updateNegotiation({
          id: negotiationId,
          data: { agreedAmount: price, status: "ride agreed" },
        })
      ).unwrap();
      Alert.alert("Success", `Price set to ₦${price.toLocaleString()}`);
      await refreshNegotiation();
      setPriceInput("");
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to set price");
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  const handlePayPress = () => {
    if (!agreedAmount) return;
    router.push({
      pathname: "/(details)/PaymentScreen",
      params: { negotiationId, amount: String(agreedAmount) },
    });
  };

  const handleViewReceipt = () => {
    if (!negotiation) return;
    router.push({
      pathname: "/(details)/ReceiptScreen",
      params: { negotiationId, id: parcelId },
    });
  };

  const handleViewChat = () => {
    router.push({
      pathname: "/(details)/ChatScreen",
      params: { id: negotiationId },
    });
  };

  // Accordion Trigger
  if (accordion && !modalVisible) {
    return (
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={{
          backgroundColor: theme.surface,
          padding: 16,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.border,
          marginVertical: 8,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <AppText weight="bold" color={theme.text + 90} color={theme.text}>
              Negotiation Details
            </AppText>
            {agreedAmount && (
              <AppText color={theme.primary}>
                ₦{Number(agreedAmount).toLocaleString()}
              </AppText>
            )}
          </View>
          <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
        </View>
      </TouchableOpacity>
    );
  }

  if (loading)
    return (
      <ActivityIndicator
        size="large"
        color={theme.primary}
        style={{ margin: 20 }}
      />
    );
  if (!negotiation)
    return <AppText color={theme.text}>Failed to load negotiation</AppText>;

  const FullPanel = (
    <View style={{ padding: 16, gap: 14 }}>
      {/* Negotiator Info */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <View>
          <AppText size={15} weight="bold" color={theme.text}>
            {negotiation.negotiator?.fullName || "Negotiator"}
          </AppText>
          {negotiation.negotiator?.email && isPaid && (
            <AppText size={12} color={theme.textMuted}>
              {negotiation.negotiator.email}
            </AppText>
          )}
        </View>
        {agreedAmount && (
          <AppText size={16} weight="bold" color={theme.primary}>
            ₦{Number(agreedAmount).toLocaleString()}
          </AppText>
        )}
      </View>

      {/* ==================== PARCEL INFO & BOOKINGS ==================== */}
      {negotiation.negotiatorServiceData && (
        <View
          style={{
            marginBottom: 16,
            padding: 14,
            backgroundColor: theme.surface,
            borderRadius: 12,
            gap: 12,
            borderWidth: 1,
            borderColor: theme.border,
          }}
        >
          <AppText size={13} weight="bold" color={theme.primary}>
            Parcel Info & Bookings
          </AppText>

          {/* Item */}
          {negotiation.negotiatorServiceData.item && (
            <View style={{ gap: 4 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <MaterialCommunityIcons
                  name="package-variant-closed"
                  size={16}
                  color={theme.text}
                />
                <AppText size={12} weight="bold" color={theme.text}>
                  Item Information
                </AppText>
              </View>
              <AppText size={13} color={theme.text} style={{ paddingLeft: 4 }}>
                Item Name:{" "}
                <AppText weight="bold" color={theme.text + 90}>
                  {negotiation.negotiatorServiceData.item.name || "N/A"}
                </AppText>
              </AppText>
            </View>
          )}

          {/* Route */}
          {negotiation.negotiatorServiceData.route && (
            <View style={{ gap: 4 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={theme.text}
                />
                <AppText size={12} weight="bold" color={theme.text}>
                  Locations
                </AppText>
              </View>
              <AppText size={13} color={theme.text} style={{ paddingLeft: 4 }}>
                Pickup:{" "}
                <AppText weight="bold" color={theme.text + 90}>
                  {negotiation.negotiatorServiceData.route.pickupAddress ||
                    "N/A"}
                </AppText>
              </AppText>
              <AppText size={13} color={theme.text} style={{ paddingLeft: 4 }}>
                Delivery:{" "}
                <AppText weight="bold" color={theme.text + 90}>
                  {negotiation.negotiatorServiceData.route.deliveryAddress ||
                    "N/A"}
                </AppText>
              </AppText>
            </View>
          )}

          {/* Parties */}
          {negotiation.negotiatorServiceData.parties && (
            <View style={{ gap: 4 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Ionicons name="people-outline" size={16} color={theme.text} />
                <AppText size={12} weight="bold" color={theme.text}>
                  Parties Involved
                </AppText>
              </View>
              {negotiation.negotiatorServiceData.parties.sender && (
                <AppText
                  size={13}
                  color={theme.text}
                  style={{ paddingLeft: 4 }}
                >
                  Sender:{" "}
                  <AppText weight="bold" color={theme.text + 90}>
                    {negotiation.negotiatorServiceData.parties.sender.fullName}
                  </AppText>{" "}
                  ({negotiation.negotiatorServiceData.parties.sender.contact})
                </AppText>
              )}
              {negotiation.negotiatorServiceData.parties.recipient && (
                <AppText
                  size={13}
                  color={theme.text}
                  style={{ paddingLeft: 4 }}
                >
                  Receiver:{" "}
                  <AppText weight="bold" color={theme.text + 90}>
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

      {/* Pickup Code */}
      {negotiation.pickupCode && (
        <View
          style={{
            backgroundColor: theme.surface,
            padding: 16,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: theme.primary,
            alignItems: "center",
          }}
        >
          <AppText size={12} weight="bold" color={theme.textMuted}>
            PICKUP CODE
          </AppText>
          <TouchableOpacity
            onPress={() => handleCopy(negotiation.pickupCode, "Pickup Code")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginTop: 8,
            }}
          >
            <AppText size={20} weight="bold" color={theme.primary}>
              {negotiation.pickupCode}
            </AppText>
            <Ionicons name="copy-outline" size={22} color={theme.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Status Banner */}
      <NegotiationStatusBanner
        status={negotiation.status}
        isPaid={isPaid}
        isServiceProvider={isServiceProvider}
        theme={theme}
        showDropdown={showStatusOptions}
        isUpdatingStatus={isUpdatingStatus}
        onUpdatePress={() => setShowStatusOptions(!showStatusOptions)}
        onDropdownOptionSelect={handleUpdateStatus}
      />

      {isPaid && negotiation?.isConfirmed === false && (
        <EscrowReleaseButton
          negotiationId={negotiationId}
          theme={theme}
          isServiceProvider={isServiceProvider}
          onSuccess={refreshNegotiation}
        />
      )}

      {/* Phone Numbers */}
      <View style={{ gap: 10 }}>
        {negotiation.negotiator?.phone && isPaid && (
          <TouchableOpacity
            onPress={() => handleCall(negotiation.negotiator.phone)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: theme.surface,
              padding: 14,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Ionicons name="call-outline" size={24} color={theme.primary} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <AppText size={13} color={theme.textMuted}>
                Negotiator Contact
              </AppText>
              <AppText size={16} weight="bold" color={theme.text}>
                {negotiation.negotiator.phone}
              </AppText>
            </View>
            <Ionicons name="copy-outline" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Set Price */}
      {isServiceProvider && !isPaid && (
        <View>
          <AppText size={12} color={theme.textMuted}>
            Set Starting Price
          </AppText>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
            <TextInput
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 10,
                padding: 12,
                backgroundColor: theme.background,
                color: theme.text,
              }}
              placeholder="Enter amount (₦)"
              keyboardType="numeric"
              value={priceInput}
              onChangeText={setPriceInput}
            />
            <TouchableOpacity
              style={{
                backgroundColor: theme.primary,
                paddingHorizontal: 24,
                justifyContent: "center",
                borderRadius: 10,
              }}
              onPress={handleSetPrice}
              disabled={isUpdatingPrice}
            >
              {isUpdatingPrice ? (
                <ActivityIndicator color={theme.text} />
              ) : (
                <AppText
                  weight="bold"
                  color={theme.text + 90}
                  color={isDark ? "#000" : "#FFF"}
                >
                  Set
                </AppText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isServiceProvider && (
        <NegotiationManager negotiationId={negotiationId} />
      )}

      {/* Pay & Receipt */}
      {agreedAmount && !isPaid && !isServiceProvider && isMyNegotiation && (
        <TouchableOpacity
          style={{
            backgroundColor: "#10B981",
            height: 52,
            borderRadius: 14,
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={handlePayPress}
        >
          <AppText weight="bold" color={theme.text + 90} color="#FFF">
            Pay Now - ₦{Number(agreedAmount).toLocaleString()}
          </AppText>
        </TouchableOpacity>
      )}

      {isPaid && (
        <TouchableOpacity
          style={{
            backgroundColor: "#10B981",
            height: 50,
            borderRadius: 14,
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={handleViewReceipt}
        >
          <AppText weight="bold" color={theme.text + 90} color="#FFF">
            View Receipt
          </AppText>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={{
          backgroundColor: theme.primary,
          height: 50,
          borderRadius: 14,
          justifyContent: "center",
          alignItems: "center",
        }}
        onPress={handleViewChat}
      >
        <AppText
          weight="bold"
          color={theme.text + 90}
          color={isDark ? "#000" : "#FFF"}
        >
          Open Chat
        </AppText>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      {accordion && (
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={{
            padding: 16,
            backgroundColor: theme.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
          }}
        >
          <AppText weight="bold" color={theme.text + 90} color={theme.text}>
            View Negotiation Details
          </AppText>
        </TouchableOpacity>
      )}

      {!accordion ? (
        FullPanel
      ) : (
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: theme.background },
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.border,
                }}
              >
                <AppText size={18} weight="bold" color={theme.text}>
                  Negotiation Details
                </AppText>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={28} color={theme.text} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16 }}
              >
                {FullPanel}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    height: "85%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});
