import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Platform,
  StatusBar,
  Modal,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import {
  ArrowLeft,
  MessageCircle,
  Clock,
  MapPin,
  Send,
  ShieldCheck,
  Truck,
  Hash,
  Calendar,
} from "lucide-react-native";
import { AppText } from "@/components/AppText";

interface Message {
  id: string;
  sender: "user" | "driver" | "system";
  text: string;
  timestamp: string;
}

type RideWorkflowState = "pending" | "started" | "paid" | "ended";

export default function OrderScreen() {
  const { theme: colors, isDark } = useTheme();
  const router = useRouter();

  // Core Functional System State Engine
  const [activeAction, setActiveAction] = useState<string>("REQUEST_DELIVERY");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Chat Screen & Simulation State Engines
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [workflowState, setWorkflowState] =
    useState<RideWorkflowState>("pending");
  const [messages, setMessages] = useState<Message[]>([]);
  const [typedMessage, setTypedMessage] = useState("");
  const chatListRef = useRef<FlatList>(null);

  const allOrders = [
    {
      id: "ORD-9382",
      type: "offered",
      title: "GRA Phase 2 → Diobu",
      date: "May 25, 2026",
      time: "09:45 AM",
      amount: "₦3,800",
      status: "In Progress",
      counterpart: "Kelechi Amadi",
      role: "You offered the ride",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
      arrival: "10:15 AM",
      completionTime: "45 mins",
      location: "Port Harcourt",
      pickup: "Polo Club Ground, GRA",
      dropoff: "Ikwerre Road, Diobu",
      paymentMethod: "SkyPay Escrow Wallet",
      insuranceRef: "PKR-INS-9921X",
    },
    {
      id: "ORD-8371",
      type: "parcel",
      title: "Express Parcel Delivery",
      date: "May 24, 2026",
      time: "02:15 PM",
      amount: "₦2,500",
      status: "Dispatched",
      counterpart: "Chinaza Okoro",
      role: "Delivered by you",
      image: "https://images.unsplash.com/photo-1556155092-490a1ba16284?w=200",
      arrival: "03:10 PM",
      completionTime: "55 mins",
      location: "Port Harcourt",
      pickup: "Peter Odili Road",
      dropoff: "Ada George Road",
      paymentMethod: "Cash on Delivery",
      insuranceRef: "PKR-INS-4412B",
    },
    {
      id: "ORD-6742",
      type: "joined",
      title: "Choba Campus → Town Terminal",
      date: "May 23, 2026",
      time: "07:20 AM",
      amount: "₦1,200",
      status: "Matched",
      counterpart: "Adebayo Johnson",
      role: "You joined the ride",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
      arrival: "08:05 AM",
      completionTime: "35 mins",
      location: "Port Harcourt",
      pickup: "Uniport Uni-Park Gate",
      dropoff: "Aggrey Road, Town",
      paymentMethod: "SkyPay Escrow Wallet",
      insuranceRef: "PKR-INS-0114K",
    },
  ];

  // Refactored switch logic mapping exactly to requested actions
  const handleAction = (actionType: string) => {
    console.log(`Dispatched Action: ${actionType}`);
    setSelectedOrder(null)
    switch (actionType) {
      case "REQUEST_DELIVERY":
        setActiveAction("REQUEST_DELIVERY");
        break;
      case "SEND_PARCEL":
        setActiveAction("SEND_PARCEL");
        break;
      case "JOIN_RIDE":
        setActiveAction("JOIN_RIDE");
        break;
      case "OFFER_RIDE":
        setActiveAction("OFFER_RIDE");
        break;
      default:
        break;
    }
  };

  const filteredOrders = allOrders.filter((order) => {
    if (activeAction === "REQUEST_DELIVERY") return true;
    if (activeAction === "OFFER_RIDE" && order.type === "offered") return true;
    if (activeAction === "JOIN_RIDE" && order.type === "joined") return true;
    if (activeAction === "SEND_PARCEL" && order.type === "parcel") return true;
    return false;
  });

  const isDriverChatMode =
    activeAction === "REQUEST_DELIVERY" || activeAction === "JOIN_RIDE";

  const handleOpenChatPipeline = () => {
    if (!selectedOrder) return;
    setWorkflowState("pending");
    setTypedMessage("");

    const isUserDriver = selectedOrder.type === "offered";

    setMessages([
      {
        id: "m1",
        sender: isUserDriver ? "driver" : "user",
        text: `Hello ${selectedOrder.counterpart}, coordinating the run for order ${selectedOrder.id}. Let me know when you are ready.`,
        timestamp: "10:30 PM",
      },
    ]);
    setChatModalVisible(true);
  };

  const handleSendMessage = () => {
    if (!typedMessage.trim()) return;
    const isUserDriver = selectedOrder?.type === "offered";

    const newMsg: Message = {
      id: String(Date.now()),
      sender: isUserDriver ? "driver" : "user",
      text: typedMessage,
      timestamp: "10:31 PM",
    };

    setMessages((prev) => [...prev, newMsg]);
    setTypedMessage("");
  };

  const handleStartRide = () => {
    setWorkflowState("started");
    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        sender: "system",
        text: "🚀 Trip sequence initiated. Secure routes tracking live.",
        timestamp: "10:32 PM",
      },
    ]);

    setTimeout(() => {
      setWorkflowState("paid");
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 2),
          sender: "system",
          text: `💳 SYSTEM ESCROW: Funds allocation locked and verified securely.`,
          timestamp: "10:32 PM",
        },
      ]);
    }, 1800);
  };

  const handleEndRide = () => {
    setWorkflowState("ended");
    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        sender: "system",
        text: "🏁 Fulfillment complete. Terminal validation cleared.",
        timestamp: "10:33 PM",
      },
    ]);
  };

  const getWorkflowThemeAesthetic = () => {
    if (isDriverChatMode) {
      return {
        headerBg: colors.primary,
        textAccent: colors.primary,
        badgeText: "DRIVER ACCESS",
      };
    }
    switch (workflowState) {
      case "started":
      case "paid":
        return {
          headerBg: "#16A34A",
          textAccent: "#16A34A",
          badgeText: "LIVE RUN",
        };
      case "ended":
        return {
          headerBg: "#64748B",
          textAccent: "#64748B",
          badgeText: "TERMINATED",
        };
      default:
        return {
          headerBg: colors.surface,
          textAccent: colors.primary,
          badgeText: "READY",
        };
    }
  };

  const currentStyle = getWorkflowThemeAesthetic();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <SafeAreaView
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
      </SafeAreaView>

      {/* Main Major Action Toggle Bars */}
      <View
        style={[
          styles.tabContainer,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        {[
          { key: "REQUEST_DELIVERY", label: "Request Del." },
          { key: "SEND_PARCEL", label: "Send Parcel" },
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
            onPress={() => handleAction(tab.key)}
          >
            <AppText
              size={13}
              weight={activeAction === tab.key ? "bold" : "medium"}
              color={
                activeAction === tab.key ? colors.primary : colors.textMuted
              }
            >
              {tab.label}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredOrders.map((order) => (
          <TouchableOpacity
            key={order.id}
            style={[
              styles.orderCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => setSelectedOrder(order)}
          >
            <View style={styles.orderLeft}>
              <Image source={{ uri: order.image }} style={styles.orderAvatar} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <AppText size={16} weight="bold" color={colors.text}>
                  {order.title}
                </AppText>
                <AppText size={13} color={colors.textMuted}>
                  {order.date} • {order.time}
                </AppText>
                <AppText size={13} weight="semibold" color={colors.primary}>
                  {order.role}
                </AppText>
              </View>
              <AppText size={16} weight="bold" color={colors.text}>
                {order.amount}
              </AppText>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ==================== EXPANDED DETAILS BOTTOM PANEL ==================== */}
      {selectedOrder && (
        <View
          style={[
            styles.bottomSheetPresentation,
            { backgroundColor: colors.surface },
          ]}
        >
          <View style={styles.sheetTopRowIdentity}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <Image
                source={{ uri: selectedOrder.image }}
                style={styles.sheetProfileAvatarImage}
              />
              <View>
                <AppText size={16} weight="bold" color={colors.text}>
                  {selectedOrder.counterpart}
                </AppText>
                <AppText size={13} color={colors.textMuted}>
                  Driver
                </AppText>
              </View>
            </View>

            {/* Call icon completely removed. Only Direct Contextual Message Trigger remains */}
            <TouchableOpacity
              style={[
                styles.messageDirectOutlineButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={handleOpenChatPipeline}
            >
              <MessageCircle
                size={16}
                color="#FFF"
                style={{ marginRight: 6 }}
              />
              <AppText size={14} weight="bold" color="#FFF">
                Message
              </AppText>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.dividerLineBorder,
              { backgroundColor: isDark ? "#2A2A2A" : "#F1F5F9" },
            ]}
          />

          {/* Enhanced Parameter Breakdowns */}
          <ScrollView
            style={{ maxHeight: 280 }}
            showsVerticalScrollIndicator={false}
          >
            <AppText
              size={14}
              weight="bold"
              color={colors.text}
              style={{ marginBottom: 12 }}
            >
              Detailed Manifest Records
            </AppText>

            {/* Route Coordinates Block */}
            <View
              style={[
                styles.detailDataCardBox,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.dataDetailParameterRow}>
                <MapPin size={16} color="#EF4444" />
                <View style={{ marginLeft: 8, flex: 1 }}>
                  <AppText size={11} color={colors.textMuted}>
                    PICKUP LOCATION POINT
                  </AppText>
                  <AppText size={14} weight="medium" color={colors.text}>
                    {selectedOrder.pickup}
                  </AppText>
                </View>
              </View>

              <View
                style={[
                  styles.innerRouteConnectorLine,
                  { borderColor: colors.border },
                ]}
              />

              <View style={styles.dataDetailParameterRow}>
                <MapPin size={16} color="#22C55E" />
                <View style={{ marginLeft: 8, flex: 1 }}>
                  <AppText size={11} color={colors.textMuted}>
                    DESTINATION DROPOFF TARGET
                  </AppText>
                  <AppText size={14} weight="medium" color={colors.text}>
                    {selectedOrder.dropoff}
                  </AppText>
                </View>
              </View>
            </View>

            {/* Secondary Parameters Metadata Layout Grid */}
            <View style={styles.metadataTwoColumnLayoutGrid}>
              <View
                style={[
                  styles.gridHalfBox,
                  { backgroundColor: colors.background },
                ]}
              >
                <Hash size={14} color={colors.textMuted} />
                <View>
                  <AppText size={10} color={colors.textMuted}>
                    MANIFEST ID
                  </AppText>
                  <AppText size={13} weight="bold" color={colors.text}>
                    {selectedOrder.id}
                  </AppText>
                </View>
              </View>

              <View
                style={[
                  styles.gridHalfBox,
                  { backgroundColor: colors.background },
                ]}
              >
                <Calendar size={14} color={colors.textMuted} />
                <View>
                  <AppText size={10} color={colors.textMuted}>
                    DEPARTURE DATE
                  </AppText>
                  <AppText size={13} weight="bold" color={colors.text}>
                    {selectedOrder.date}
                  </AppText>
                </View>
              </View>

              <View
                style={[
                  styles.gridHalfBox,
                  { backgroundColor: colors.background },
                ]}
              >
                <Clock size={14} color={colors.textMuted} />
                <View>
                  <AppText size={10} color={colors.textMuted}>
                    ETA INTERVAL
                  </AppText>
                  <AppText size={13} weight="bold" color={colors.text}>
                    {selectedOrder.arrival}
                  </AppText>
                </View>
              </View>

              <View
                style={[
                  styles.gridHalfBox,
                  { backgroundColor: colors.background },
                ]}
              >
                <ShieldCheck size={14} color="#22C55E" />
                <View>
                  <AppText size={10} color={colors.textMuted}>
                    INSURANCE REF
                  </AppText>
                  <AppText size={13} weight="bold" color={colors.text}>
                    {selectedOrder.insuranceRef}
                  </AppText>
                </View>
              </View>
            </View>

            <View style={[styles.metaDataBlockRowItem, { marginTop: 6 }]}>
              <AppText size={12} color={colors.textMuted}>
                Security Assurance Guarantee Strategy
              </AppText>
              <AppText
                size={13}
                weight="medium"
                color={colors.text}
                style={{ marginTop: 2 }}
              >
                Payment managed via{" "}
                <AppText weight="bold" color={colors.primary}>
                  {selectedOrder.paymentMethod}
                </AppText>
                .
              </AppText>
            </View>
          </ScrollView>

          <View
            style={[
              styles.dividerLineBorder,
              { backgroundColor: isDark ? "#2A2A2A" : "#F1F5F9" },
            ]}
          />

          {/* Core Footer Interface Control Actions */}
          <View style={styles.summaryTotalDockRow}>
            <View>
              <AppText size={12} color={colors.textMuted}>
                VALUATION FARE
              </AppText>
              <AppText size={22} weight="bold" color={colors.text}>
                {selectedOrder.amount}
              </AppText>
            </View>

            <TouchableOpacity
              style={[
                styles.modalSingleCloseBtn,
                { backgroundColor: isDark ? "#2A2A2A" : "#E2E8F0" },
              ]}
              onPress={() => setSelectedOrder(null)}
            >
              <AppText size={15} weight="bold" color={colors.text}>
                Dismiss Panel
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ==================== CHAT INTERACTION & SIMULATION MODAL ==================== */}
      <Modal
        animationType="slide"
        visible={chatModalVisible}
        onRequestClose={() => setChatModalVisible(false)}
      >
        <View
          style={[
            styles.chatViewContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <SafeAreaView
            style={{
              backgroundColor:
                workflowState === "pending" || isDriverChatMode
                  ? colors.surface
                  : currentStyle.headerBg,
            }}
          >
            <View style={styles.chatHeaderRow}>
              <TouchableOpacity onPress={() => setChatModalVisible(false)}>
                <AppText
                  size={16}
                  weight="bold"
                  color={
                    workflowState === "pending" || isDriverChatMode
                      ? colors.text
                      : "#FFF"
                  }
                >
                  Close
                </AppText>
              </TouchableOpacity>

              <View style={{ alignItems: "center", flex: 1 }}>
                <AppText
                  size={16}
                  weight="bold"
                  color={
                    workflowState === "pending" || isDriverChatMode
                      ? colors.text
                      : "#FFF"
                  }
                >
                  {selectedOrder?.counterpart}
                </AppText>
                <AppText
                  size={12}
                  color={
                    workflowState === "pending" || isDriverChatMode
                      ? colors.textMuted
                      : "#FFFFFFC0"
                  }
                >
                  {selectedOrder?.title}
                </AppText>
              </View>

              <View
                style={[
                  styles.pillBadge,
                  {
                    backgroundColor:
                      workflowState === "pending" || isDriverChatMode
                        ? colors.border
                        : "#FFFFFF25",
                  },
                ]}
              >
                <AppText
                  size={10}
                  weight="bold"
                  color={
                    workflowState === "pending" || isDriverChatMode
                      ? colors.text
                      : "#FFF"
                  }
                >
                  {currentStyle.badgeText}
                </AppText>
              </View>
            </View>
          </SafeAreaView>

          <FlatList
            ref={chatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            renderItem={({ item }) => {
              const loggedInIsDriver = selectedOrder?.type === "offered";
              const matchesRightSide =
                (item.sender === "driver" && loggedInIsDriver) ||
                (item.sender === "user" && !loggedInIsDriver);

              return (
                <View
                  style={[
                    styles.bubbleWrapper,
                    matchesRightSide
                      ? { justifyContent: "flex-end" }
                      : { justifyContent: "flex-start" },
                  ]}
                >
                  <View
                    style={[
                      styles.msgBubble,
                      matchesRightSide
                        ? {
                            backgroundColor: colors.primary,
                            borderBottomRightRadius: 4,
                          }
                        : {
                            backgroundColor: colors.surface,
                            borderBottomLeftRadius: 4,
                            borderWidth: 1,
                            borderColor: colors.border,
                          },
                    ]}
                  >
                    <AppText
                      size={14}
                      color={matchesRightSide ? "#FFF" : colors.text}
                    >
                      {item.text}
                    </AppText>
                  </View>
                </View>
              );
            }}
          />

          {!isDriverChatMode && workflowState !== "ended" && (
            <View
              style={[
                styles.workflowBar,
                {
                  backgroundColor: colors.surface,
                  borderTopColor: colors.border,
                },
              ]}
            >
              {workflowState === "pending" && (
                <TouchableOpacity
                  style={[
                    styles.actionWorkflowBtn,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={handleStartRide}
                >
                  <AppText size={14} weight="bold" color="#FFF">
                    Start Ride / Begin Delivery
                  </AppText>
                </TouchableOpacity>
              )}
              {workflowState === "started" && (
                <View style={styles.waitingPaymentPill}>
                  <AppText size={13} weight="bold" color={colors.textMuted}>
                    Awaiting clearing house escrow verification...
                  </AppText>
                </View>
              )}
              {workflowState === "paid" && (
                <TouchableOpacity
                  style={[
                    styles.actionWorkflowBtn,
                    { backgroundColor: "#64748B" },
                  ]}
                  onPress={handleEndRide}
                >
                  <AppText size={14} weight="bold" color="#FFF">
                    Complete Run / End Ride
                  </AppText>
                </TouchableOpacity>
              )}
            </View>
          )}

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <SafeAreaView
              style={[
                styles.chatInputDock,
                {
                  backgroundColor: colors.surface,
                  borderTopColor: colors.border,
                },
              ]}
            >
              <View style={styles.innerDockLayout}>
                <TextInput
                  placeholder="Type your message..."
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.inputField,
                    { color: colors.text, backgroundColor: colors.background },
                  ]}
                  value={typedMessage}
                  onChangeText={setTypedMessage}
                />
                <TouchableOpacity
                  style={[
                    styles.sendIconBtn,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={handleSendMessage}
                >
                  <Send size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  tabContainer: { flexDirection: "row", borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center" },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 160 },
  orderCard: {
    flexDirection: "row",
    alignItems: "center",
    justifySpacework: "space-between",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  orderLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
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
