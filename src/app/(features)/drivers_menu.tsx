import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { useDispatch } from "react-redux";
import { getAllGlobalRequests } from "@/api/slices/parcel.request.slice";
import { AppDispatch } from "@/api/store";
import {
  ArrowLeft,
  Handshake,
  Lock,
  CheckCircle2,
  ArrowDown,
} from "lucide-react-native";
import { AppText } from "@/components/AppText";
import { LinearGradient } from "expo-linear-gradient";

export default function DriverMarketplaceScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [parcels, setParcels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      console.error("No ID provided to DriverMarketplaceScreen");
      return;
    }

    setIsLoading(true);
    dispatch(getAllGlobalRequests(id))
      .unwrap()
      .then((response: any) => {
        let parcelData: any[] = [];

        if (response?.success && Array.isArray(response.data)) {
          parcelData = response.data;
        } else if (Array.isArray(response)) {
          parcelData = response;
        } else if (response?.data) {
          parcelData = Array.isArray(response.data)
            ? response.data
            : [response.data];
        }

        // Sort: Negotiations first, then newest
        const sorted = [...parcelData].sort((a, b) => {
          const aHasNeg = Boolean(a.isNegotiator);
          const bHasNeg = Boolean(b.isNegotiator);
          if (bHasNeg !== aHasNeg) return bHasNeg ? 1 : -1;
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });

        setParcels(sorted);
      })
      .catch((err) => {
        console.error("❌ Fetch failure:", err);
      })
      .finally(() => setIsLoading(false));
  }, [dispatch, id]);

  const getInitials = (name: string = "Customer") => {
    const names = name.trim().split(" ");
    return names.length >= 2
      ? (names[0][0] + names[1][0]).toUpperCase()
      : names[0].slice(0, 2).toUpperCase();
  };

  const getNegotiationSummary = (parcel: any) => {
    if (!parcel?.isNegotiator || !parcel?.negotiations?.length) return null;

    const latest = [...parcel.negotiations].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0];

    const otherParty =
      latest.negotiator?._id === parcel.user?._id
        ? latest.serviceProvider
        : latest.negotiator;

    return {
      withUser: otherParty?.fullName || "Service Provider",
      status: latest.status,
      agreedAmount: latest.agreedAmount,
      isPaid: latest.isPaid,
    };
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
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={theme.text} />
            </TouchableOpacity>

            <AppText size={20} weight="bold" color={theme.text}>
              {id ? "Related Requests" : "Available Requests"}
            </AppText>

            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!id ? (
          <View style={styles.emptyWrapper}>
            <AppText size={15} color={theme.textMuted} weight="medium">
              ID is required to view requests
            </AppText>
          </View>
        ) : isLoading ? (
          <View style={styles.loaderWrapper}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : parcels.length === 0 ? (
          <View style={styles.emptyWrapper}>
            <AppText size={15} color={theme.textMuted} weight="medium">
              No related requests found.
            </AppText>
          </View>
        ) : (
          parcels.map((parcel) => {
            const clientName = parcel.user?.fullName || "Anonymous Requester";
            const clientImage = parcel.user?.profileImage;
            const negotiation = getNegotiationSummary(parcel);
            const isCardDisabled = parcel.isDisabled && !parcel.isNegotiator;

            return (
              <TouchableOpacity
                key={parcel._id}
                activeOpacity={isCardDisabled ? 1 : 0.85}
                disabled={isCardDisabled}
                onPress={() =>
                  router.push({
                    pathname: "/(details)/details",
                    params: {
                      id: parcel._id,
                      type: "parcelrequest",
                      negotiatorService: id,
                    },
                  })
                }
                style={[
                  styles.requestCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: isCardDisabled ? "transparent" : theme.border,
                  },
                  negotiation && {
                    borderColor: theme.primary,
                    borderWidth: 1.5,
                  },
                  isCardDisabled && styles.disabledCard,
                ]}
              >
                {/* Active Negotiation Badge */}
                {negotiation && (
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${theme.primary}15` },
                    ]}
                  >
                    <Handshake size={14} color={theme.primary} />
                    <AppText size={12} weight="bold" color={theme.primary}>
                      Negotiation • {negotiation.status.toUpperCase()}
                      {negotiation.agreedAmount &&
                        ` • ₦${Number(
                          negotiation.agreedAmount
                        ).toLocaleString()}`}
                    </AppText>
                  </View>
                )}

                {/* Ride Closed / Unavailable Badge */}
                {isCardDisabled && (
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: "rgba(148, 163, 184, 0.12)" },
                    ]}
                  >
                    <Lock size={14} color={theme.textMuted} />
                    <AppText size={12} weight="bold" color={theme.textMuted}>
                      RIDE TAKEN / UNAVAILABLE
                    </AppText>
                  </View>
                )}

                {/* Profile Block */}
                <View style={styles.userInfoRow}>
                  <View style={styles.avatarWrapper}>
                    {clientImage ? (
                      <Image
                        source={{ uri: clientImage }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <View
                        style={[
                          styles.initialsBox,
                          {
                            backgroundColor: isCardDisabled
                              ? "#CBD5E1"
                              : theme.primary,
                          },
                        ]}
                      >
                        <AppText size={14} weight="bold" color="#FFFFFF">
                          {getInitials(clientName)}
                        </AppText>
                      </View>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <AppText
                        size={15}
                        weight="bold"
                        color={theme.text}
                        numberOfLines={1}
                      >
                        {clientName}
                      </AppText>
                      {parcel.user?.isVerified && (
                        <CheckCircle2 size={14} color={theme.primary} />
                      )}
                    </View>
                    <AppText size={12} color={theme.textMuted} weight="medium">
                      {parcel.user?.isVerified
                        ? "Verified Client"
                        : "Active Hub User"}
                    </AppText>
                  </View>
                </View>

                {/* Scannable Route View Components */}
                <View
                  style={[
                    styles.routePathsBlock,
                    { backgroundColor: theme.background },
                  ]}
                >
                  <View style={styles.routeRowItem}>
                    <View
                      style={[
                        styles.bulletIndicator,
                        { backgroundColor: "#EF4444" },
                      ]}
                    />
                    <AppText
                      size={14}
                      weight="semibold"
                      color={theme.text}
                      numberOfLines={1}
                      style={styles.routeText}
                    >
                      {parcel.pickupAddress || "Unknown Pickup Hub"}
                    </AppText>
                  </View>

                  <View
                    style={[
                      styles.connectorLine,
                      { borderColor: theme.border },
                    ]}
                  />

                  <View style={styles.routeRowItem}>
                    <View
                      style={[
                        styles.bulletIndicator,
                        { backgroundColor: "#22C55E" },
                      ]}
                    />
                    <AppText
                      size={14}
                      weight="semibold"
                      color={theme.text}
                      numberOfLines={1}
                      style={styles.routeText}
                    >
                      {parcel.destinationCity || "Unknown Destination"}
                    </AppText>
                  </View>
                </View>

                {/* Card Bottom Matrix Pricing & Tags row */}
                <View style={styles.cardFooterRow}>
                  <AppText size={16} weight="bold" color={theme.text}>
                    {parcel.priceRange
                      ? `₦${parcel.priceRange.min?.toLocaleString()} - ₦${parcel.priceRange.max?.toLocaleString()}`
                      : "Negotiable"}
                  </AppText>

                  <View style={styles.tagBadgeRow}>
                    {parcel.properties?.isPerishable && (
                      <View
                        style={[
                          styles.tagBadge,
                          { backgroundColor: "rgba(245, 158, 11, 0.12)" },
                        ]}
                      >
                        <AppText size={11} weight="bold" color="#F59E0B">
                          PERISHABLE
                        </AppText>
                      </View>
                    )}
                    {parcel.properties?.isFragile && (
                      <View
                        style={[
                          styles.tagBadge,
                          { backgroundColor: "rgba(239, 68, 68, 0.12)" },
                        ]}
                      >
                        <AppText size={11} weight="bold" color="#EF4444">
                          FRAGILE
                        </AppText>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
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
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  loaderWrapper: {
    paddingVertical: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyWrapper: {
    paddingVertical: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  requestCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  disabledCard: {
    opacity: 0.55,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 14,
    alignSelf: "flex-start",
  },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  avatarWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%", resizeMode: "cover" },
  initialsBox: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  routePathsBlock: {
    padding: 14,
    borderRadius: 16,
    marginVertical: 4,
    marginBottom: 16,
  },
  routeRowItem: { flexDirection: "row", alignItems: "center" },
  bulletIndicator: { width: 8, height: 8, borderRadius: 4 },
  routeText: { flex: 1, marginLeft: 8 },
  connectorLine: {
    height: 14,
    width: 1,
    borderLeftWidth: 1.5,
    borderStyle: "dashed",
    marginLeft: 3,
    marginVertical: 2,
  },
  cardFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.04)",
  },
  tagBadgeRow: {
    flexDirection: "row",
    gap: 6,
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
});
