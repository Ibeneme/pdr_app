import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
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
  Animated,
  KeyboardAvoidingView,
} from "react-native";
import { WebView } from "react-native-webview";
import { useRouter, useFocusEffect } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { AppText } from "@/components/AppText";
import {
  ArrowLeft,
  Wallet as WalletIcon,
  ArrowDownLeft,
  ArrowUpRight as ArrowUpRightIcon,
  ShieldCheck,
  Eye,
  EyeOff,
  History as HistoryIcon,
  RefreshCw,
  Mail,
  Phone,
  Package,
  MapPin,
  X,
} from "lucide-react-native";

import { useDispatch } from "react-redux";
import { fetchWallet } from "@/api/slices/wallet.slice";
import { AppDispatch } from "@/api/store";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

const INK = "#111318";

// ==================== DATE HELPERS ====================
// Richer date + time display instead of the plain "Jul 23, 2026" format.
const formatDetailedDate = (dateInput?: string) => {
  if (!dateInput) return "N/A";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "N/A";

  const datePart = d.toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timePart = d.toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return `${datePart} · ${timePart}`;
};

// Short relative label used on compact rows/capsules ("2h ago", "Yesterday", etc.)
const formatRelative = (dateInput?: string) => {
  if (!dateInput) return "N/A";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "N/A";

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
};

// ==================== SHIMMER LOADER ====================
const ShimmerBlock = ({
  width,
  height,
  borderRadius = 10,
  style,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 850,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.85],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: "#D9D9D9",
          opacity,
        },
        style,
      ]}
    />
  );
};

const WalletSkeleton = ({
  heroCardBg,
  tileBg,
}: {
  heroCardBg: string;
  tileBg: string;
}) => {
  return (
    <View style={{ paddingTop: 8, paddingHorizontal: 16 }}>
      {/* brand pill */}
      <View style={{ alignItems: "center", marginBottom: 16 }}>
        <ShimmerBlock width={120} height={30} borderRadius={999} />
      </View>

      {/* balance hero */}
      <View style={{ alignItems: "center", marginBottom: 24 }}>
        <ShimmerBlock width={150} height={13} style={{ marginBottom: 10 }} />
        <ShimmerBlock width={220} height={40} style={{ marginBottom: 12 }} />
        <ShimmerBlock width={170} height={28} borderRadius={999} />
      </View>

      {/* quick actions */}
      <View
        style={[
          styles.quickActionsCard,
          { backgroundColor: heroCardBg, marginBottom: 14 },
        ]}
      >
        <View style={[styles.quickActionTile, { backgroundColor: tileBg }]}>
          <ShimmerBlock width={32} height={32} borderRadius={16} />
          <ShimmerBlock width={70} height={12} />
        </View>
        <View style={[styles.quickActionTile, { backgroundColor: tileBg }]}>
          <ShimmerBlock width={32} height={32} borderRadius={16} />
          <ShimmerBlock width={90} height={12} />
        </View>
      </View>

      {/* secondary cards */}
      <View style={styles.secondaryRow}>
        <View style={[styles.secondaryCard, { backgroundColor: heroCardBg }]}>
          <ShimmerBlock width={90} height={12} />
          <ShimmerBlock width={100} height={30} borderRadius={15} />
        </View>
        <View style={[styles.secondaryCard, { backgroundColor: heroCardBg }]}>
          <ShimmerBlock width={80} height={12} />
          <ShimmerBlock width={110} height={20} />
        </View>
      </View>

      {/* activity capsules */}
      <ShimmerBlock width={140} height={14} style={{ marginBottom: 10 }} />
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
        <ShimmerBlock width={120} height={40} borderRadius={999} />
        <ShimmerBlock width={120} height={40} borderRadius={999} />
        <ShimmerBlock width={120} height={40} borderRadius={999} />
      </View>

      {/* transaction rows */}
      {[1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={[
            styles.transactionLogCardRow,
            { backgroundColor: heroCardBg },
          ]}
        >
          <View style={styles.txLogInternalStructure}>
            <ShimmerBlock width={42} height={42} borderRadius={12} />
            <View style={{ flex: 1, paddingLeft: 12 }}>
              <ShimmerBlock
                width={"70%"}
                height={14}
                style={{ marginBottom: 8 }}
              />
              <ShimmerBlock
                width={"50%"}
                height={11}
                style={{ marginBottom: 6 }}
              />
              <ShimmerBlock width={"35%"} height={10} />
            </View>
            <ShimmerBlock width={60} height={16} />
          </View>
        </View>
      ))}
    </View>
  );
};

