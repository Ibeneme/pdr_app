import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/api/store";
import { releaseEscrowEarnings } from "@/api/slices/payment.slice";
import { AppText } from "@/components/AppText";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

interface ThemeProps {
  surface: string;
  background: string;
  border: string;
  primary: string;
  text: string;
  textMuted: string;
}

interface EscrowReleaseButtonProps {
  negotiationId: string;
  theme: ThemeProps;
  isServiceProvider?: boolean;
  onSuccess?: () => void;
}

export const EscrowReleaseButton: React.FC<EscrowReleaseButtonProps> = ({
  negotiationId,
  theme,
  isServiceProvider = false,
  onSuccess,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  // Localized Component UI Loading State Trigger Hook
  const [localLoading, setLocalLoading] = useState<boolean>(false);

  // Step tracking states: "initial" -> "confirming" -> "completed"
  const [step, setStep] = useState<"initial" | "confirming" | "completed">(
    "initial"
  );

  const handleInitiate = () => {
    console.log(
      `[ESCROW_COMPONENT] User initiated release layout stack flow context for ID: ${negotiationId}`
    );
    setStep("confirming");
  };

  const handleCancel = () => {
    console.log(
      `[ESCROW_COMPONENT] User canceled decision framework, resetting back to 'initial' base phase.`
    );
    setStep("initial");
  };

  const handleConfirmRelease = async () => {
    console.log(
      `🚀 [ESCROW_COMPONENT] Dispatch process beginning. Confirming release for negotiationId: ${negotiationId}`
    );
    setLocalLoading(true);

    try {
      const resultAction = await dispatch(releaseEscrowEarnings(negotiationId));

      if (releaseEscrowEarnings.fulfilled.match(resultAction)) {
        console.log(
          "✅ [ESCROW_COMPONENT] Server response metadata action success match fulfilled clean."
        );
        setStep("completed");
        if (onSuccess) {
          console.log(
            "[ESCROW_COMPONENT] Running parent screen onSuccess pipeline listener callback."
          );
          onSuccess();
        }
      } else {
        console.error(
          "❌ [ESCROW_COMPONENT] Release rejected mismatch inside pipeline layer:",
          resultAction.payload
        );
        setStep("initial");
      }
    } catch (err) {
      console.error(
        "🚨 [ESCROW_COMPONENT] Fatal hardware or asynchronous networking thread exception:",
        err
      );
      setStep("initial");
    } finally {
      console.log(
        "[ESCROW_COMPONENT] Cleaning execution context hooks. Resetting local operational loader to false."
      );
      setLocalLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
        isServiceProvider &&
          step !== "completed" && { backgroundColor: `${theme.primary}06` },
      ]}
    >
      {/* HEADER SECTION INLINE WITH VERIFIED PROFILE AND FEEDS ARCHITECTURE */}
      <View style={styles.headerRow}>
        <View
          style={[
            styles.iconWrapper,
            {
              backgroundColor:
                step === "completed"
                  ? "#10B98112"
                  : isServiceProvider
                  ? `${theme.primary}12`
                  : `${theme.primary}12`,
            },
          ]}
        >
          <Ionicons
            name={
              step === "completed"
                ? "checkmark-done"
                : isServiceProvider
                ? "time-outline"
                : "shield-checkmark-outline"
            }
            size={16}
            color={step === "completed" ? "#10B981" : theme.primary}
          />
        </View>

        <View style={{ flex: 1 }}>
          <AppText
            size={11}
            weight="bold"
            color={theme.textMuted}
            style={styles.labelTitle}
          >
            {step === "completed"
              ? "TRANSACTION SETTLED"
              : isServiceProvider
              ? "ESCROW MONITOR"
              : "ESCROW SECURITY CONTROLS"}
          </AppText>
          <AppText size={14} weight="bold" color={theme.text}>
            {step === "completed"
              ? "Payment Released"
              : isServiceProvider
              ? "Awaiting Release"
              : "Disburse Funds"}
          </AppText>
        </View>
      </View>

      {/* BODY SEGMENTS TRANSLATING THE CLEAN TEXT CONTAINER SYSTEM */}
      {step === "initial" && (
        <View style={styles.contentBody}>
          {isServiceProvider ? (
            <View
              style={[
                styles.infoPod,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                },
              ]}
            >
              <AppText
                size={12}
                color={theme.textMuted}
                style={styles.descriptionText}
              >
                The ride is complete. Escrow earnings will move into your
                spendable balance once the passenger authorizes release from
                their dashboard.
              </AppText>
            </View>
          ) : (
            <>
              <View
                style={[
                  styles.infoPod,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  },
                ]}
              >
                <AppText
                  size={12}
                  color={theme.textMuted}
                  style={styles.descriptionText}
                >
                  If this ride or delivery service is completed perfectly, you
                  can safely release the escrowed payment directly into the
                  provider's wallet balance.
                </AppText>
              </View>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: theme.text }]}
                onPress={handleInitiate}
                activeOpacity={0.8}
              >
                <AppText size={13} weight="bold" color={theme.surface}>
                  Authorize escrow release
                </AppText>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {step === "confirming" && (
        <View style={styles.contentBody}>
          <View
            style={[
              styles.infoPod,
              { backgroundColor: "#FFFBF2", borderColor: "#F59E0B30" },
            ]}
          >
            <AppText
              size={12}
              color="#D97706"
              weight="medium"
              style={styles.descriptionText}
            >
              This action is fully irreversible and transfers funds immediately.
              Ensure your ride context was finalized safely.
            </AppText>
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: theme.border }]}
              onPress={handleCancel}
              disabled={localLoading}
              activeOpacity={0.8}
            >
              <AppText size={13} weight="bold" color={theme.textMuted}>
                Dismiss
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: theme.primary, flex: 1, marginTop: 0 },
              ]}
              onPress={handleConfirmRelease}
              disabled={localLoading}
              activeOpacity={0.8}
            >
              {localLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <AppText size={13} weight="bold" color="#FFF">
                  Confirm Release
                </AppText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {step === "completed" && (
        <View style={styles.contentBody}>
          <View
            style={[
              styles.infoPod,
              { backgroundColor: "#F0FDF4", borderColor: "#10B98125" },
            ]}
          >
            <AppText
              size={12}
              color="#15803D"
              weight="medium"
              style={styles.descriptionText}
            >
              Funds released successfully. The service provider's spendable
              ledger balance has been credited.
            </AppText>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginVertical: 10,
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  labelTitle: {
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 1,
  },
  contentBody: {
    marginTop: 14,
  },
  infoPod: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  descriptionText: {
    lineHeight: 18,
  },
  actionBtn: {
    height: 46,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    width: "100%",
  },
  cancelBtn: {
    height: 46,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "transparent",
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
});
