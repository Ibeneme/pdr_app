import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Alert,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle,
  AlertCircle,
  X,
  ChevronDown,
  Search,
  RefreshCw,
  Info,
  Check,
} from "lucide-react-native";
import { AppText } from "@/components/AppText";

import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/api/store";
import {
  fetchWallet,
  fetchBankList,
  requestWithdrawal,
  resolveAccount,
} from "@/api/slices/wallet.slice";

const WITHDRAWAL_FEE_PERCENTAGE = 10;

// Same neutral ink tone used in WalletScreen
const INK = "#111318";

export default function WithdrawScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const [walletData, setWalletData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { bankList: rawBankList } = useSelector(
    (state: RootState) => state.wallet
  );

  useFocusEffect(
    useCallback(() => {
      console.log(
        "[UI_FOCUS_LIFECYCLE] 🔄 Wallet screen has come into view. Fetching updated ledger stats..."
      );
      setIsLoading(true);

      dispatch(fetchWallet())
        .unwrap()
        .then((data) => {
          console.log(
            "[UI_FOCUS_SUCCESS] ✅ Wallet data updated successfully:",
            data
          );
          // Store response in local state
          setWalletData(data?.wallet || data);
        })
        .catch((error) => {
          console.error(
            "[UI_FOCUS_ERROR] ❌ Failed to fetch wallet data:",
            error
          );
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, [dispatch])
  );

  const balance = walletData?.balance || 0;
  const withdrawableBalance = walletData?.withdrawableBalance || 0;
  const earnings = walletData?.earnings || [];
  const withdrawals = walletData?.withdrawals || [];

  const bankList = rawBankList ?? [];

  const [amount, setAmount] = useState("");
  const [selectedBankCode, setSelectedBankCode] = useState("");
  const [selectedBankName, setSelectedBankName] = useState("Select a Bank");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isResolving, setIsResolving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [bankPickerVisible, setBankPickerVisible] = useState(false);
  const [confirmSheetVisible, setConfirmSheetVisible] = useState(false);
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);
  const [modalType, setModalType] = useState<"success" | "error">("error");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  // Soft neutral surfaces matching WalletScreen
  const pageBg = isDark ? theme.background : "#ECECE7";
  const heroCardBg = isDark ? theme.surface : "#FFFFFF";
  const tileBg = isDark ? theme.background : "#F4F4F1";

  useEffect(() => {
    dispatch(fetchWallet());
    dispatch(fetchBankList());
  }, [dispatch]);

  useEffect(() => {
    const autoResolveBankDetails = async () => {
      if (accountNumber.length === 10 && selectedBankCode) {
        setIsResolving(true);
        setAccountName("");

        const resultAction = await dispatch(
          resolveAccount({ accountNumber, bankCode: selectedBankCode })
        );

        setIsResolving(false);

        if (resolveAccount.fulfilled.match(resultAction)) {
          setAccountName(resultAction.payload.accountName);
        } else {
          const errorMsg = (resultAction.payload as string) || "Unknown error";
          triggerModal("error", "Account Verification Failed", errorMsg);
        }
      } else {
        setAccountName("");
      }
    };

    autoResolveBankDetails();
  }, [accountNumber, selectedBankCode, dispatch]);

  const pendingEscrowAmount = useMemo(() => {
    if (!earnings || !Array.isArray(earnings)) return 0;
    return earnings
      .filter((e: any) => e.status === "pending")
      .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
  }, [earnings]);

  // Drives the segmented allocation bar on the balance card: how much of
  // the total balance is free to withdraw vs. sitting in escrow.
  const allocation = useMemo(() => {
    const total = Math.max(
      balance || 0,
      withdrawableBalance + pendingEscrowAmount,
      1
    );
    const withdrawableRatio = Math.min(withdrawableBalance / total, 1);
    const escrowRatio = Math.min(
      pendingEscrowAmount / total,
      1 - withdrawableRatio
    );
    const remainingRatio = Math.max(1 - withdrawableRatio - escrowRatio, 0);
    return { withdrawableRatio, escrowRatio, remainingRatio };
  }, [balance, withdrawableBalance, pendingEscrowAmount]);

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

  const handleReviewWithdrawal = () => {
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
        `Your active withdrawable balance is ₦${withdrawableBalance.toLocaleString()}.`
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

    // Everything checks out — show the review sheet instead of submitting
    // straight away, so the person can double-check the destination before
    // money actually moves.
    setConfirmSheetVisible(true);
  };

  const handleConfirmWithdrawal = async () => {
    const numericAmount = parseInt(amount, 10);

    const payload = {
      amount: numericAmount,
      bankDetails: {
        accountName: accountName.trim(),
        accountNumber: accountNumber,
        bankName: selectedBankName,
      },
    };

    setIsSubmittingWithdrawal(true);
    const resultAction = await dispatch(requestWithdrawal(payload));
    setIsSubmittingWithdrawal(false);
    setConfirmSheetVisible(false);

    if (requestWithdrawal.fulfilled.match(resultAction)) {
      triggerModal(
        "success",
        "Withdrawal Requested",
        `₦${numericAmount.toLocaleString()} has been queued for transfer to ${selectedBankName} • ${accountNumber}`
      );
    } else {
      const errorMsg =
        (resultAction.payload as string) || "An unexpected error occurred.";
      triggerModal("error", "Transaction Rejected", errorMsg);
    }
  };

  const selectBankInstance = (name: string, code: string) => {
    setSelectedBankName(name);
    setSelectedBankCode(code);
    setSearchQuery("");
    setBankPickerVisible(false);
  };

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
    <View style={[styles.container, { backgroundColor: pageBg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={styles.headerWrap}>
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.circleIconButton, { backgroundColor: heroCardBg }]}
              activeOpacity={0.7}
            >
              <ArrowLeft size={19} color={theme.text} />
            </TouchableOpacity>

            <AppText size={18} weight="bold" color={theme.text}>
              Withdraw Funds
            </AppText>

            <TouchableOpacity
              onPress={() => dispatch(fetchWallet())}
              style={[styles.circleIconButton, { backgroundColor: heroCardBg }]}
              activeOpacity={0.7}
            >
              <RefreshCw size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

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
          {/* Page info banner */}
          <View
            style={[
              styles.infoBanner,
              {
                backgroundColor: `${theme.primary}0A`,
                borderColor: `${theme.primary}25`,
              },
            ]}
          >
            <View style={styles.infoBannerHeader}>
              <Info size={16} color={theme.primary} />
              <AppText
                size={13}
                weight="bold"
                color={theme.primary}
                style={{ marginLeft: 6 }}
              >
                About Withdrawals
              </AppText>
            </View>
            <AppText size={13} color={theme.text} style={styles.infoBannerText}>
              Move your withdrawable balance to a Nigerian bank account. Funds
              held in escrow stay locked until the related delivery or ride is
              completed, and a {WITHDRAWAL_FEE_PERCENTAGE}% processing fee
              applies to every transfer.
            </AppText>
          </View>

          {/* Balance Hero Card */}
          <View
            style={[
              styles.balanceMasterCard,
              {
                backgroundColor: heroCardBg,
                shadowColor: isDark ? "#000" : "#8A8A78",
              },
            ]}
          >
            <View style={styles.cardTopRow}>
              <AppText
                size={12}
                weight="bold"
                color={theme.textMuted}
                style={{ letterSpacing: 0.8 }}
              >
                WITHDRAWABLE BALANCE
              </AppText>
              <View
                style={[styles.infoCircleButton, { backgroundColor: tileBg }]}
              >
                <Info size={13} color={theme.textMuted} />
              </View>
            </View>

            <AppText
              size={36}
              weight="bold"
              color={theme.text}
              style={{ marginVertical: 4, letterSpacing: -0.5 }}
            >
              ₦{withdrawableBalance.toLocaleString()}
            </AppText>

            <AppText
              size={13}
              color={theme.textMuted}
              style={{ marginBottom: 16 }}
            >
              Funds available for immediate withdrawal
            </AppText>

            {/* Segmented allocation bar — withdrawable / escrow / rest */}
            <View style={[styles.allocationTrack, { backgroundColor: tileBg }]}>
              {allocation.withdrawableRatio > 0 && (
                <View
                  style={[
                    styles.allocationSegment,
                    {
                      flex: allocation.withdrawableRatio,
                      backgroundColor: theme.primary,
                    },
                  ]}
                />
              )}
              {allocation.escrowRatio > 0 && (
                <View
                  style={[
                    styles.allocationSegment,
                    {
                      flex: allocation.escrowRatio,
                      backgroundColor: "#D97706",
                    },
                  ]}
                />
              )}
              {allocation.remainingRatio > 0 && (
                <View
                  style={[
                    styles.allocationSegment,
                    {
                      flex: allocation.remainingRatio,
                      backgroundColor: theme.border,
                    },
                  ]}
                />
              )}
            </View>

            <View style={styles.subBalanceGrid}>
              <View style={styles.subBalanceItem}>
                <View style={styles.legendRow}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: theme.primary },
                    ]}
                  />
                  <AppText size={11} color={theme.textMuted} weight="medium">
                    TOTAL VALUE
                  </AppText>
                </View>
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
                <View style={styles.legendRow}>
                  <View
                    style={[styles.legendDot, { backgroundColor: "#D97706" }]}
                  />
                  <AppText size={11} color="#D97706" weight="medium">
                    HELD IN ESCROW
                  </AppText>
                </View>
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

            {isExceedingWithdrawable && (
              <View
                style={[
                  styles.errorAlertBanner,
                  { backgroundColor: "rgba(239, 68, 68, 0.1)" },
                ]}
              >
                <AlertCircle size={16} color="#EF4444" />
                <AppText
                  size={12}
                  color="#EF4444"
                  weight="medium"
                  style={{ marginLeft: 8, flex: 1 }}
                >
                  Amount exceeds your withdrawable balance.
                </AppText>
              </View>
            )}
          </View>

          {/* Form Section */}
          <AppText
            size={11}
            weight="bold"
            color={theme.textMuted}
            style={{
              letterSpacing: 1.2,
              marginBottom: 12,
              paddingHorizontal: 4,
            }}
          >
            WITHDRAWAL DETAILS
          </AppText>

          <View
            style={[
              styles.formCard,
              {
                backgroundColor: heroCardBg,
                shadowColor: isDark ? "#000" : "#8A8A78",
              },
            ]}
          >
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
                { backgroundColor: tileBg, color: theme.text },
              ]}
              placeholder="0.00"
              placeholderTextColor={theme.textMuted}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

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
                { backgroundColor: tileBg },
              ]}
              onPress={() => setBankPickerVisible(true)}
            >
              <AppText size={15} color={theme.text}>
                {selectedBankName}
              </AppText>
              <ChevronDown size={18} color={theme.textMuted} />
            </TouchableOpacity>

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
                { backgroundColor: tileBg, color: theme.text },
              ]}
              placeholder="Enter 10-digit account number"
              placeholderTextColor={theme.textMuted}
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="numeric"
              maxLength={10}
            />

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
                    backgroundColor: tileBg,
                    color: theme.text,
                    paddingRight: 40,
                  },
                ]}
                placeholder="Auto-populated"
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
              {!isResolving && accountName.length > 0 && (
                <View style={styles.verifiedBadge}>
                  <Check size={12} color="#fff" />
                </View>
              )}
            </View>
          </View>

          {/* Summary */}
          {amount && parsedAmount > 0 && (
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: heroCardBg,
                  shadowColor: isDark ? "#000" : "#8A8A78",
                },
              ]}
            >
              <AppText size={14} weight="bold" color={theme.text}>
                Withdrawal Summary
              </AppText>
              <View style={styles.summaryRow}>
                <AppText size={14} color={theme.textMuted}>
                  Amount
                </AppText>
                <AppText size={15} weight="bold" color={theme.text}>
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
          )}

          <TouchableOpacity
            style={[
              styles.withdrawButton,
              {
                backgroundColor: isButtonDisabled ? theme.border : INK,
                marginBottom: 64,
              },
            ]}
            onPress={handleReviewWithdrawal}
            disabled={isButtonDisabled}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
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
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bank Picker Modal */}
      <Modal
        visible={bankPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBankPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            onPress={() => setBankPickerVisible(false)}
          />
          <View
            style={[
              styles.modalContent,
              { backgroundColor: heroCardBg, height: "85%" },
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
                onPress={() => setBankPickerVisible(false)}
                style={[styles.circleIconButton, { backgroundColor: tileBg }]}
              >
                <X size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <View
              style={[styles.searchBarContainer, { backgroundColor: tileBg }]}
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
              />
            </View>

            <ScrollView
              style={{ flex: 1, paddingHorizontal: 16 }}
              contentContainerStyle={{ paddingBottom: 24, paddingTop: 4 }}
              keyboardShouldPersistTaps="handled"
            >
              {filteredBanks.map((item) => {
                const isSelected = item.code === selectedBankCode;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.bankItemRow,
                      isSelected
                        ? { backgroundColor: INK }
                        : { backgroundColor: tileBg },
                    ]}
                    onPress={() => selectBankInstance(item.name, item.code)}
                    activeOpacity={0.8}
                  >
                    <AppText
                      size={15}
                      weight={isSelected ? "bold" : "regular"}
                      color={isSelected ? "#fff" : theme.text}
                    >
                      {item.name}
                    </AppText>
                    {isSelected && (
                      <View style={styles.bankCheckCircle}>
                        <Check size={12} color={INK} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Review & Confirm Withdrawal Sheet */}
      <Modal
        visible={confirmSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setConfirmSheetVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            onPress={() =>
              !isSubmittingWithdrawal && setConfirmSheetVisible(false)
            }
          />
          <View
            style={[
              styles.modalContent,
              { backgroundColor: heroCardBg, paddingHorizontal: 24 },
            ]}
          >
            <View
              style={[styles.modalKnob, { backgroundColor: theme.border }]}
            />

            <AppText
              size={18}
              weight="bold"
              color={theme.text}
              style={{ marginBottom: 4 }}
            >
              Review Withdrawal
            </AppText>
            <AppText
              size={13}
              color={theme.textMuted}
              style={{ marginBottom: 20, lineHeight: 18 }}
            >
              Double-check the destination below. This can't be undone once
              submitted.
            </AppText>

            <View style={[styles.reviewHeroBlock, { backgroundColor: tileBg }]}>
              <AppText size={11} weight="bold" color={theme.textMuted}>
                YOU WILL RECEIVE
              </AppText>
              <AppText
                size={30}
                weight="bold"
                color={theme.text}
                style={{ marginTop: 4 }}
              >
                ₦{netAmount.toLocaleString()}
              </AppText>
            </View>

            <View
              style={[styles.reviewDetailsBlock, { borderColor: theme.border }]}
            >
              <View style={styles.reviewRow}>
                <AppText size={13} color={theme.textMuted}>
                  Bank
                </AppText>
                <AppText size={13} weight="bold" color={theme.text}>
                  {selectedBankName}
                </AppText>
              </View>
              <View
                style={[
                  styles.reviewRow,
                  { borderTopWidth: 1, borderTopColor: theme.border },
                ]}
              >
                <AppText size={13} color={theme.textMuted}>
                  Account Number
                </AppText>
                <AppText size={13} weight="bold" color={theme.text}>
                  {accountNumber}
                </AppText>
              </View>
              <View
                style={[
                  styles.reviewRow,
                  { borderTopWidth: 1, borderTopColor: theme.border },
                ]}
              >
                <AppText size={13} color={theme.textMuted}>
                  Account Name
                </AppText>
                <AppText
                  size={13}
                  weight="bold"
                  color={theme.text}
                  numberOfLines={1}
                >
                  {accountName}
                </AppText>
              </View>
              <View
                style={[
                  styles.reviewRow,
                  { borderTopWidth: 1, borderTopColor: theme.border },
                ]}
              >
                <AppText size={13} color={theme.textMuted}>
                  Amount Requested
                </AppText>
                <AppText size={13} weight="bold" color={theme.text}>
                  ₦{parsedAmount.toLocaleString()}
                </AppText>
              </View>
              <View
                style={[
                  styles.reviewRow,
                  { borderTopWidth: 1, borderTopColor: theme.border },
                ]}
              >
                <AppText size={13} color={theme.textMuted}>
                  Processing Fee ({WITHDRAWAL_FEE_PERCENTAGE}%)
                </AppText>
                <AppText size={13} weight="bold" color={theme.text}>
                  ₦{fee.toLocaleString()}
                </AppText>
              </View>
            </View>

            <View style={styles.reviewButtonRow}>
              <TouchableOpacity
                style={[styles.reviewGoBackButton, { backgroundColor: tileBg }]}
                onPress={() => setConfirmSheetVisible(false)}
                disabled={isSubmittingWithdrawal}
                activeOpacity={0.8}
              >
                <AppText size={15} weight="bold" color={theme.text}>
                  Go Back
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reviewConfirmButton, { backgroundColor: INK }]}
                onPress={handleConfirmWithdrawal}
                disabled={isSubmittingWithdrawal}
                activeOpacity={0.85}
              >
                {isSubmittingWithdrawal ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <AppText size={15} weight="bold" color="#fff">
                    Yes, Withdraw
                  </AppText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success / Error Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            onPress={handleModalClose}
          />
          <View
            style={[
              styles.modalContent,
              { backgroundColor: heroCardBg, paddingHorizontal: 24 },
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
              style={{ textAlign: "center", lineHeight: 22, marginBottom: 32 }}
            >
              {modalMessage}
            </AppText>

            <TouchableOpacity
              style={[
                styles.modalButton,
                {
                  backgroundColor: modalType === "success" ? "#22c55e" : INK,
                  marginBottom: 64,
                },
              ]}
              onPress={handleModalClose}
              activeOpacity={0.85}
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
  headerWrap: { paddingBottom: 4 },
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
  circleIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },

  mainScrollView: { flex: 1 },
  scrollContentLayout: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },

  infoBanner: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  infoBannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  infoBannerText: {
    lineHeight: 18,
  },

  reviewHeroBlock: {
    borderRadius: 20,
    padding: 18,
    alignItems: "center",
    marginBottom: 16,
  },
  reviewDetailsBlock: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 20,
  },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 12,
  },
  reviewButtonRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: Platform.OS === "ios" ? 34 : 64,
  },
  reviewGoBackButton: {
    flex: 1,
    height: 54,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  reviewConfirmButton: {
    flex: 1,
    height: 54,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },

  balanceMasterCard: {
    borderRadius: 28,
    padding: 24,
    marginBottom: 24,
    alignItems: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  infoCircleButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  allocationTrack: {
    flexDirection: "row",
    width: "100%",
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 16,
  },
  allocationSegment: {
    height: "100%",
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    justifyContent: "center",
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  subBalanceGrid: { flexDirection: "row", alignItems: "center", width: "100%" },
  subBalanceItem: { flex: 1, alignItems: "center" },
  verticalDivider: { width: 1, height: 30 },

  errorAlertBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    width: "100%",
  },

  formCard: {
    borderRadius: 28,
    padding: 20,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 1,
  },
  label: { marginBottom: 6 },
  input: {
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
  verifiedBadge: {
    position: "absolute",
    right: 14,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#22c55e",
    justifyContent: "center",
    alignItems: "center",
  },

  summaryCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 1,
  },
  summaryRow: {
    flexDirection: "row",
    marginTop: 12,
    justifyContent: "space-between",
  },

  withdrawButton: {
    height: 58,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  modalDismissArea: { flex: 1 },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
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
    borderRadius: 999,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 14,
  },
  searchIcon: { marginRight: 10 },
  searchInputField: { flex: 1, fontSize: 15 },

  bankItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 18,
    marginBottom: 8,
  },
  bankCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },

  modalIconContainer: { marginTop: 20, marginBottom: 16, alignItems: "center" },
  modalButton: {
    width: "100%",
    height: 54,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
});
