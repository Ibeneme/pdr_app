import React, { useState } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { AppText } from "@/components/AppText";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function WalletScreen() {
  const { theme: colors, isDark } = useTheme();
  const router = useRouter();

  const [balance] = useState(48750);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [fundModalVisible, setFundModalVisible] = useState(false);
  const [fundAmount, setFundAmount] = useState("");

  const transactions = [
    {
      id: "TX-90182",
      type: "credit",
      title: "Ride Revenue Received",
      amount: "+₦3,800",
      date: "Today, 11:20 AM",
      service: "Ride Sharing",
      route: "Choba to Aluu",
      driver: "Emma Okoro",
      status: "Settled",
    },
    {
      id: "TX-44129",
      type: "debit",
      title: "Settlement to GTBank",
      amount: "-₦15,000",
      date: "May 23, 2026",
      service: "Bank Withdrawal",
      route: "Not Applicable",
      driver: "David Bike Run",
      status: "Processed",
    },
    {
      id: "TX-11028",
      type: "credit",
      title: "Logistics Delivery Payout",
      amount: "+₦2,500",
      date: "May 22, 2026",
      service: "Parcel Delivery",
      route: "Port Harcourt to Owerri",
      driver: "David Bike Run",
      status: "Settled",
    },
    {
      id: "TX-09821",
      type: "credit",
      title: "Ride Revenue Received",
      amount: "+₦1,800",
      date: "May 21, 2026",
      service: "Ride Sharing",
      route: "Choba to Rumuokwuta",
      driver: "Sarah Nwosu",
      status: "Settled",
    },
  ];

  const quickAmounts = [1000, 5000, 10000, 25000];

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
            Financial Ledger
          </AppText>
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* --- PREMIUM BALANCE VIEW BOARD --- */}
        <View
          style={[
            styles.balanceMasterCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <AppText
            size={12}
            weight="bold"
            color={colors.textMuted}
            style={{ letterSpacing: 0.8 }}
          >
            WALLET
          </AppText>
          <AppText
            size={34}
            weight="bold"
            color={colors.text}
            style={{ marginVertical: 6, letterSpacing: -0.5 }}
          >
            ₦{balance.toLocaleString()}
          </AppText>

          <View style={styles.balanceTwinActionsRow}>
            <TouchableOpacity
              style={[
                styles.actionCellBtn,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => setFundModalVisible(true)}
            >
              <AppText size={14} weight="bold" color="#FFF">
                Fund Account
              </AppText>
            </TouchableOpacity>

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

        {/* --- STATS ASYMMETRIC GRID TRACKER --- */}
        <View style={styles.statsRowGridLayout}>
          <View
            style={[
              styles.smallMetricCardBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <AppText
              size={11}
              weight="bold"
              color={colors.textMuted}
              style={{ marginBottom: 4 }}
            >
              CUMULATIVE EARNINGS
            </AppText>
            <AppText size={20} weight="bold" color={colors.text}>
              ₦128,450
            </AppText>
          </View>
          <View
            style={[
              styles.smallMetricCardBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <AppText
              size={11}
              weight="bold"
              color={colors.textMuted}
              style={{ marginBottom: 4 }}
            >
              CURRENT CYCLE MONTH
            </AppText>
            <AppText size={20} weight="bold" color={colors.text}>
              ₦42,300
            </AppText>
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

        {transactions.map((tx) => {
          const isIncome = tx.type === "credit";
          return (
            <TouchableOpacity
              key={tx.id}
              style={[
                styles.transactionLogCardRow,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => setSelectedTx(tx)}
              activeOpacity={0.9}
            >
              <View style={styles.txLogInternalStructure}>
                <View
                  style={[
                    styles.verticalIndicatorPillMarker,
                    { backgroundColor: isIncome ? "#22C55E" : "#EF4444" },
                  ]}
                />

                <View style={{ flex: 1, paddingLeft: 4 }}>
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
                    ID: {tx.id} • {tx.date}
                  </AppText>
                </View>

                <View
                  style={{ alignItems: "flex-end", justifyContent: "center" }}
                >
                  <AppText
                    size={15}
                    weight="bold"
                    color={isIncome ? "#22C55E" : "#EF4444"}
                  >
                    {tx.amount}
                  </AppText>
                  <View
                    style={[
                      styles.statusMiniCapsule,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <AppText size={9} weight="bold" color={colors.text}>
                      {tx.status.toUpperCase()}
                    </AppText>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
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
                Details
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
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <AppText size={11} weight="bold" color={colors.textMuted}>
                    TRANSACTION VALUATION VOLUME
                  </AppText>
                  <AppText
                    size={32}
                    weight="bold"
                    color={selectedTx.type === "credit" ? "#22C55E" : "#EF4444"}
                    style={{ marginVertical: 6 }}
                  >
                    {selectedTx.amount}
                  </AppText>
                  <AppText size={11} weight="bold" color={colors.text}>
                    UUID: {selectedTx.id}
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
                      Source
                    </AppText>
                    <AppText size={13} weight="bold" color={colors.text}>
                      {selectedTx.service}
                    </AppText>
                  </View>
                  <View style={styles.metadataSplitRowAlign}>
                    <AppText size={13} color={colors.textMuted}>
                      Routing Geolocation
                    </AppText>
                    <AppText size={13} weight="bold" color={colors.text}>
                      {selectedTx.route}
                    </AppText>
                  </View>
                  <View style={styles.metadataSplitRowAlign}>
                    <AppText size={13} color={colors.textMuted}>
                      Account Owner
                    </AppText>
                    <AppText size={13} weight="bold" color={colors.text}>
                      {selectedTx.driver}
                    </AppText>
                  </View>
                  <View style={styles.metadataSplitRowAlign}>
                    <AppText size={13} color={colors.textMuted}>
                      Timestamp
                    </AppText>
                    <AppText size={13} weight="bold" color={colors.text}>
                      {selectedTx.date}
                    </AppText>
                  </View>
                  <View
                    style={[
                      styles.metadataSplitRowAlign,
                      { borderBottomWidth: 0, paddingBottom: 0 },
                    ]}
                  >
                    <AppText size={13} color={colors.textMuted}>
                      Status
                    </AppText>
                    <AppText size={13} weight="bold" color="#22C55E">
                      {selectedTx.status}
                    </AppText>
                  </View>
                </View>
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
        <View style={styles.modalScreenLayoutOverlayMask}>
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
                onPress={() => setFundModalVisible(false)}
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
                onPress={() => {
                  setFundModalVisible(false);
                  setFundAmount("");
                }}
              >
                <AppText size={14} weight="bold" color="#FFF">
                  Confirm 
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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

  /* Balance Component Architectures */
  balanceMasterCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  balanceTwinActionsRow: { flexDirection: "row", gap: 10, marginTop: 24 },
  actionCellBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Data Monitoring Grid Layout Units */
  statsRowGridLayout: { flexDirection: "row", gap: 12, marginBottom: 24 },
  smallMetricCardBox: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },

  /* Financial Logs List Interface Blocks */
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

  /* Overlay Presentation Layout Layer Engineering */
  modalScreenLayoutOverlayMask: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  detailModalPresentationSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: SCREEN_HEIGHT * 0.65,
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
});
