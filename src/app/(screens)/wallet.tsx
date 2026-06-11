import React, { useState, useCallback, useMemo } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  Modal,
  TextInput,
  Dimensions,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { WebView } from "react-native-webview";
import { useRouter, useFocusEffect } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { AppText } from "@/components/AppText";

import { useDispatch, useSelector } from "react-redux";
import {
  fetchWallet,
  initializeFunding,
  verifyAndTopUp,
} from "@/api/slices/wallet.slice";
import { getUser } from "@/api/secureStore";
import { AppDispatch } from "@/api/store";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function WalletScreen() {
  const { theme: colors, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  // Redux State
  const { balance, withdrawableBalance, earnings, withdrawals, isLoading } =
    useSelector((state: any) => state.wallet);

  // Local State
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [fundModalVisible, setFundModalVisible] = useState(false);
  const [fundAmount, setFundAmount] = useState("");

  // Paystack WebView Flow Local States
  const [paystackUrl, setPaystackUrl] = useState<string | null>(null);
  const [webViewModalVisible, setWebViewModalVisible] = useState(false);
  const [activeReference, setActiveReference] = useState<string | null>(null);

  console.warn(balance, withdrawableBalance, earnings, withdrawals, isLoading);
  const quickAmounts = [1000, 5000, 10000, 25000];

  useFocusEffect(
    useCallback(() => {
      console.log(
        "[UI_FOCUS_LIFECYCLE] 🔄 Wallet screen has come into view. Fetching updated ledger stats..."
      );

      dispatch(fetchWallet())
        .unwrap()
        .then((data) => {
          console.log(
            "[UI_FOCUS_SUCCESS] ✅ Wallet data updated successfully:",
            data
          );
        })
        .catch((error) => {
          console.error(
            "[UI_FOCUS_ERROR] ❌ Failed to fetch wallet data:",
            error
          );
        });
    }, [dispatch])
  );

  // Calculate values wrapped inside active escrow holding locks
  const pendingEscrowAmount = useMemo(() => {
    if (!earnings || !Array.isArray(earnings)) return 0;
    return earnings
      .filter((e: any) => e.status === "pending")
      .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
  }, [earnings]);

  const handleWebViewNavigationStateChange = async (navState: any) => {
    const { url } = navState;
    console.log("[PAYSTACK_NAVIGATION_INTERCEPTOR] URL Event Trace Log:", url);

    const isSuccessRedirect =
      url.includes("callback") ||
      url.includes("checkout/done") ||
      url.includes("trx_reference=") ||
      url.includes("reference=");

    if (isSuccessRedirect) {
      triggerVerificationSequence();
    } else if (url.includes("paystack.com/close")) {
      handlePaymentCancellation();
    }
  };

  const handleWebViewMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (
        data.event === "charge:success" ||
        data.message === "Approved" ||
        data.status === "success"
      ) {
        triggerVerificationSequence();
      }
    } catch (err) {}
  };

  const triggerVerificationSequence = async () => {
    setWebViewModalVisible(false);
    setPaystackUrl(null);

    if (activeReference) {
      try {
        await dispatch(verifyAndTopUp(activeReference)).unwrap();
        dispatch(fetchWallet());
        Alert.alert(
          "Funding Successful",
          `Successfully topped up your wallet!`
        );
        setFundAmount("");
        setActiveReference(null);
      } catch (verificationError: any) {
        Alert.alert(
          "Verification Check Incomplete",
          verificationError || "Please contact support if funds were deducted."
        );
      }
    } else {
      dispatch(fetchWallet());
    }
  };

  const handlePaymentCancellation = () => {
    setWebViewModalVisible(false);
    setPaystackUrl(null);
    setActiveReference(null);
    dispatch(fetchWallet());
    Alert.alert(
      "Payment Cancelled",
      "You closed the secure billing session checkout screen."
    );
  };

  const handleFundAccount = async () => {
    const amount = parseInt(fundAmount);
    if (!amount || amount < 100) {
      Alert.alert("Invalid Amount", "Minimum funding amount is ₦100");
      return;
    }

    try {
      const user = await getUser();
      const email = user?.email;

      if (!email) {
        Alert.alert("Error", "User email not found. Please log in again.");
        return;
      }

      const result = await dispatch(
        initializeFunding({ amount: Number(fundAmount), email })
      ).unwrap();

      if (result.authorization_url) {
        setActiveReference(result.reference);
        setFundModalVisible(false);
        setPaystackUrl(result.authorization_url);
        setWebViewModalVisible(true);
      } else {
        Alert.alert(
          "Error",
          "Initialization failed to pass gateway parameters token headers safely."
        );
      }
    } catch (err: any) {
      Alert.alert("Funding Failed", err || "Please try again later");
    }
  };

  const handleViewOrderDetails = (tx: any) => {
    setSelectedTx(null);

    if (tx.raw?.status === "pending" || tx.status === "PENDING ESCROW") {
      Alert.alert(
        "Escrow Holding Active",
        "This payment is currently held as pending. You cannot access details or initiate withdrawals until this service clears."
      );
      return;
    }

    const serviceId = tx.raw?.serviceId;
    const source = tx.raw?.source;

    if (!serviceId) {
      Alert.alert(
        "Notice",
        "This older transaction has no linked service item profile history associated with it."
      );
      return;
    }

    if (source === "deliver_a_parcel") {
      return router.push({
        pathname: "/(details)/details",
        params: { id: serviceId },
      });
    }

    if (source === "ride_offer" || source === "ride_join") {
      return router.push({
        pathname: "/(details)/ride",
        params: {
          id: serviceId,
          driverName: tx.raw?.payerName || "Driver",
          pickup: "View Details",
          dropoff: "View Details",
          fare: tx.raw?.amount || "",
          seats: 1,
        },
      });
    }
  };

  const transactions = [
    ...earnings.map((e: any) => ({
      id: e.reference || e._id,
      type: "credit",
      title:
        e.source === "deliver_a_parcel"
          ? "Parcel Revenue Received"
          : e.source || "Ride Revenue Received",
      amount: `+₦${e.amount.toLocaleString()}`,
      date: new Date(e.createdAt).toLocaleDateString("en-NG", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      service: e.source || "Ride Sharing",
      route:
        e.source === "deliver_a_parcel"
          ? "Delivery Order Log"
          : "Ride Sharing Journey",
      driver: e.payerName || "System",
      status: e.status === "pending" ? "PENDING ESCROW" : "Settled",
      raw: e,
    })),
    ...withdrawals.map((w: any) => ({
      id: w.reference || w._id,
      type: "debit",
      title: "Bank Withdrawal",
      amount: `-₦${w.amount.toLocaleString()}`,
      date: new Date(w.createdAt).toLocaleDateString("en-NG", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      service: "Bank Transfer",
      route: "Not Applicable",
      driver: w.bankDetails?.accountName || "N/A",
      status: w.status === "success" ? "Processed" : w.status.toUpperCase(),
      raw: w,
    })),
  ].sort(
    (a, b) =>
      new Date(b.raw.createdAt).getTime() - new Date(a.raw.createdAt).getTime()
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* --- HEADER DOCK CONTAINER --- */}
      <SafeAreaView
        style={[
          styles.headerSafeArea,
          {
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          },
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
            <AppText size={14} weight="bold" color={colors.text}>
              Back
            </AppText>
          </TouchableOpacity>
          <AppText size={18} weight="bold" color={colors.text}>
            Wallet
          </AppText>
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* --- DYNAMIC MULTI-BALANCE MASTER VIEW BOARD --- */}
        <View
          style={[
            styles.balanceMasterCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <AppText
            size={12}
            weight="bold"
            color={colors.primary}
            style={{ letterSpacing: 0.8 }}
          >
            WITHDRAWABLE BALANCE
          </AppText>
          <AppText
            size={36}
            weight="bold"
            color={colors.text}
            style={{ marginVertical: 4, letterSpacing: -0.5 }}
          >
            ₦{withdrawableBalance?.toLocaleString() || "0"}
          </AppText>

          <View
            style={[styles.balanceDivider, { backgroundColor: colors.border }]}
          />

          <View style={styles.subBalanceGrid}>
            <View style={styles.subBalanceItem}>
              <AppText size={11} color={colors.textMuted} weight="medium">
                TOTAL VALUE
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
                HELD IN ESCROW
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

          <View style={styles.balanceTwinActionsRow}>
            <TouchableOpacity
              style={[
                styles.actionCellBtn,
                {
                  backgroundColor: colors.background,
                  borderWidth: 1.5,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => router.push("/(screens)/withdrawal")}
            >
              <AppText size={14} weight="bold" color={colors.text}>
                Transfer Out
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- RECENT TRANSACTION STREAMS --- */}
        <View style={styles.sectionTitleLayoutDock}>
          <AppText
            size={11}
            weight="bold"
            color={colors.textMuted}
            style={{ letterSpacing: 1.2 }}
          >
            ACCOUNT TRANSACTION LOGS
          </AppText>
          <AppText size={11} weight="bold" color={colors.primary}>
            {transactions.length} Total Units
          </AppText>
        </View>

        {isLoading && transactions.length === 0 ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: 50 }}
          />
        ) : (
          transactions.map((tx) => {
            const isIncome = tx.type === "credit";
            const isPending = tx.status === "PENDING ESCROW";

            return (
              <TouchableOpacity
                key={tx.id}
                style={[
                  styles.transactionLogCardRow,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setSelectedTx(tx)}
                activeOpacity={0.9}
              >
                <View style={styles.txLogInternalStructure}>
                  <View
                    style={[
                      styles.verticalIndicatorPillMarker,
                      {
                        backgroundColor: isPending
                          ? "#D97706"
                          : isIncome
                          ? "#22C55E"
                          : "#EF4444",
                      },
                    ]}
                  />
                  <View style={{ flex: 1, paddingLeft: 12 }}>
                    <AppText
                      size={14}
                      weight="bold"
                      color={colors.text}
                      numberOfLines={1}
                    >
                      {tx.title}
                    </AppText>
                    <AppText
                      size={12}
                      weight="medium"
                      color={colors.textMuted}
                      style={{ marginVertical: 2 }}
                    >
                      {tx.route}
                    </AppText>
                    <AppText size={11} color={colors.textMuted}>
                      {tx.date}
                    </AppText>
                  </View>
                  <View
                    style={{ alignItems: "flex-end", justifyContent: "center" }}
                  >
                    <AppText
                      size={15}
                      weight="bold"
                      color={
                        isPending ? "#D97706" : isIncome ? "#22C55E" : "#EF4444"
                      }
                    >
                      {tx.amount}
                    </AppText>
                    <View
                      style={[
                        styles.statusMiniCapsule,
                        {
                          backgroundColor: colors.background,
                          borderColor: isPending ? "#D97706" : colors.border,
                        },
                      ]}
                    >
                      <AppText
                        size={9}
                        weight="bold"
                        color={isPending ? "#D97706" : colors.text}
                      >
                        {tx.status.toUpperCase()}
                      </AppText>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* ==================== MODAL 1: TRANSACTION LEDGER DETAILS LAYER ==================== */}
      <Modal
        animationType="slide"
        transparent
        visible={!!selectedTx}
        onRequestClose={() => setSelectedTx(null)}
      >
        <View style={styles.modalScreenLayoutOverlayMask}>
          <View
            style={[
              styles.detailModalPresentationSheet,
              { backgroundColor: colors.surface },
            ]}
          >
            <View style={styles.modalHeaderActionBarLayout}>
              <AppText size={16} weight="bold" color={colors.text}>
                Transaction Details
              </AppText>
              <TouchableOpacity
                style={[
                  styles.closeLabelActionBtn,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setSelectedTx(null)}
              >
                <AppText size={12} weight="bold" color={colors.text}>
                  Close
                </AppText>
              </TouchableOpacity>
            </View>

            {selectedTx && (
              <ScrollView
                style={{ paddingHorizontal: 24 }}
                showsVerticalScrollIndicator={false}
              >
                <View
                  style={[
                    styles.centerAuditHeroUnitBanner,
                    {
                      backgroundColor: colors.background,
                      borderColor:
                        selectedTx.status === "PENDING ESCROW"
                          ? "#D97706"
                          : colors.border,
                    },
                  ]}
                >
                  <AppText size={11} weight="bold" color={colors.textMuted}>
                    TRANSACTION VALUE
                  </AppText>
                  <AppText
                    size={32}
                    weight="bold"
                    color={
                      selectedTx.status === "PENDING ESCROW"
                        ? "#D97706"
                        : selectedTx.type === "credit"
                        ? "#22C55E"
                        : "#EF4444"
                    }
                    style={{ marginVertical: 6 }}
                  >
                    {selectedTx.amount}
                  </AppText>
                  <AppText
                    size={11}
                    weight="bold"
                    color={colors.text}
                    numberOfLines={1}
                  >
                    Ref: {selectedTx.id}
                  </AppText>
                </View>

                <View
                  style={[
                    styles.auditFieldMetadataBlock,
                    { borderColor: colors.border },
                  ]}
                >
                  <View style={styles.metadataSplitRowAlign}>
                    <AppText size={13} color={colors.textMuted}>
                      Service Context
                    </AppText>
                    <AppText size={13} weight="bold" color={colors.text}>
                      {selectedTx.service}
                    </AppText>
                  </View>

                  <View style={styles.metadataSplitRowAlign}>
                    <AppText size={13} color={colors.textMuted}>
                      Status Check
                    </AppText>
                    <AppText
                      size={13}
                      weight="bold"
                      color={
                        selectedTx.status === "PENDING ESCROW"
                          ? "#D97706"
                          : colors.text
                      }
                    >
                      {selectedTx.status}
                    </AppText>
                  </View>

                  <View style={styles.metadataSplitRowAlign}>
                    <AppText size={13} color={colors.textMuted}>
                      Payer/Beneficiary
                    </AppText>
                    <AppText size={13} weight="bold" color={colors.text}>
                      {selectedTx.driver}
                    </AppText>
                  </View>

                  {selectedTx.raw?.payerEmail && (
                    <View style={styles.metadataSplitRowAlign}>
                      <AppText size={13} color={colors.textMuted}>
                        Payer Email
                      </AppText>
                      <AppText size={13} weight="bold" color={colors.text}>
                        {selectedTx.raw.payerEmail}
                      </AppText>
                    </View>
                  )}

                  <View style={styles.metadataSplitRowAlign}>
                    <AppText size={13} color={colors.textMuted}>
                      Timestamp
                    </AppText>
                    <AppText size={13} weight="bold" color={colors.text}>
                      {selectedTx.date}
                    </AppText>
                  </View>
                </View>

                {selectedTx.type === "credit" &&
                  selectedTx.raw?.serviceId &&
                  selectedTx.status !== "PENDING ESCROW" && (
                    <TouchableOpacity
                      style={[
                        styles.primaryRoutingButton,
                        { backgroundColor: colors.primary },
                      ]}
                      onPress={() => handleViewOrderDetails(selectedTx)}
                    >
                      <AppText size={14} weight="bold" color="#FFF">
                        View Order Details
                      </AppText>
                    </TouchableOpacity>
                  )}

                {selectedTx.status === "PENDING ESCROW" && (
                  <View
                    style={[
                      styles.primaryRoutingButton,
                      {
                        backgroundColor: "rgba(217, 119, 6, 0.1)",
                        borderWidth: 1,
                        borderColor: "#D97706",
                      },
                    ]}
                  >
                    <AppText size={14} weight="bold" color="#D97706">
                      Pending Completion Clearance
                    </AppText>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ==================== MODAL 2: INJECTION/FUND ESCROW ACCOUNT SHEET ==================== */}
      <Modal
        animationType="slide"
        transparent
        visible={fundModalVisible}
        onRequestClose={() => setFundModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalScreenLayoutOverlayMask}
        >
          <View
            style={[
              styles.fundPresentationDrawerSheet,
              { backgroundColor: colors.surface },
            ]}
          >
            <View style={styles.sheetLayoutTopBarIndicator} />
            <AppText
              size={18}
              weight="bold"
              color={colors.text}
              style={{ marginBottom: 4 }}
            >
              Add Money
            </AppText>
            <AppText
              size={13}
              color={colors.textMuted}
              style={{ marginBottom: 20 }}
            >
              Top up your Padiman Route balance.
            </AppText>

            <AppText size={11} weight="bold" color={colors.textMuted}>
              AMOUNT (₦)
            </AppText>
            <View
              style={[
                styles.largeValueEntryBoxField,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <TextInput
                style={[styles.textInputBoxCoreStyle, { color: colors.text }]}
                value={fundAmount}
                onChangeText={setFundAmount}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                autoFocus={true}
              />
            </View>

            <AppText
              size={11}
              weight="bold"
              color={colors.textMuted}
              style={{ marginTop: 14, marginBottom: 10 }}
            >
              QUICK PICK
            </AppText>
            <View style={styles.quickAmountsRowGridLayout}>
              {quickAmounts.map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[
                    styles.quickSelectionBoundsPill,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setFundAmount(amt.toString())}
                >
                  <AppText size={13} weight="bold" color={colors.text}>
                    ₦{amt.toLocaleString()}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.actionModalFooterTwinButtonsLayoutGrid}>
              <TouchableOpacity
                style={[
                  styles.actionModalGridHalfBtn,
                  { borderColor: colors.border, borderWidth: 1 },
                ]}
                onPress={() => {
                  setFundModalVisible(false);
                  setFundAmount("");
                }}
              >
                <AppText size={14} weight="bold" color={colors.text}>
                  Cancel
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionModalGridHalfBtn,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleFundAccount}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <AppText size={14} weight="bold" color="#FFF">
                    Confirm
                  </AppText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ==================== MODAL 3: INLINE PAYSTACK GATEWAY INTERFACES (WEBVIEW) ==================== */}
      <Modal
        animationType="fade"
        transparent={false}
        visible={webViewModalVisible}
        onRequestClose={() => {
          setWebViewModalVisible(false);
          setPaystackUrl(null);
          setActiveReference(null);
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>
          <View style={styles.webViewHeaderLayout}>
            <TouchableOpacity
              style={styles.webViewCloseButton}
              onPress={() => {
                setWebViewModalVisible(false);
                setPaystackUrl(null);
                setActiveReference(null);
                dispatch(fetchWallet());
              }}
            >
              <AppText size={14} weight="bold" color="#EF4444">
                Cancel Payment
              </AppText>
            </TouchableOpacity>
            <AppText size={15} weight="bold" color="#1F2937">
              Secure Checkout
            </AppText>
            <View style={{ width: 80 }} />
          </View>

          {paystackUrl && (
            <WebView
              source={{ uri: paystackUrl }}
              onNavigationStateChange={handleWebViewNavigationStateChange}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              renderLoading={() => (
                <ActivityIndicator
                  color={colors.primary}
                  size="large"
                  style={StyleSheet.absoluteFill}
                />
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSafeArea: {
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
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  iconButton: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  balanceMasterCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    marginBottom: 20,
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
  balanceTwinActionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 24,
    width: "100%",
  },
  actionCellBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitleLayoutDock: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  transactionLogCardRow: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  txLogInternalStructure: { flexDirection: "row", alignItems: "center" },
  verticalIndicatorPillMarker: { width: 4, height: 38, borderRadius: 2 },
  statusMiniCapsule: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 4,
  },
  modalScreenLayoutOverlayMask: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  detailModalPresentationSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: SCREEN_HEIGHT * 0.72,
    paddingTop: 12,
  },
  modalHeaderActionBarLayout: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  closeLabelActionBtn: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  centerAuditHeroUnitBanner: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    marginVertical: 14,
  },
  auditFieldMetadataBlock: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginVertical: 10,
  },
  metadataSplitRowAlign: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    paddingVertical: 12,
  },
  primaryRoutingButton: {
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    marginBottom: 32,
    width: "100%",
  },
  fundPresentationDrawerSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingTop: 12,
  },
  sheetLayoutTopBarIndicator: {
    width: 36,
    height: 4,
    backgroundColor: "rgba(0,0,0,0.15)",
    alignSelf: "center",
    borderRadius: 2,
    marginBottom: 18,
  },
  largeValueEntryBoxField: {
    height: 64,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    marginVertical: 10,
    justifyContent: "center",
  },
  textInputBoxCoreStyle: {
    fontSize: 24,
    fontWeight: "700",
    height: "100%",
    padding: 0,
  },
  quickAmountsRowGridLayout: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 8,
  },
  quickSelectionBoundsPill: {
    flex: 1,
    minWidth: "22%",
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionModalFooterTwinButtonsLayoutGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    paddingBottom: Platform.OS === "ios" ? 16 : 0,
  },
  actionModalGridHalfBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  webViewHeaderLayout: {
    height: 56,
    backgroundColor: "#F9FAFB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingHorizontal: 16,
  },
  webViewCloseButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
});
