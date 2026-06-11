import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Modal,
  FlatList,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { useDispatch } from "react-redux";
import {
  getAllGlobalRequests,
  ParcelRequest,
} from "@/api/slices/parcel.request.slice";
import { AppDispatch } from "@/api/store";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/components/AppText";

export default function DriverMarketplaceScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [parcels, setParcels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!id) {
      console.error("No ID provided to DriverMarketplaceScreen");
      return;
    }

    setIsLoading(true);
    dispatch(getAllGlobalRequests(id))
      .unwrap()
      .then((response: any) => {
        console.warn("API Response:", response);

        let parcelData: any[] = [];

        // Robust response handling
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
      <SafeAreaView
        style={[
          styles.headerSafeArea,
          {
            backgroundColor: theme.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <AppText style={[styles.brandText, { color: theme.text }]}>
            {id ? "Related Requests" : "Available Requests"}
          </AppText>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollLayout}
        showsVerticalScrollIndicator={false}
      >
        {!id ? (
          <View style={styles.emptyWrapper}>
            <AppText style={{ color: theme.textMuted }}>
              ID is required to view requests
            </AppText>
          </View>
        ) : isLoading ? (
          <View style={styles.loaderWrapper}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : parcels.length === 0 ? (
          <View style={styles.emptyWrapper}>
            <AppText style={{ color: theme.textMuted }}>
              No related requests found.
            </AppText>
          </View>
        ) : (
          parcels.map((parcel) => {
            const clientName = parcel.user?.fullName || "Anonymous Requester";
            const clientImage = parcel.user?.profileImage;
            const negotiation = getNegotiationSummary(parcel);

            // Item should be disabled if a negotiation has started/ended and this driver isn't part of it
            const isCardDisabled = parcel.isDisabled && !parcel.isNegotiator;

            return (
              <TouchableOpacity
                key={parcel._id}
                activeOpacity={isCardDisabled ? 1 : 0.9}
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
                  styles.driverCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  negotiation && styles.negotiatedCard,
                  isCardDisabled && styles.disabledCard,
                ]}
              >
                {/* Negotiation Indicator */}
                {negotiation && (
                  <View style={styles.negotiationBadge}>
                    <Ionicons
                      name="chatbubble-ellipses-outline"
                      size={16}
                      color={theme.primary}
                    />
                    <AppText
                      style={[styles.negotiationText, { color: theme.primary }]}
                    >
                      Negotiation • {negotiation.status}
                      {negotiation.agreedAmount &&
                        ` • ₦${negotiation.agreedAmount}`}
                    </AppText>
                  </View>
                )}

                {/* Closed / Taken Indicator */}
                {isCardDisabled && (
                  <View style={styles.disabledBadge}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={14}
                      color={theme.textMuted}
                    />
                    <AppText
                      style={[
                        styles.disabledBadgeText,
                        { color: theme.textMuted },
                      ]}
                    >
                      Ride Taken / Unavailable
                    </AppText>
                  </View>
                )}

                {/* User Info */}
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
                        <AppText style={styles.initialsText}>
                          {getInitials(clientName)}
                        </AppText>
                      </View>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText
                      style={[styles.clientNameText, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {clientName}
                    </AppText>
                    <AppText style={{ color: theme.textMuted, fontSize: 12 }}>
                      {parcel.user?.isVerified ? "✓ Verified" : "Active User"}
                    </AppText>
                  </View>
                </View>

                {/* Route */}
                <View
                  style={[
                    styles.routeBlock,
                    { backgroundColor: theme.background },
                  ]}
                >
                  <AppText style={[styles.driverName, { color: theme.text }]}>
                    To: {parcel.destinationCity}
                  </AppText>
                  <AppText
                    style={[
                      styles.vehicleLabel,
                      { color: theme.textMuted, marginTop: 4 },
                    ]}
                  >
                    From: {parcel.pickupAddress}
                  </AppText>
                </View>

                <View
                  style={[
                    styles.innerDivider,
                    { backgroundColor: theme.border },
                  ]}
                />

                {/* Price */}
                <View style={styles.cardFooterRow}>
                  <AppText
                    style={[styles.priceMatrixText, { color: theme.text }]}
                  >
                    {parcel.priceRange
                      ? `₦${parcel.priceRange.min?.toLocaleString()} - ₦${parcel.priceRange.max?.toLocaleString()}`
                      : "Negotiable"}
                  </AppText>

                  {parcel.properties?.isPerishable && (
                    <AppText style={{ color: "#f59e0b", fontSize: 12 }}>
                      Perishable
                    </AppText>
                  )}
                  {parcel.properties?.isFragile && (
                    <AppText style={{ color: "#ef4444", fontSize: 12 }}>
                      Fragile
                    </AppText>
                  )}
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
  headerSafeArea: { width: "100%" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 12,
  },
  backButton: { marginRight: 8 },
  brandText: { fontFamily: "RethinkSans-Bold", fontSize: 20 },
  scrollLayout: { padding: 24 },
  loaderWrapper: {
    paddingVertical: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyWrapper: {
    paddingVertical: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  driverCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  negotiatedCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#10b981",
  },
  disabledCard: {
    opacity: 0.5,
  },
  negotiationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 12,
  },
  negotiationText: { fontSize: 13, fontWeight: "600" },
  disabledBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(148, 163, 184, 0.12)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  disabledBadgeText: { fontSize: 12, fontWeight: "500" },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  avatarWrapper: {
    width: 40,
    height: 40,
    borderRadius: 14,
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%", resizeMode: "cover" },
  initialsBox: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  initialsText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 14 },
  clientNameText: { fontFamily: "RethinkSans-Bold", fontSize: 15 },
  routeBlock: {
    padding: 12,
    borderRadius: 14,
    marginTop: 4,
  },
  driverName: { fontFamily: "RethinkSans-Bold", fontSize: 15 },
  vehicleLabel: { fontSize: 13 },
  innerDivider: { height: 1, marginVertical: 14 },
  cardFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceMatrixText: { fontFamily: "RethinkSans-Bold", fontSize: 14 },
});
