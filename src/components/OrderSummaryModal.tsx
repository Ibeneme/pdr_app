import React from "react";
import { Modal, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { AppText } from "@/components/AppText";
import { useTheme } from "@/contexts/ThemeContext";

interface OrderSummaryModalProps {
  visible: boolean;
  onClose: () => void;
  submissionStatus: "idle" | "success" | "error";
  loading?: boolean;
  itemName?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  senderName?: string;
  senderContact?: string;
  recipientName?: string;
  recipientContact?: string;
  isFragile?: boolean;
  isPerishable?: boolean;
  isInsured?: boolean;
  isImpromptu?: boolean;
  dispatchDate?: Date;
  error?: string;
  createdBooking?: any;
  onConfirm?: () => void;
  onGoToDrivers?: () => void;
}

export default function OrderSummaryModal({
  visible,
  onClose,
  submissionStatus,
  loading = false,
  itemName,
  pickupAddress,
  deliveryAddress,
  senderName,
  senderContact,
  recipientName,
  recipientContact,
  isFragile = false,
  isPerishable = false,
  isInsured = false,
  isImpromptu = true,
  dispatchDate = new Date(),
  error,
  createdBooking,
  onConfirm,
  onGoToDrivers,
}: OrderSummaryModalProps) {
  const { theme } = useTheme();

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
      >
        <View
          style={{
            backgroundColor: theme.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: 24,
            paddingBottom: 40,
            paddingTop: 16,
          }}
        >
          {/* Knob */}
          <View
            style={{
              width: 44,
              height: 5,
              backgroundColor: theme.border,
              borderRadius: 3,
              alignSelf: "center",
              marginBottom: 24,
            }}
          />

          {/* IDLE STATE - Order Summary */}
          {submissionStatus === "idle" && (
            <>
              <AppText
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  color: theme.text,
                  marginBottom: 16,
                }}
              >
                Order Summary
              </AppText>

              <View
                style={{
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 18,
                  padding: 16,
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <AppText style={{ color: theme.text }}>
                  <AppText style={{ color: theme.textMuted }}>Item: </AppText>
                  {itemName || "Not specified"}
                </AppText>
                <AppText style={{ color: theme.text }}>
                  <AppText style={{ color: theme.textMuted }}>Route: </AppText>
                  {pickupAddress || "—"} ➔ {deliveryAddress || "—"}
                </AppText>
                <AppText style={{ color: theme.text }}>
                  <AppText style={{ color: theme.textMuted }}>Sender: </AppText>
                  {senderName} ({senderContact})
                </AppText>
                <AppText style={{ color: theme.text }}>
                  <AppText style={{ color: theme.textMuted }}>
                    Receiver:{" "}
                  </AppText>
                  {recipientName} ({recipientContact})
                </AppText>
                <AppText style={{ color: theme.text }}>
                  <AppText style={{ color: theme.textMuted }}>
                    Handling:{" "}
                  </AppText>
                  {isFragile && "Fragile "}
                  {isPerishable && "Perishable "}
                  {isInsured && "Insured"}
                </AppText>
                <AppText style={{ color: theme.text }}>
                  <AppText style={{ color: theme.textMuted }}>
                    Delivery Time:{" "}
                  </AppText>
                  {isImpromptu
                    ? "As soon as possible (Now)"
                    : dispatchDate.toDateString()}
                </AppText>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: theme.primary,
                  height: 56,
                  borderRadius: 18,
                  justifyContent: "center",
                  alignItems: "center",
                }}
                onPress={onConfirm}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <AppText
                    style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}
                  >
                    Confirm and Book Order
                  </AppText>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* SUCCESS STATE */}
          {submissionStatus === "success" && (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: "#34C75920",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <AppText
                  style={{ color: "#34C759", fontSize: 36, fontWeight: "bold" }}
                >
                  ✓
                </AppText>
              </View>

              <AppText
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: theme.text,
                  marginBottom: 8,
                }}
              >
                Delivery Booked Successfully!
              </AppText>
              <AppText
                style={{
                  color: theme.textMuted,
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                Your delivery has been logged. You can now track your rider and
                package details.
              </AppText>

              <TouchableOpacity
                style={{
                  backgroundColor: theme.text,
                  height: 56,
                  borderRadius: 18,
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100%",
                  marginTop: 24,
                }}
                onPress={onGoToDrivers}
              >
                <AppText
                  style={{ color: theme.background, fontWeight: "bold" }}
                >
                  Go to Available Drivers
                </AppText>
              </TouchableOpacity>
            </View>
          )}

          {/* ERROR STATE */}
          {submissionStatus === "error" && (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: "#FF3B3020",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <AppText
                  style={{ color: "#FF3B30", fontSize: 36, fontWeight: "bold" }}
                >
                  ✕
                </AppText>
              </View>

              <AppText
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: theme.text,
                  marginBottom: 8,
                }}
              >
                Something Went Wrong
              </AppText>
              <AppText
                style={{
                  color: theme.textMuted,
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                {error ||
                  "We couldn't set up your delivery. Please verify form details."}
              </AppText>

              <TouchableOpacity
                style={{
                  backgroundColor: "#FF3B30",
                  height: 56,
                  borderRadius: 18,
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100%",
                  marginTop: 24,
                }}
                onPress={onClose}
              >
                <AppText style={{ color: "#fff", fontWeight: "bold" }}>
                  Check Fields and Fix
                </AppText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
