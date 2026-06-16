import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
} from "react-native";
import { useDispatch } from "react-redux";
import { useTheme } from "@/contexts/ThemeContext";
import { AppText } from "@/components/AppText";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

import {
  getNegotiationById,
  updateNegotiation,
} from "@/api/slices/negotiation.slice";
import { AppDispatch } from "@/api/store";

const { width } = Dimensions.get("window");

interface NegotiationManagerProps {
  negotiationId: string;
}

export const STATUS_OPTIONS = [
  "ride pending",
  "ride agreed",
  "ride started",
  "ride completed",
  "ride cancelled",
] as const;

export default function NegotiationManager({
  negotiationId,
}: NegotiationManagerProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useTheme();

  const [currentNegotiation, setCurrentNegotiation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<string>("ride pending");
  const [agreedAmount, setAgreedAmount] = useState<string>("0");
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);

  // Notification Modal
  const [notification, setNotification] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: "success" | "error";
  }>({
    visible: false,
    title: "",
    message: "",
    type: "success",
  });

  useEffect(() => {
    const fetchNegotiation = async () => {
      if (!negotiationId) return;
      setIsLoading(true);
      setError(null);

      try {
        const resultAction = await dispatch(getNegotiationById(negotiationId));
        if (getNegotiationById.fulfilled.match(resultAction)) {
          const data = resultAction.payload;
          setCurrentNegotiation(data);

          if (data) {
            setStatus(data.status || "ride pending");
            setAgreedAmount(
              data.agreedAmount ? data.agreedAmount.toString() : "0"
            );
          }
        } else {
          setError("Failed to fetch negotiation.");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNegotiation();
  }, [negotiationId, dispatch]);

  // ====================== STRICT STATUS FLOW ======================
  const currentStatus = currentNegotiation?.status || status;

  const isCancelled = currentStatus === "ride cancelled";
  const isCompleted =
    currentStatus === "ride completed" || currentStatus === "completed";
  const isAgreed = currentStatus === "ride agreed";
  const isStarted =
    currentStatus === "ride started" || currentStatus === "ride ongoing";

  // Dynamic Status Options based on current state
  let availableStatuses: string[] = [];

  if (isCancelled || isCompleted) {
    availableStatuses = [currentStatus]; // Show only current final state
  } else if (currentStatus === "ride pending") {
    availableStatuses = ["ride agreed"]; // Only "ride agreed" from pending
  } else if (isAgreed) {
    availableStatuses = ["ride started"]; // Only "ride started" from agreed
  } else if (isStarted) {
    availableStatuses = ["ride completed"]; // Only "ride completed" from started
  } else {
    availableStatuses = STATUS_OPTIONS;
  }

  const canChangeStatus = !isCompleted && !isCancelled;
  const canSetPrice =
    currentStatus === "ride pending" || currentStatus === "ride agreed";

  const isPriceLocked =
    currentNegotiation?.agreedAmount !== undefined &&
    Number(currentNegotiation.agreedAmount) > 0;

  const showNotification = (
    title: string,
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setNotification({ visible: true, title, message, type });
  };

  const executeDataSync = async () => {
    if (isCancelled || isCompleted) return;

    const updatedData: any = { status };

    if (canSetPrice && agreedAmount.trim() !== "") {
      updatedData.agreedAmount = Number(agreedAmount);
    }

    setIsSaving(true);
    try {
      const resultAction = await dispatch(
        updateNegotiation({ id: negotiationId, data: updatedData })
      );

      if (updateNegotiation.fulfilled.match(resultAction)) {
        const updated = resultAction.payload;
        setCurrentNegotiation(updated);
        setStatus(updated.status || status);
        setAgreedAmount(
          updated.agreedAmount ? updated.agreedAmount.toString() : agreedAmount
        );

        setShowConfirmation(false);
        showNotification("Success", "Changes applied successfully", "success");
      }
    } catch (err: any) {
      showNotification("Error", err?.message || "Failed to update", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View
        style={[styles.centeredState, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  }

  if (error || !currentNegotiation) {
    return (
      <View
        style={[styles.centeredState, { backgroundColor: theme.background }]}
      >
        <AppText color={theme.text}>Unable to load negotiation manager</AppText>
      </View>
    );
  }

  return (
    <View style={styles.noPaddingWrapper}>
      <View
        style={[
          styles.modalSheet,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />

        <View style={styles.paddedContent}>
          {!showConfirmation ? (
            <View style={styles.animLayer}>
              <AppText size={16} weight="bold" color={theme.text}>
                Negotiation Manager
              </AppText>
              <AppText
                size={12}
                color={theme.textMuted}
                style={{ marginTop: 2, marginBottom: 16 }}
              >
                Manage ride status and pricing
              </AppText>

              {/* Status Selection - STRICT FLOW */}
              <AppText
                size={11}
                weight="bold"
                color={theme.textMuted}
                style={styles.labelTitle}
              >
                CURRENT STATUS
              </AppText>
              <View style={styles.masonryGrid}>
                {availableStatuses.map((item) => {
                  const isActive = status === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      onPress={() => canChangeStatus && setStatus(item)}
                      disabled={!canChangeStatus}
                      style={[
                        styles.masonryItem,
                        {
                          backgroundColor: isActive
                            ? theme.primary
                            : theme.background,
                          borderColor: isActive ? theme.primary : theme.border,
                          opacity: !canChangeStatus ? 0.5 : 1,
                        },
                      ]}
                    >
                      <AppText
                        size={13}
                        weight={isActive ? "bold" : "regular"}
                        color={isActive ? "#FFF" : theme.text}
                        style={styles.textCapitalize}
                      >
                        {item}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Price Input */}
              <AppText
                size={11}
                weight="bold"
                color={theme.textMuted}
                style={[styles.labelTitle, { marginTop: 20 }]}
              >
                AGREED AMOUNT (₦) {isPriceLocked && "• LOCKED"}
              </AppText>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  },
                  (!canSetPrice || isPriceLocked) && { opacity: 0.6 },
                ]}
              >
                <MaterialCommunityIcons
                  name={isPriceLocked ? "lock-outline" : "cash"}
                  size={24}
                  color={theme.textMuted}
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      color:
                        isPriceLocked || !canSetPrice
                          ? theme.textMuted
                          : theme.text,
                    },
                  ]}
                  value={agreedAmount}
                  onChangeText={setAgreedAmount}
                  keyboardType="numeric"
                  editable={canSetPrice && !isPriceLocked}
                  placeholder="0"
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              {canChangeStatus && (
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                  onPress={() => setShowConfirmation(true)}
                >
                  <AppText size={15} weight="bold" color="#FFF">
                    Apply Changes
                  </AppText>
                </TouchableOpacity>
              )}

              {(isCompleted || isCancelled) && (
                <AppText
                  size={13}
                  color={theme.textMuted}
                  style={{ textAlign: "center", marginTop: 20 }}
                >
                  {isCompleted
                    ? "Ride Completed - No further changes allowed"
                    : "Ride Cancelled"}
                </AppText>
              )}
            </View>
          ) : (
            /* Confirmation Screen */
            <View style={styles.animLayer}>
              <View style={styles.confirmHeaderRow}>
                <Ionicons
                  name="shield-checkmark"
                  size={24}
                  color={theme.primary}
                />
                <AppText
                  size={16}
                  weight="bold"
                  color={theme.text}
                  style={{ marginLeft: 8 }}
                >
                  Confirm Changes
                </AppText>
              </View>

              <View
                style={[
                  styles.summaryCard,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={styles.summaryRow}>
                  <AppText size={13} color={theme.textMuted}>
                    New Status:
                  </AppText>
                  <AppText
                    size={14}
                    weight="bold"
                    color={theme.text}
                    style={styles.textCapitalize}
                  >
                    {status}
                  </AppText>
                </View>
                <View
                  style={[
                    styles.summaryDivider,
                    { backgroundColor: theme.border },
                  ]}
                />
                <View style={styles.summaryRow}>
                  <AppText size={13} color={theme.textMuted}>
                    Agreed Amount:
                  </AppText>
                  <AppText size={16} weight="bold" color={theme.primary}>
                    ₦{Number(agreedAmount || 0).toLocaleString()}
                  </AppText>
                </View>
              </View>

              <View style={styles.splitBtnRow}>
                <TouchableOpacity
                  style={[
                    styles.flexButton,
                    styles.cancelBtn,
                    { borderColor: theme.border },
                  ]}
                  onPress={() => setShowConfirmation(false)}
                >
                  <AppText size={14} weight="bold" color={theme.textMuted}>
                    Cancel
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.flexButton,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={executeDataSync}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <AppText size={14} weight="bold" color="#FFF">
                      Confirm & Save
                    </AppText>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Notification Modal */}
      <Modal visible={notification.visible} transparent animationType="fade">
        <View style={styles.notificationOverlay}>
          <View
            style={[
              styles.notificationModal,
              { backgroundColor: theme.surface },
            ]}
          >
            <View style={{ alignItems: "center", marginBottom: 12 }}>
              <Ionicons
                name={
                  notification.type === "success"
                    ? "checkmark-circle"
                    : "alert-circle"
                }
                size={48}
                color={notification.type === "success" ? "#10B981" : "#EF4444"}
              />
            </View>
            <AppText
              size={18}
              weight="bold"
              color={theme.text}
              style={{ textAlign: "center" }}
            >
              {notification.title}
            </AppText>
            <AppText
              size={14}
              color={theme.textMuted}
              style={{ textAlign: "center", marginTop: 8 }}
            >
              {notification.message}
            </AppText>
            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: theme.primary, marginTop: 24 },
              ]}
              onPress={() =>
                setNotification((prev) => ({ ...prev, visible: false }))
              }
            >
              <AppText size={15} weight="bold" color="#FFF">
                OK
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  noPaddingWrapper: { width: "100%", padding: 0, marginVertical: 10 },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    width: "100%",
    overflow: "hidden",
  },
  modalHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    marginTop: 10,
    marginBottom: 8,
  },
  paddedContent: { width: "100%", padding: 20 },
  animLayer: { width: "100%" },
  centeredState: {
    paddingVertical: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  labelTitle: { letterSpacing: 1, marginBottom: 8 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
  },
  textInput: { flex: 1, padding: 0, fontSize: 22, fontWeight: "700" },
  masonryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    width: "100%",
  },
  masonryItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  textCapitalize: { textTransform: "capitalize" },
  saveBtn: {
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    width: "100%",
  },
  confirmHeaderRow: { flexDirection: "row", alignItems: "center" },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 30,
  },
  summaryDivider: { height: 1, width: "100%", marginVertical: 10 },
  splitBtnRow: { flexDirection: "row", gap: 12, width: "100%" },
  flexButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtn: { borderWidth: 1, backgroundColor: "transparent" },

  notificationOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  notificationModal: {
    width: width * 0.85,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
});
