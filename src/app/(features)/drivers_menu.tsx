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
  Search,
  Info,
} from "lucide-react-native";
import { AppText } from "@/components/AppText";

// Design Tokens
const RADIUS = { sm: 12, md: 16, lg: 20, xl: 24, pill: 999 };
const SHADOW_SM = {
  shadowColor: "#0F0B2E",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevation: 2,
};
const SHADOW_MD = {
  shadowColor: "#0F0B2E",
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.1,
  shadowRadius: 24,
  elevation: 8,
};

const PASTELS = {
  sky: { bg: "#DBEAFE", icon: "#2563EB" },
  lavender: { bg: "#EDE9FE", icon: "#7C3AED" },
  mint: { bg: "#D1FAE5", icon: "#059669" },
  peach: { bg: "#FFE4D6", icon: "#EA580C" },
  rose: { bg: "#FFE1E6", icon: "#E11D48" },
};

export default function DriverMarketplaceScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { id, request } = useLocalSearchParams<{ id?: string; request: any }>();

  const pageBg = isDark ? theme.background : "#f4f4f4";
  const cardBg = isDark ? theme.surface : "#FFFFFF";
  const tileBg = isDark ? theme.background : "#F4F4F1";

  const [parcels, setParcels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [matchedRequest, setMatchedRequest] = useState<any>(null);

  useEffect(() => {
    if (!id) {
      console.error("No ID provided to DriverMarketplaceScreen");
      return;
    }

    let parsedRequest = null;
    if (typeof request === "string") {
      try {
        parsedRequest = JSON.parse(request);
      } catch (e) {
        console.error("Failed to parse request param", e);
      }
    } else if (request) {
      parsedRequest = request;
    }

    console.warn("Request details:", JSON.stringify(parsedRequest, null, 2));
    setMatchedRequest(parsedRequest);

    setIsLoading(true);
    dispatch(getAllGlobalRequests(id))
      .unwrap()
      .then((response: any) => {
        console.warn(response, "responseresponse");

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

        let filteredParcels = [...parcelData];

        if (parsedRequest) {
          const reqPickup = (
            parsedRequest.route?.pickupAddress ||
            parsedRequest.pickupAddress ||
            ""
          )
            .toLowerCase()
            .trim();
          const reqDelivery = (
            parsedRequest.route?.deliveryAddress ||
            parsedRequest.deliveryAddress ||
            parsedRequest.destinationCity ||
            ""
          )
            .toLowerCase()
            .trim();

          filteredParcels = filteredParcels.filter((parcel) => {
            const parcelPickup = (parcel.pickupAddress || "")
              .toLowerCase()
              .trim();
            const parcelDest = (parcel.destinationCity || "")
              .toLowerCase()
              .trim();

            if (!reqPickup || !reqDelivery) return true;

            const sameDirection =
              (parcelPickup.includes(reqPickup) ||
                reqPickup.includes(parcelPickup)) &&
              (parcelDest.includes(reqDelivery) ||
                reqDelivery.includes(parcelDest));

            const reverseDirection =
              (parcelPickup.includes(reqDelivery) ||
                reqDelivery.includes(parcelPickup)) &&
              (parcelDest.includes(reqPickup) ||
                reqPickup.includes(parcelDest));

            return sameDirection || reverseDirection;
          });
        }

        const sorted = [...filteredParcels].sort((a, b) => {
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
  }, [dispatch, id, request]);

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

  const messageAdmin = () => {
    console.log("💬 Message Admin button clicked - Coming Soon");
  };

  return (
    <View style={[styles.container, { backgroundColor: pageBg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: cardBg }, SHADOW_SM]}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <ArrowLeft size={22} color={theme.text} />
          </TouchableOpacity>

          <AppText size={19} weight="bold" color={theme.text}>
            Find Drivers
          </AppText>

          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View
          style={[styles.infoBanner, { backgroundColor: cardBg }, SHADOW_SM]}
        >
          <View style={styles.infoHeader}>
            <Info size={18} color={theme.primary} />
            <AppText
              size={14}
              weight="bold"
              color={theme.primary}
              style={{ marginLeft: 8 }}
            >
              About: Find Drivers Going your Way
            </AppText>
          </View>
          <AppText
            size={13.5}
            color={theme.text}
            style={{ lineHeight: 19, marginTop: 8 }}
          >
            This space lists delivery requests that match your travel route. As
            a driver, you can connect with clients heading your way to negotiate
            and settle on a fair price.
          </AppText>
        </View>

        {!id ? (
          <View style={styles.emptyWrapper}>
            <AppText size={15} color={theme.textMuted} weight="medium">
              ID is required to view requests
            </AppText>
          </View>
        ) : isLoading ? (
          <View style={styles.loaderWrapper}>
            <ActivityIndicator size="large" color={theme.primary} />
            <AppText
              size={14}
              color={theme.textMuted}
              style={{ marginTop: 12 }}
            >
              Loading available requests...
            </AppText>
          </View>
        ) : parcels.length === 0 ? (
          <View style={styles.emptyWrapper}>
            <View
              style={[styles.emptyIconContainer, { backgroundColor: cardBg }]}
            >
              <Search size={72} color={theme.textMuted} strokeWidth={1.4} />
            </View>

            <AppText
              size={20}
              weight="bold"
              color={theme.text}
              style={{ marginBottom: 8 }}
            >
              No matching requests found
            </AppText>

            <AppText
              size={14.5}
              color={theme.textMuted}
              weight="medium"
              style={{ textAlign: "center", lineHeight: 22, marginBottom: 32 }}
            >
              We couldn't find any requests that match your current route. Try
              checking back later.
            </AppText>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: theme.primary },
                SHADOW_MD,
              ]}
              activeOpacity={0.85}
              onPress={messageAdmin}
            >
              <AppText size={16} weight="bold" color="#FFFFFF">
                Message Admin
              </AppText>
            </TouchableOpacity>
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
                  { backgroundColor: cardBg },
                  SHADOW_SM,
                  negotiation && {
                    borderColor: theme.primary,
                    borderWidth: 1.5,
                  },
                  isCardDisabled && styles.disabledCard,
                ]}
              >
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
                          { backgroundColor: theme.primary },
                        ]}
                      >
                        <AppText size={15} weight="bold" color="#FFFFFF">
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
                        gap: 6,
                      }}
                    >
                      <AppText
                        size={16}
                        weight="bold"
                        color={theme.text}
                        numberOfLines={1}
                      >
                        {clientName}
                      </AppText>
                      {parcel.user?.isVerified && (
                        <CheckCircle2 size={16} color={theme.primary} />
                      )}
                    </View>
                    <AppText size={13} color={theme.textMuted} weight="medium">
                      {parcel.user?.isVerified
                        ? "Verified Client"
                        : "Active Hub User"}
                    </AppText>
                  </View>
                </View>

                <View style={[styles.routeBlock, { backgroundColor: tileBg }]}>
                  <View style={styles.routeRow}>
                    <View
                      style={[
                        styles.bulletDot,
                        { backgroundColor: PASTELS.rose.icon },
                      ]}
                    />
                    <AppText
                      size={14.5}
                      weight="semibold"
                      color={theme.text}
                      numberOfLines={1}
                      style={{ flex: 1, marginLeft: 10 }}
                    >
                      {parcel.pickupAddress || "Unknown Pickup"}
                    </AppText>
                  </View>

                  <View
                    style={[styles.connector, { borderColor: theme.border }]}
                  />

                  <View style={styles.routeRow}>
                    <View
                      style={[
                        styles.bulletDot,
                        { backgroundColor: PASTELS.mint.icon },
                      ]}
                    />
                    <AppText
                      size={14.5}
                      weight="semibold"
                      color={theme.text}
                      numberOfLines={1}
                      style={{ flex: 1, marginLeft: 10 }}
                    >
                      {parcel.destinationCity || "Unknown Destination"}
                    </AppText>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <AppText size={17} weight="bold" color={theme.primary}>
                    {parcel.priceRange
                      ? `₦${parcel.priceRange.min?.toLocaleString()} - ₦${parcel.priceRange.max?.toLocaleString()}`
                      : "Negotiable"}
                  </AppText>

                  <View style={styles.tagRow}>
                    {parcel.properties?.isPerishable && (
                      <View
                        style={[
                          styles.tag,
                          { backgroundColor: PASTELS.peach.bg },
                        ]}
                      >
                        <AppText
                          size={11}
                          weight="bold"
                          color={PASTELS.peach.icon}
                        >
                          PERISHABLE
                        </AppText>
                      </View>
                    )}
                    {parcel.properties?.isFragile && (
                      <View
                        style={[
                          styles.tag,
                          { backgroundColor: PASTELS.rose.bg },
                        ]}
                      >
                        <AppText
                          size={11}
                          weight="bold"
                          color={PASTELS.rose.icon}
                        >
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
  headerSafeArea: {
    paddingTop: Platform.OS === "ios" ? 10 : StatusBar.currentHeight || 10,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },

  infoBanner: {
    padding: 16,
    borderRadius: RADIUS.lg,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(100,100,120,0.1)",
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  loaderWrapper: {
    paddingVertical: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyWrapper: {
    paddingVertical: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyIconContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  primaryButton: {
    height: 54,
    borderRadius: RADIUS.pill,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },

  requestCard: {
    borderRadius: RADIUS.xl,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  disabledCard: {
    opacity: 0.6,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 14,
  },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  avatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  initialsBox: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  routeBlock: {
    padding: 16,
    borderRadius: RADIUS.lg,
    marginBottom: 16,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  bulletDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  connector: {
    height: 18,
    width: 1,
    borderLeftWidth: 1.5,
    borderStyle: "dashed",
    marginLeft: 4,
    marginVertical: 4,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  tagRow: {
    flexDirection: "row",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
