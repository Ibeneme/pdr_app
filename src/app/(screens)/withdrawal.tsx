import React, { useState, useEffect, useMemo } from "react";
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
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle,
  AlertCircle,
  X,
  ChevronDown,
  Search,
} from "lucide-react-native";
import { AppText } from "@/components/AppText";
import { LinearGradient } from "expo-linear-gradient";

// Redux Integration Imports
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/api/store";
import {
  fetchWallet,
  fetchBankList,
  requestWithdrawal,
  resolveAccount,
} from "@/api/slices/wallet.slice";

const WITHDRAWAL_FEE_PERCENTAGE = 1.5; // 1.5% fee

export default function WithdrawScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();

  // Redux Hook Allocations
  const dispatch = useDispatch<AppDispatch>();
  const { balance, withdrawableBalance, earnings, bankList, isLoading } =
    useSelector((state: RootState) => state.wallet);

  // Form Controlled Input Fields
  const [amount, setAmount] = useState("");
  const [selectedBankCode, setSelectedBankCode] = useState("");
  const [selectedBankName, setSelectedBankName] = useState("Select a Bank");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  // Search Query State for Bank Picker
  const [searchQuery, setSearchQuery] = useState("");

  // Sheet UI Triggers
  const [modalVisible, setModalVisible] = useState(false);
  const [bankPickerVisible, setBankPickerVisible] = useState(false);
  const [modalType, setModalType] = useState<"success" | "error">("error");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  // Sync state data on initial context mount
  useEffect(() => {
    dispatch(fetchWallet());
    dispatch(fetchBankList());
  }, [dispatch]);

  // Hook watching input rules to fire off account verification hooks automatically
  useEffect(() => {
    const autoResolveBankDetails = async () => {
      console.log(
        `🔍 [BANK_RESOLVER] Triggered. AccNum: ${accountNumber}, BankCode: ${selectedBankCode}`
      );

      if (accountNumber.length === 10 && selectedBankCode) {
        setIsResolving(true);
        setAccountName("");

        console.log(`🚀 [BANK_RESOLVER] Dispatching resolveAccount...`);

        const resultAction = await dispatch(
          resolveAccount({ accountNumber, bankCode: selectedBankCode })
        );

        setIsResolving(false);

        if (resolveAccount.fulfilled.match(resultAction)) {
          console.log(
            `✅ [BANK_RESOLVER_SUCCESS] Server returned:`,
            resultAction.payload
          );
          setAccountName(resultAction.payload.accountName);
        } else {
          const errorMsg = (resultAction.payload as string) || "Unknown error";
          console.error(`❌ [BANK_RESOLVER_ERROR] Failed:`, errorMsg);
          triggerModal("error", "Account Verification Failed", errorMsg);
        }
      } else {
        setAccountName("");
      }
    };

    autoResolveBankDetails();
  }, [accountNumber, selectedBankCode, dispatch]);

  // Calculate total values wrapped in escrow holdings
  const pendingEscrowAmount = useMemo(() => {
    if (!earnings || !Array.isArray(earnings)) return 0;
    return earnings
      .filter((e: any) => e.status === "pending")
      .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
  }, [earnings]);

  // Performance-optimized localized client filter for the banks list
  const filteredBanks = useMemo(() => {
    if (!searchQuery.trim()) return bankList;
    return bankList.filter((bank) =>
      bank.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, bankList]);

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

  const handleModalClose = () => {
    setModalVisible(false);
    if (modalType === "success") {
      router.back();
    }
  };

  const handleWithdraw = async () => {
    const numericAmount = parseInt(amount, 10);

    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      triggerModal(
        "error",
        "Invalid Amount",
        "Please input a realistic numerical value to withdraw."
      );
      return;
    }
    if (numericAmount > withdrawableBalance) {
      triggerModal(
        "error",
        "Insufficient Withdrawable Balance",
        `Your active withdrawable balance is ₦${withdrawableBalance.toLocaleString()}. The rest of your total funds are locked in escrow.`
      );
      return;
    }
    if (!selectedBankCode || selectedBankName === "Select a Bank") {
      triggerModal(
        "error",
        "Missing Bank Selector",
        "Please choose a verified destination banking channel."
      );
      return;
    }
    if (accountNumber.length !== 10) {
      triggerModal(
        "error",
        "Invalid Account Number",
        "Nigerian NUBAN account records must be exactly 10 digits long."
      );
      return;
    }
    if (!accountName.trim()) {
      triggerModal(
        "error",
        "Missing Recipient Details",
        "Please fill out the authorized account holder's name."
      );
      return;
    }

    const payload = {
      amount: numericAmount,
      bankDetails: {
        accountName: accountName.trim(),
        accountNumber: accountNumber,
        bankName: selectedBankName,
      },
    };

    const resultAction = await dispatch(requestWithdrawal(payload));

    if (requestWithdrawal.fulfilled.match(resultAction)) {
      triggerModal(
        "success",
        "Withdrawal Requested",
        `₦${numericAmount.toLocaleString()} has been queued for transfer to ${selectedBankName} • ${accountNumber}`
      );
    } else {
      const errorMsg =
        (resultAction.payload as string) ||
        "An unexpected error occurred processing your payload.";
      triggerModal("error", "Transaction Rejected", errorMsg);
    }
  };

  const selectBankInstance = (name: string, code: string) => {
    setSelectedBankName(name);
    setSelectedBankCode(code);
    setSearchQuery("");
    setBankPickerVisible(false);
  };

  // UI Checks and State Enforcements
  const parsedAmount = parseInt(amount, 10) || 0;
  const fee = Math.round(parsedAmount * (WITHDRAWAL_FEE_PERCENTAGE / 100));
  const netAmount = parsedAmount - fee;
  const isExceedingWithdrawable = parsedAmount > withdrawableBalance;
  const isButtonDisabled =
    isLoading ||
    isResolving ||
    !accountName.trim() ||
    isExceedingWithdrawable ||
    parsedAmount <= 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* PREMIUM HEADER GRADIENT */}
      <LinearGradient
        colors={isDark ? ["#2A1B4D", theme.surface] : ["#F8F5FF", "#FFFFFF"]}
        style={styles.headerGradient}
      >
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <ArrowLeft size={24} color={theme.text} />
            </TouchableOpacity>

            <AppText size={20} weight="bold" color={theme.text}>
              Withdraw Funds
            </AppText>

            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
      >
        <ScrollView
          style={styles.mainScrollView}
          contentContainerStyle={styles.scrollContentLayout}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* BALANCE DISPLAY */}
          <View
            style={[
              styles.mainBalanceCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <AppText
              size={12}
              color={theme.primary}
              weight="bold"
              style={{ letterSpacing: 0.8 }}
            >
              WITHDRAWABLE AVAILABLE BALANCE
            </AppText>
            <AppText
              size={36}
              weight="bold"
              color={theme.text}
              style={{ marginVertical: 4, letterSpacing: -0.5 }}
            >
              ₦{withdrawableBalance.toLocaleString()}
            </AppText>

            <View
              style={[styles.balanceDivider, { backgroundColor: theme.border }]}
            />

            <View style={styles.subBalanceGrid}>
              <View style={styles.subBalanceItem}>
                <AppText size={11} color={theme.textMuted} weight="medium">
                  TOTAL WALLET VALUE
                </AppText>
                <AppText
                  size={15}
                  weight="bold"
                  color={theme.text}
                  style={{ marginTop: 2 }}
                >
                  ₦{balance.toLocaleString()}
                </AppText>
              </View>

              <View
                style={[
                  styles.verticalDivider,
                  { backgroundColor: theme.border },
                ]}
              />

              <View style={styles.subBalanceItem}>
                <AppText size={11} color="#D97706" weight="medium">
                  LOCKED IN ESCROW
                </AppText>
                <AppText
                  size={15}
                  weight="bold"
                  color="#D97706"
                  style={{ marginTop: 2 }}
                >
                  ₦{pendingEscrowAmount.toLocaleString()}
                </AppText>
              </View>
            </View>
          </View>

          {isExceedingWithdrawable && (
            <View
              style={[
                styles.errorAlertBanner,
                {
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  borderColor: "#EF4444",
                },
              ]}
            >
              <AlertCircle size={16} color="#EF4444" />
              <AppText
                size={12}
                color="#EF4444"
                weight="medium"
                style={{ marginLeft: 8, flex: 1 }}
              >
                Amount exceeds your clear payout limits. ₦
                {pendingEscrowAmount.toLocaleString()} is currently locked
                safely in escrow.
              </AppText>
            </View>
          )}

          <AppText
            size={12}
            weight="bold"
            color={theme.textMuted}
            style={{
              marginBottom: 12,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              paddingHorizontal: 4,
            }}
          >
            WITHDRAWAL CONFIGURATION
          </AppText>

          <View
            style={[
              styles.formCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            {/* Amount Field */}
            <AppText
              size={13}
              weight="medium"
              color={theme.text}
              style={styles.label}
            >
              Amount (₦)
            </AppText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="0.00"
              placeholderTextColor={theme.textMuted}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            {/* Bank Picker Dropdown */}
            <AppText
              size={13}
              weight="medium"
              color={theme.text}
              style={[styles.label, { marginTop: 18 }]}
            >
              Select Bank
            </AppText>
            <TouchableOpacity
              style={[
                styles.input,
                styles.pickerTrigger,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => setBankPickerVisible(true)}
            >
              <AppText size={15} color={theme.text}>
                {selectedBankName}
              </AppText>
              <ChevronDown size={18} color={theme.textMuted} />
            </TouchableOpacity>

            {/* Account Number Field */}
            <AppText
              size={13}
              weight="medium"
              color={theme.text}
              style={[styles.label, { marginTop: 18 }]}
            >
              Account Number
            </AppText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Enter 10-digit account number"
              placeholderTextColor={theme.textMuted}
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="numeric"
              maxLength={10}
            />

            {/* Account Name Field */}
            <AppText
              size={13}
              weight="medium"
              color={theme.text}
              style={[styles.label, { marginTop: 18 }]}
            >
              Account Name
            </AppText>
            <View style={{ justifyContent: "center" }}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background,
                    color: theme.text,
                    borderColor: theme.border,
                    paddingRight: 40,
                  },
                ]}
                placeholder="Auto-populated holder name"
                placeholderTextColor={theme.textMuted}
                value={accountName}
                editable={false}
              />
              {isResolving && (
                <ActivityIndicator
                  size="small"
                  color={theme.primary}
                  style={{ position: "absolute", right: 14 }}
                />
              )}
            </View>
          </View>

          {/* Summary Card - Updated with Percentage Fee */}
          {amount && !isNaN(parsedAmount) && parsedAmount > 0 ? (
            <View
              style={[
                styles.summaryCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <AppText size={14} weight="bold" color={theme.text}>
                Withdrawal Summary
              </AppText>

              <View style={styles.summaryRow}>
                <AppText size={14} color={theme.textMuted}>
                  Amount
                </AppText>
                <AppText
                  size={15}
                  weight="bold"
                  color={isExceedingWithdrawable ? "#EF4444" : theme.text}
                >
                  ₦{parsedAmount.toLocaleString()}
                </AppText>
              </View>

              <View style={styles.summaryRow}>
                <AppText size={14} color={theme.textMuted}>
                  Fee ({WITHDRAWAL_FEE_PERCENTAGE}%)
                </AppText>
                <AppText size={14} weight="medium" color={theme.text}>
                  ₦{fee.toLocaleString()}
                </AppText>
              </View>

              <View
                style={[
                  styles.summaryRow,
                  {
                    borderTopWidth: 1,
                    borderTopColor: theme.border,
                    paddingTop: 12,
                    marginTop: 8,
                  },
                ]}
              >
                <AppText size={14} weight="bold" color={theme.text}>
                  You will receive
                </AppText>
                <AppText size={16} weight="bold" color={theme.primary}>
                  ₦{netAmount.toLocaleString()}
                </AppText>
              </View>
            </View>
          ) : null}

          <TouchableOpacity
            style={[
              styles.withdrawButton,
              {
                backgroundColor: isButtonDisabled
                  ? theme.border
                  : theme.primary,
              },
            ]}
            onPress={handleWithdraw}
            disabled={isButtonDisabled}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <AppText
                  size={16}
                  weight="bold"
                  color={isButtonDisabled ? theme.textMuted : "#fff"}
                  style={{ marginRight: 8 }}
                >
                  Confirm Withdrawal
                </AppText>
                <ArrowUpRight
                  size={20}
                  color={isButtonDisabled ? theme.textMuted : "#fff"}
                />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.noteContainer}>
            <CheckCircle size={16} color={theme.textMuted} />
            <AppText
              size={12}
              color={theme.textMuted}
              style={{ marginLeft: 8, flex: 1 }}
            >
              Funds will reflect within 30 minutes to 2 hours during normal
              banking operations.
            </AppText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* BANK PICKER MODAL */}
      <Modal
        visible={bankPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setSearchQuery("");
          setBankPickerVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => {
              setSearchQuery("");
              setBankPickerVisible(false);
            }}
          />
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.surface,
                height: "85%",
              },
            ]}
          >
            <View
              style={[styles.modalKnob, { backgroundColor: theme.border }]}
            />

            <View style={styles.pickerHeaderRow}>
              <AppText size={18} weight="bold" color={theme.text}>
                Select Destination Bank
              </AppText>
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery("");
                  setBankPickerVisible(false);
                }}
              >
                <X size={22} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.searchBarContainer,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                },
              ]}
            >
              <Search
                size={18}
                color={theme.textMuted}
                style={styles.searchIcon}
              />
              <TextInput
                style={[styles.searchInputField, { color: theme.text }]}
                placeholder="Search bank name..."
                placeholderTextColor={theme.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <X size={18} color={theme.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {bankList.length === 0 ? (
                <View style={{ padding: 40, alignItems: "center" }}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <AppText
                    size={14}
                    color={theme.textMuted}
                    style={{ marginTop: 12 }}
                  >
                    Loading bank registers...
                  </AppText>
                </View>
              ) : filteredBanks.length === 0 ? (
                <View style={{ padding: 40, alignItems: "center" }}>
                  <AlertCircle size={48} color={theme.textMuted} />
                  <AppText
                    size={14}
                    color={theme.textMuted}
                    style={{ marginTop: 12 }}
                  >
                    No banks match "{searchQuery}"
                  </AppText>
                </View>
              ) : (
                filteredBanks.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.bankItemRow,
                      { borderBottomColor: theme.border },
                    ]}
                    onPress={() => selectBankInstance(item.name, item.code)}
                  >
                    <AppText
                      size={15}
                      color={theme.text}
                      weight={
                        selectedBankCode === item.code ? "bold" : "regular"
                      }
                    >
                      {item.name}
                    </AppText>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* SUCCESS / ERROR MODAL */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={handleModalClose}
          />
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.surface, paddingHorizontal: 24 },
            ]}
          >
            <View
              style={[styles.modalKnob, { backgroundColor: theme.border }]}
            />

            <View style={styles.modalIconContainer}>
              {modalType === "success" ? (
                <CheckCircle size={64} color="#22c55e" />
              ) : (
                <AlertCircle size={64} color="#ef4444" />
              )}
            </View>

            <AppText
              size={20}
              weight="bold"
              color={theme.text}
              style={{ textAlign: "center", marginBottom: 12 }}
            >
              {modalTitle}
            </AppText>
            <AppText
              size={14}
              color={theme.textMuted}
              style={{
                textAlign: "center",
                lineHeight: 22,
                marginBottom: 32,
              }}
            >
              {modalMessage}
            </AppText>

            <TouchableOpacity
              style={[
                styles.modalButton,
                {
                  backgroundColor:
                    modalType === "success" ? "#22c55e" : theme.primary,
                },
              ]}
              onPress={handleModalClose}
            >
              <AppText size={16} weight="bold" color="#fff">
                {modalType === "success" ? "Done" : "Got it"}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardContainer: { flex: 1 },
  headerGradient: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,

  },
  headerSafeArea: {
    paddingTop: Platform.OS === "ios" ? 10 : StatusBar.currentHeight || 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 8 },

  mainScrollView: { flex: 1 },
  scrollContentLayout: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },

  mainBalanceCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1.5,
    marginBottom: 24,
    alignItems: "center",
  },
  balanceDivider: {
    height: 1,
    width: "100%",
    marginVertical: 16,
  },
  subBalanceGrid: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  subBalanceItem: {
    flex: 1,
    alignItems: "center",
  },
  verticalDivider: {
    width: 1,
    height: 30,
  },

  errorAlertBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },

  formCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
  },
  label: { marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  pickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  summaryCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: "row",
    marginTop: 12,
    justifyContent: "space-between",
  },

  withdrawButton: {
    height: 56,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,

  },

  noteContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 28,
    paddingHorizontal: 8,
  },

  /* Modal Styles - Unified */
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  modalDismissArea: { flex: 1 },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    width: "100%",
  },
  modalKnob: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
    marginVertical: 12,
  },

  pickerHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 24,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 12,
  },
  searchIcon: { marginRight: 10 },
  searchInputField: { flex: 1, fontSize: 15 },

  bankItemRow: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },

  modalIconContainer: { marginTop: 20, marginBottom: 16, alignItems: "center" },
  modalButton: {
    width: "100%",
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
});