export default function WalletScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  // ==================== LOCAL STATE (as requested) ====================
  const [walletData, setWalletData] = useState<any>(null);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [fundModalVisible, setFundModalVisible] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [balanceVisible, setBalanceVisible] = useState(true);

  // Recent payer bottom modal state
  const [selectedPayer, setSelectedPayer] = useState<string | null>(null);

  // Paystack WebView Flow Local States
  const [paystackUrl, setPaystackUrl] = useState<string | null>(null);
  const [webViewModalVisible, setWebViewModalVisible] = useState(false);
  const [activeReference, setActiveReference] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const quickAmounts = [1000, 5000, 10000, 25000];

  const pageBg = isDark ? theme.background : "#ECECE7";
  const heroCardBg = isDark ? theme.surface : "#FFFFFF";
  const tileBg = isDark ? theme.background : "#F4F4F1";
  const pillDarkBg = INK;

  // ==================== useFocusEffect with dispatch ====================
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

  const handleManualRefresh = () => {
    setIsLoading(true);
    dispatch(fetchWallet())
      .unwrap()
      .then((data) => {
        setWalletData(data?.wallet || data);
      })
      .catch((error) => {
        console.error("[MANUAL_REFRESH_ERROR] ❌", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Derived values from local state
  const balance = walletData?.balance || 0;
  const withdrawableBalance = walletData?.withdrawableBalance || 0;
  const earnings = walletData?.earnings || [];
  const withdrawals = walletData?.withdrawals || [];

  const pendingEscrowAmount = useMemo(() => {
    if (!earnings || !Array.isArray(earnings)) return 0;
    return earnings
      .filter((e: any) => e.status === "pending")
      .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
  }, [earnings]);

  const transactions = useMemo(() => {
    const credits = earnings.map((e: any) => ({
      id: e.reference || e._id,
      type: "credit",
      title:
        e.source === "deliver-package"
          ? "Parcel Revenue Received"
          : e.source === "offer-ride"
          ? "Ride Revenue Received"
          : "Service Revenue",
      amount: `+₦${e.amount.toLocaleString()}`,
      date: formatDetailedDate(e.createdAt),
      dateShort: formatRelative(e.createdAt),
      service: e.source || "Service",
      route: `${e.negotiation?.service?.pickupLocation?.address || "N/A"} → ${
        e.negotiation?.service?.deliveryLocation?.address || "N/A"
      }`,
      driver: e.payerName || "Customer",
      status: e.status === "pending" ? "PENDING ESCROW" : "Settled",
      raw: e,
    }));

    const debits = withdrawals.map((w: any) => ({
      id: w._id,
      type: "debit",
      title: "Bank Withdrawal",
      amount: `-₦${w.amount.toLocaleString()}`,
      date: formatDetailedDate(w.createdAt),
      dateShort: formatRelative(w.createdAt),
      service: "Bank Transfer",
      route: "Not Applicable",
      driver: w.bankDetails?.accountName || "N/A",
      status: w.status === "success" ? "Processed" : w.status.toUpperCase(),
      raw: w,
    }));

    return [...credits, ...debits].sort(
      (a, b) =>
        new Date(b.raw.createdAt).getTime() -
        new Date(a.raw.createdAt).getTime()
    );
  }, [earnings, withdrawals]);

  const recentPayers = useMemo(() => {
    const names = transactions
      .filter((t) => t.type === "credit" && t.driver && t.driver !== "System")
      .map((t) => t.driver);
    return Array.from(new Set(names)).slice(0, 3);
  }, [transactions]);

  // Aggregated info for whichever payer is tapped in the "Recent Payers" card
  const payerDetails = useMemo(() => {
    if (!selectedPayer) return null;

    const payerTxs = transactions.filter(
      (t) => t.type === "credit" && t.driver === selectedPayer
    );

    const totalPaid = payerTxs.reduce(
      (sum, t) => sum + (t.raw?.amount || 0),
      0
    );

    const email = payerTxs[0]?.raw?.payerEmail || "N/A";
    const phone =
      payerTxs[0]?.raw?.negotiation?.negotiator?.phone ||
      payerTxs[0]?.raw?.negotiation?.serviceProvider?.phone ||
      "N/A";

    return {
      name: selectedPayer,
      email,
      phone,
      totalPaid,
      count: payerTxs.length,
      transactions: payerTxs,
    };
  }, [selectedPayer, transactions]);

  const latestActivity = transactions.slice(0, 6);

  const avatarPalette = ["#9C2583", "#4A148C", "#111318", "#D97706"];

  const handleWebViewNavigationStateChange = async (navState: any) => {
    const { url } = navState;
    const isSuccessRedirect =
      url.includes("callback") ||
      url.includes("checkout/done") ||
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
      if (data.event === "charge:success" || data.status === "success") {
        triggerVerificationSequence();
      }
    } catch (err) {}
  };

  const triggerVerificationSequence = async () => {
    setWebViewModalVisible(false);
    setPaystackUrl(null);
    if (activeReference) {
      dispatch(fetchWallet());
      Alert.alert("Funding Successful", "Successfully topped up your wallet!");
      setFundAmount("");
      setActiveReference(null);
    }
  };

  const handlePaymentCancellation = () => {
    setWebViewModalVisible(false);
    setPaystackUrl(null);
    setActiveReference(null);
    dispatch(fetchWallet());
    Alert.alert("Payment Cancelled", "You closed the secure checkout.");
  };

  const handleFundAccount = async () => {
    // Your existing funding logic...
    Alert.alert("Demo", "Paystack integration would trigger here.");
  };

  // Wired up: closes the transaction modal and routes to the details screen,
  // passing the full negotiation/service payload (falls back to the raw
  // record itself for withdrawals which have no negotiation attached).
  const handleViewOrderDetails = (tx: any) => {
    setSelectedTx(null);
    const item = tx?.raw?.negotiation || tx?.raw;
    router.push({
      pathname: "/(features)/details",
      params: { requestData: JSON.stringify(item) },
    });
  };

  const handleShowEscrowInfo = () => {
    Alert.alert(
      "Escrow Protection",
      "When the customer accepts and the service is completed, the amount moves from Held in Escrow to Withdrawable Balance."
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: pageBg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            style={styles.avatarPressableRow}
          >
            <View style={styles.backChip}>
              <ArrowLeft size={24} color={theme.text} />
            </View>
          </TouchableOpacity>

          <View style={styles.headerRightIcons}>
            <TouchableOpacity
              onPress={handleShowEscrowInfo}
              style={[styles.headerChipButton, { backgroundColor: heroCardBg }]}
              activeOpacity={0.7}
            >
              <ShieldCheck size={17} color="#D97706" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleManualRefresh}
              style={[styles.headerChipButton, { backgroundColor: heroCardBg }]}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <RefreshCw size={17} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {isLoading ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <WalletSkeleton heroCardBg={heroCardBg} tileBg={tileBg} />
        </ScrollView>
      ) : (
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
            {/* CURRENCY / BRAND PILL */}
            <View style={styles.brandPillDock}>
              <View style={[styles.brandPill, { backgroundColor: heroCardBg }]}>
                <WalletIcon size={13} color={theme.text} />
                <AppText
                  size={12.5}
                  weight="bold"
                  color={theme.text}
                  style={{ marginLeft: 6 }}
                >
                  NGN Wallet
                </AppText>
              </View>
            </View>

            {/* BALANCE HERO */}
            <View style={styles.balanceHeroDock}>
              <AppText size={13} color={theme.textMuted} weight="medium">
                Withdrawable Balance
              </AppText>

              <View style={styles.balanceValueRow}>
                <AppText
                  size={38}
                  weight="bold"
                  color={theme.text}
                  style={{ letterSpacing: -0.8 }}
                >
                  {balanceVisible
                    ? `₦${withdrawableBalance?.toLocaleString() || "0"}`
                    : "₦••••••"}
                </AppText>
                <TouchableOpacity
                  onPress={() => setBalanceVisible((v) => !v)}
                  hitSlop={10}
                  style={{ marginLeft: 10 }}
                >
                  {balanceVisible ? (
                    <Eye size={20} color={theme.textMuted} />
                  ) : (
                    <EyeOff size={20} color={theme.textMuted} />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleShowEscrowInfo}
                activeOpacity={0.75}
                style={styles.escrowPill}
              >
                <ShieldCheck size={13} color="#D97706" />
                <AppText
                  size={12}
                  weight="bold"
                  color="#D97706"
                  style={{ marginLeft: 6 }}
                >
                  ₦{pendingEscrowAmount.toLocaleString()} in Escrow
                </AppText>
              </TouchableOpacity>
            </View>

            {/* QUICK ACTIONS ROW */}
            <View
              style={[styles.quickActionsCard, { backgroundColor: heroCardBg }]}
            >
              <TouchableOpacity
                style={[styles.quickActionTile, { backgroundColor: tileBg }]}
                activeOpacity={0.8}
                onPress={() => router.push("/(screens)/withdrawal")}
              >
                <View
                  style={[
                    styles.quickActionIconDot,
                    { backgroundColor: pillDarkBg },
                  ]}
                >
                  <ArrowUpRightIcon size={16} color="#FFF" />
                </View>
                <AppText size={12.5} weight="bold" color={theme.text}>
                  Withdraw
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionTile, { backgroundColor: tileBg }]}
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: "/(features)/all_requests",
                    params: { status: "completed" },
                  })
                }
              >
                <View
                  style={[
                    styles.quickActionIconDot,
                    { backgroundColor: pillDarkBg },
                  ]}
                >
                  <HistoryIcon size={16} color="#FFF" />
                </View>
                <AppText size={12.5} weight="bold" color={theme.text}>
                  Order History
                </AppText>
              </TouchableOpacity>
            </View>

            {/* SECONDARY CARDS */}
            <View style={styles.secondaryRow}>
              <View
                style={[styles.secondaryCard, { backgroundColor: heroCardBg }]}
              >
                <AppText size={13} weight="bold" color={theme.text}>
                  Recent Payers
                </AppText>
                {recentPayers.length > 0 ? (
                  <View style={styles.avatarStackRow}>
                    {recentPayers.map((name, idx) => (
                      <TouchableOpacity
                        key={name}
                        activeOpacity={0.75}
                        onPress={() => setSelectedPayer(name)}
                        style={[
                          styles.stackedAvatar,
                          {
                            backgroundColor:
                              avatarPalette[idx % avatarPalette.length],
                            marginLeft: idx === 0 ? 0 : -10,
                          },
                        ]}
                      >
                        <AppText size={12} weight="bold" color="#FFF">
                          {name.charAt(0).toUpperCase()}
                        </AppText>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <AppText
                    size={11.5}
                    color={theme.textMuted}
                    style={{ marginTop: 10 }}
                  >
                    No payers yet
                  </AppText>
                )}
              </View>

              <TouchableOpacity
                style={[styles.secondaryCard, { backgroundColor: heroCardBg }]}
                activeOpacity={0.8}
                onPress={handleShowEscrowInfo}
              >
                <AppText size={13} weight="bold" color={theme.text}>
                  Escrow Held
                </AppText>
                <View style={styles.escrowIconPairRow}>
                  <View
                    style={[
                      styles.escrowIconChip,
                      { backgroundColor: "rgba(217, 119, 6, 0.14)" },
                    ]}
                  >
                    <ShieldCheck size={14} color="#D97706" />
                  </View>
                  <AppText
                    size={15}
                    weight="bold"
                    color="#D97706"
                    style={{ marginLeft: 8 }}
                  >
                    ₦{pendingEscrowAmount.toLocaleString()}
                  </AppText>
                </View>
              </TouchableOpacity>
            </View>

            {/* RECENT ACTIVITY */}
            <View style={styles.activityHeaderRow}>
              <AppText size={15} weight="bold" color={theme.text}>
                Recent Activity
              </AppText>
              {/* <TouchableOpacity onPress={() => router.push("/(screens)/order")}>
                <AppText size={12.5} weight="bold" color={theme.textMuted}>
                  See all
                </AppText>
              </TouchableOpacity> */}
            </View>

            {latestActivity.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.activityScrollRow}
              >
                {latestActivity.map((tx) => {
                  const isIncome = tx.type === "credit";
                  const isPending = tx.status === "PENDING ESCROW";
                  const dotColor = isPending
                    ? "#D97706"
                    : isIncome
                    ? "#22C55E"
                    : "#EF4444";
                  return (
                    <TouchableOpacity
                      key={`activity-${tx.id}`}
                      style={styles.activityCapsule}
                      activeOpacity={0.85}
                      onPress={() => setSelectedTx(tx)}
                    >
                      <View
                        style={[
                          styles.activityCapsuleIcon,
                          { backgroundColor: `${dotColor}25` },
                        ]}
                      >
                        {isIncome ? (
                          <ArrowDownLeft size={13} color={dotColor} />
                        ) : (
                          <ArrowUpRightIcon size={13} color={dotColor} />
                        )}
                      </View>
                      <AppText
                        size={12}
                        weight="bold"
                        color="#FFF"
                        numberOfLines={1}
                        style={{ maxWidth: 90 }}
                      >
                        {tx.title}
                      </AppText>
                      <AppText size={11} weight="bold" color={dotColor}>
                        {tx.amount}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* FULL TRANSACTIONS SECTION */}
            <View style={styles.sectionTitleLayoutDock}>
              <AppText
                size={11}
                weight="bold"
                color={theme.textMuted}
                style={{ letterSpacing: 1.2 }}
              >
                ACCOUNT TRANSACTION LOGS
              </AppText>
              <AppText size={11} weight="bold" color={theme.textMuted}>
                {transactions.length} Total Units
              </AppText>
            </View>

            {transactions.map((tx: any) => {
              const isIncome = tx.type === "credit";
              const isPending = tx.status === "PENDING ESCROW";
              const rowColor = isPending
                ? "#D97706"
                : isIncome
                ? "#22C55E"
                : "#EF4444";

              return (
                <TouchableOpacity
                  key={tx.id}
                  style={[
                    styles.transactionLogCardRow,
                    { backgroundColor: heroCardBg },
                  ]}
                  onPress={() => setSelectedTx(tx)}
                  activeOpacity={0.9}
                >
                  <View style={styles.txLogInternalStructure}>
                    <View
                      style={[
                        styles.txIconChip,
                        { backgroundColor: `${rowColor}15` },
                      ]}
                    >
                      {isIncome ? (
                        <ArrowDownLeft size={17} color={rowColor} />
                      ) : (
                        <ArrowUpRightIcon size={17} color={rowColor} />
                      )}
                    </View>
                    <View style={{ flex: 1, paddingLeft: 12 }}>
                      <AppText
                        size={14}
                        weight="bold"
                        color={theme.text}
                        numberOfLines={1}
                      >
                        {tx.title}
                      </AppText>
                      <AppText
                        size={12}
                        weight="medium"
                        color={theme.textMuted}
                        style={{ marginVertical: 2 }}
                      >
                        {tx.route}
                      </AppText>
                      <AppText size={11} color={theme.textMuted}>
                        {tx.dateShort} · {tx.date}
                      </AppText>
                    </View>
                    <View
                      style={{
                        alignItems: "flex-end",
                        justifyContent: "center",
                      }}
                    >
                      <AppText size={15} weight="bold" color={rowColor}>
                        {tx.amount}
                      </AppText>
                      <View
                        style={[
                          styles.statusMiniCapsule,
                          { backgroundColor: `${rowColor}12` },
                        ]}
                      >
                        <AppText size={9} weight="bold" color={rowColor}>
                          {tx.status.toUpperCase()}
                        </AppText>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* TRANSACTION DETAILS MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!selectedTx}
        onRequestClose={() => setSelectedTx(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setSelectedTx(null)}
          />
          <View
            style={[
              styles.modalContent,
              { backgroundColor: heroCardBg, height: SCREEN_HEIGHT * 0.85 },
            ]}
          >
            <View
              style={[styles.modalKnob, { backgroundColor: theme.border }]}
            />

            <View style={styles.modalHeaderActionBarLayout}>
              <AppText size={18} weight="bold" color={theme.text}>
                Transaction Details
              </AppText>
              <TouchableOpacity
                onPress={() => setSelectedTx(null)}
                style={styles.closeLabelActionBtn}
              >
                <AppText size={14} weight="bold" color={theme.textMuted}>
                  Close
                </AppText>
              </TouchableOpacity>
            </View>

            {selectedTx && (
              <ScrollView
                style={{ paddingHorizontal: 24, flex: 1 }}
                showsVerticalScrollIndicator={false}
              >
                <View
                  style={[
                    styles.centerAuditHeroUnitBanner,
                    { backgroundColor: tileBg },
                  ]}
                >
                  <AppText size={11} weight="bold" color={theme.textMuted}>
                    TRANSACTION AMOUNT
                  </AppText>
                  <AppText
                    size={32}
                    weight="bold"
                    color={selectedTx.type === "credit" ? "#22C55E" : "#EF4444"}
                    style={{ marginVertical: 6 }}
                  >
                    {selectedTx.amount}
                  </AppText>
                  <AppText size={11} weight="bold" color={theme.text}>
                    Ref: {selectedTx.id}
                  </AppText>
                </View>

                {/* CORE SUMMARY */}
                <View
                  style={[
                    styles.auditFieldMetadataBlock,
                    { borderColor: theme.border },
                  ]}
                >
                  <View
                    style={[
                      styles.metadataSplitRowAlign,
                      { borderBottomColor: theme.border },
                    ]}
                  >
                    <AppText size={13} color={theme.textMuted}>
                      Service Context
                    </AppText>
                    <AppText size={13} weight="bold" color={theme.text}>
                      {selectedTx.service}
                    </AppText>
                  </View>
                  <View
                    style={[
                      styles.metadataSplitRowAlign,
                      { borderBottomColor: theme.border },
                    ]}
                  >
                    <AppText size={13} color={theme.textMuted}>
                      Status Check
                    </AppText>
                    <AppText size={13} weight="bold" color={theme.text}>
                      {selectedTx.status}
                    </AppText>
                  </View>
                  <View
                    style={[
                      styles.metadataSplitRowAlign,
                      { borderBottomColor: theme.border },
                    ]}
                  >
                    <AppText size={13} color={theme.textMuted}>
                      Payer/Beneficiary
                    </AppText>
                    <AppText size={13} weight="bold" color={theme.text}>
                      {selectedTx.driver}
                    </AppText>
                  </View>
                  {selectedTx.raw?.payerEmail && (
                    <View
                      style={[
                        styles.metadataSplitRowAlign,
                        { borderBottomColor: theme.border },
                      ]}
                    >
                      <AppText size={13} color={theme.textMuted}>
                        Payer Email
                      </AppText>
                      <AppText size={13} weight="bold" color={theme.text}>
                        {selectedTx.raw.payerEmail}
                      </AppText>
                    </View>
                  )}
                  <View
                    style={[
                      styles.metadataSplitRowAlign,
                      { borderBottomWidth: 0 },
                    ]}
                  >
                    <AppText size={13} color={theme.textMuted}>
                      Timestamp
                    </AppText>
                    <AppText size={13} weight="bold" color={theme.text}>
                      {selectedTx.date}
                    </AppText>
                  </View>
                </View>

                {/* EXTRA DETAILS — CREDIT (earning) TRANSACTIONS */}
                {selectedTx.type === "credit" && (
                  <>
            

                    <AppText
                      size={11}
                      weight="bold"
                      color={theme.textMuted}
                      style={{
                        marginTop: 16,
                        marginBottom: 8,
                        letterSpacing: 1,
                      }}
                    >
                      TRIP / SERVICE DETAILS
                    </AppText>
                    <View
                      style={[
                        styles.auditFieldMetadataBlock,
                        { borderColor: theme.border },
                      ]}
                    >
                      <View
                        style={[
                          styles.metadataSplitRowAlign,
                          { borderBottomColor: theme.border },
                        ]}
                      >
                        <AppText size={13} color={theme.textMuted}>
                          Pickup
                        </AppText>
                        <AppText
                          size={13}
                          weight="bold"
                          color={theme.text}
                          style={{ flexShrink: 1, textAlign: "right" }}
                        >
                          {selectedTx.raw?.negotiation?.service?.pickupLocation
                            ?.address || "N/A"}
                        </AppText>
                      </View>
                      <View
                        style={[
                          styles.metadataSplitRowAlign,
                          { borderBottomColor: theme.border },
                        ]}
                      >
                        <AppText size={13} color={theme.textMuted}>
                          Delivery
                        </AppText>
                        <AppText
                          size={13}
                          weight="bold"
                          color={theme.text}
                          style={{ flexShrink: 1, textAlign: "right" }}
                        >
                          {selectedTx.raw?.negotiation?.service
                            ?.deliveryLocation?.address || "N/A"}
                        </AppText>
                      </View>
                      <View
                        style={[
                          styles.metadataSplitRowAlign,
                          { borderBottomColor: theme.border },
                        ]}
                      >
                        <AppText size={13} color={theme.textMuted}>
                          Pickup Date / Time
                        </AppText>
                        <AppText size={13} weight="bold" color={theme.text}>
                          {selectedTx.raw?.negotiation?.service?.pickupDate
                            ? formatDetailedDate(
                                selectedTx.raw.negotiation.service.pickupDate
                              )
                            : "N/A"}
                          {selectedTx.raw?.negotiation?.service?.pickupTime
                            ? ` (${selectedTx.raw.negotiation.service.pickupTime})`
                            : ""}
                        </AppText>
                      </View>
                      <View
                        style={[
                          styles.metadataSplitRowAlign,
                          { borderBottomColor: theme.border },
                        ]}
                      >
                        <AppText size={13} color={theme.textMuted}>
                          Agreed Price
                        </AppText>
                        <AppText size={13} weight="bold" color={theme.text}>
                          {selectedTx.raw?.negotiation?.service?.agreedPrice
                            ? `₦${selectedTx.raw.negotiation.service.agreedPrice.toLocaleString()}`
                            : "N/A"}
                        </AppText>
                      </View>
                      <View
                        style={[
                          styles.metadataSplitRowAlign,
                          { borderBottomColor: theme.border },
                        ]}
                      >
                        <AppText size={13} color={theme.textMuted}>
                          Service Status
                        </AppText>
                        <AppText size={13} weight="bold" color={theme.text}>
                          {selectedTx.raw?.negotiation?.service?.status
                            ? selectedTx.raw.negotiation.service.status
                                .charAt(0)
                                .toUpperCase() +
                              selectedTx.raw.negotiation.service.status.slice(1)
                            : "N/A"}
                        </AppText>
                      </View>
                      <View
                        style={[
                          styles.metadataSplitRowAlign,
                          { borderBottomWidth: 0 },
                        ]}
                      >
                        <AppText size={13} color={theme.textMuted}>
                          Negotiation Paid?
                        </AppText>
                        <AppText
                          size={13}
                          weight="bold"
                          color={
                            selectedTx.raw?.negotiation?.isPaid
                              ? "#22C55E"
                              : "#EF4444"
                          }
                        >
                          {selectedTx.raw?.negotiation?.isPaid ? "Yes" : "No"}
                        </AppText>
                      </View>
                    </View>

                    <AppText
                      size={11}
                      weight="bold"
                      color={theme.textMuted}
                      style={{
                        marginTop: 16,
                        marginBottom: 8,
                        letterSpacing: 1,
                      }}
                    >
                      PARTIES INVOLVED
                    </AppText>
                    <View
                      style={[
                        styles.auditFieldMetadataBlock,
                        { borderColor: theme.border },
                      ]}
                    >
                      <View
                        style={[
                          styles.metadataSplitRowAlign,
                          { borderBottomColor: theme.border },
                        ]}
                      >
                        <AppText size={13} color={theme.textMuted}>
                          Negotiator
                        </AppText>
                        <AppText size={13} weight="bold" color={theme.text}>
                          {selectedTx.raw?.negotiation?.negotiator?.fullName ||
                            "N/A"}
                        </AppText>
                      </View>
                      <View
                        style={[
                          styles.metadataSplitRowAlign,
                          { borderBottomColor: theme.border },
                        ]}
                      >
                        <AppText size={13} color={theme.textMuted}>
                          Negotiator Phone
                        </AppText>
                        <AppText size={13} weight="bold" color={theme.text}>
                          {selectedTx.raw?.negotiation?.negotiator?.phone ||
                            "N/A"}
                        </AppText>
                      </View>
                      <View
                        style={[
                          styles.metadataSplitRowAlign,
                          { borderBottomColor: theme.border },
                        ]}
                      >
                        <AppText size={13} color={theme.textMuted}>
                          Service Provider
                        </AppText>
                        <AppText size={13} weight="bold" color={theme.text}>
                          {selectedTx.raw?.negotiation?.serviceProvider
                            ?.fullName || "N/A"}
                        </AppText>
                      </View>
                      <View
                        style={[
                          styles.metadataSplitRowAlign,
                          { borderBottomWidth: 0 },
                        ]}
                      >
                        <AppText size={13} color={theme.textMuted}>
                          Provider Phone
                        </AppText>
                        <AppText size={13} weight="bold" color={theme.text}>
                          {selectedTx.raw?.negotiation?.serviceProvider
                            ?.phone || "N/A"}
                        </AppText>
                      </View>
                    </View>
                  </>
                )}

                {/* EXTRA DETAILS — DEBIT (withdrawal) TRANSACTIONS */}
                {selectedTx.type === "debit" && (
                  <>
                    <AppText
                      size={11}
                      weight="bold"
                      color={theme.textMuted}
                      style={{
                        marginTop: 8,
                        marginBottom: 8,
                        letterSpacing: 1,
                      }}
                    >
                      BANK DETAILS
                    </AppText>
                    <View
                      style={[
                        styles.auditFieldMetadataBlock,
                        { borderColor: theme.border },
                      ]}
                    >
                      <View
                        style={[
                          styles.metadataSplitRowAlign,
                          { borderBottomColor: theme.border },
                        ]}
                      >
                        <AppText size={13} color={theme.textMuted}>
                          Account Name
                        </AppText>
                        <AppText size={13} weight="bold" color={theme.text}>
                          {selectedTx.raw?.bankDetails?.accountName || "N/A"}
                        </AppText>
                      </View>
                      <View
                        style={[
                          styles.metadataSplitRowAlign,
                          { borderBottomColor: theme.border },
                        ]}
                      >
                        <AppText size={13} color={theme.textMuted}>
                          Account Number
                        </AppText>
                        <AppText size={13} weight="bold" color={theme.text}>
                          {selectedTx.raw?.bankDetails?.accountNumber || "N/A"}
                        </AppText>
                      </View>
                      <View
                        style={[
                          styles.metadataSplitRowAlign,
                          { borderBottomWidth: 0 },
                        ]}
                      >
                        <AppText size={13} color={theme.textMuted}>
                          Bank Name
                        </AppText>
                        <AppText size={13} weight="bold" color={theme.text}>
                          {selectedTx.raw?.bankDetails?.bankName || "N/A"}
                        </AppText>
                      </View>
                    </View>
                  </>
                )}


              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* RECENT PAYER DETAILS MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!selectedPayer}
        onRequestClose={() => setSelectedPayer(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setSelectedPayer(null)}
          />
          <View
            style={[
              styles.modalContent,
              { backgroundColor: heroCardBg, height: SCREEN_HEIGHT * 0.7 },
            ]}
          >
            <View
              style={[styles.modalKnob, { backgroundColor: theme.border }]}
            />

            <View style={styles.modalHeaderActionBarLayout}>
              <AppText size={18} weight="bold" color={theme.text}>
                Payer Details
              </AppText>
              <TouchableOpacity
                onPress={() => setSelectedPayer(null)}
                style={styles.closeLabelActionBtn}
              >
                <X size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {payerDetails && (
              <ScrollView
                style={{ paddingHorizontal: 24, flex: 1 }}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.payerHeroRow}>
                  <View
                    style={[styles.payerHeroAvatar, { backgroundColor: INK }]}
                  >
                    <AppText size={22} weight="bold" color="#FFF">
                      {payerDetails.name.charAt(0).toUpperCase()}
                    </AppText>
                  </View>
                  <View style={{ marginLeft: 14, flex: 1 }}>
                    <AppText size={17} weight="bold" color={theme.text}>
                      {payerDetails.name}
                    </AppText>
                    <View style={styles.payerContactRow}>
                      <Mail size={12} color={theme.textMuted} />
                      <AppText
                        size={12}
                        color={theme.textMuted}
                        style={{ marginLeft: 5 }}
                        numberOfLines={1}
                      >
                        {payerDetails.email}
                      </AppText>
                    </View>
                    <View style={styles.payerContactRow}>
                      <Phone size={12} color={theme.textMuted} />
                      <AppText
                        size={12}
                        color={theme.textMuted}
                        style={{ marginLeft: 5 }}
                      >
                        {payerDetails.phone}
                      </AppText>
                    </View>
                  </View>
                </View>

                <View style={styles.secondaryRow}>
                  <View
                    style={[
                      styles.secondaryCard,
                      { backgroundColor: tileBg, minHeight: 70 },
                    ]}
                  >
                    <AppText size={11} weight="bold" color={theme.textMuted}>
                      TOTAL PAID
                    </AppText>
                    <AppText size={17} weight="bold" color="#22C55E">
                      ₦{payerDetails.totalPaid.toLocaleString()}
                    </AppText>
                  </View>
                  <View
                    style={[
                      styles.secondaryCard,
                      { backgroundColor: tileBg, minHeight: 70 },
                    ]}
                  >
                    <AppText size={11} weight="bold" color={theme.textMuted}>
                      TRANSACTIONS
                    </AppText>
                    <AppText size={17} weight="bold" color={theme.text}>
                      {payerDetails.count}
                    </AppText>
                  </View>
                </View>

                <AppText
                  size={11}
                  weight="bold"
                  color={theme.textMuted}
                  style={{ marginTop: 8, marginBottom: 10, letterSpacing: 1 }}
                >
                  TRANSACTION HISTORY
                </AppText>

                {payerDetails.transactions.map((t: any) => (
                  <TouchableOpacity
                    key={`payer-tx-${t.id}`}
                    style={[styles.payerTxRow, { borderColor: theme.border }]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedPayer(null);
                      setSelectedTx(t);
                    }}
                  >
                    <View
                      style={[
                        styles.txIconChip,
                        { backgroundColor: "#22C55E15", width: 36, height: 36 },
                      ]}
                    >
                      <Package size={15} color="#22C55E" />
                    </View>
                    <View style={{ flex: 1, paddingLeft: 10 }}>
                      <AppText
                        size={13}
                        weight="bold"
                        color={theme.text}
                        numberOfLines={1}
                      >
                        {t.title}
                      </AppText>
                      <AppText size={11} color={theme.textMuted}>
                        {t.dateShort}
                      </AppText>
                    </View>
                    <AppText size={13} weight="bold" color="#22C55E">
                      {t.amount}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* FUND ACCOUNT MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={fundModalVisible}
        onRequestClose={() => setFundModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
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
              Add Money
            </AppText>
            <AppText
              size={13}
              color={theme.textMuted}
              style={{ marginBottom: 20 }}
            >
              Top up your wallet.
            </AppText>

            <AppText size={11} weight="bold" color={theme.textMuted}>
              AMOUNT (₦)
            </AppText>
            <View
              style={[
                styles.largeValueEntryBoxField,
                { backgroundColor: tileBg, borderColor: theme.border },
              ]}
            >
              <TextInput
                style={[styles.textInputBoxCoreStyle, { color: theme.text }]}
                value={fundAmount}
                onChangeText={setFundAmount}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={theme.textMuted}
                autoFocus={true}
              />
            </View>

            <AppText
              size={11}
              weight="bold"
              color={theme.textMuted}
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
                    { backgroundColor: tileBg, borderColor: theme.border },
                  ]}
                  onPress={() => setFundAmount(amt.toString())}
                >
                  <AppText size={13} weight="bold" color={theme.text}>
                    ₦{amt.toLocaleString()}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.actionModalFooterTwinButtonsLayoutGrid}>
              <TouchableOpacity
                style={[
                  styles.actionModalGridHalfBtn,
                  { borderColor: theme.border, borderWidth: 1 },
                ]}
                onPress={() => {
                  setFundModalVisible(false);
                  setFundAmount("");
                }}
              >
                <AppText size={14} weight="bold" color={theme.text}>
                  Cancel
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionModalGridHalfBtn,
                  { backgroundColor: theme?.primary },
                ]}
                onPress={handleFundAccount}
              >
                <AppText size={14} weight="bold" color="#FFF">
                  Confirm
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* PAYSTACK WEBVIEW MODAL */}
      <Modal
        animationType="fade"
        transparent={false}
        visible={webViewModalVisible}
        onRequestClose={() => setWebViewModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>
          <View style={styles.webViewHeaderLayout}>
            <TouchableOpacity
              style={styles.webViewCloseButton}
              onPress={() => setWebViewModalVisible(false)}
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
              onMessage={handleWebViewMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
            />
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardContainer: { flex: 1 },
  headerSafeArea: {
    paddingTop: Platform.OS === "ios" ? 6 : StatusBar.currentHeight || 6,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  avatarPressableRow: { position: "relative" },
  backChip: {
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  headerRightIcons: { flexDirection: "row", gap: 10 },
  headerChipButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  mainScrollView: { flex: 1 },
  scrollContentLayout: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  brandPillDock: { alignItems: "center", marginBottom: 16 },
  brandPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  balanceHeroDock: { alignItems: "center", marginBottom: 24 },
  balanceValueRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 12,
  },
  escrowPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(217, 119, 6, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  quickActionsCard: {
    flexDirection: "row",
    borderRadius: 24,
    padding: 10,
    gap: 8,
    marginBottom: 14,
  },
  quickActionTile: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "flex-start",
    gap: 12,
  },
  quickActionIconDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  secondaryCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    minHeight: 92,
    justifyContent: "space-between",
  },
  avatarStackRow: { flexDirection: "row", marginTop: 12 },
  stackedAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  escrowIconPairRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  escrowIconChip: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  activityHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  activityScrollRow: { gap: 10, paddingBottom: 20, paddingRight: 8 },
  activityCapsule: {
    backgroundColor: INK,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  activityCapsuleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitleLayoutDock: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  transactionLogCardRow: { borderRadius: 18, padding: 14, marginBottom: 12 },
  txLogInternalStructure: { flexDirection: "row", alignItems: "center" },
  txIconChip: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  statusMiniCapsule: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
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
  modalHeaderActionBarLayout: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  closeLabelActionBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  centerAuditHeroUnitBanner: {
    padding: 20,
    borderRadius: 20,
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
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
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
  payerHeroRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  payerHeroAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  payerContactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  payerTxRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
});
