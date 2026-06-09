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
import { useRouter } from "expo-router";
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

  // Local State Management
  const [parcels, setParcels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);

  // Fetch data
  useEffect(() => {
    setIsLoading(true);
    dispatch(getAllGlobalRequests())
      .unwrap()
      .then((data: any) => {
        const parcelData = data?.data || data || [];
        setParcels(parcelData);
      })
      .catch((err) => {
        console.error("❌ [DriverMarketplaceScreen] Fetch failure:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [dispatch]);

  const handleOpenChat = (parcel: any) => {
    setSelectedParcel(parcel);
    const senderName = parcel.user?.fullName || "Customer";
    setMessages([
      {
        id: "1",
        sender: "driver",
        text: `Hello! I can help move your parcel from ${parcel.pickupAddress} to ${parcel.destinationCity}.`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setChatVisible(true);
  };

  const getInitials = (name: string = "Customer") => {
    const names = name.trim().split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0].slice(0, 2).toUpperCase();
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
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>

          <AppText style={[styles.brandText, { color: theme.text }]}>
            Available Requests
          </AppText>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollLayout}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loaderWrapper}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : parcels.length === 0 ? (
          <View style={styles.emptyWrapper}>
            <AppText style={{ color: theme.textMuted }}>
              No delivery requests available.
            </AppText>
          </View>
        ) : (
          parcels.map((parcel) => {
            const clientName = parcel.user?.fullName || "Anonymous Requester";
            const clientImage = parcel.user?.profileImage;
            const hasImage = !!clientImage;

            return (
              <TouchableOpacity
                key={parcel._id}
                activeOpacity={0.9}
                onPress={() =>
                  router.push({
                    pathname: "/(details)/details",
                    params: { id: parcel._id },
                  })
                }
                style={[
                  styles.driverCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                {/* User Info Header Block */}
                <View style={styles.userInfoRow}>
                  <View style={styles.avatarWrapper}>
                    {hasImage ? (
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
                    <AppText style={{ color: theme.textMuted, fontSize: 11 }}>
                      {parcel.user?.isVerified
                        ? "🔒 Verified Poster"
                        : "Active User"}
                    </AppText>
                  </View>
                </View>

                {/* Routing Destination Block */}
                <View
                  style={[
                    styles.routeBlock,
                    { backgroundColor: theme.background },
                  ]}
                >
                  <AppText style={[styles.driverName, { color: theme.text }]}>
                    📦 Bound to: {parcel.destinationCity}
                  </AppText>
                  <AppText
                    style={[
                      styles.vehicleLabel,
                      { color: theme.textMuted, marginTop: 4 },
                    ]}
                  >
                    📍 Pickup Location: {parcel.pickupAddress}
                  </AppText>
                </View>

                <View
                  style={[
                    styles.innerDivider,
                    { backgroundColor: theme.border },
                  ]}
                />

                <View style={styles.cardFooterRow}>
                  <AppText
                    style={[styles.priceMatrixText, { color: theme.text }]}
                  >
                    {parcel.priceRange
                      ? `₦${parcel.priceRange.min?.toLocaleString()} - ₦${parcel.priceRange.max?.toLocaleString()}`
                      : "Price negotiable"}
                  </AppText>

                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Modal Chat */}
      <Modal animationType="slide" visible={chatVisible} transparent={false}>
        <View
          style={[
            styles.modalContextContainer,
            { backgroundColor: theme.background },
          ]}
        >
          <SafeAreaView style={{ backgroundColor: theme.surface }}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setChatVisible(false)}>
                <AppText style={{ color: theme.text, fontSize: 16 }}>
                  Close
                </AppText>
              </TouchableOpacity>
              <AppText style={[styles.chatTitleName, { color: theme.text }]}>
                {selectedParcel?.user?.fullName || "Chat"}
              </AppText>
            </View>
          </SafeAreaView>

          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.chatBubbleBase,
                  {
                    backgroundColor: theme.surface,
                    alignSelf:
                      item.sender === "driver" ? "flex-end" : "flex-start",
                  },
                ]}
              >
                <AppText style={{ color: theme.text }}>{item.text}</AppText>
                <AppText
                  style={{
                    color: theme.textMuted,
                    fontSize: 10,
                    textAlign: "right",
                    marginTop: 4,
                  }}
                >
                  {item.timestamp}
                </AppText>
              </View>
            )}
          />
        </View>
      </Modal>
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
  backButton: {
    marginRight: 8,
  },
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
  initialsText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  clientNameText: {
    fontFamily: "RethinkSans-Bold",
    fontSize: 15,
  },
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
  messageTriggerBtn: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
  },
  btnTextCompact: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
  modalContextContainer: { flex: 1 },
  modalHeader: { flexDirection: "row", padding: 20, alignItems: "center" },
  chatTitleName: { fontSize: 16, fontWeight: "bold", marginLeft: 20 },
  chatBubbleBase: {
    padding: 14,
    marginVertical: 6,
    borderRadius: 16,
    maxWidth: "80%",
  },
});
