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
import { Ionicons } from "@expo/vector-icons";

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
  isServiceProvider?: boolean; // Added parameter to separate view vectors
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
          step !== "completed" && { backgroundColor: `${theme.primary}08` },
      ]}
    >
      {/* Header Context Banner */}
      <View style={styles.headerRow}>
        <Ionicons
          name={
            step === "completed"
              ? "checkmark-circle"
              : isServiceProvider
              ? "time-outline"
              : "lock-open-outline"
          }
          size={18}
          color={step === "completed" ? "#10B981" : theme.primary}
        />
        <AppText
          size={13}
          weight="bold"
          color={theme.text}
          style={{ marginLeft: 6 }}
        >
          {step === "completed"
            ? "PAYMENT RELEASED SUCCESSFULLY"
            : isServiceProvider
            ? "AWAITING CUSTOMER APPROVAL"
            : "ESCROW FUNDS CONTROL"}
        </AppText>
      </View>

      {/* Conditional Interface Rendering based on role matrix and step tracking */}
      {step === "initial" && (
        <View style={styles.contentBody}>
          {isServiceProvider ? (
            /* SERVICE PROVIDER INITIAL STANDBY STATE */
            <AppText
              size={12}
              color={theme.textMuted}
              style={styles.descriptionText}
            >
              The ride is complete. Escrow funds will move into your spendable
              ledger balance once the passenger authorizes release from their
              dashboard.
            </AppText>
          ) : (
            /* PASSENGER INITIAL ACTION STATE */
            <>
              <AppText
                size={12}
                color={theme.textMuted}
                style={styles.descriptionText}
              >
                If this ride or delivery service is completed, you can release
                the payment out of escrow directly into the provider's balance.
              </AppText>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: theme.primary }]}
                onPress={handleInitiate}
                activeOpacity={0.8}
              >
                <AppText size={13} weight="bold" color="#FFF">
                  Confirm Request is Completed
                </AppText>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {step === "confirming" && (
        <View style={styles.contentBody}>
          <AppText
            size={12}
            color="#F59E0B"
            weight="bold"
            style={styles.descriptionText}
          >
            ⚠️ Are you absolutely sure? This action is irreversible and
            transfers funds immediately.
          </AppText>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: theme.border }]}
              onPress={handleCancel}
              disabled={localLoading}
              activeOpacity={0.8}
            >
              <AppText size={13} weight="bold" color={theme.textMuted}>
                Cancel
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: "#10B981", flex: 1, marginTop: 0 },
              ]}
              onPress={handleConfirmRelease}
              disabled={localLoading}
              activeOpacity={0.8}
            >
              {localLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <AppText size={13} weight="bold" color="#FFF">
                  Yes, Release Funds
                </AppText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {step === "completed" && (
        <View style={styles.contentBody}>
          <AppText
            size={13}
            color="#10B981"
            weight="medium"
            style={styles.descriptionText}
          >
            🎉 Funds released! The service provider's spendable ledger balance
            has been updated.
          </AppText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginVertical: 8,
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  contentBody: {
    marginTop: 4,
  },
  descriptionText: {
    lineHeight: 18,
    marginBottom: 12,
  },
  actionBtn: {
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
    paddingHorizontal: 16,
  },
  cancelBtn: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginTop: 4,
  },
});
