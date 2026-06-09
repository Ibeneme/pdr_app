// app/(screens)/withdraw.tsx
import React, { useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react-native";
import { AppText } from "@/components/AppText";

export default function WithdrawScreen() {
  const { theme: colors, isDark } = useTheme();
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("GTBank");
  const [accountNumber, setAccountNumber] = useState("0123456789");
  const [accountName, setAccountName] = useState("Deniro Erhuvwu Ohanomah");

  // Bottom Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"success" | "error">("error");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  const availableBalance = 48750;

  const triggerModal = (
    type: "success" | "error",
    title: string,
    msg: string
  ) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(msg);
    setModalVisible(true);
  };

  const handleWithdraw = () => {
    if (!amount || parseInt(amount) > availableBalance) {
      triggerModal(
        "error",
        "Invalid Amount",
        "Please enter a valid amount within your balance limits."
      );
      return;
    }

    triggerModal(
      "success",
      "Withdrawal Requested",
      `₦${parseInt(
        amount
      ).toLocaleString()} has been requested to ${bank} • ${accountNumber}`
    );
  };

  const handleModalClose = () => {
    setModalVisible(false);
    if (modalType === "success") {
      router.back();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

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
            Withdraw Funds
          </AppText>

          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Card */}
        <View
          style={[
            styles.balanceCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <AppText size={13} color={colors.textMuted} weight="medium">
            AVAILABLE BALANCE
          </AppText>
          <AppText
            size={38}
            weight="bold"
            color={colors.text}
            style={{ marginTop: 6 }}
          >
            ₦{availableBalance.toLocaleString()}
          </AppText>
          <AppText size={12} color={colors.textMuted} style={{ marginTop: 6 }}>
            Padiman Route • Instant Processing
          </AppText>
        </View>

        <AppText
          size={12}
          weight="bold"
          color={colors.primary}
          style={{ marginBottom: 12, letterSpacing: 0.5 }}
        >
          WITHDRAWAL DETAILS
        </AppText>

        <View
          style={[
            styles.formCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {/* Amount Input */}
          <AppText
            size={13}
            weight="medium"
            color={colors.text}
            style={styles.label}
          >
            Amount (₦)
          </AppText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          {/* Bank */}
          <AppText
            size={13}
            weight="medium"
            color={colors.text}
            style={[styles.label, { marginTop: 18 }]}
          >
            Select Bank
          </AppText>
          <View
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                justifyContent: "center",
              },
            ]}
          >
            <AppText size={15} color={colors.text}>
              {bank}
            </AppText>
          </View>

          {/* Account Number */}
          <AppText
            size={13}
            weight="medium"
            color={colors.text}
            style={[styles.label, { marginTop: 18 }]}
          >
            Account Number
          </AppText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={accountNumber}
            onChangeText={setAccountNumber}
            keyboardType="numeric"
            maxLength={10}
          />

          {/* Account Name */}
          <AppText
            size={13}
            weight="medium"
            color={colors.text}
            style={[styles.label, { marginTop: 18 }]}
          >
            Account Name
          </AppText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={accountName}
            onChangeText={setAccountName}
          />
        </View>

        {/* Summary */}
        {amount ? (
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <AppText size={14} weight="bold" color={colors.text}>
              Withdrawal Summary
            </AppText>
            <View style={styles.summaryRow}>
              <AppText size={14} color={colors.textMuted}>
                Amount
              </AppText>
              <AppText size={15} weight="bold" color={colors.text}>
                ₦{parseInt(amount || "0").toLocaleString()}
              </AppText>
            </View>
            <View style={styles.summaryRow}>
              <AppText size={14} color={colors.textMuted}>
                Fee
              </AppText>
              <AppText
                size={14}
                weight="medium"
                color={colors.success || "#22c55e"}
              >
                Free (First withdrawal)
              </AppText>
            </View>
          </View>
        ) : null}

        {/* Withdraw Button */}
        <TouchableOpacity
          style={[styles.withdrawButton, { backgroundColor: colors.primary }]}
          onPress={handleWithdraw}
          activeOpacity={0.85}
        >
          <AppText
            size={16}
            weight="bold"
            color="#fff"
            style={{ marginRight: 8 }}
          >
            Confirm Withdrawal
          </AppText>
          <ArrowUpRight size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.noteContainer}>
          <CheckCircle size={16} color={colors.textMuted} />
          <AppText
            size={12}
            color={colors.textMuted}
            style={{ marginLeft: 8, flex: 1 }}
          >
            Funds will reflect within 30 minutes to 2 hours during normal
            banking operations.
          </AppText>
        </View>
      </ScrollView>

      {/* Replaced standard alerts with Bottom Modal Layout */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleModalClose}
      >
        <TouchableWithoutFeedback onPress={handleModalClose}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalContent,
                  { backgroundColor: colors.surface },
                ]}
              >
                <View style={styles.modalIndicator} />

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleModalClose}
                >
                  <X size={20} color={colors.textMuted} />
                </TouchableOpacity>

                <View style={styles.modalIconContainer}>
                  {modalType === "success" ? (
                    <CheckCircle size={54} color="#22c55e" />
                  ) : (
                    <AlertCircle size={54} color="#ef4444" />
                  )}
                </View>

                <AppText
                  size={20}
                  weight="bold"
                  color={colors.text}
                  style={{ textAlign: "center", marginBottom: 10 }}
                >
                  {modalTitle}
                </AppText>

                <AppText
                  size={14}
                  color={colors.textMuted}
                  style={{
                    textAlign: "center",
                    paddingHorizontal: 10,
                    marginBottom: 24,
                    lineHeight: 20,
                  }}
                >
                  {modalMessage}
                </AppText>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    {
                      backgroundColor:
                        modalType === "success" ? "#22c55e" : colors.primary,
                    },
                  ]}
                  onPress={handleModalClose}
                >
                  <AppText size={16} weight="bold" color="#fff">
                    {modalType === "success" ? "Done" : "Got it"}
                  </AppText>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSafeArea: {
    borderBottomWidth: 1,
    ...Platform.select({
      android: {
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 4 : 12,
      },
    }),
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  balanceCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
    alignItems: "center",
  },
  formCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  label: {
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  withdrawButton: {
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    paddingHorizontal: 6,
  },
  /* Bottom Sheet Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 34,
    paddingTop: 14,
    alignItems: "center",
  },
  modalIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(150,150,150,0.4)",
    borderRadius: 2,
    marginBottom: 18,
  },
  closeButton: {
    position: "absolute",
    right: 20,
    top: 20,
    padding: 4,
  },
  modalIconContainer: {
    marginBottom: 16,
    marginTop: 8,
  },
  modalButton: {
    width: "100%",
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
});
