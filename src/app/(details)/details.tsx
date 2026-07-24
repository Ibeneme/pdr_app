import { useState, useEffect, useCallback, useRef } from "react";
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
  Animated,
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
import NegotiationActionPanel from "@/components/NegotiationActionPanel";

// ---- Simple animated shimmer block, no external libraries required ----
function ShimmerBlock({
  width,
  height,
  borderRadius = 10,
  baseColor,
  style,
}: {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  baseColor: string;
  style?: any;
}) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: baseColor, opacity },
        style,
      ]}
    />
  );
}

export default function RequestDetailsScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { id, negotiatorService } = useLocalSearchParams<{
    id: string;
    negotiatorService?: string;
  }>();

  const shimmerBase = isDark ? "#2A2A2E" : "#E7E7EA";

  // Local State
  const [parcel, setParcel] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNegotiating, setIsNegotiating] = useState(false);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = await getUser();
      setCurrentUser(user);
    };
    fetchCurrentUser();
  }, []);

  // Fetch parcel details
  useFocusEffect(
    useCallback(() => {
      if (!id) return;

      setIsLoading(true);
      dispatch(getRequestById(id))
        .unwrap()
        .then((res: any) => {
          const data = res?.data ? res.data : res;
          setParcel(data);
          setError(null);
        })
        .catch((err: any) => {
          setError(err?.message || "Failed to fetch request");
        })
        .finally(() => setIsLoading(false));
    }, [id, dispatch])
  );

  const currentUserId = currentUser?._id || currentUser?.id;
  const parcelOwnerId = parcel?.user?._id || parcel?.user?.id;

  const isOwner = parcel?.isOwner === true;
  const isServiceProvider = currentUserId === parcelOwnerId;

  // Get current user's negotiation
  const getCurrentUserNegotiation = () => {
    if (!parcel?.negotiations || !currentUserId) return null;
    return parcel.negotiations.find((neg: any) => {
      const negotiatorId = neg?.negotiator?._id || neg?.negotiator;
      return negotiatorId === currentUserId;
    });
  };

  const activeNegotiation = getCurrentUserNegotiation();
  const hasExistingNegotiation = !!activeNegotiation;
  const isPaid = activeNegotiation?.isPaid === true; // ← Fixed: This was missing

  const refreshParcel = async () => {
    if (!id) return;
    // ... same as before
  };

  const handleNegotiate = async () => {
    if (!parcel) return;

    if (
      hasExistingNegotiation &&
      activeNegotiation?._id &&
      id &&
      currentUserId
    ) {
      router.push({
        pathname: "/(details)/ChatScreen",
        params: {
          id: activeNegotiation._id,
          parcelId: id,
          isServiceProvider: String(isServiceProvider),
          currentUserId: currentUserId,
        },
      });
      return;
    }

    const payload = {
      serviceProvider: parcel.user?._id,
      service: id,
      serviceType: "deliver_a_parcel",
      negotiatorService: negotiatorService,
    };

    setIsNegotiating(true);
    try {
      const result = await dispatch(createNegotiation(payload)).unwrap();

      if (result?.data?._id) {
        router.push({
          pathname: "/(details)/ChatScreen",
          params: { id: result.data._id },
        });
      }
    } catch (err: any) {
      console.error("Negotiation error:", err);
      Alert.alert("Error", "Failed to initialize negotiation.");
    } finally {
      setIsNegotiating(false);
    }
  };

  // ==================== LOADING STATE (shimmer skeleton) ====================
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

        <SafeAreaView style={styles.headerArea}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.iconCircle, { backgroundColor: theme.surface }]}
            >
              <Ionicons name="arrow-back" size={20} color={theme.text} />
            </TouchableOpacity>
            <AppText size={16} weight="bold" color={theme.text}>
              Request Details
            </AppText>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile card skeleton */}
          <View
            style={[styles.contentCard, { backgroundColor: theme.surface }]}
          >
            <View style={styles.profileSection}>
              <ShimmerBlock
                width={52}
                height={52}
                borderRadius={20}
                baseColor={shimmerBase}
              />
              <View style={{ flex: 1, gap: 8 }}>
                <ShimmerBlock
                  width={90}
                  height={11}
                  borderRadius={6}
                  baseColor={shimmerBase}
                />
                <ShimmerBlock
                  width={150}
                  height={16}
                  borderRadius={7}
                  baseColor={shimmerBase}
                />
              </View>
              <ShimmerBlock
                width={64}
                height={26}
                borderRadius={999}
                baseColor={shimmerBase}
              />
            </View>
          </View>

          {/* Logistics section skeleton */}
          <View style={styles.sectionPill}>
            <ShimmerBlock
              width={130}
              height={11}
              borderRadius={6}
              baseColor={shimmerBase}
            />
          </View>
          <View
            style={[
              styles.contentCard,
              { backgroundColor: theme.surface, padding: 18 },
            ]}
          >
            <View style={styles.timelineRow}>
              <View style={styles.timelineIndicators}>
                <ShimmerBlock
                  width={26}
                  height={26}
                  borderRadius={999}
                  baseColor={shimmerBase}
                />
                <View style={{ flex: 1, width: 2, marginVertical: 6 }} />
                <ShimmerBlock
                  width={26}
                  height={26}
                  borderRadius={999}
                  baseColor={shimmerBase}
                />
              </View>
              <View style={styles.timelineContent}>
                <View style={{ gap: 6 }}>
                  <ShimmerBlock
                    width={100}
                    height={10}
                    borderRadius={5}
                    baseColor={shimmerBase}
                  />
                  <ShimmerBlock
                    width={180}
                    height={15}
                    borderRadius={7}
                    baseColor={shimmerBase}
                  />
                </View>
                <View style={{ marginTop: 26, gap: 6 }}>
                  <ShimmerBlock
                    width={110}
                    height={10}
                    borderRadius={5}
                    baseColor={shimmerBase}
                  />
                  <ShimmerBlock
                    width={150}
                    height={15}
                    borderRadius={7}
                    baseColor={shimmerBase}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Budget section skeleton */}
          <View style={styles.sectionPill}>
            <ShimmerBlock
              width={110}
              height={11}
              borderRadius={6}
              baseColor={shimmerBase}
            />
          </View>
          <View
            style={[
              styles.contentCard,
              { backgroundColor: theme.surface, padding: 18 },
            ]}
          >
            <View style={styles.metaParamRow}>
              <ShimmerBlock
                width={44}
                height={44}
                borderRadius={999}
                baseColor={shimmerBase}
              />
              <View style={{ flex: 1, marginLeft: 14, gap: 8 }}>
                <ShimmerBlock
                  width={80}
                  height={10}
                  borderRadius={5}
                  baseColor={shimmerBase}
                />
                <ShimmerBlock
                  width={160}
                  height={18}
                  borderRadius={8}
                  baseColor={shimmerBase}
                />
              </View>
            </View>
          </View>
        </ScrollView>
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
        <View
          style={[styles.errorIconCircle, { backgroundColor: `#EF444415` }]}
        >
          <Ionicons name="alert-circle-outline" size={36} color="#EF4444" />
        </View>
        <AppText size={15} color={theme.text} style={styles.errorText}>
          {error || "Record missing"}
        </AppText>
      </View>
    );
  }

  const clientName = parcel.user?.fullName || "Anonymous Operator";
  const displayDriverName = (parcel?.user?.fullName || "Driver")
    .split(" ")[0]
    .slice(0, 5);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <SafeAreaView style={styles.headerArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.iconCircle, { backgroundColor: theme.surface }]}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </TouchableOpacity>
          <AppText size={16} weight="bold" color={theme.text}>
            Request Details
          </AppText>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={[styles.contentCard, { backgroundColor: theme.surface }]}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              {parcel.user?.profileImage ? (
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
              <AppText
                size={11}
                color={theme.textMuted}
                style={{ marginBottom: 2 }}
              >
                Requested by
              </AppText>
              <AppText size={16} weight="bold" color={theme.text}>
                {isPaid ? clientName : `${displayDriverName}********`}
              </AppText>
            </View>

            <View
              style={[
                styles.statusDotBadge,
                { backgroundColor: `${theme.primary}12` },
              ]}
            >
              <View
                style={[styles.liveDot, { backgroundColor: theme.primary }]}
              />
              <AppText size={11} weight="bold" color={theme.primary}>
                Active
              </AppText>
            </View>
          </View>
        </View>

        {/* Logistics Details */}
        <View style={styles.sectionPill}>
          <AppText
            size={11}
            weight="bold"
            color={theme.textMuted}
            style={styles.sectionPillText}
          >
            LOGISTICS DETAILS
          </AppText>
        </View>

        <View
          style={[
            styles.contentCard,
            { backgroundColor: theme.surface, padding: 18 },
          ]}
        >
          <View style={styles.timelineRow}>
            <View style={styles.timelineIndicators}>
              <View
                style={[
                  styles.timelineDotWrap,
                  { backgroundColor: `${theme.primary}15` },
                ]}
              >
                <View
                  style={[
                    styles.timelineDotCore,
                    { backgroundColor: theme.primary },
                  ]}
                />
              </View>
              <View
                style={[styles.dashedLine, { backgroundColor: theme.border }]}
              />
              <View
                style={[
                  styles.timelineDotWrap,
                  { backgroundColor: "#EF444415" },
                ]}
              >
                <Ionicons name="location" size={13} color="#EF4444" />
              </View>
            </View>

            <View style={styles.timelineContent}>
              <View>
                <AppText size={11} color={theme.textMuted}>
                  PICKUP ADDRESS
                </AppText>
                <AppText size={15} weight="bold" color={theme.text}>
                  {parcel.pickupAddress}
                </AppText>
              </View>
              <View style={{ marginTop: 26 }}>
                <AppText size={11} color={theme.textMuted}>
                  DESTINATION CITY
                </AppText>
                <AppText size={15} weight="bold" color={theme.text}>
                  {parcel.destinationCity}
                </AppText>
              </View>
            </View>
          </View>
        </View>

        {/* Budget Range */}
        <View style={styles.sectionPill}>
          <AppText
            size={11}
            weight="bold"
            color={theme.textMuted}
            style={styles.sectionPillText}
          >
            PRICING & BUDGET
          </AppText>
        </View>

        <View
          style={[
            styles.contentCard,
            { backgroundColor: theme.surface, padding: 18 },
          ]}
        >
          <View style={styles.metaParamRow}>
            <View
              style={[
                styles.metaIconCircle,
                { backgroundColor: `${theme.primary}12` },
              ]}
            >
              <MaterialCommunityIcons
                name="cash-multiple"
                size={20}
                color={theme.primary}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <AppText size={12} color={theme.textMuted}>
                Budget Range
              </AppText>
              <AppText size={19} weight="bold" color={theme.text}>
                ₦{parcel.priceRange?.min?.toLocaleString()} - ₦
                {parcel.priceRange?.max?.toLocaleString()}
              </AppText>
            </View>
          </View>
        </View>

        {/* Negotiations */}
        {parcel.negotiations?.length > 0 && (
          <>
            <View style={styles.sectionPill}>
              <AppText
                size={11}
                weight="bold"
                color={theme.textMuted}
                style={styles.sectionPillText}
              >
                NEGOTIATIONS ({parcel.negotiations.length})
              </AppText>
            </View>

            {parcel.negotiations.map((neg: any, index: number) => (
              <View
                key={neg._id || index}
                style={[styles.contentCard, { backgroundColor: theme.surface }]}
              >
                <NegotiationActionPanel
                  negotiationId={neg._id}
                  parcelId={id as string}
                  isServiceProvider={isServiceProvider}
                  currentUserId={currentUserId}
                  accordion={false}
                  handleViewChat={() =>
                    router.push({
                      pathname: "/(details)/ChatScreen",
                      params: {
                        id: activeNegotiation._id,
                        parcelId: id,
                        isServiceProvider: String(isServiceProvider),
                        currentUserId: currentUserId,
                      },
                    })
                  }
                />
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Bottom Button */}
      {!isOwner && (
        <View style={styles.stickyFooter}>
          <TouchableOpacity
            style={[
              styles.primaryActionBtn,
              { backgroundColor: theme.primary },
              isNegotiating && { opacity: 0.7 },
            ]}
            onPress={handleNegotiate}
            disabled={isNegotiating}
            activeOpacity={0.85}
          >
            {isNegotiating ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : hasExistingNegotiation ? (
              <>
                <AppText size={15} weight="bold" color="#FFF">
                  Go to My Chat
                </AppText>
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color="#fff"
                  style={{ marginLeft: 8 }}
                />
              </>
            ) : (
              <>
                <AppText size={15} weight="bold" color="#FFF">
                  Negotiate Now
                </AppText>
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color="#fff"
                  style={{ marginLeft: 8 }}
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  errorIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  errorText: { marginVertical: 4, textAlign: "center" },

  // Header — no border, no shadow, just breathing room
  headerArea: { width: "100%" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },

  scrollContainer: { padding: 20, paddingBottom: 40 },

  // Flat cards — big radius, no border, no shadow. Separation comes from
  // the surface/background color contrast alone.
  contentCard: {
    borderRadius: 28,
    marginBottom: 16,
  },

  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 20,
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%", resizeMode: "cover" },
  initialsAvatar: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  statusDotBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Section labels as soft pill chips instead of bare uppercase text
  sectionPill: {
    alignSelf: "flex-start",
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionPillText: {
    letterSpacing: 1,
  },

  timelineRow: { flexDirection: "row", gap: 14 },
  timelineIndicators: { alignItems: "center", paddingVertical: 2 },
  timelineDotWrap: {
    width: 26,
    height: 26,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  timelineDotCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dashedLine: { width: 2, flex: 1, marginVertical: 6, borderRadius: 1 },
  timelineContent: { flex: 1 },

  metaParamRow: { flexDirection: "row", alignItems: "center" },
  metaIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },

  // Sticky footer — flat, no top border/shadow separating it
  stickyFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  primaryActionBtn: {
    height: 56,
    borderRadius: 999,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});
