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
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft } from "lucide-react-native";

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

  const handleShareReceipt = async () => {
    if (isSharing) return;
    setIsSharing(true);

    try {
      if (!viewShotRef.current?.capture) {
        throw new Error("Capture reference initialization failed.");
      }

      const localUri = await viewShotRef.current.capture();

      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (!isSharingAvailable) {
        Alert.alert(
          "Sharing Unavailable",
          "Native sharing is not available on this device."
        );
        return;
      }

      await Sharing.shareAsync(localUri, {
        dialogTitle: `Padiman Transaction Receipt - ${shortReference}`,
        mimeType: "image/png",
        UTI: "public.png",
      });
    } catch (error: any) {
      console.error("❌ [SHARE_ERROR]", error);
      Alert.alert("Sharing Failed", "Could not share the receipt.");
    } finally {
      setIsSharing(false);
    }
  };

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
              Transaction Receipt
            </AppText>

            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShareReceipt}
              disabled={isSharing}
            >
              {isSharing ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <Ionicons
                  name="share-social-outline"
                  size={22}
                  color={theme.text}
                />
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={styles.scrollContentLayout}
        showsVerticalScrollIndicator={false}
      >
        <ViewShot
          ref={viewShotRef}
          options={{ format: "png", quality: 0.95 }}
          style={{ backgroundColor: theme.background }}
        >
          <View style={styles.receiptContainer}>
            {/* Receipt Header */}
            <View style={styles.receiptHeader}>
              <View style={styles.successBadge}>
                <Ionicons name="checkmark-done" size={36} color="#FFF" />
              </View>
              <AppText
                size={32}
                weight="bold"
                color={theme.text}
                style={{ marginTop: 16 }}
              >
                ₦{formattedAmount}
              </AppText>
              <AppText
                size={13}
                weight="bold"
                color="#10B981"
                style={{ marginTop: 8, letterSpacing: 0.5 }}
              >
                SECURELY PROCESSED
              </AppText>
            </View>

            <View
              style={[styles.dashedDivider, { borderColor: theme.border }]}
            />

            {/* Transaction Details */}
            <View
              style={[
                styles.infoCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.dataRow}>
                <AppText size={13} color={theme.textMuted}>
                  Service
                </AppText>
                <AppText size={13} weight="bold" color={theme.text}>
                  {params.serviceType === "offer_a_ride"
                    ? "Ride Share"
                    : "Parcel Delivery"}
                </AppText>
              </View>
              <View style={styles.dataRow}>
                <AppText size={13} color={theme.textMuted}>
                  Status
                </AppText>
                <View style={styles.statusBadge}>
                  <View
                    style={[styles.statusDot, { backgroundColor: "#10B981" }]}
                  />
                  <AppText size={13} weight="bold" color="#10B981">
                    {params.status?.toUpperCase() || "PAID"}
                  </AppText>
                </View>
              </View>
              <View style={styles.dataRow}>
                <AppText size={13} color={theme.textMuted}>
                  Reference
                </AppText>
                <AppText size={13} weight="bold" color={theme.text}>
                  {shortReference}
                </AppText>
              </View>
            </View>

            {/* Parties */}
            <AppText
              size={12}
              weight="bold"
              color={theme.textMuted}
              style={styles.sectionTitle}
            >
              PARTICIPATING PARTIES
            </AppText>

            <View
              style={[
                styles.infoCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.partyRow}>
                <View
                  style={[
                    styles.partyIcon,
                    { backgroundColor: theme.primary + "15" },
                  ]}
                >
                  <Ionicons
                    name="wallet-outline"
                    size={20}
                    color={theme.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText size={12} color={theme.textMuted} weight="bold">
                    PAYER
                  </AppText>
                  <AppText
                    size={15}
                    weight="bold"
                    color={theme.text}
                    style={{ marginTop: 2 }}
                  >
                    {params.payerName || "Client"}
                  </AppText>
                  <AppText size={13} color={theme.textMuted}>
                    {params.payerEmail || "—"}
                  </AppText>
                </View>
              </View>

              <View
                style={[styles.divider, { backgroundColor: theme.border }]}
              />

              <View style={styles.partyRow}>
                <View
                  style={[styles.partyIcon, { backgroundColor: "#10B98115" }]}
                >
                  <Ionicons name="bicycle-outline" size={20} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText size={12} color={theme.textMuted} weight="bold">
                    PROVIDER
                  </AppText>
                  <AppText
                    size={15}
                    weight="bold"
                    color={theme.text}
                    style={{ marginTop: 2 }}
                  >
                    {params.providerName || "Service Provider"}
                  </AppText>
                  <AppText size={13} color={theme.textMuted}>
                    {params.providerEmail || "—"}
                  </AppText>
                </View>
              </View>
            </View>

            {/* Logistics */}
            <AppText
              size={12}
              weight="bold"
              color={theme.textMuted}
              style={styles.sectionTitle}
            >
              LOGISTICS DETAILS
            </AppText>

            <View
              style={[
                styles.infoCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.timelineRow}>
                <View style={styles.timelineDotContainer}>
                  <Ionicons
                    name="radio-button-on"
                    size={18}
                    color={theme.primary}
                  />
                  <View
                    style={[
                      styles.timelineLine,
                      { backgroundColor: theme.border },
                    ]}
                  />
                  <Ionicons name="location" size={18} color="#EF4444" />
                </View>

                <View style={{ flex: 1 }}>
                  <View>
                    <AppText size={12} color={theme.textMuted}>
                      PICKUP
                    </AppText>
                    <AppText
                      size={14}
                      weight="bold"
                      color={theme.text}
                      style={{ marginTop: 4 }}
                    >
                      {params.pickupAddress || "Not provided"}
                    </AppText>
                  </View>
                  <View style={{ marginTop: 20 }}>
                    <AppText size={12} color={theme.textMuted}>
                      DESTINATION
                    </AppText>
                    <AppText
                      size={14}
                      weight="bold"
                      color={theme.text}
                      style={{ marginTop: 4 }}
                    >
                      {params.destinationCity || "Not provided"}
                    </AppText>
                  </View>
                </View>
              </View>

              {params.notes && (
                <View
                  style={[
                    styles.notesBox,
                    {
                      backgroundColor: theme.background,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <AppText size={12} weight="bold" color={theme.textMuted}>
                    NOTES
                  </AppText>
                  <AppText
                    size={13}
                    color={theme.text}
                    style={{ marginTop: 6, lineHeight: 20 }}
                  >
                    {params.notes}
                  </AppText>
                </View>
              )}
            </View>
          </View>
        </ViewShot>
      </ScrollView>

      {/* Bottom Action */}
      <View
        style={[
          styles.footer,
          { backgroundColor: theme.surface, borderTopColor: theme.border },
        ]}
      >
        <TouchableOpacity
          style={[styles.doneButton, { backgroundColor: theme.primary }]}
          onPress={() => router.back()}
        >
          <AppText size={16} weight="bold" color="#FFFFFF">
            Done
          </AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  shareButton: { padding: 8 },

  mainScrollView: { flex: 1 },
  scrollContentLayout: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  receiptContainer: { backgroundColor: "transparent" },
  receiptHeader: { alignItems: "center", marginBottom: 20 },
  successBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
  },

  dashedDivider: {
    borderWidth: 1,
    borderStyle: "dashed",
    marginVertical: 20,
  },
  divider: { height: 1, marginVertical: 16 },

  infoCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 20,
    marginBottom: 24,
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  sectionTitle: {
    letterSpacing: 1.2,
    marginBottom: 10,
    paddingHorizontal: 4,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#10B98115",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },

  partyRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  partyIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  timelineRow: { flexDirection: "row", gap: 16 },
  timelineDotContainer: { alignItems: "center", paddingVertical: 4 },
  timelineLine: { width: 2, flex: 1, marginVertical: 6 },

  notesBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 36 : 20,
    borderTopWidth: 1,
  },
  doneButton: {
    height: 56,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
