import { useState, useEffect, useCallback } from "react";
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
import NegotiationActionPanel from "@/components/NegotiationActionPanel";

export default function RequestDetailsScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { id, negotiatorService } = useLocalSearchParams<{
    id: string;
    negotiatorService: any;
  }>();

  // Local State
  const [parcel, setParcel] = useState<any | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNegotiating, setIsNegotiating] = useState(false);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = await getUser();
      setCurrentUser(user);
    };
    fetchCurrentUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (id) {
        setIsLoading(true);
        dispatch(getRequestById(id))
          .unwrap()
          .then((res: any) => {
            const incomingData = res?.data ? res.data : res;
            setParcel(incomingData);
            setError(null);
          })
          .catch((err: any) => {
            setError(err?.message || "Failed to fetch request");
          })
          .finally(() => setIsLoading(false));
      }
    }, [id, dispatch])
  );

  const isOwner = parcel?.isOwner === true;
  const currentUserIdStr = currentUser?._id || currentUser?.id;
  const parcelProviderIdStr = parcel?.user?._id || parcel?.user?.id;
  const isServiceProvider =
    !!currentUserIdStr &&
    !!parcelProviderIdStr &&
    currentUserIdStr === parcelProviderIdStr;

  const getCurrentUserNegotiation = () => {
    if (!parcel?.negotiations || !currentUser) return null;
    return parcel.negotiations.find((neg: any) => {
      const negotiatorId = neg?.negotiator?._id || neg?.negotiator;
      return negotiatorId === currentUserIdStr;
    });
  };

  const activeNegotiation = getCurrentUserNegotiation();
  const hasExistingNegotiation = !!activeNegotiation;

  const refreshParcel = async () => {
    if (id) {
      setIsLoading(true);
      dispatch(getRequestById(id))
        .unwrap()
        .then((res: any) => {
          const incomingData = res?.data ? res.data : res;
          setParcel(incomingData);
          setError(null);
        })
        .catch((err: any) => {
          setError(err?.message || "Failed to fetch request");
        })
        .finally(() => setIsLoading(false));
    }
  };

  const handleNegotiate = async () => {
    if (!parcel) return;

    if (hasExistingNegotiation && activeNegotiation?._id) {
      router.push({
        pathname: "/(details)/ChatScreen",
        params: {
          id: activeNegotiation._id,
          parcelId: String(id),
          isServiceProvider: String(isServiceProvider),
          currentUserId: String(currentUser?._id || currentUser?.id),
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
      if (result?._id) {
        router.push({
          pathname: "/(details)/ChatScreen",
          params: { id: result._id },
        });
      }
    } catch (err: any) {
      Alert.alert("Error", "Failed to initialize negotiation.");
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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
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
            Request Details
          </AppText>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View
          style={[
            styles.contentCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
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
              <AppText size={16} weight="bold" color={theme.text}>
                {clientName}
              </AppText>
              {/* <AppText size={12} color={theme.textMuted}>
                {parcel.user?.email}
              </AppText> */}
              {/* {parcel.user?.phone  && (
                <AppText size={12} color={theme.textMuted}>
                  {parcel.user.phone}
                </AppText>
              )} */}
            </View>
          </View>
        </View>

        {/* Logistics Details */}
        <View style={styles.sectionTitleRow}>
          <AppText size={11} weight="bold" color={theme.textMuted}>
            LOGISTICS DETAILS
          </AppText>
        </View>
        <View
          style={[
            styles.contentCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              padding: 16,
            },
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
                  PICKUP ADDRESS
                </AppText>
                <AppText size={15} weight="bold" color={theme.text}>
                  {parcel.pickupAddress}
                </AppText>
              </View>
              <View style={{ marginTop: 24 }}>
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
        <View style={styles.sectionTitleRow}>
          <AppText size={11} weight="bold" color={theme.textMuted}>
            PRICING & BUDGET
          </AppText>
        </View>
        <View
          style={[
            styles.contentCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              padding: 16,
            },
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
                Budget Range
              </AppText>
              <AppText size={18} weight="bold" color={theme.primary}>
                ₦{parcel.priceRange?.min?.toLocaleString()} - ₦
                {parcel.priceRange?.max?.toLocaleString()}
              </AppText>
            </View>
          </View>
        </View>

        {/* NEGOTIATIONS */}
        {parcel.negotiations && parcel.negotiations.length > 0 && (
          <>
            <AppText
              size={11}
              weight="bold"
              color={theme.textMuted}
              style={styles.sectionTitleLabel}
            >
              NEGOTIATIONS ({parcel.negotiations.length})
            </AppText>

            {parcel.negotiations.map((neg: any, index: number) => {
              const serviceData = neg.negotiatorServiceData;
              const agreed = neg.agreedAmount;

              return (
                <View
                  key={neg._id || index}
                  style={[
                    styles.contentCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <NegotiationActionPanel
                    negotiationId={neg._id}
                    parcelId={id as string}
                    isServiceProvider={isServiceProvider}
                    currentUserId={currentUserIdStr}
                    accordion={false} // Set true if you want accordion modal behavior
                  />
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* Bottom Floating Button */}
      {!isOwner && (
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
              isNegotiating && { opacity: 0.7 },
            ]}
            onPress={handleNegotiate}
            disabled={isNegotiating}
          >
            {isNegotiating ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : hasExistingNegotiation ? (
              <AppText size={15} weight="bold" color="#FFF">
                Go to My Chat
              </AppText>
            ) : (
              <AppText size={15} weight="bold" color="#FFF">
                Negotiate Now
              </AppText>
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
  contentCard: {
    borderRadius: 20,
    borderWidth: 1,

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
  sectionTitleLabel: { letterSpacing: 1, marginBottom: 8 },
  timelineRow: { flexDirection: "row", gap: 14 },
  timelineIndicators: { alignItems: "center", paddingVertical: 4 },
  dashedLine: { width: 2, flex: 1, marginVertical: 4 },
  timelineContent: { flex: 1 },
  metaParamRow: { flexDirection: "row", alignItems: "center" },
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
  subDataBlock: { gap: 1, marginTop: 4 },
  iconHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
});
