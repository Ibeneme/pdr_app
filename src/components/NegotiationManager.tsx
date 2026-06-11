import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
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

const STATUS_OPTIONS = [
  "ride pending",
  "ride agreed",
  "ride started",
  "ride ongoing",
  "ride completed",
  "ride cancelled",
];

export default function NegotiationManager({
  negotiationId,
}: NegotiationManagerProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useTheme();

  // Component States
  const [currentNegotiation, setCurrentNegotiation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form Management States
  const [status, setStatus] = useState<string>("ride pending");
  const [agreedAmount, setAgreedAmount] = useState<string>("0");

  // Custom Bottom Sheet In-line Confirmation State
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);

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
              data.agreedAmount ? data.agreedAmount.toString() : ""
            );
          }
        } else {
          setError(
            (resultAction.payload as string) ||
              "Failed to fetch configurations."
          );
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

  const executeDataSync = async () => {
    const updatedData: any = { status };

    // Only allow syncing the price field if it wasn't already locked down initially
    if (!isPriceLocked && agreedAmount.trim() !== "") {
      updatedData.agreedAmount = Number(agreedAmount);
    }

    setIsSaving(true);
    try {
      const resultAction = await dispatch(
        updateNegotiation({ id: negotiationId, data: updatedData })
      );

      if (updateNegotiation.fulfilled.match(resultAction)) {
        setCurrentNegotiation(resultAction.payload);
        setShowConfirmation(false);
      }
    } catch (err) {
      console.error("Dispatch error:", err);
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

  if (error || !currentNegotiation) return null;

  // Evaluation matrices for disabling modifications
  const isRideCompleted =
    currentNegotiation?.status === "ride completed" ||
    currentNegotiation?.status === "completed";

  const isPriceLocked =
    currentNegotiation?.agreedAmount !== undefined &&
    Number(currentNegotiation.agreedAmount) > 0;

  return (
    <View style={styles.noPaddingWrapper}>
      <View
        style={[
          styles.modalSheet,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        {/* Handle Decorator */}
        <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />

        <View style={styles.paddedContent}>
          {!showConfirmation ? (
            /* LAYER ONE: INPUT FLOW DATA SELECTION */
            <View style={styles.animLayer}>
              <AppText size={16} weight="bold" color={theme.text}>
                Negotiation Parameters
              </AppText>
              <AppText
                size={12}
                color={theme.textMuted}
                style={{ marginTop: 2, marginBottom: 16 }}
              >
                Set current status values and assign agreed financial parameters
                below.
              </AppText>

              {/* Status State Area */}
              <AppText
                size={11}
                weight="bold"
                color={theme.textMuted}
                style={styles.labelTitle}
              >
                STATUS
              </AppText>
              <View style={styles.masonryGrid}>
                {STATUS_OPTIONS.map((item, index) => {
                  const isActive = status === item;

                  return (
                    <TouchableOpacity
                      key={item}
                      onPress={() => !isRideCompleted && setStatus(item)}
                      disabled={isRideCompleted}
                      style={[
                        styles.masonryItem,
                        {
                          backgroundColor: isActive
                            ? theme.primary
                            : theme.background,
                          borderColor: isActive ? theme.primary : theme.border,
                          opacity: isRideCompleted && !isActive ? 0.5 : 1,
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

              {/* Pricing input field */}
              <AppText
                size={11}
                weight="bold"
                color={theme.textMuted}
                style={[styles.labelTitle, { marginTop: 20 }]}
              >
                CONFIRM AGREED PRICE (₦) {isPriceLocked && "• LOCKED"}
              </AppText>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  },
                  isPriceLocked && { opacity: 0.64 },
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
                      color: isPriceLocked ? theme.textMuted : theme.text,
                      fontSize: 22,
                      fontWeight: "700",
                    },
                  ]}
                  value={agreedAmount}
                  onChangeText={setAgreedAmount}
                  keyboardType="numeric"
                  editable={!isPriceLocked}
                  placeholder="0.00"
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              {/* Action trigger -> Hidden completely when ride is completed */}
              {!isRideCompleted && (
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                  onPress={() => setShowConfirmation(true)}
                >
                  <AppText size={15} weight="bold" color="#FFF">
                    Apply Action Changes
                  </AppText>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            /* LAYER TWO: BOTTOM SHEET CONFIRMATION SPLIT VIEW */
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
                  Verify Parameter Transitions
                </AppText>
              </View>

              <AppText
                size={13}
                color={theme.textMuted}
                style={{ marginTop: 6, marginBottom: 20 }}
              >
                Please review the finalized state modification boundaries before
                sending adjustments downstream.
              </AppText>

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
                    Target Action State:
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
                  <AppText size={16} weight="extrabold" color={theme.primary}>
                    ₦{Number(agreedAmount || 0).toLocaleString()}
                  </AppText>
                </View>
              </View>

              {/* Split actions block inside container */}
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
                    Go Back
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
                      Confirm & Sync
                    </AppText>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  noPaddingWrapper: {
    width: "100%",
    padding: 0,
    marginVertical: 10,
  },
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
  paddedContent: {
    width: "100%",
    padding: 20,
  },
  animLayer: {
    width: "100%",
  },
  centeredState: {
    paddingVertical: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  labelTitle: {
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
  },
  textInput: {
    flex: 1,
    padding: 0,
  },
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
    alignSelf: "center",
  },
  textCapitalize: {
    textTransform: "capitalize",
  },
  saveBtn: {
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    width: "100%",
  },
  confirmHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
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
  summaryDivider: {
    height: 1,
    width: "100%",
    marginVertical: 10,
  },
  splitBtnRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  flexButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtn: {
    borderWidth: 1,
    backgroundColor: "transparent",
  },
});
