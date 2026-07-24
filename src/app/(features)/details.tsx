import React, { useMemo, useCallback, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  Animated,
  Easing,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import {
  getRequest,
  clearRequestState,
  RequestRecord,
} from "@/api/slices/new.request.slice";
import { useTheme } from "@/contexts/ThemeContext";
import { AppDispatch, RootState } from "@/api/store";
import {
  StatusPill,
  SUCCESS,
  SUCCESS_BG_LIGHT,
  WARNING,
  WARNING_BG,
  DANGER,
  DANGER_BG,
  formatFullDateTime,
  getMetaEntries,
  RequestDetailsSkeleton,
} from "@/components/PairingComponents";

// ------------------------------------------------------------------
// Design Tokens & Color Palette
// ------------------------------------------------------------------
const PRIMARY = "#3D6BFF";
const PRIMARY_SOFT = "rgba(61, 107, 255, 0.08)";
const PRIMARY_BORDER = "rgba(61, 107, 255, 0.20)";
const ON_PRIMARY = "#FFFFFF";

// Helper functions (Unchanged)
function isPackageType(type?: RequestRecord["type"]) {
  return type === "send-package" || type === "deliver-package";
}

function typeLabel(type?: RequestRecord["type"]) {
  switch (type) {
    case "send-package":
      return "Send a Package";
    case "deliver-package":
      return "Deliver a Package";
    case "join-ride":
      return "Join a Ride";
    default:
      return (type as string) === "offer-ride" ||
        (type as string) === "offer-join"
        ? "Offer a Ride"
        : "Request";
  }
}

// Banner config
type BannerTone = "purple" | "warning" | "success" | "danger" | "muted";

interface BannerConfig {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
  tone: BannerTone;
}

function getBanner(
  request: RequestRecord | any,
  provider: boolean
): BannerConfig | null {
  if (!request) return null;
  const status = request.status;
  const isPaid = !!request.isPaid;

  if (status === "confirmed") {
    return {
      icon: "checkmark-done-circle",
      title: "All Done",
      text: "This ride is completed and funds have been credited to the provider.",
      tone: "success",
    };
  }

  if (!provider) {
    switch (status) {
      case "pending":
        return {
          icon: "search-outline",
          title: "Finding a Driver",
          text: "We are currently searching for an available driver.",
          tone: "purple",
        };
      case "assigned":
        return isPaid
          ? {
              icon: "time-outline",
              title: "Driver Assigned",
              text: "You will be notified once the driver begins your request.",
              tone: "purple",
            }
          : {
              icon: "card-outline",
              title: "Payment Required",
              text: "Please make payment so the driver can start your request.",
              tone: "warning",
            };
      case "in_progress":
        return {
          icon: "navigate-outline",
          title: "Trip in Progress",
          text: "Your request is currently underway.",
          tone: "purple",
        };
      case "completed":
        return {
          icon: "checkmark-circle-outline",
          title: "Completed",
          text: "This request has been successfully completed.",
          tone: "success",
        };
      case "cancelled":
        return {
          icon: "close-circle-outline",
          title: "Cancelled",
          text: "This request has been cancelled.",
          tone: "danger",
        };
      case "expired":
        return {
          icon: "hourglass-outline",
          title: "Expired",
          text: "This request has expired.",
          tone: "muted",
        };
      default:
        return null;
    }
  }

  switch (status) {
    case "pending":
      return {
        icon: "megaphone-outline",
        title: "Live Request",
        text: "Your request is live. Users heading your direction will reach out.",
        tone: "purple",
      };
    case "assigned":
      return isPaid
        ? {
            icon: "checkmark-circle-outline",
            title: "Paired & Confirmed",
            text: "You've been paired and payment is fully confirmed.",
            tone: "success",
          }
        : {
            icon: "hourglass-outline",
            title: "Payment Pending",
            text: "You've been paired. Waiting for passenger payment.",
            tone: "warning",
          };
    case "in_progress":
      return {
        icon: "navigate-outline",
        title: "Trip Started",
        text: "Trip is currently in progress.",
        tone: "purple",
      };
    case "completed":
      return {
        icon: "checkmark-done-outline",
        title: "Completed",
        text: "Request completed.",
        tone: "success",
      };
    case "cancelled":
      return {
        icon: "close-circle-outline",
        title: "Cancelled",
        text: "This request was cancelled.",
        tone: "danger",
      };
    case "expired":
      return {
        icon: "hourglass-outline",
        title: "Expired",
        text: "This request has expired.",
        tone: "muted",
      };
    default:
      return null;
  }
}

// Fade & Slide Entrance Animation
function FadeInUp({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: any;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 380,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [14, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// ------------------------------------------------------------------
// Static Styles for Pulsing Dot
// ------------------------------------------------------------------
const styles = StyleSheet.create({
  pulseContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: PRIMARY,
  },
  pulseCore: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PRIMARY,
  },
});

// Pulse Live Dot Component
function PulsingDot() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.8,
            duration: 900,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 900,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.8,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scale, opacity]);

  return (
    <View style={styles.pulseContainer}>
      <Animated.View
        style={[
          styles.pulseRing,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      />
      <View style={styles.pulseCore} />
    </View>
  );
}

export default function RequestDetailsScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const dynamicStyles = useMemo(() => getStyles(theme), [theme]);
  const { profile } = useSelector((state: RootState) => state.user);

  const params = useLocalSearchParams<{ id?: string; requestData?: string }>();
  const parsedRequestData: RequestRecord | null = useMemo(() => {
    if (!params.requestData) return null;
    try {
      return JSON.parse(params.requestData);
    } catch (e) {
      console.warn("⚠️ Failed to parse requestData:", e);
      return null;
    }
  }, [params.requestData]);

  const id = params.id || parsedRequestData?._id;
  const dispatch = useDispatch<AppDispatch>();
  const { currentRequest, isLoading, error } = useSelector(
    (state: RootState) => state.request
  );

  useFocusEffect(
    useCallback(() => {
      if (id) {
        dispatch(getRequest(id));
      }
      return () => {
        dispatch(clearRequestState());
      };
    }, [id, dispatch])
  );

  const effectiveRequest = currentRequest || parsedRequestData;
  const provider =
    effectiveRequest?.type === "deliver-package" ||
    (effectiveRequest?.type as string) === "offer-ride" ||
    (effectiveRequest?.type as string) === "offer-join";
  const isPackage = isPackageType(effectiveRequest?.type);

  const status = effectiveRequest?.status;
  const negotiationId = (effectiveRequest as any)?.negotiation;

  const banner = getBanner(effectiveRequest, provider);
  const metaEntries = getMetaEntries((effectiveRequest as any)?.meta);
  const trackingId = effectiveRequest?._id
    ? `DL-${effectiveRequest._id.slice(-6).toUpperCase()}`
    : null;

  const currentLocation = (effectiveRequest as any)?.currentLocation;
  const isFragile = !!(effectiveRequest as any)?.isFragile;
  const isPerishable = !!(effectiveRequest as any)?.isPerishable;

  const pickupAddress = effectiveRequest?.pickupLocation?.address;
  const deliveryAddress = (effectiveRequest as any)?.deliveryLocation?.address;

  const canViewNegotiation =
    !!negotiationId &&
    (effectiveRequest?.type === "offer-ride" ||
      effectiveRequest?.type === "deliver-package");

  const handleViewNegotiation = () => {
    const targetNegId =
      typeof negotiationId === "object" ? negotiationId?._id : negotiationId;
    if (!targetNegId) return;

    router.push({
      pathname: "/(features)/chat_screen",
      params: { id: targetNegId, currentId: profile?._id },
    });
  };

  const requestFullDateTime = formatFullDateTime(
    effectiveRequest?.pickupDate,
    effectiveRequest?.pickupTime
  );
  const requestedOn = formatFullDateTime(effectiveRequest?.createdAt);
  const lastUpdated = formatFullDateTime(effectiveRequest?.updatedAt);

  const toneColors: Record<
    BannerTone,
    { solid: string; tint: string; border: string }
  > = {
    purple: {
      solid: PRIMARY,
      tint: isDark ? "rgba(61, 107, 255, 0.12)" : PRIMARY_SOFT,
      border: PRIMARY_BORDER,
    },
    warning: {
      solid: WARNING,
      tint: isDark ? "rgba(245, 158, 11, 0.12)" : WARNING_BG,
      border: "rgba(245, 158, 11, 0.25)",
    },
    success: {
      solid: SUCCESS,
      tint: isDark ? "rgba(16, 185, 129, 0.12)" : SUCCESS_BG_LIGHT,
      border: "rgba(16, 185, 129, 0.25)",
    },
    danger: {
      solid: DANGER,
      tint: isDark ? "rgba(239, 68, 68, 0.12)" : DANGER_BG,
      border: "rgba(239, 68, 68, 0.25)",
    },
    muted: {
      solid: theme.textMuted,
      tint: theme.surface,
      border: theme.border,
    },
  };
  const bannerColors = banner ? toneColors[banner.tone] : null;

  const renderDetailRow = (
    icon: React.ReactNode,
    label: string,
    value?: string | null,
    isLast: boolean = false
  ) => {
    if (!value) return null;
    return (
      <View
        style={[dynamicStyles.detailRow, isLast && { borderBottomWidth: 0 }]}
      >
        <View style={dynamicStyles.detailIconBox}>{icon}</View>
        <View style={dynamicStyles.detailTextContainer}>
          <AppText
            size={11}
            weight="semibold"
            color={theme.textMuted}
            style={dynamicStyles.detailLabel}
          >
            {label}
          </AppText>
          <AppText size={14} weight="semibold" color={theme.text}>
            {value}
          </AppText>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={dynamicStyles.safeArea}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />

      {/* Modern App Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity
          onPress={() => router.push("/(features)/all_requests")}
          style={dynamicStyles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <AppText size={17} weight="bold" color={theme.text}>
          Request Details
        </AppText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={dynamicStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && !effectiveRequest ? (
          <RequestDetailsSkeleton
            styles={dynamicStyles}
            shimmerColor={theme.border}
          />
        ) : error || !effectiveRequest ? (
          <FadeInUp style={[dynamicStyles.banner, { borderColor: DANGER }]}>
            <Ionicons name="alert-circle-outline" size={22} color={DANGER} />
            <AppText size={14} color={theme.text} style={{ flex: 1 }}>
              {error || "We couldn't load this request details."}
            </AppText>
          </FadeInUp>
        ) : (
          <>
            {/* Live Location Pill Banner */}
            {!!currentLocation && (
              <FadeInUp delay={20} style={dynamicStyles.locationPill}>
                <Ionicons name="navigate-circle" size={20} color={PRIMARY} />
                <View style={{ flex: 1, marginHorizontal: 10 }}>
                  <AppText
                    size={10}
                    weight="bold"
                    color={PRIMARY}
                    style={{ letterSpacing: 0.6 }}
                  >
                    LIVE LOCATION UPDATE
                  </AppText>
                  <AppText
                    size={13}
                    weight="semibold"
                    color={theme.text}
                    numberOfLines={1}
                  >
                    {currentLocation}
                  </AppText>
                </View>
                <PulsingDot />
              </FadeInUp>
            )}

            {/* Status Notification Banner */}
            {banner && bannerColors && (
              <FadeInUp
                delay={50}
                style={[
                  dynamicStyles.banner,
                  {
                    backgroundColor: bannerColors.tint,
                    borderColor: bannerColors.border,
                  },
                ]}
              >
                <View
                  style={[
                    dynamicStyles.bannerIconBadge,
                    { backgroundColor: bannerColors.solid },
                  ]}
                >
                  <Ionicons name={banner.icon} size={18} color={ON_PRIMARY} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText size={14} weight="bold" color={theme.text}>
                    {banner.title}
                  </AppText>
                  <AppText
                    size={12.5}
                    color={theme.textMuted}
                    style={{ marginTop: 2, lineHeight: 17 }}
                  >
                    {banner.text}
                  </AppText>
                </View>
              </FadeInUp>
            )}

            {/* Hero Overview Card */}
            <FadeInUp delay={90} style={dynamicStyles.heroCard}>
              <View style={dynamicStyles.heroTopRow}>
                <View style={dynamicStyles.heroIconCircle}>
                  <MaterialCommunityIcons
                    name={isPackage ? "package-variant-closed" : "car-estate"}
                    size={24}
                    color={PRIMARY}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <AppText
                    size={10}
                    weight="bold"
                    color={theme.textMuted}
                    style={dynamicStyles.metaTrackingLabel}
                  >
                    TRACKING ID
                  </AppText>
                  {trackingId && (
                    <AppText size={18} weight="bold" color={theme.text}>
                      {trackingId}
                    </AppText>
                  )}
                </View>
                <StatusPill
                  status={effectiveRequest.status}
                  styles={dynamicStyles}
                  theme={theme}
                />
              </View>

              <View style={dynamicStyles.heroDivider} />

              <View style={dynamicStyles.heroFooterRow}>
                <AppText size={13} weight="semibold" color={theme.textMuted}>
                  Type
                </AppText>
                <View style={dynamicStyles.typeBadge}>
                  <AppText size={12} weight="bold" color={PRIMARY}>
                    {typeLabel(effectiveRequest.type)}
                  </AppText>
                </View>
              </View>
            </FadeInUp>

            {/* Package Special Handling Tags */}
            {isPackage && (isFragile || isPerishable) && (
              <FadeInUp delay={120} style={dynamicStyles.tagRow}>
                {isFragile && (
                  <View
                    style={[
                      dynamicStyles.tag,
                      { backgroundColor: WARNING_BG, borderColor: WARNING },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="alert-decagram-outline"
                      size={15}
                      color={WARNING}
                    />
                    <AppText
                      size={12}
                      weight="bold"
                      color={WARNING}
                      style={{ marginLeft: 6 }}
                    >
                      Fragile Item
                    </AppText>
                  </View>
                )}
                {isPerishable && (
                  <View
                    style={[
                      dynamicStyles.tag,
                      {
                        backgroundColor: SUCCESS_BG_LIGHT,
                        borderColor: SUCCESS,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="leaf"
                      size={15}
                      color={SUCCESS}
                    />
                    <AppText
                      size={12}
                      weight="bold"
                      color={SUCCESS}
                      style={{ marginLeft: 6 }}
                    >
                      Perishable
                    </AppText>
                  </View>
                )}
              </FadeInUp>
            )}

            {/* Key Stats Grid */}
            {(requestFullDateTime || effectiveRequest.agreedPrice) && (
              <FadeInUp delay={150} style={dynamicStyles.statGrid}>
                {requestFullDateTime && (
                  <View style={dynamicStyles.statBox}>
                    <View style={dynamicStyles.statHeader}>
                      <View style={dynamicStyles.statIconBox}>
                        <Ionicons
                          name="calendar-outline"
                          size={16}
                          color={PRIMARY}
                        />
                      </View>
                      <AppText
                        size={10}
                        weight="bold"
                        color={theme.textMuted}
                        style={dynamicStyles.statLabel}
                      >
                        SCHEDULED
                      </AppText>
                    </View>
                    <AppText
                      size={13.5}
                      weight="bold"
                      color={theme.text}
                      numberOfLines={2}
                    >
                      {requestFullDateTime}
                    </AppText>
                  </View>
                )}

                {effectiveRequest.agreedPrice && (
                  <View style={dynamicStyles.statBox}>
                    <View style={dynamicStyles.statHeader}>
                      <View style={dynamicStyles.statIconBox}>
                        <Ionicons
                          name="wallet-outline"
                          size={16}
                          color={PRIMARY}
                        />
                      </View>
                      <AppText
                        size={10}
                        weight="bold"
                        color={theme.textMuted}
                        style={dynamicStyles.statLabel}
                      >
                        AGREED PRICE
                      </AppText>
                    </View>
                    <AppText size={20} weight="bold" color={PRIMARY}>
                      ₦{effectiveRequest.agreedPrice.toLocaleString()}
                    </AppText>
                  </View>
                )}
              </FadeInUp>
            )}

            {/* Route Timeline Card */}
            {(pickupAddress || deliveryAddress) && (
              <FadeInUp delay={190} style={dynamicStyles.summaryCard}>
                <View style={dynamicStyles.summaryHeaderRow}>
                  <View style={dynamicStyles.summaryHeaderAccent} />
                  <AppText size={15} weight="bold" color={theme.text}>
                    Route Summary
                  </AppText>
                </View>

                <View style={dynamicStyles.timeline}>
                  {!!pickupAddress && (
                    <View style={dynamicStyles.timelineRow}>
                      <View style={dynamicStyles.timelineDotColumn}>
                        <View style={dynamicStyles.timelineDotOrigin} />
                        {!!deliveryAddress && (
                          <View style={dynamicStyles.timelineLine} />
                        )}
                      </View>
                      <View style={dynamicStyles.timelineTextBlock}>
                        <AppText
                          size={10}
                          weight="bold"
                          color={theme.textMuted}
                          style={dynamicStyles.detailLabel}
                        >
                          PICKUP ADDRESS
                        </AppText>
                        <AppText
                          size={14}
                          weight="medium"
                          color={theme.text}
                          style={{ marginTop: 2 }}
                        >
                          {pickupAddress}
                        </AppText>
                      </View>
                    </View>
                  )}

                  {!!deliveryAddress && (
                    <View
                      style={[dynamicStyles.timelineRow, { marginBottom: 0 }]}
                    >
                      <View style={dynamicStyles.timelineDotColumn}>
                        <View style={dynamicStyles.timelineDotDest} />
                      </View>
                      <View style={dynamicStyles.timelineTextBlock}>
                        <AppText
                          size={10}
                          weight="bold"
                          color={theme.textMuted}
                          style={dynamicStyles.detailLabel}
                        >
                          {isPackage
                            ? "DESTINATION / DELIVERY"
                            : "DROP-OFF LOCATION"}
                        </AppText>
                        <AppText
                          size={14}
                          weight="medium"
                          color={theme.text}
                          style={{ marginTop: 2 }}
                        >
                          {deliveryAddress}
                        </AppText>
                      </View>
                    </View>
                  )}
                </View>
              </FadeInUp>
            )}

            {/* General Request Info */}
            <FadeInUp delay={230} style={dynamicStyles.summaryCard}>
              <View style={dynamicStyles.summaryHeaderRow}>
                <View style={dynamicStyles.summaryHeaderAccent} />
                <AppText size={15} weight="bold" color={theme.text}>
                  {isPackage ? "Delivery Specifications" : "Trip Details"}
                </AppText>
              </View>

              {renderDetailRow(
                <Ionicons
                  name={
                    effectiveRequest.isPaid
                      ? "checkmark-circle"
                      : "alert-circle-outline"
                  }
                  size={18}
                  color={effectiveRequest.isPaid ? SUCCESS : WARNING}
                />,
                "PAYMENT STATUS",
                effectiveRequest.isPaid
                  ? "Payment Confirmed"
                  : "Payment Pending"
              )}

              {!!negotiationId &&
                renderDetailRow(
                  <Ionicons
                    name="git-compare-outline"
                    size={18}
                    color={PRIMARY}
                  />,
                  "NEGOTIATION STATUS",
                  "Active Negotiation Thread"
                )}

              {renderDetailRow(
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={theme.textMuted}
                />,
                "REQUEST CREATED",
                requestedOn
              )}

              {renderDetailRow(
                <Ionicons
                  name="sync-outline"
                  size={18}
                  color={theme.textMuted}
                />,
                "LAST UPDATED",
                lastUpdated
              )}

              {!!(effectiveRequest as any)?.assignedProvider &&
                renderDetailRow(
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={theme.textMuted}
                  />,
                  "ASSIGNED PROVIDER",
                  (effectiveRequest as any).assignedProvider,
                  true
                )}
            </FadeInUp>

            {/* Additional Meta Information */}
            {metaEntries.length > 0 && (
              <FadeInUp delay={270} style={dynamicStyles.summaryCard}>
                <View style={dynamicStyles.summaryHeaderRow}>
                  <View style={dynamicStyles.summaryHeaderAccent} />
                  <AppText size={15} weight="bold" color={theme.text}>
                    Additional Metadata
                  </AppText>
                </View>
                {metaEntries.map((entry, index) =>
                  renderDetailRow(
                    <Ionicons
                      name="information-circle-outline"
                      size={18}
                      color={PRIMARY}
                    />,
                    entry.label.toUpperCase(),
                    entry.value,
                    index === metaEntries.length - 1
                  )
                )}
              </FadeInUp>
            )}

            {/* Handover Proof Image */}
            {!!(effectiveRequest as any)?.handOverProof && (
              <FadeInUp delay={310} style={dynamicStyles.summaryCard}>
                <View style={dynamicStyles.summaryHeaderRow}>
                  <View style={dynamicStyles.summaryHeaderAccent} />
                  <AppText size={15} weight="bold" color={theme.text}>
                    Proof of Handover
                  </AppText>
                </View>
                <View style={dynamicStyles.imageFrame}>
                  <Image
                    source={{ uri: (effectiveRequest as any).handOverProof }}
                    style={dynamicStyles.handoverImage}
                    resizeMode="cover"
                  />
                  <View style={dynamicStyles.imageOverlayBadge}>
                    <Ionicons
                      name="shield-checkmark"
                      size={14}
                      color={ON_PRIMARY}
                    />
                    <AppText
                      size={11}
                      weight="bold"
                      color={ON_PRIMARY}
                      style={{ marginLeft: 4 }}
                    >
                      Verified Proof
                    </AppText>
                  </View>
                </View>
              </FadeInUp>
            )}
          </>
        )}
      </ScrollView>

      {/* Floating Bottom Navigation CTA */}
      {canViewNegotiation && (
        <SafeAreaView edges={["bottom"]} style={dynamicStyles.footerContainer}>
          <TouchableOpacity
            onPress={handleViewNegotiation}
            style={dynamicStyles.primaryButton}
            activeOpacity={0.88}
          >
            <Ionicons
              name="chatbubbles"
              size={18}
              color={ON_PRIMARY}
              style={{ marginRight: 8 }}
            />
            <AppText size={15} weight="bold" color={ON_PRIMARY}>
              View Negotiation Thread
            </AppText>
          </TouchableOpacity>
        </SafeAreaView>
      )}
    </SafeAreaView>
  );
}

// ------------------------------------------------------------------
// Dynamic Stylesheet
// ------------------------------------------------------------------
function getStyles(theme: any) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: theme.background,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      justifyContent: "center",
      alignItems: "center",
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 32,
      flexGrow: 1,
    },

    // Hero Card
    heroCard: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 20,
      padding: 18,
      marginBottom: 14,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
        },
        android: { elevation: 1 },
      }),
    },
    heroTopRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    heroIconCircle: {
      width: 48,
      height: 48,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: PRIMARY_SOFT,
      borderWidth: 1,
      borderColor: PRIMARY_BORDER,
    },
    metaTrackingLabel: {
      letterSpacing: 0.8,
      marginBottom: 2,
    },
    heroDivider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: 14,
    },
    heroFooterRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    typeBadge: {
      backgroundColor: PRIMARY_SOFT,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 8,
    },

    // Status Banner
    banner: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
      gap: 12,
      marginBottom: 14,
    },
    bannerIconBadge: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
    },

    // Location Pill
    locationPill: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: PRIMARY_SOFT,
      borderWidth: 1,
      borderColor: PRIMARY_BORDER,
      borderRadius: 16,
      paddingVertical: 10,
      paddingHorizontal: 14,
      marginBottom: 14,
    },

    // Package Special Tags
    tagRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 14,
    },
    tag: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
    },

    // Key Stats Grid
    statGrid: {
      flexDirection: "row",
      gap: 14,
      marginBottom: 14,
    },
    statBox: {
      flex: 1,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 16,
      padding: 16,
    },
    statHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
    },
    statIconBox: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: PRIMARY_SOFT,
      justifyContent: "center",
      alignItems: "center",
    },
    statLabel: {
      letterSpacing: 0.5,
    },

    // Cards
    summaryCard: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 20,
      padding: 18,
      marginBottom: 14,
    },
    summaryHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 16,
    },
    summaryHeaderAccent: {
      width: 4,
      height: 16,
      borderRadius: 2,
      backgroundColor: PRIMARY,
    },

    // Timeline Route Summary
    timeline: {
      paddingLeft: 4,
    },
    timelineRow: {
      flexDirection: "row",
      marginBottom: 20,
    },
    timelineDotColumn: {
      alignItems: "center",
      width: 16,
      marginRight: 12,
    },
    timelineDotOrigin: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: PRIMARY,
      borderWidth: 3,
      borderColor: PRIMARY_SOFT,
      zIndex: 1,
    },
    timelineLine: {
      width: 2,
      flex: 1,
      backgroundColor: theme.border,
      marginVertical: -2,
    },
    timelineDotDest: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: SUCCESS,
      zIndex: 1,
    },
    timelineTextBlock: {
      flex: 1,
      marginTop: -2,
    },

    // Detail Rows
    detailRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    detailIconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.background,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    detailTextContainer: {
      flex: 1,
      justifyContent: "center",
    },
    detailLabel: {
      letterSpacing: 0.5,
      marginBottom: 2,
    },

    // Handover Image Card
    imageFrame: {
      width: "100%",
      height: 180,
      borderRadius: 14,
      overflow: "hidden",
      backgroundColor: theme.background,
      position: "relative",
    },
    handoverImage: {
      width: "100%",
      height: "100%",
    },
    imageOverlayBadge: {
      position: "absolute",
      bottom: 12,
      left: 12,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.65)",
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 8,
    },

    // Footer Navigation CTA
    footerContainer: {
      padding: 16,
      backgroundColor: theme.surface,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    primaryButton: {
      flexDirection: "row",
      backgroundColor: PRIMARY,
      height: 54,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
      ...Platform.select({
        ios: {
          shadowColor: PRIMARY,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
        },
        android: { elevation: 4 },
      }),
    },
  });
}
