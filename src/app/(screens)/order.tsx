import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { ArrowLeft, Car, Package, Truck } from "lucide-react-native";
import { AppText } from "@/components/AppText";

// Redux
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/api/store";
import { fetchDashboardOrders } from "@/api/slices/user.slice";

type OrderType = "ride_offer" | "ride_join" | "parcel_send" | "parcel_deliver";

interface NormalizedOrder {
  id: string;
  type: OrderType;
  category: string;
  status: string;
  title: string;
  subtitle: string;
  amount?: number;
  date: string;
  rawData: any;
}

export default function OrderScreen() {
  const { theme: colors, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const { dashboardData } = useSelector((state: RootState) => state.user);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string>("REQUEST_DELIVERY");

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await dispatch(fetchDashboardOrders()).unwrap();
      } catch (err: any) {
        setError(
          err?.message || "Failed to retrieve dashboard orders pipeline."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [dispatch]);

  const getMappedOrders = (): NormalizedOrder[] => {
    if (!dashboardData?.orders) return [];

    const sourceOrders = dashboardData.orders;
    const normalized: NormalizedOrder[] = [];

    // Offer Ride
    sourceOrders.offer_ride?.forEach((order: any) => {
      normalized.push({
        id: order._id,
        type: "ride_offer",
        category: "offer_ride",
        status: order.status,
        title: `${order.pickupPoint} → ${order.dropoffPoint}`,
        subtitle: `${order.departureTime} • ${order.availableSeats} seats`,
        amount: order.estimatedFare,
        date: order.createdAt,
        rawData: order,
      });
    });

    // Join Ride
    sourceOrders.join_ride?.forEach((order: any) => {
      normalized.push({
        id: order.service,
        type: "ride_join",
        category: "join_ride",
        status: order.status,
        title: "Ride Agreed",
        subtitle: `₦${order.agreedAmount} • ${
          order.serviceProvider?.name || "Driver"
        }`,
        amount: order.agreedAmount,
        date: order.createdAt,
        rawData: order,
      });
    });

    // Send Parcel
    sourceOrders.send_parcel?.forEach((order: any) => {
      normalized.push({
        id: order._id,
        type: "parcel_deliver",
        category: "deliver_parcel",
        status: order.status,
        title: `${order.pickupAddress} → ${order.destinationCity}`,
        subtitle: `Available from: ${order.dispatchDateStart?.split("T")[0]}`,
        amount: order.priceRange?.max || order.priceRange?.min,
        date: order.createdAt,
        rawData: order,
      });
    });

    // Deliver Parcel
    sourceOrders.deliver_parcel?.forEach((order: any) => {
      normalized.push({
        id: order._id,
        type: "parcel_send",
        category: "send_parcel",
        status: order.status,
        title: "Send a Parcel",
        subtitle: `Status: ${order.status}`,
        date: order.createdAt,
        rawData: order,
      });
    });

    return normalized;
  };

  const filteredOrders = getMappedOrders().filter((order) => {
    if (activeAction === "REQUEST_DELIVERY") return true;
    if (activeAction === "OFFER_RIDE" && order.category === "offer_ride")
      return true;
    if (activeAction === "JOIN_RIDE" && order.category === "join_ride")
      return true;
    if (activeAction === "SEND_PARCEL" && order.category === "send_parcel")
      return true;
    if (
      activeAction === "DELIVER_PARCEL" &&
      order.category === "deliver_parcel"
    )
      return true;
    return false;
  });

  const handleOrderPress = (order: NormalizedOrder) => {
    console.log("Order Clicked:", {
      id: order.id,
      type: order.type,
      category: order.category,
      title: order.title,
      status: order.status,
      rawData: order.rawData,
    });

    const { rawData } = order;

    if (order.type === "ride_offer" || order.type === "ride_join") {
      router.push({
        pathname: "/(details)/ride",
        params: {
          id: order.id,
          driverName:
            rawData.driver?.name || rawData.serviceProvider?.name || "Driver",
          driverPhone: rawData.driver?.phone || "",
          pickup: rawData.pickupPoint || rawData.pickup,
          dropoff: rawData.dropoffPoint || rawData.dropoff,
          fare: order.amount,
          time: rawData.departureTime,
          seats: rawData.availableSeats || 1,
        },
      });
    } else if (order.type === "parcel_send") {
      const hasNegotiations =
        Array.isArray(rawData.negotiations) && rawData.negotiations.length > 0;

      if (!hasNegotiations) {
        console.log("No negotiations found → Redirecting to drivers_menu");
        router.push("/(features)/drivers_menu");
      } else {
        console.log("Has negotiations → Redirecting to details");
        router.push({
          pathname: "/(details)/details",
          params: { id: order.id },
        });
      }
    } else {
      router.push({
        pathname: "/(details)/details",
        params: { id: order.id },
      });
    }
  };

  const getIcon = (type: OrderType) => {
    switch (type) {
      case "ride_offer":
      case "ride_join":
        return <Car size={28} color={colors.primary} />;
      case "parcel_send":
      case "parcel_deliver":
        return <Package size={28} color={colors.primary} />;
      default:
        return <Truck size={28} color={colors.primary} />;
    }
  };

  const renderOrderItem = ({ item }: { item: NormalizedOrder }) => (
    <TouchableOpacity
      style={[
        styles.orderCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      onPress={() => handleOrderPress(item)}
    >
      <View style={styles.orderLeft}>
        <View style={{ marginRight: 16 }}>{getIcon(item.type)}</View>

        <View style={{ flex: 1 }}>
          <AppText weight="semibold" color={colors.text}>
            {item.title}
          </AppText>
          <AppText size={13} color={colors.textMuted}>
            {item.subtitle}
          </AppText>
          <AppText size={12} color={colors.textMuted}>
            {new Date(item.date).toLocaleDateString()}
          </AppText>
        </View>
      </View>

      {item.amount && (
        <AppText weight="bold" color={colors.primary}>
          ₦{item.amount}
        </AppText>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background, height: "100%" },
      ]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View
        style={[
          styles.headerSafeArea,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            borderBottomWidth: 1,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[
              styles.iconButton,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <AppText size={20} weight="bold" color={colors.text}>
            Orders
          </AppText>
          <View style={{ width: 44 }} />
        </View>
      </View>

      {/* Horizontal Scrollable Tabs (No Overflow) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScrollContainer}
        contentContainerStyle={styles.tabScrollContent}
      >
        {[
          { key: "REQUEST_DELIVERY", label: "All" },
          { key: "SEND_PARCEL", label: "Send Parcel" },
          { key: "DELIVER_PARCEL", label: "Deliver Parcel" },
          { key: "JOIN_RIDE", label: "Join Ride" },
          { key: "OFFER_RIDE", label: "Offer Ride" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeAction === tab.key && {
                borderBottomWidth: 3,
                borderBottomColor: colors.primary,
              },
            ]}
            onPress={() => setActiveAction(tab.key)}
          >
            <AppText
              size={16}
              weight={activeAction === tab.key ? "bold" : "medium"}
              color={
                activeAction === tab.key ? colors.primary : colors.textMuted
              }
            >
              {tab.label}
            </AppText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading && (
        <View style={styles.stateCenterLoader}>
          <ActivityIndicator size="small" color={colors.primary} />
          <AppText style={{ marginTop: 10 }} size={13} color={colors.textMuted}>
            Loading active operational nodes...
          </AppText>
        </View>
      )}

      {!isLoading && (
        <View style={{ height: "81%", marginTop: -48 }}>
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item.id}
            renderItem={renderOrderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <AppText size={14} color={colors.textMuted}>
                  No running orders active inside this lane parameters.
                </AppText>
              </View>
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {},
  headerSafeArea: {
    ...Platform.select({
      android: {
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 4 : 12,
      },
    }),
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },

  /* Horizontal Scrollable Tabs */
  tabScrollContainer: {
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  tabScrollContent: {
    flexDirection: "row",
    paddingHorizontal: 10,
    height: 65,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 4,
    marginBottom: 12,
  },

  listContent: {
    padding: 20,
    paddingBottom: 160,
  },
  stateCenterLoader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  orderCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  orderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  orderAvatar: { width: 50, height: 50, borderRadius: 12 },

  /* Bottom Sheet Presentation Core */
  bottomSheetPresentation: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 24,
  },
  sheetTopRowIdentity: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sheetProfileAvatarImage: { width: 48, height: 48, borderRadius: 24 },
  messageDirectOutlineButton: {
    flexDirection: "row",
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  dividerLineBorder: { height: 1, marginVertical: 16 },

  /* Extended Detail Parameter Layout Elements */
  detailDataCardBox: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  dataDetailParameterRow: { flexDirection: "row", alignItems: "center" },
  innerRouteConnectorLine: {
    height: 16,
    width: 1,
    borderLeftWidth: 1.5,
    borderStyle: "dashed",
    marginLeft: 7,
    marginVertical: 2,
  },
  metadataTwoColumnLayoutGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  gridHalfBox: {
    flex: 1,
    minWidth: "45%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 12,
  },
  metaDataBlockRowItem: { marginBottom: 12 },

  /* Footer Block */
  summaryTotalDockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  modalSingleCloseBtn: {
    paddingHorizontal: 24,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  /* Modal Conversation Core Screen Styles */
  chatViewContainer: { flex: 1 },
  chatHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  pillBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  bubbleWrapper: { flexDirection: "row", width: "100%", marginBottom: 12 },
  msgBubble: {
    maxWidth: "80%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  workflowBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  actionWorkflowBtn: {
    height: 46,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  waitingPaymentPill: {
    height: 46,
    justifyContent: "center",
    alignItems: "center",
  },
  chatInputDock: { width: "100%", borderTopWidth: 1 },
  innerDockLayout: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  inputField: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  sendIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
});
