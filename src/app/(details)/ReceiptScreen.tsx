import React, { useRef, useState } from "react";
import {
  StyleSheet,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { AppText } from "@/components/AppText";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { ArrowLeft } from "lucide-react-native";

export default function ReceiptScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const viewShotRef = useRef<any>(null);
  const [isSharing, setIsSharing] = useState(false);

  const params = useLocalSearchParams<{
    id: string;
    negotiationId: string;
    amount: string;
    status: string;
    pickupAddress?: string;
    destinationCity?: string;
    notes?: string;
    serviceType?: string;
    payerName?: string;
    payerEmail?: string;
    providerName?: string;
  }>();

  const formattedAmount = Number(params.amount || 0).toLocaleString();
  const shortReference = String(params.negotiationId || params.id || "UNKNOWN")
    .slice(-12)
    .toUpperCase();

  const formattedDate = new Date().toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

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
      console.error("❌ [SHARE_ERROR]:", error);
      Alert.alert("Sharing Failed", "Could not share the receipt.");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? theme.background : "#F4F6F9" },
      ]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* HEADER BAR */}
      <SafeAreaView style={{ backgroundColor: "transparent" }}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.headerIconButton,
              { backgroundColor: theme.surface },
            ]}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={theme.text} />
          </TouchableOpacity>

          <AppText size={16} weight="bold" color={theme.text}>
            Receipt Details
          </AppText>

          <TouchableOpacity
            style={[
              styles.headerIconButton,
              { backgroundColor: theme.surface },
            ]}
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
        style={styles.mainScrollView}
        contentContainerStyle={styles.scrollContentLayout}
        showsVerticalScrollIndicator={false}
      >
        {/* CAPTURABLE TICKET CONTAINER */}
        <ViewShot
          ref={viewShotRef}
          options={{ format: "png", quality: 0.95 }}
          style={[styles.ticketCard, { backgroundColor: theme.surface }]}
        >
          {/* TOP HEADER */}
          <View style={styles.ticketTopHeader}>
            <AppText size={38} style={styles.emojiHeading}>
              🎉
            </AppText>
            <AppText
              size={22}
              weight="bold"
              color={theme.text}
              style={styles.thankYouText}
            >
              Thank you!
            </AppText>
            <AppText
              size={13}
              color={theme.textMuted}
              style={styles.subReceiptMessage}
            >
              Your transaction was processed successfully
            </AppText>
          </View>

          {/* NOTCHED DASHED DIVIDER */}
          <View style={styles.notchDashedDividerRow}>
            <View
              style={[
                styles.leftNotchCutout,
                { backgroundColor: isDark ? theme.background : "#F4F6F9" },
              ]}
            />
            <View
              style={[
                styles.dashedDividerLine,
                { borderColor: isDark ? theme.border : "#E2E8F0" },
              ]}
            />
            <View
              style={[
                styles.rightNotchCutout,
                { backgroundColor: isDark ? theme.background : "#F4F6F9" },
              ]}
            />
          </View>

          {/* AMOUNT BANNER */}
          <View style={styles.amountBannerGroup}>
            <AppText size={11} color={theme.textMuted} weight="bold">
              AMOUNT PAID
            </AppText>
            <AppText size={28} weight="bold" color={theme.text}>
              ₦{formattedAmount}
            </AppText>
            <View style={styles.statusBadge}>
              <MaterialCommunityIcons
                name="check-circle"
                size={14}
                color="#10B981"
              />
              <AppText
                size={12}
                weight="bold"
                color="#10B981"
                style={{ marginLeft: 4 }}
              >
                {String(params.status || "Paid").toUpperCase()}
              </AppText>
            </View>
          </View>

          {/* ITEM DETAILS TABLE */}
          <View style={[styles.detailsBlock, { borderColor: theme.border }]}>
            <View style={styles.detailRow}>
              <AppText size={13} color={theme.textMuted}>
                Reference
              </AppText>
              <AppText size={13} weight="bold" color={theme.text}>
                #{shortReference}
              </AppText>
            </View>

            <View style={styles.detailRow}>
              <AppText size={13} color={theme.textMuted}>
                Date & Time
              </AppText>
              <AppText size={13} weight="bold" color={theme.text}>
                {formattedDate}
              </AppText>
            </View>

            {params.serviceType ? (
              <View style={styles.detailRow}>
                <AppText size={13} color={theme.textMuted}>
                  Service Type
                </AppText>
                <AppText size={13} weight="bold" color={theme.text}>
                  {params.serviceType.replace(/_/g, " ").toUpperCase()}
                </AppText>
              </View>
            ) : null}

            {params.payerName ? (
              <View style={styles.detailRow}>
                <AppText size={13} color={theme.textMuted}>
                  Payer
                </AppText>
                <AppText size={13} weight="bold" color={theme.text}>
                  {params.payerName}
                </AppText>
              </View>
            ) : null}

            {params.providerName ? (
              <View style={styles.detailRow}>
                <AppText size={13} color={theme.textMuted}>
                  Provider / Partner
                </AppText>
                <AppText size={13} weight="bold" color={theme.text}>
                  {params.providerName}
                </AppText>
              </View>
            ) : null}

            {params.pickupAddress && params.pickupAddress !== "N/A" ? (
              <View style={styles.detailRow}>
                <AppText size={13} color={theme.textMuted}>
                  Pickup Location
                </AppText>
                <AppText
                  size={13}
                  weight="bold"
                  color={theme.text}
                  style={styles.rightAlignText}
                >
                  {params.pickupAddress}
                </AppText>
              </View>
            ) : null}

            {params.destinationCity && params.destinationCity !== "N/A" ? (
              <View style={styles.detailRow}>
                <AppText size={13} color={theme.textMuted}>
                  Destination
                </AppText>
                <AppText
                  size={13}
                  weight="bold"
                  color={theme.text}
                  style={styles.rightAlignText}
                >
                  {params.destinationCity}
                </AppText>
              </View>
            ) : null}
          </View>

          {/* FOOTER GUARANTEE NOTE */}
          <View style={styles.ticketFooterNote}>
            <MaterialCommunityIcons
              name="shield-check"
              size={18}
              color="#10B981"
            />
            <AppText
              size={11}
              color={theme.textMuted}
              style={{ marginLeft: 6 }}
            >
              Escrow Security Active • Padiman Verified
            </AppText>
          </View>
        </ViewShot>

        {/* BOTTOM ACTION BUTTON */}
        <TouchableOpacity
          style={[styles.doneButton, { backgroundColor: theme.primary }]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <AppText color="#FFFFFF" weight="bold" size={15}>
            Done
          </AppText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  mainScrollView: { flex: 1 },
  scrollContentLayout: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },
  ticketCard: {
    borderRadius: 24,
    paddingVertical: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  ticketTopHeader: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emojiHeading: { textAlign: "center", marginBottom: 6 },
  thankYouText: { textAlign: "center" },
  subReceiptMessage: { textAlign: "center", marginTop: 4, lineHeight: 18 },

  notchDashedDividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    position: "relative",
  },
  leftNotchCutout: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginLeft: -10,
  },
  rightNotchCutout: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: -10,
  },
  dashedDividerLine: {
    flex: 1,
    borderWidth: 1,
    borderStyle: "dashed",
    height: 1,
  },

  amountBannerGroup: {
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },

  detailsBlock: {
    marginHorizontal: 20,
    borderTopWidth: 1,
    paddingTop: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rightAlignText: {
    maxWidth: "60%",
    textAlign: "right",
  },

  ticketFooterNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    paddingTop: 16,
  },

  doneButton: {
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
});
