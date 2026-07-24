import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  Easing,
  Linking,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";

import { AppText } from "@/components/AppText";
import {
  getMatchingRequests,
  clearRequestState,
  RequestRecord,
} from "@/api/slices/new.request.slice";
import { getProfile } from "@/api/slices/user.slice";
import { createNegotiation } from "@/api/slices/negotiation.slice";
import { useTheme } from "@/contexts/ThemeContext";
import { AppDispatch, RootState } from "@/api/store";
import {
  formatFullDateTime,
  getMetaEntries,
} from "@/components/PairingComponents";
import { SafeAreaView } from "react-native-safe-area-context";

const SUPPORT_EMAIL = "padimanroute@gmail.com";
const ACCENT_TO = "rgba(108, 92, 231, 0.1)";

export default function PairingScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const params = useLocalSearchParams<{ id?: string; requestData?: string }>();

  const parsedItem: RequestRecord | null = useMemo(() => {
    if (!params.requestData) return null;
    try {
      return JSON.parse(params.requestData);
    } catch (e) {
      console.warn("⚠️ [PAIRING] Failed to parse requestData param:", e);
      return null;
    }
  }, [params.requestData]);

  const id = params.id || parsedItem?._id;

  const dispatch = useDispatch<AppDispatch>();
  const { matchingRequests, isMatchingLoading, error } = useSelector(
    (state: RootState) => state.request
  );
  const { profile } = useSelector((state: RootState) => state.user);

  const [matchIndex, setMatchIndex] = useState(0);
  const [searchDone, setSearchDone] = useState(false);
  const [isCreatingNegotiation, setIsCreatingNegotiation] = useState(false);

  // Extra 50 seconds delay for matching (as requested)
  const MATCHING_DELAY_MS = 0; // 50 seconds

  useEffect(() => {
    if (!profile) {
      dispatch(getProfile());
    }
  }, [dispatch, profile]);

  useEffect(() => {
    if (id) {
      // Simulate longer matching time
      const timer = setTimeout(() => {
        dispatch(getMatchingRequests(id));
      }, MATCHING_DELAY_MS);

      return () => clearTimeout(timer);
    }
    return () => {
      dispatch(clearRequestState());
    };
  }, [id, dispatch]);

  const prevLoading = useRef(false);
  useEffect(() => {
    if (prevLoading.current && !isMatchingLoading) {
      setSearchDone(true);
      setMatchIndex(0);
    }
    prevLoading.current = isMatchingLoading;
  }, [isMatchingLoading]);

  // Fade animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [matchIndex, isMatchingLoading, fadeAnim]);

  // Spin animation
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isMatchingLoading) {
      const loop = Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isMatchingLoading, spin]);

  const spinDeg = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const currentMatch: RequestRecord | undefined = matchingRequests[matchIndex];
  const hasMatches = matchingRequests.length > 0;
  const isLastMatch = matchIndex >= matchingRequests.length - 1;
  const isFirstMatch = matchIndex === 0;

  const matchFullDateTime = formatFullDateTime(
    currentMatch?.pickupDate,
    currentMatch?.pickupTime
  );
  const matchMetaEntries = getMetaEntries((currentMatch as any)?.meta);

  const handleStartChat = async () => {
    if (!currentMatch) return;

    const currentUserId = profile?._id || profile?.id;
    const serviceProviderId = currentMatch.userId;
    const negotiatorServiceId = parsedItem?._id;
    const serviceType = currentMatch.type;
    const negotiatorServiceType = parsedItem?.type;

    if (!currentUserId || !serviceProviderId) return;

    setIsCreatingNegotiation(true);
    try {
      const payload = {
        negotiator: currentUserId,
        serviceProvider: serviceProviderId,
        service: currentMatch._id,
        negotiatorService: negotiatorServiceId,
        serviceType: serviceType,
        negotiatorServiceType: negotiatorServiceType,
        initialPrice: currentMatch.agreedPrice || 0,
      };

      const res = await dispatch(createNegotiation(payload)).unwrap();
      const negotiationId = res?.data?._id || res?._id || res?.id;

      if (negotiationId) {
        router.push({
          pathname: "/(features)/chat_screen",
          params: { id: negotiationId, currentId: currentUserId },
        });
      }
    } catch (err) {
      console.error("❌ [PAIRING] Failed to create negotiation:", err);
    } finally {
      setIsCreatingNegotiation(false);
    }
  };

  const handleNext = () => {
    if (!isLastMatch) {
      setMatchIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstMatch) {
      setMatchIndex((i) => i - 1);
    }
  };

  const handleContactSupport = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  };

  const renderDetailRow = (
    icon: React.ReactNode,
    label: string,
    value?: string | null
  ) => {
    if (!value) return null;
    return (
      <View style={styles.detailRow}>
        <View style={styles.detailIconBox}>{icon}</View>
        <View style={styles.detailTextContainer}>
          <AppText size={12} color={theme.textMuted} style={styles.detailLabel}>
            {label}
          </AppText>
          <AppText size={15} weight="medium" color={theme.text}>
            {value}
          </AppText>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push("/(features)/all_requests")}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <AppText size={17} weight="bold" color={theme.text}>
          {hasMatches && !isMatchingLoading ? "Ride Found" : "Finding a Match"}
        </AppText>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{ opacity: fadeAnim, width: "100%", alignItems: "center" }}
        >
          {/* LOADING */}
          {isMatchingLoading && (
            <View style={styles.centerBlock}>
              <Animated.View
                style={[styles.ringOuter, { transform: [{ rotate: spinDeg }] }]}
              >
                <Ionicons name="search" size={28} color={theme.text} />
              </Animated.View>
              <AppText
                size={20}
                weight="bold"
                color={theme.text}
                style={styles.heading}
              >
                Locating nearby drivers...
              </AppText>
              <AppText
                size={14}
                color={theme.textMuted}
                style={styles.subheading}
              >
                This may take up to 50 seconds. Please wait...
              </AppText>
            </View>
          )}

          {/* ERROR */}
          {!isMatchingLoading && error && (
            <View style={styles.centerBlock}>
              <View style={styles.errorCircle}>
                <Ionicons name="alert" size={32} color="#FF6B6B" />
              </View>
              <AppText
                size={20}
                weight="bold"
                color={theme.text}
                style={styles.heading}
              >
                Connection Error
              </AppText>
              <AppText
                size={14}
                color={theme.textMuted}
                style={styles.subheading}
              >
                {error}
              </AppText>
            </View>
          )}

          {/* NO MATCHES */}
          {!isMatchingLoading && !error && searchDone && !hasMatches && (
            <View style={styles.centerBlock}>
              <View style={styles.errorCircle}>
                <Ionicons
                  name="car-sport-outline"
                  size={32}
                  color={theme.textMuted}
                />
              </View>
              <AppText
                size={20}
                weight="bold"
                color={theme.text}
                style={styles.heading}
              >
                No drivers available
              </AppText>
              <AppText
                size={14}
                color={theme.textMuted}
                style={styles.subheading}
              >
                All our drivers on this route are currently busy. Try again
                shortly.
              </AppText>
              <TouchableOpacity
                onPress={handleContactSupport}
                style={[styles.outlineButton, { width: "100%", marginTop: 10 }]}
              >
                <Feather
                  name="life-buoy"
                  size={18}
                  color={theme.text}
                  style={{ marginRight: 8 }}
                />
                <AppText size={15} weight="bold" color={theme.text}>
                  Contact Support
                </AppText>
              </TouchableOpacity>
            </View>
          )}

          {/* MATCH FOUND */}
          {!isMatchingLoading && !error && hasMatches && currentMatch && (
            <View style={{ width: "100%" }}>
              <View style={styles.successBanner}>
                <View style={styles.successIconWrapper}>
                  <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
                </View>
                <AppText
                  size={22}
                  weight="bold"
                  color={theme.text}
                  style={{ marginBottom: 4 }}
                >
                  Match Confirmed!
                </AppText>
                <AppText size={14} color={theme.textMuted}>
                  Review the details before starting the chat.
                </AppText>
              </View>

              <View style={styles.matchBadge}>
                <AppText size={12} weight="bold" color={theme.textMuted}>
                  OPTION {matchIndex + 1} OF {matchingRequests.length}
                </AppText>
              </View>

              <View style={styles.summaryCard}>
                {renderDetailRow(
                  <Ionicons name="location" size={18} color={theme.text} />,
                  "Route",
                  currentMatch.pickupLocation?.address &&
                    currentMatch.deliveryLocation?.address
                    ? `${currentMatch.pickupLocation.address} → ${currentMatch.deliveryLocation.address}`
                    : currentMatch.pickupLocation?.address ||
                        currentMatch.deliveryLocation?.address
                )}

                {renderDetailRow(
                  <Ionicons name="calendar" size={18} color={theme.text} />,
                  "Pickup Time",
                  matchFullDateTime
                )}

                {!!currentMatch.agreedPrice &&
                  renderDetailRow(
                    <Ionicons name="wallet" size={18} color={theme.text} />,
                    "Average Fare",
                    `₦${
                      currentMatch.agreedPrice.toLocaleString?.() ??
                      currentMatch.agreedPrice
                    }`
                  )}

                {matchMetaEntries.length > 0 && <View style={styles.divider} />}
                {matchMetaEntries.map((entry) =>
                  renderDetailRow(
                    <Ionicons
                      name="information-circle"
                      size={18}
                      color={theme.text}
                    />,
                    entry.label,
                    entry.value
                  )
                )}
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* FOOTER WITH PREV / NEXT */}
      {!isMatchingLoading && !error && hasMatches && currentMatch && (
        <View style={styles.footerContainer}>
          <TouchableOpacity
            onPress={handleStartChat}
            style={styles.primaryButton}
            disabled={isCreatingNegotiation}
          >
            {isCreatingNegotiation ? (
              <ActivityIndicator size="small" color={theme.background} />
            ) : (
              <>
                <Ionicons
                  name="chatbubble-ellipses"
                  size={20}
                  color={theme.background}
                  style={{ marginRight: 8 }}
                />
                <AppText size={16} weight="bold" color={theme.background}>
                  Message Driver
                </AppText>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.navigationRow}>
            <TouchableOpacity
              onPress={handlePrev}
              disabled={isFirstMatch}
              style={[
                styles.navButton,
                isFirstMatch && styles.navButtonDisabled,
              ]}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={isFirstMatch ? theme.textMuted : theme.text}
              />
              <AppText
                size={14}
                weight="bold"
                color={isFirstMatch ? theme.textMuted : theme.text}
              >
                Previous
              </AppText>
            </TouchableOpacity>

            {!isLastMatch ? (
              <TouchableOpacity onPress={handleNext} style={styles.navButton}>
                <AppText size={14} weight="bold" color={theme.text}>
                  Next
                </AppText>
                <Ionicons name="chevron-forward" size={20} color={theme.text} />
              </TouchableOpacity>
            ) : (
              <AppText
                size={13}
                color={theme.textMuted}
                style={{ textAlign: "center", flex: 1 }}
              >
                Last Option
              </AppText>
            )}
          </View>
        </View>
      )}

      {!isMatchingLoading && !error && searchDone && !hasMatches && (
        <View style={styles.footerContainer}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.outlineButton}
          >
            <AppText size={15} weight="bold" color={theme.text}>
              Go Back
            </AppText>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function getStyles(theme: any) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    backButton: {
      padding: 8,
      borderRadius: 12,
      backgroundColor: theme.surface,
    },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40, flexGrow: 1 },

    centerBlock: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 80,
      width: "100%",
    },
    ringOuter: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 2,
      borderColor: theme.border,
      borderTopColor: theme.text,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 24,
    },
    errorCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.surface,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 24,
    },
    heading: { textAlign: "center", marginBottom: 8 },
    subheading: {
      textAlign: "center",
      paddingHorizontal: 24,
      lineHeight: 22,
      marginBottom: 20,
    },

    successBanner: {
      alignItems: "center",
      marginTop: 20,
      marginBottom: 32,
    },
    successIconWrapper: {
      marginBottom: 12,
    },

    matchBadge: {
      alignSelf: "flex-start",
      backgroundColor: theme.surface,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 12,
      marginBottom: 12,
    },

    summaryCard: {
      width: "100%",
      backgroundColor: theme.surface,
      borderRadius: 24,
      padding: 24,
      marginBottom: 20,
    },
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 18,
    },
    detailIconBox: {
      width: 44,
      height: 44,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
      backgroundColor: ACCENT_TO,
    },
    detailTextContainer: { flex: 1, justifyContent: "center" },
    detailLabel: {
      marginBottom: 4,
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    divider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: 10,
      marginBottom: 20,
    },

    footerContainer: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 24,
      backgroundColor: theme.background,
      borderTopWidth: 1,
      borderTopColor: theme.surface,
    },
    primaryButton: {
      flexDirection: "row",
      borderRadius: 16,
      height: 56,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.text,
      marginBottom: 16,
    },
    navigationRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
    },
    navButton: {
      flex: 1,
      flexDirection: "row",
      borderRadius: 16,
      height: 52,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.surface,
      gap: 6,
    },
    navButtonDisabled: {
      opacity: 0.5,
    },
    outlineButton: {
      flexDirection: "row",
      borderRadius: 16,
      height: 56,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: theme.border,
    },
  });
}
