import React, { useRef, useState } from "react";
import {
  StyleSheet,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { AppText } from "@/components/AppText";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";

export default function ReceiptScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const viewShotRef = useRef<ViewShot>(null);
  const [isSharing, setIsSharing] = useState(false);

  const params = useLocalSearchParams<{
    id: string;
    negotiationId: string;
    amount: string;
    status: string;
    pickupAddress: string;
    destinationCity: string;
    notes?: string;
    serviceType?: string;
    payerName?: string;
    payerEmail?: string;
    providerName?: string;
    providerEmail?: string;
  }>();

  const formattedAmount = Number(params.amount || 0).toLocaleString();
  const shortReference = String(params.negotiationId || params.id || "UNKNOWN")
    .slice(-12)
    .toUpperCase();

  // Native View-Shot Image Generation & Share Intent Pipeline
  const handleShareReceipt = async () => {
    if (isSharing) return;
    setIsSharing(true);

    try {
      if (!viewShotRef.current?.capture) {
        throw new Error("Capture reference initialization failed.");
      }

      // Generate local transient image file path pointer
      const localUri = await viewShotRef.current.capture();

      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (!isSharingAvailable) {
        Alert.alert(
          "Sharing Unavailable",
          "Native sharing platform profiles are restricted on this device."
        );
        return;
      }

      await Sharing.shareAsync(localUri, {
        dialogTitle: `Padiman Transaction Receipt - ${shortReference}`,
        mimeType: "image/png",
        UTI: "public.png",
      });
    } catch (error: any) {
      console.error("❌ [SHARE_ERROR] Processing exception caught:", error);
      Alert.alert(
        "Sharing Failed",
        "Could not assemble receipt layout file graphics."
      );
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header Context Bar */}
      <SafeAreaView
        style={[
          styles.headerArea,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconCircle}
          >
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <AppText size={16} weight="bold" color={theme.text}>
            Transaction Receipt
          </AppText>
          <TouchableOpacity
            style={styles.iconCircle}
            onPress={handleShareReceipt}
            disabled={isSharing}
          >
            {isSharing ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Ionicons
                name="share-social-outline"
                size={20}
                color={theme.text}
              />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* VIEWSHOT CONTAINER: Captures everything inside elegantly */}
        <ViewShot
          ref={viewShotRef}
          options={{ format: "png", quality: 0.95 }}
          style={{ backgroundColor: theme.background }}
        >
          <View style={styles.capturePadding}>
            {/* Terminal Header Voucher Brand */}
            <View style={styles.receiptVoucherHeader}>
              <View style={styles.successBadgeCircle}>
                <Ionicons name="checkmark-done" size={32} color="#FFF" />
              </View>
              <AppText
                size={28}
                weight="bold"
                color={theme.text}
                style={{ marginTop: 14 }}
              >
                ₦{formattedAmount}
              </AppText>
              <AppText
                size={12}
                color="#10B981"
                weight="bold"
                style={styles.badgeText}
              >
                <MaterialCommunityIcons name="shield-check" size={13} />{" "}
                SECURELY PROCESSED VIA PAYSTACK
              </AppText>
            </View>

            <View
              style={[styles.dashedDivider, { borderColor: theme.border }]}
            />

            {/* Transaction Core Properties */}
            <View
              style={[
                styles.infoCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.dataRow}>
                <AppText size={13} color={theme.textMuted}>
                  Service Category
                </AppText>
                <AppText size={13} weight="bold" color={theme.text}>
                  {params.serviceType === "offer_a_ride"
                    ? "Ride Share / Transport"
                    : "Parcel Logistics Delivery"}
                </AppText>
              </View>
              <View style={styles.dataRow}>
                <AppText size={13} color={theme.textMuted}>
                  Payment Status
                </AppText>
                <View style={styles.statusBadge}>
                  <View
                    style={[styles.statusDot, { backgroundColor: "#10B981" }]}
                  />
                  <AppText size={12} weight="bold" color="#10B981">
                    {params.status || "PAID"}
                  </AppText>
                </View>
              </View>
              <View style={styles.dataRow}>
                <AppText size={13} color={theme.textMuted}>
                  Reference Hash
                </AppText>
                <AppText size={13} weight="mono" color={theme.text}>
                  {shortReference}
                </AppText>
              </View>
            </View>

            {/* Party Profiles */}
            <AppText
              size={11}
              weight="bold"
              color={theme.textMuted}
              style={styles.sectionLabel}
            >
              PARTICIPATING PARTIES
            </AppText>

            <View
              style={[
                styles.infoCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              {/* Payer Row */}
              <View style={styles.partyRow}>
                <View
                  style={[
                    styles.avatarIndicator,
                    { backgroundColor: theme.primary + "15" },
                  ]}
                >
                  <Ionicons
                    name="wallet-outline"
                    size={18}
                    color={theme.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText size={11} color={theme.textMuted} weight="bold">
                    PAYER / CLIENT
                  </AppText>
                  <AppText
                    size={14}
                    weight="bold"
                    color={theme.text}
                    style={{ marginTop: 2 }}
                  >
                    {params.payerName || "Authorized Account User"}
                  </AppText>
                  <AppText size={12} color={theme.textMuted}>
                    {params.payerEmail || "—"}
                  </AppText>
                </View>
              </View>

              <View
                style={[styles.solidDivider, { backgroundColor: theme.border }]}
              />

              {/* Provider Row */}
              <View style={[styles.partyRow, { marginTop: 4 }]}>
                <View
                  style={[
                    styles.avatarIndicator,
                    { backgroundColor: "#10B98115" },
                  ]}
                >
                  <Ionicons name="bicycle-outline" size={18} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText size={11} color={theme.textMuted} weight="bold">
                    SERVICE PROVIDER
                  </AppText>
                  <AppText
                    size={14}
                    weight="bold"
                    color={theme.text}
                    style={{ marginTop: 2 }}
                  >
                    {params.providerName || "Anonymous Operator"}
                  </AppText>
                  <AppText size={12} color={theme.textMuted}>
                    {params.providerEmail || "—"}
                  </AppText>
                </View>
              </View>
            </View>

            {/* Logistics Manifest */}
            <AppText
              size={11}
              weight="bold"
              color={theme.textMuted}
              style={styles.sectionLabel}
            >
              LOGISTICS MANIFEST
            </AppText>

            <View
              style={[
                styles.infoCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.timelineRow}>
                <View style={styles.timelineIndicators}>
                  <Ionicons
                    name="radio-button-on"
                    size={16}
                    color={theme.primary}
                  />
                  <View
                    style={[styles.lineLink, { backgroundColor: theme.border }]}
                  />
                  <Ionicons name="location" size={16} color="#EF4444" />
                </View>
                <View style={styles.timelineContent}>
                  <View>
                    <AppText size={11} color={theme.textMuted}>
                      PICKUP MANIFEST LOCATION
                    </AppText>
                    <AppText
                      size={14}
                      weight="bold"
                      color={theme.text}
                      style={{ marginTop: 2 }}
                    >
                      {params.pickupAddress || "Not Disclosed"}
                    </AppText>
                  </View>
                  <View style={{ marginTop: 20 }}>
                    <AppText size={11} color={theme.textMuted}>
                      BOUND TERMINAL DESTINATION
                    </AppText>
                    <AppText
                      size={14}
                      weight="bold"
                      color={theme.text}
                      style={{ marginTop: 2 }}
                    >
                      {params.destinationCity || "Not Disclosed"}
                    </AppText>
                  </View>
                </View>
              </View>

              {params.notes && params.notes.trim().length > 0 && (
                <View
                  style={[
                    styles.notesWrapper,
                    { backgroundColor: theme.background },
                  ]}
                >
                  <AppText size={11} weight="bold" color={theme.textMuted}>
                    MANIFEST NOTES
                  </AppText>
                  <AppText
                    size={13}
                    color={theme.text}
                    style={{ marginTop: 4, lineHeight: 18 }}
                  >
                    {params.notes}
                  </AppText>
                </View>
              )}
            </View>
          </View>
        </ViewShot>
      </ScrollView>

      {/* Footer Navigation Bar */}
      <View
        style={[
          styles.stickyFooter,
          { backgroundColor: theme.surface, borderTopColor: theme.border },
        ]}
      >
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
          onPress={() => router.back()}
        >
          <AppText size={15} weight="bold" color="#FFF">
            Done
          </AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerArea: { width: "100%", borderBottomWidth: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyBox: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: { padding: 4 },
  capturePadding: { padding: 16 },
  receiptVoucherHeader: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 24,
  },
  successBadgeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: { marginTop: 8, letterSpacing: 0.5 },
  dashedDivider: {
    width: "100%",
    height: 1,
    borderWidth: 1,
    borderStyle: "dashed",
    marginBottom: 24,
    borderRadius: 1,
  },
  solidDivider: { width: "100%", height: 1, marginVertical: 14 },
  infoCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    gap: 14,
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionLabel: { letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#10B98110",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  partyRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarIndicator: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  timelineRow: { flexDirection: "row", gap: 12 },
  timelineIndicators: { alignItems: "center", paddingVertical: 2 },
  lineLink: { width: 2, flex: 1, marginVertical: 4 },
  timelineContent: { flex: 1 },
  notesWrapper: { padding: 12, borderRadius: 12, marginTop: 14 },
  stickyFooter: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 36 : 20,
    borderTopWidth: 1,
  },
  primaryBtn: {
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
});
