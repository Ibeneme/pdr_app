import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Image,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/api/store";
import { getRequestById } from "@/api/slices/parcel.request.slice";
import { createNegotiation } from "@/api/slices/negotiation.slice";
import { AppText } from "@/components/AppText";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { getUser } from "@/api/secureStore";
import NegotiationManager from "@/components/NegotiationManager";

export default function RequestDetailsScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Local State
  const [parcel, setParcel] = useState<any | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNegotiating, setIsNegotiating] = useState(false);

  // Fetch Current User from Secure Store (Run once on mount)
  useEffect(() => {
    const fetchCurrentUser = async () => {
      console.log("👤 Fetching current user from secure store...");
      const user = await getUser();
      setCurrentUser(user);
      console.log(
        "✅ Current user loaded:",
        user ? user.fullName || user.name : "Not found"
      );
    };

    fetchCurrentUser();
  }, []);

  // AUTOMATIC RE-FETCH ON SCREEN FOCUS: Pulls latest data when navigating back
  useFocusEffect(
    useCallback(() => {
      if (id) {
        console.log(
          `🔄 [FOCUS EFFECT] Refreshing parcel details for ID: ${id}`
        );
        setIsLoading(true);
        dispatch(getRequestById(id))
          .unwrap()
          .then((data: any) => {
            console.log("✅ [FOCUS EFFECT] Data refreshed successfully:", data);
            setParcel(data);
            setError(null);
          })
          .catch((err: any) => {
            console.error("❌ [FOCUS EFFECT] Failed to refresh parcel:", err);
            setError(err?.message || "Failed to fetch request information");
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        console.warn("⚠️ [FOCUS EFFECT] Missing target ID parameter.");
      }
    }, [id, dispatch])
  );

  // Helper function to extract the active negotiation object matching current user
  const getActiveNegotiation = () => {
    if (!parcel || !currentUser) return null;

    const negData = parcel.negotiations || parcel.negotiation;

    if (Array.isArray(negData)) {
      if (negData.length === 0) return null;

      const currentUserId = currentUser._id || currentUser.id;
      return (
        negData.find(
          (n: any) =>
            n?.negotiator === currentUserId ||
            n?.negotiator?._id === currentUserId ||
            n?.negotiator?.id === currentUserId
        ) || null
      );
    }

    if (typeof negData === "object" && negData !== null) {
      return negData;
    }

    return null;
  };

  const activeNegotiation = getActiveNegotiation();
  const existingNegotiationId =
    activeNegotiation?._id || activeNegotiation?.id || null;
  const hasExistingNegotiation = !!existingNegotiationId;

  // Extract variables directly from the negotiation level
  const negotiationAgreedAmount = activeNegotiation?.agreedAmount;

  // FIX MATCHERS: Catch both explicit string payloads 'PAID' or raw model flags 'isPaid === true'
  const isPaid =
    activeNegotiation?.isPaid === true ||
    String(activeNegotiation?.status).toUpperCase() === "PAID" ||
    String(parcel?.status).toUpperCase() === "PAID";

  const negotiationStatus = isPaid
    ? "PAID"
    : activeNegotiation?.status
    ? String(activeNegotiation.status).toUpperCase()
    : "PENDING";

  const hasAgreedAmount =
    negotiationAgreedAmount !== undefined && negotiationAgreedAmount !== null;

  // STRICT RULE: Check if current user is the actual owner/serviceProvider of the parcel request
  const currentUserIdStr = currentUser?._id || currentUser?.id;
  const parcelProviderIdStr = parcel?.user?._id || parcel?.user?.id;
  const isServiceProvider =
    !!currentUserIdStr &&
    !!parcelProviderIdStr &&
    currentUserIdStr === parcelProviderIdStr;

  const handlePayPress = () => {
    console.log(
      "💳 [NAVIGATION] Redirecting user context to payment screen..."
    );
    router.push({
      pathname: "/(details)/PaymentScreen",
      params: {
        negotiationId: existingNegotiationId,
        serviceType: parcel?.serviceType || "deliver_a_parcel",
        amount: String(negotiationAgreedAmount),
        email: currentUser?.email || "customer@padiman.com",
      },
    });
  };

  const handleNegotiate = async () => {
    if (!parcel) {
      console.error("❌ Cannot negotiate: Parcel data not loaded");
      return;
    }

    if (hasExistingNegotiation && existingNegotiationId) {
      router.push({
        pathname: "/(details)/ChatScreen",
        params: { id: existingNegotiationId, parcelId: id },
      });
      return;
    }

    const payload = {
      serviceProvider: parcel.user?._id,
      service: id,
      serviceType: "deliver_a_parcel",
      negotiatorService: "Parcel Delivery Negotiation",
    };

    setIsNegotiating(true);
    try {
      const result = await dispatch(createNegotiation(payload)).unwrap();
      if (result?._id || result?.id) {
        const targetRoomId = result._id || result.id;
        router.push({
          pathname: "/(details)/ChatScreen",
          params: { id: targetRoomId },
        });
      }
    } catch (err: any) {
      console.error("[NEGOTIATION_ERROR] Failed:", err);
      Alert.alert("Error", "Failed to start negotiation. Please try again.");
    } finally {
      setIsNegotiating(false);
    }
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.centeredContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (error || !parcel) {
    return (
      <View
        style={[
          styles.centeredContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <AppText size={15} color={theme.text} style={styles.errorText}>
          {error || "Record missing"}
        </AppText>
      </View>
    );
  }

  const clientName = parcel.user?.fullName || "Anonymous Operator";
  const hasImage = !!parcel.user?.profileImage;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

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
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <AppText size={16} weight="bold" color={theme.text}>
            Request Validation
          </AppText>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      {/* DYNAMIC STATUS BANNER: Mutually visible to both provider and negotiator */}
      {hasExistingNegotiation && (
        <View
          style={[
            styles.agreedBanner,
            {
              backgroundColor: isPaid ? "#10B98115" : theme.primary + "15",
              borderColor: isPaid ? "#10B981" : theme.primary,
              margin: 16,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={isPaid ? "cash-check" : "handshake"}
            size={24}
            color={isPaid ? "#10B981" : theme.primary}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <AppText
              size={14}
              weight="bold"
              color={isPaid ? "#10B981" : theme.text}
            >
              {hasAgreedAmount
                ? `${isPaid ? "Payment Cleared" : "Agreed Price"}: ₦${Number(
                    negotiationAgreedAmount
                  ).toLocaleString()}`
                : "Negotiation Room Active"}
            </AppText>
            <AppText size={11} color={theme.textMuted} style={{ marginTop: 1 }}>
              Status: {negotiationStatus}
            </AppText>
          </View>

          {/* PAY NOW CTA: Strictly isolated so ONLY the negotiator (customer) can see it */}
          {hasAgreedAmount && !isPaid && !isServiceProvider && (
            <TouchableOpacity
              style={[styles.bannerPayBtn, { backgroundColor: theme.primary }]}
              onPress={handlePayPress}
            >
              <AppText size={12} weight="bold" color="#FFF">
                Pay Now
              </AppText>
            </TouchableOpacity>
          )}   <TouchableOpacity
          style={[styles.bannerPayBtn, { backgroundColor: theme.primary }]}
          onPress={handlePayPress}
        >
          <AppText size={12} weight="bold" color="#FFF">
            Pay Now
          </AppText>
        </TouchableOpacity>

          {/* VIEW RECEIPT CTA: Mutually visible to both service provider and negotiator once paid */}
          {hasAgreedAmount && isPaid && (
            <TouchableOpacity
              style={[styles.bannerPayBtn, { backgroundColor: "#10B981" }]}
              onPress={() => {
                router.push({
                  pathname: "/(details)/ReceiptScreen",
                  params: {
                    id: id,
                    negotiationId: existingNegotiationId,
                    amount: String(negotiationAgreedAmount),
                    status: negotiationStatus,
                    pickupAddress: parcel?.pickupAddress,
                    destinationCity: parcel?.destinationCity,
                    notes: parcel?.notes,
                    serviceType: parcel?.serviceType,
                    payerName: currentUser?.fullName || currentUser?.name,
                    payerEmail: currentUser?.email,
                    providerName: parcel?.user?.fullName,
                    providerEmail: parcel?.user?.email,
                  },
                });
              }}
            >
              <AppText size={12} weight="bold" color="#FFF">
                View Receipt
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Poster Profile Header Card */}
        <View
          style={[
            styles.contentCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              {hasImage ? (
                <Image
                  source={{ uri: parcel.user.profileImage }}
                  style={styles.avatarImg}
                />
              ) : (
                <View
                  style={[
                    styles.initialsAvatar,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <AppText color="#FFF" weight="bold" size={16}>
                    {clientName.slice(0, 2).toUpperCase()}
                  </AppText>
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <AppText size={16} weight="bold" color={theme.text}>
                {clientName}
              </AppText>
              <AppText size={12} color={theme.textMuted}>
                {parcel.user?.email || "No contact email linked"}
              </AppText>
            </View>
          </View>
        </View>

        {/* Route Details Card */}
        <View style={styles.sectionTitleRow}>
          <AppText
            size={11}
            weight="bold"
            color={theme.textMuted}
            style={styles.sectionTitleLabel}
          >
            LOGISTICS DETAILS
          </AppText>
        </View>

        <View
          style={[
            styles.contentCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.timelineRow}>
            <View style={styles.timelineIndicators}>
              <Ionicons
                name="radio-button-on"
                size={18}
                color={theme.primary}
              />
              <View
                style={[styles.dashedLine, { backgroundColor: theme.border }]}
              />
              <Ionicons name="location" size={18} color="#EF4444" />
            </View>
            <View style={styles.timelineContent}>
              <View>
                <AppText size={11} color={theme.textMuted}>
                  ORIGIN PICKUP
                </AppText>
                <AppText
                  size={15}
                  weight="bold"
                  color={theme.text}
                  style={{ marginTop: 2 }}
                >
                  {parcel.pickupAddress}
                </AppText>
              </View>
              <View style={{ marginTop: 24 }}>
                <AppText size={11} color={theme.textMuted}>
                  BOUND DESTINATION
                </AppText>
                <AppText
                  size={15}
                  weight="bold"
                  color={theme.text}
                  style={{ marginTop: 2 }}
                >
                  {parcel.destinationCity}
                </AppText>
              </View>
            </View>
          </View>
        </View>

        {/* Additional Notes */}
        {parcel.notes && parcel.notes.trim().length > 0 && (
          <>
            <AppText
              size={11}
              weight="bold"
              color={theme.textMuted}
              style={styles.sectionTitleLabel}
            >
              ADDITIONAL HANDLING NOTES
            </AppText>
            <View
              style={[
                styles.contentCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.notesRow}>
                <MaterialCommunityIcons
                  name="notebook-edit-outline"
                  size={22}
                  color={theme.primary}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <AppText
                    size={14}
                    color={theme.text}
                    style={styles.notesBodyText}
                  >
                    {parcel.notes}
                  </AppText>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Pricing Matrix */}
        <AppText
          size={11}
          weight="bold"
          color={theme.textMuted}
          style={styles.sectionTitleLabel}
        >
          PRICING & BUDGET
        </AppText>
        <View
          style={[
            styles.contentCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.metaParamRow}>
            <MaterialCommunityIcons
              name="cash-multiple"
              size={22}
              color={theme.textMuted}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <AppText size={12} color={theme.textMuted}>
                Budget Estimation Range
              </AppText>
              <AppText
                size={18}
                weight="bold"
                color={theme.primary}
                style={{ marginTop: 2 }}
              >
                {parcel.priceRange
                  ? `₦${parcel.priceRange.min?.toLocaleString()} - ₦${parcel.priceRange.max?.toLocaleString()}`
                  : "Negotiable Matrix Pricing"}
              </AppText>
            </View>
          </View>
        </View>

        {/* ONLY SERVICE PROVIDERS CAN VISUALLY ACCESS THE NEGOTIATION MANAGER */}
        {hasExistingNegotiation && isServiceProvider && (
          <NegotiationManager negotiationId={existingNegotiationId} />
        )}
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View
        style={[
          styles.stickyFooter,
          { backgroundColor: theme.surface, borderTopColor: theme.border },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.primaryActionBtn,
            { backgroundColor: theme.primary },
            isNegotiating && { opacity: 0.8 },
          ]}
          onPress={handleNegotiate}
          disabled={isNegotiating}
        >
          {isNegotiating ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : hasExistingNegotiation ? (
            <AppText size={15} weight="bold" color="#FFF">
              Go to Chats
            </AppText>
          ) : (
            <AppText size={15} weight="bold" color="#FFF">
              Negotiate
            </AppText>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: { marginVertical: 12, textAlign: "center" },
  headerArea: { width: "100%", borderBottomWidth: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: { padding: 20 },
  agreedBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  bannerPayBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  contentCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  profileSection: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%", resizeMode: "cover" },
  initialsAvatar: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitleLabel: { letterSpacing: 1, marginBottom: 0 },
  timelineRow: { flexDirection: "row", gap: 14 },
  timelineIndicators: { alignItems: "center", paddingVertical: 4 },
  dashedLine: { width: 2, flex: 1, marginVertical: 4 },
  timelineContent: { flex: 1 },
  metaParamRow: { flexDirection: "row", alignItems: "center" },
  notesRow: { flexDirection: "row", alignItems: "flex-start" },
  notesBodyText: { lineHeight: 20 },
  stickyFooter: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 36 : 20,
    borderTopWidth: 1,
  },
  primaryActionBtn: {
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
});
