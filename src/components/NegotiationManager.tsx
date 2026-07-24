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

type StatusType = (typeof STATUS_OPTIONS)[number];

// Status Transition Map
const STATUS_TRANSITIONS: Record<StatusType, StatusType[]> = {
  "ride pending": ["ride agreed", "ride cancelled"],
  "ride agreed": ["ride started", "ride cancelled"],
  "ride started": ["ride completed", "ride cancelled"],
  "ride completed": [],
  "ride cancelled": [],
};

export default function NegotiationManager({
  negotiationId,
}: NegotiationManagerProps) {
  console.log("--> NegotiationManager initialized with id:", negotiationId);

  const dispatch = useDispatch<AppDispatch>();
  const { theme, isDark } = useTheme();

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
      if (!negotiationId) {
        console.log("--> fetchNegotiation skipped: No negotiationId provided");
        return;
      }
      console.log("--> fetchNegotiation trigger initiated for:", negotiationId);
      setIsLoading(true);
      setError(null);

      try {
        const resultAction = await dispatch(getNegotiationById(negotiationId));
        console.log("--> fetchNegotiation response dispatch resolved");

        if (getNegotiationById.fulfilled.match(resultAction)) {
          const data = resultAction.payload;
          console.log("--> fetchNegotiation fulfilled payload match:", data);
          setCurrentNegotiation(data);

          if (data) {
            console.log(
              "--> Synchronizing local states with fetched document payload parameters"
            );
            setStatus(data.status || "ride pending");
            setAgreedAmount(
              data.agreedAmount ? data.agreedAmount.toString() : "0"
            );
          }
        } else {
          console.log(
            "--> fetchNegotiation rejected or action contract unfulfilled"
          );
          setError("Failed to fetch negotiation.");
        }
      } catch (err) {
        console.error("--> Fetch exception error captured:", err);
        setError("An unexpected error occurred.");
      } finally {
        console.log("--> fetchNegotiation execution loop finalized");
        setIsLoading(false);
      }
    };

    fetchNegotiation();
  }, [negotiationId, dispatch]);

  const currentStatus = currentNegotiation?.status || status;
  console.log(
    "--> Derived dynamic configuration state check [currentStatus]:",
    currentStatus
  );

  const isCancelled = currentStatus === "ride cancelled";
  const isCompleted = currentStatus === "ride completed";
  const isTerminal = isCancelled || isCompleted;

  // Get allowed next statuses from the transition map
  const availableStatuses =
    STATUS_TRANSITIONS[currentStatus as StatusType] || [];
  console.log(
    "--> Computed forward structural workflows available:",
    availableStatuses
  );

  const canChangeStatus = !isTerminal && availableStatuses.length > 0;
  const canSetPrice =
    currentStatus === "ride pending" || currentStatus === "ride agreed";

  const isPriceLocked =
    currentNegotiation?.agreedAmount !== undefined &&
    Number(currentNegotiation.agreedAmount) > 0;

  console.log("--> Context Matrix Checklist flags:", {
    isTerminal,
    canChangeStatus,
    canSetPrice,
    isPriceLocked,
  });

  const showNotification = (
    title: string,
    message: string,
    type: "success" | "error" = "success"
  ) => {
    console.log("--> Modal alert system triggered:", { title, message, type });
    setNotification({ visible: true, title, message, type });
  };

  const executeDataSync = async () => {
    console.log("--> Data pipeline mutation requested via executeDataSync()");
    if (isTerminal) {
      console.log(
        "--> Data pipeline update blocked: Current target element exists inside a terminal flow hierarchy"
      );
      return;
    }

    const updatedData: any = { status };

    if (canSetPrice && agreedAmount.trim() !== "") {
      updatedData.agreedAmount = Number(agreedAmount);
    }

    console.log(
      "--> Submitting structured remote network transactional frame layout:",
      updatedData
    );
    setIsSaving(true);
    try {
      const resultAction = await dispatch(
        updateNegotiation({ id: negotiationId, data: updatedData })
      );
      console.log(
        "--> Data pipeline mutation dispatch frame completed parsing"
      );

      if (updateNegotiation.fulfilled.match(resultAction)) {
        const updated = resultAction.payload;
        console.log(
          "--> updateNegotiation layout returned matching payload verification success:",
          updated
        );
        setCurrentNegotiation(updated);
        setStatus(updated.status || status);
        setAgreedAmount(
          updated.agreedAmount ? updated.agreedAmount.toString() : agreedAmount
        );

        console.log(
          "--> Clearing confirmation structural layer overlay visibility view"
        );
        setShowConfirmation(false);
        showNotification("Success", "Changes applied successfully", "success");
      } else {
        console.log(
          "--> updateNegotiation response match returned error execution metadata parsing path"
        );
        showNotification(
          "Error",
          "Failed to update state details across dispatch profile parameters",
          "error"
        );
      }
    } catch (err: any) {
      console.error(
        "--> Exception caught while persisting structural state parameters:",
        err
      );
      showNotification("Error", err?.message || "Failed to update", "error");
    } finally {
      console.log("--> Data sync task completed lifecycle execution run loop");
      setIsSaving(false);
    }
  };

  if (isLoading) {
    console.log(
      "--> Rendering UI State: Loading placeholder active indicator spin"
    );
    return (
      <View
        style={[styles.centeredState, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  }

  if (error || !currentNegotiation) {
    console.log(
      "--> Rendering UI State: Error view template alternative matching display configuration layout active",
      { error, hasNegotiation: !!currentNegotiation }
    );
    return (
      <View
        style={[styles.centeredState, { backgroundColor: theme.background }]}
      >
        <AppText color={theme.text}>Unable to load negotiation manager</AppText>
      </View>
    );
  }

  console.log(
    "--> Rendering UI State: Main configuration interactive layout workspace active"
  );
  return (
    <View
      style={[
        styles.noPaddingWrapper,
        { backgroundColor: isDark ? theme.background : "#F4F6F9" },
      ]}
    >
      <View
        style={[
          styles.modalSheet,
          {
            backgroundColor: theme.surface,
            borderColor: isDark ? theme.border : "#EAEAEA",
          },
        ]}
      >
        <View
          style={[
            styles.modalHandle,
            { backgroundColor: isDark ? theme.border : "#E0E0E0" },
          ]}
        />

        <View style={styles.paddedContent}>
          {!showConfirmation ? (
            <View style={styles.animLayer}>
              {console.log(
                "--> Sub-View rendering configuration parameters layout: Standard Manager Active"
              )}

              {/* BRANDED INTERACTIVE PROFILE CARD HEADER BLOCK */}
              <View style={styles.profileHeaderBlockRow}>
                <View
                  style={[
                    styles.avatarCircleFrame,
                    { backgroundColor: theme.primary + "12" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="handshake-outline"
                    size={22}
                    color={theme.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.titleWithBadgeInlineRow}>
                    <AppText size={15} weight="bold" color={theme.text}>
                      Negotiation Hub
                    </AppText>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#10B981"
                      style={{ marginLeft: 4 }}
                    />
                  </View>
                  <AppText
                    size={12}
                    color={theme.textMuted}
                    style={{ marginTop: 1 }}
                  >
                    ID: {String(negotiationId).slice(-8).toUpperCase()} • Live
                    Updates
                  </AppText>
                </View>
              </View>

              {/* RECENT ACTIVITY CARD FEED SUB CONTAINER */}
              <View
                style={[
                  styles.feedCardContainer,
                  {
                    backgroundColor: isDark ? theme.background : "#F8F9FA",
                    borderColor: isDark ? theme.border : "#EDF2F7",
                  },
                ]}
              >
                <AppText
                  size={10}
                  weight="bold"
                  color={theme.textMuted}
                  style={styles.labelTitle}
                >
                  CURRENT DISPATCH STATUS
                </AppText>
                <View style={styles.inlineStatusBadgeContainer}>
                  <View
                    style={[
                      styles.statusIndicatorDot,
                      {
                        backgroundColor: isTerminal ? "#EF4444" : theme.primary,
                      },
                    ]}
                  />
                  <AppText
                    size={14}
                    weight="bold"
                    color={theme.text}
                    style={styles.textCapitalize}
                  >
                    {currentStatus}
                  </AppText>
                </View>
              </View>

              {/* AVAILABLE NEXT STATUSES INTERACTIVE FEED GRID */}
              {/* {canChangeStatus && (
                <>
                  <AppText
                    size={11}
                    weight="bold"
                    color={theme.textMuted}
                    style={[
                      styles.labelTitle,
                      { marginTop: 20, marginLeft: 4 },
                    ]}
                  >
                    Action Selection
                  </AppText>
                  <View style={styles.masonryGrid}>
                    {availableStatuses.map((item) => {
                      const isActive = status === item;
                      return (
                        <TouchableOpacity
                          key={item}
                          onPress={() => {
                            console.log(
                              "--> Status option pill pressed. Setting local stage value to:",
                              item
                            );
                            setStatus(item);
                          }}
                          style={[
                            styles.masonryItem,
                            {
                              backgroundColor: isActive
                                ? theme.primary
                                : theme.surface,
                              borderColor: isActive
                                ? theme.primary
                                : isDark
                                ? theme.border
                                : "#E2E8F0",
                            },
                          ]}
                        >
                          <AppText
                            size={13}
                            weight={isActive ? "bold" : "regular"}
                            color={isActive ? theme.background : theme.text}
                            style={styles.textCapitalize}
                          >
                            {item}
                          </AppText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )} */}

              {/* PRICE INPUT CARD COMPONENT */}
              <AppText
                size={11}
                weight="bold"
                color={theme.textMuted}
                style={[styles.labelTitle, { marginTop: 20, marginLeft: 4 }]}
              >
                Agreed Pricing {isPriceLocked && "• (LOCKED BY PROVIDER)"}
              </AppText>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: isDark ? theme.background : "#F8F9FA",
                    borderColor: isDark ? theme.border : "#EDF2F7",
                  },
                  (!canSetPrice || isPriceLocked) && { opacity: 0.5 },
                ]}
              >
                <MaterialCommunityIcons
                  name={isPriceLocked ? "lock-outline" : "cash-multiple"}
                  size={22}
                  color={theme.textMuted}
                  style={{ marginRight: 12 }}
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
                  onChangeText={(val) => {
                    console.log(
                      "--> Amount text modified input value update payload stream changed to:",
                      val
                    );
                    setAgreedAmount(val);
                  }}
                  keyboardType="numeric"
                  editable={canSetPrice && !isPriceLocked}
                  placeholder="0"
                  placeholderTextColor={theme.textMuted}
                />
                <AppText
                  size={14}
                  weight="bold"
                  color={theme.textMuted}
                  style={{ marginRight: 4 }}
                >
                  NGN
                </AppText>
              </View>

              {canChangeStatus && (
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: theme.text }]}
                  onPress={() => {
                    console.log(
                      "--> Transition stage review requested. Shifting layout flow forward to preview sheet confirmation card summary details wrapper pod"
                    );
                    setShowConfirmation(true);
                  }}
                >
                  <AppText size={14} weight="bold" color={theme.background}>
                    Post updates now
                  </AppText>
                </TouchableOpacity>
              )}

              {isTerminal && (
                <View
                  style={[
                    styles.terminalBannerAlert,
                    { backgroundColor: isDark ? theme.background : "#FFF5F5" },
                  ]}
                >
                  <AppText
                    size={12}
                    weight="bold"
                    color="#EF4444"
                    style={{ textAlign: "center" }}
                  >
                    {isCompleted
                      ? "Ride Completed — This activity item is closed"
                      : "Ride Cancelled — This activity item is inactive"}
                  </AppText>
                </View>
              )}
            </View>
          ) : (
            /* Confirmation Screen */
            <View style={styles.animLayer}>
              {console.log(
                "--> Sub-View rendering configuration parameters layout: Confirmation Review Screen Template Display"
              )}
              <View style={styles.confirmHeaderRow}>
                <Ionicons
                  name="shield-checkmark"
                  size={22}
                  color={theme.primary}
                />
                <AppText
                  size={15}
                  weight="bold"
                  color={theme.text}
                  style={{ marginLeft: 8 }}
                >
                  Confirm Activity Update
                </AppText>
              </View>

              <View
                style={[
                  styles.summaryCard,
                  {
                    backgroundColor: isDark ? theme.background : "#F8F9FA",
                    borderColor: isDark ? theme.border : "#EDF2F7",
                  },
                ]}
              >
                <View style={styles.summaryRow}>
                  <AppText size={13} color={theme.textMuted}>
                    New Status Pipeline:
                  </AppText>
                  <AppText
                    size={13}
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
                    { backgroundColor: isDark ? theme.border : "#EAEAEA" },
                  ]}
                />
                <View style={styles.summaryRow}>
                  <AppText size={13} color={theme.textMuted}>
                    Final Target Amount:
                  </AppText>
                  <AppText size={15} weight="bold" color={theme.primary}>
                    ₦{Number(agreedAmount || 0).toLocaleString()}
                  </AppText>
                </View>
              </View>

              <View style={styles.splitBtnRow}>
                <TouchableOpacity
                  style={[
                    styles.flexButton,
                    styles.cancelBtn,
                    { borderColor: isDark ? theme.border : "#E2E8F0" },
                  ]}
                  onPress={() => {
                    console.log(
                      "--> Rollback workflow state option selected, escaping transaction preview loop context"
                    );
                    setShowConfirmation(false);
                  }}
                >
                  <AppText size={13} weight="bold" color={theme.textMuted}>
                    Dismiss
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.flexButton,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={() => {
                    console.log(
                      "--> Master verification sequence authorized. Requesting immediate atomic profile state data persist updates commit dispatch transaction execution runtime"
                    );
                    executeDataSync();
                  }}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color={theme.background} size="small" />
                  ) : (
                    <AppText size={13} weight="bold" color={theme.background}>
                      Confirm Update
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
        {console.log(
          "--> Rendering Modal dialog visibility status overlay panel wrapper active context loop state:",
          notification.visible
        )}
        <View style={styles.notificationOverlay}>
          <View
            style={[
              styles.notificationModal,
              {
                backgroundColor: theme.surface,
                borderColor: isDark ? theme.border : "#EAEAEA",
                borderWidth: 1,
              },
            ]}
          >
            <View style={{ alignItems: "center", marginBottom: 12 }}>
              <Ionicons
                name={
                  notification.type === "success"
                    ? "checkmark-circle"
                    : "alert-circle"
                }
                size={44}
                color={notification.type === "success" ? "#10B981" : "#EF4444"}
              />
            </View>
            <AppText
              size={16}
              weight="bold"
              color={theme.text}
              style={{ textAlign: "center" }}
            >
              {notification.title}
            </AppText>
            <AppText
              size={13}
              color={theme.textMuted}
              style={{
                textAlign: "center",
                marginTop: 6,
                paddingHorizontal: 8,
              }}
            >
              {notification.message}
            </AppText>
            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: theme.text, marginTop: 20 },
              ]}
              onPress={() => {
                console.log(
                  "--> Dialog modal dismissal overlay requested view trigger closed interface interaction"
                );
                setNotification((prev) => ({ ...prev, visible: false }));
              }}
            >
              <AppText size={14} weight="bold" color={theme.background}>
                Acknowledge
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  noPaddingWrapper: { width: "100%", padding: 0 },
  modalSheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderWidth: 1,
    alignItems: "center",
    width: "100%",
    overflow: "hidden",
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    marginTop: 12,
    marginBottom: 4,
  },
  paddedContent: { width: "100%", padding: 24 },
  animLayer: { width: "100%" },
  centeredState: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  profileHeaderBlockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  avatarCircleFrame: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  titleWithBadgeInlineRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  feedCardContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
  },
  inlineStatusBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  statusIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  labelTitle: {
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    marginTop: 6,
  },
  textInput: {
    flex: 1,
    padding: 0,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  masonryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    width: "100%",
    marginTop: 6,
  },
  masonryItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  textCapitalize: { textTransform: "capitalize" },
  saveBtn: {
    height: 50,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    width: "100%",
  },
  confirmHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 28,
  },
  summaryDivider: { height: 1, width: "100%", marginVertical: 8 },
  splitBtnRow: { flexDirection: "row", gap: 10, width: "100%" },
  flexButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtn: { borderWidth: 1, backgroundColor: "transparent" },
  terminalBannerAlert: {
    borderRadius: 14,
    padding: 12,
    marginTop: 20,
  },
  notificationOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  notificationModal: {
    width: width * 0.82,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
});
