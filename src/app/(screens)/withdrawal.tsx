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

// Redux Integration Imports
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/api/store";
import {
  fetchWallet,
  fetchBankList,
  requestWithdrawal,
  resolveAccount,
} from "@/api/slices/wallet.slice";

export default function WithdrawScreen() {
  const { theme: colors, isDark } = useTheme();
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
  const isExceedingWithdrawable = parsedAmount > withdrawableBalance;
  const isButtonDisabled =
    isLoading ||
    isResolving ||
    !accountName.trim() ||
    isExceedingWithdrawable ||
    parsedAmount <= 0;

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
        {/* Dynamic Multi-Balance Display Matrix */}
        <View
          style={[
            styles.mainBalanceCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <AppText
            size={12}
            color={colors.primary}
            weight="bold"
            style={{ letterSpacing: 0.8 }}
          >
            WITHDRAWABLE AVAILABLE BALANCE
          </AppText>
          <AppText
            size={40}
            weight="bold"
            color={colors.text}
            style={{ marginTop: 6 }}
          >
            ₦{withdrawableBalance.toLocaleString()}
          </AppText>

          <View
            style={[styles.balanceDivider, { backgroundColor: colors.border }]}
          />

          <View style={styles.subBalanceGrid}>
            <View style={styles.subBalanceItem}>
              <AppText size={11} color={colors.textMuted} weight="medium">
                TOTAL WALLET VALUE
              </AppText>
              <AppText
                size={15}
                weight="bold"
                color={colors.text}
                style={{ marginTop: 2 }}
              >
                ₦{balance.toLocaleString()}
              </AppText>
            </View>

            <View
              style={[
                styles.verticalDivider,
                { backgroundColor: colors.border },
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
              {pendingEscrowAmount.toLocaleString()} is currently locked safely
              in escrow.
            </AppText>
          </View>
        )}

        <AppText
          size={12}
          weight="bold"
          color={colors.textMuted}
          style={{
            marginBottom: 12,
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          WITHDRAWAL CONFIGURATION
        </AppText>

        <View
          style={[
            styles.formCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {/* Amount Field */}
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

          {/* Bank Picker Dropdown */}
          <AppText
            size={13}
            weight="medium"
            color={colors.text}
            style={[styles.label, { marginTop: 18 }]}
          >
            Select Bank
          </AppText>
          <TouchableOpacity
            style={[
              styles.input,
              styles.pickerTrigger,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setBankPickerVisible(true)}
          >
            <AppText size={15} color={colors.text}>
              {selectedBankName}
            </AppText>
            <ChevronDown size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Account Number Field */}
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
            placeholder="Enter 10-digit account number"
            placeholderTextColor={colors.textMuted}
            value={accountNumber}
            onChangeText={setAccountNumber}
            keyboardType="numeric"
            maxLength={10}
          />

          {/* Account Name Field */}
          <AppText
            size={13}
            weight="medium"
            color={colors.text}
            style={[styles.label, { marginTop: 18 }]}
          >
            Account Name
          </AppText>
          <View style={{ justifyContent: "center" }}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? "#1f1f1f" : "#f5f5f5",
                  color: colors.text,
                  borderColor: colors.border,
                  paddingRight: 40,
                },
              ]}
              placeholder="Auto-populated holder name"
              placeholderTextColor={colors.textMuted}
              value={accountName}
              editable={false}
            />
            {isResolving && (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ position: "absolute", right: 14 }}
              />
            )}
          </View>
        </View>

        {/* Summary Card */}
        {amount && !isNaN(parsedAmount) ? (
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
              <AppText
                size={15}
                weight="bold"
                color={isExceedingWithdrawable ? "#EF4444" : colors.text}
              >
                ₦{parsedAmount.toLocaleString()}
              </AppText>
            </View>
            <View style={styles.summaryRow}>
              <AppText size={14} color={colors.textMuted}>
                Fee
              </AppText>
              <AppText size={14} weight="medium" color={colors.text}>
                Free (First withdrawal)
              </AppText>
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            styles.withdrawButton,
            {
              backgroundColor: isButtonDisabled
                ? colors.border
                : colors.primary,
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
                color={isButtonDisabled ? colors.textMuted : "#fff"}
                style={{ marginRight: 8 }}
              >
                Confirm Withdrawal
              </AppText>
              <ArrowUpRight
                size={20}
                color={isButtonDisabled ? colors.textMuted : "#fff"}
              />
            </>
          )}
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

      {/* MODAL 1: Bank Picker Bottom Sheet */}
      <Modal
        visible={bankPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setSearchQuery("");
          setBankPickerVisible(false);
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            setSearchQuery("");
            setBankPickerVisible(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalContent,
                  {
                    backgroundColor: colors.surface,
                    minHeight: "85%",
                    maxHeight: "90%",
                  },
                ]}
              >
                <View style={styles.modalIndicator} />
                <View style={styles.pickerHeaderRow}>
                  <AppText size={16} weight="bold" color={colors.text}>
                    Select Destination Bank
                  </AppText>
                  <TouchableOpacity
                    onPress={() => {
                      setSearchQuery("");
                      setBankPickerVisible(false);
                    }}
                  >
                    <X size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <View
                  style={[
                    styles.searchBarContainer,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Search
                    size={18}
                    color={colors.textMuted}
                    style={styles.searchIcon}
                  />
                  <TextInput
                    style={[styles.searchInputField, { color: colors.text }]}
                    placeholder="Search bank name..."
                    placeholderTextColor={colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {searchQuery ? (
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                      <X
                        size={16}
                        color={colors.textMuted}
                        style={{ padding: 4 }}
                      />
                    </TouchableOpacity>
                  ) : null}
                </View>

                <ScrollView
                  style={{ width: "100%" }}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {bankList.length === 0 ? (
                    <View style={{ padding: 24, alignItems: "center" }}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <AppText
                        size={14}
                        color={colors.textMuted}
                        style={{ marginTop: 8 }}
                      >
                        Loading bank registers...
                      </AppText>
                    </View>
                  ) : filteredBanks.length === 0 ? (
                    <View style={{ padding: 32, alignItems: "center" }}>
                      <AlertCircle size={32} color={colors.textMuted} />
                      <AppText
                        size={14}
                        color={colors.textMuted}
                        style={{ marginTop: 8 }}
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
                          { borderBottomColor: colors.border },
                        ]}
                        onPress={() => selectBankInstance(item.name, item.code)}
                      >
                        <AppText
                          size={15}
                          color={colors.text}
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
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* MODAL 2: Receipt Status Feedback Sheets */}
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
  mainBalanceCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
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
    padding: 12,
    marginBottom: 20,
  },
  formCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  label: { marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  pickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerHeaderRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
  },
  searchIcon: { marginRight: 8 },
  searchInputField: { flex: 1, fontSize: 14, paddingVertical: 8 },
  bankItemRow: { width: "100%", paddingVertical: 14, borderBottomWidth: 0.5 },
  summaryCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: "row",
    marginTop: 10,
    justifyContent: "space-between",
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
  closeButton: { position: "absolute", right: 20, top: 20, padding: 4 },
  modalIconContainer: { marginBottom: 16, marginTop: 8 },
  modalButton: {
    width: "100%",
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
});
