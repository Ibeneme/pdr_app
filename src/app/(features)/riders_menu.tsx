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
  MapPin,
  Clock,
  User,
  CreditCard,
  PlusCircle,
  MessageCircle,
  Send,
  Search,
  Filter,
  Navigation,
} from "lucide-react-native";
import { AppText } from "@/components/AppText";

interface AvailableRide {
  id: string;
  driverName: string;
  driverImage: string;
  pickup: string;
  dropoff: string;
  time: string;
  seatsAvailable: number;
  fare: string;
  rating: string;
}

interface Message {
  id: string;
  sender: "user" | "driver" | "system";
  text: string;
  timestamp: string;
}

export default function RideEngineScreen() {
  const { theme: colors, isDark } = useTheme();
  const router = useRouter();

  // Root screen mode switcher: "OFFER" (Create a ride) vs "JOIN" (Find available rides)
  const [screenMode, setScreenMode] = useState<"OFFER" | "JOIN">("OFFER");

  // --- OFFER RIDE FORM STATE ---
  const [pickupPoint, setPickupPoint] = useState("");
  const [dropoffPoint, setDropoffPoint] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [availableSeats, setAvailableSeats] = useState("3");
  const [estimatedFare, setEstimatedFare] = useState("");

  // --- JOIN RIDE MARKETPLACE STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<AvailableRide | null>(
    null
  );

  // --- CHAT SYSTEM STATE ---
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typedMessage, setTypedMessage] = useState("");
  const chatListRef = useRef<FlatList>(null);

  // Simulated open ride matches within Port Harcourt terminal loops
  const localMarketplacePool: AvailableRide[] = [
    {
      id: "RIDE-102",
      driverName: "Tunde Elumelu",
      driverImage:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
      pickup: "Polo Club Ground, GRA Phase 2",
      dropoff: "Choba Campus (Uniport)",
      time: "10:30 AM",
      seatsAvailable: 3,
      fare: "₦1,800",
      rating: "4.9",
    },
    {
      id: "RIDE-509",
      driverName: "Amara Nwosu",
      driverImage:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
      pickup: "Peter Odili Road",
      dropoff: "Spar Mall, Garrison",
      time: "11:15 AM",
      seatsAvailable: 2,
      fare: "₦1,200",
      rating: "4.7",
    },
    {
      id: "RIDE-774",
      driverName: "Ibrahim Musa",
      driverImage:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
      pickup: "Ada George Junction",
      dropoff: "Town Terminal, Aggrey Rd",
      time: "12:00 PM",
      seatsAvailable: 4,
      fare: "₦2,000",
      rating: "4.8",
    },
  ];

  // Filters listings based on target coordinates inputs
  const filteredRides = localMarketplacePool.filter(
    (ride) =>
      ride.pickup.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.dropoff.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Action Handler: Form Submission to create a new ride offer
  const handlePublishOffer = () => {
    if (!pickupPoint || !dropoffPoint || !estimatedFare) {
      alert(
        "Please complete all parameters to instantiate the route manifest."
      );
      return;
    }
    alert(
      `Success: Ride manifest routing from "${pickupPoint}" has been published to Pickars pool logs.`
    );
    // Reset Form fields
    setPickupPoint("");
    setDropoffPoint("");
    setDepartureTime("");
    setEstimatedFare("");
  };

  // Instantiates safe messaging channels between counterpart agents
  const handleConnectWithDriver = (ride: AvailableRide) => {
    setSelectedDriver(ride);
    setTypedMessage("");
    setMessages([
      {
        id: "m1",
        sender: "system",
        text: `🔒 Encrypted channel open with ${ride.driverName}. Coordinate pick up metrics safety protocols.`,
        timestamp: "10:45 PM",
      },
      {
        id: "m2",
        sender: "driver",
        text: `Hello! I will be taking the flyover route shortly. Are you ready near ${ride.pickup}?`,
        timestamp: "10:46 PM",
      },
    ]);
    setChatModalVisible(true);
  };

  const handleSendMessage = () => {
    if (!typedMessage.trim()) return;

    const newMsg: Message = {
      id: String(Date.now()),
      sender: "user",
      text: typedMessage,
      timestamp: "10:46 PM",
    };

    setMessages((prev) => [...prev, newMsg]);
    setTypedMessage("");

    // Simulate real-time driver response sequence
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: "driver",
          text: "Copy that! Pulling up in roughly 10 minutes. Please stay visible.",
          timestamp: "10:47 PM",
        },
      ]);
    }, 1200);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* --- APPLICATION MAIN CONTAINER HEADER --- */}
      <SafeAreaView
        style={[
          styles.headerSafeArea,
          {
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
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
          <AppText size={18} weight="bold" color={colors.text}>
            Ride Dispatch Engine
          </AppText>
          <View style={{ width: 44 }} />
        </View>

        {/* --- HIGH-LEVEL RUN SWITCHER MODE CONTROLLERS --- */}
        <View style={styles.switcherRowContainer}>
          <TouchableOpacity
            style={[
              styles.switchButton,
              screenMode === "OFFER" && {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              },
              screenMode !== "OFFER" && { borderColor: colors.border },
            ]}
            onPress={() => setScreenMode("OFFER")}
          >
            <AppText
              size={14}
              weight="bold"
              color={screenMode === "OFFER" ? "#FFF" : colors.textMuted}
            >
              Offer Ride (Driver)
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.switchButton,
              screenMode === "JOIN" && {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              },
              screenMode !== "JOIN" && { borderColor: colors.border },
            ]}
            onPress={() => setScreenMode("JOIN")}
          >
            <AppText
              size={14}
              weight="bold"
              color={screenMode === "JOIN" ? "#FFF" : colors.textMuted}
            >
              Join Ride (Passenger)
            </AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ========================================================
          LAYOUT REGION A: OFFER RIDE FORMULATION VIEW (DRIVER FLOW)
          ======================================================== */}
      {screenMode === "OFFER" && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <AppText
            size={18}
            weight="bold"
            color={colors.text}
            style={styles.sectionHeadingTitle}
          >
            Configure Route Metrics
          </AppText>
          <AppText
            size={13}
            color={colors.textMuted}
            style={{ marginBottom: 20 }}
          >
            Fill in details to open a carpool manifest pool log for real-time
            tracking across local terminals.
          </AppText>

          {/* Pickup Input Block */}
          <View style={styles.inputGroupFieldWrapper}>
            <AppText
              size={12}
              weight="bold"
              color={colors.textMuted}
              style={styles.inputLabelHint}
            >
              STARTING PICKUP LOCATION POINT
            </AppText>
            <View
              style={[
                styles.inputFieldBoxContainer,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <MapPin size={18} color="#EF4444" style={{ marginRight: 10 }} />
              <TextInput
                placeholder="e.g. Polo Club, GRA Phase 2"
                placeholderTextColor={colors.textMuted}
                style={[styles.textInputCore, { color: colors.text }]}
                value={pickupPoint}
                onChangeText={setPickupPoint}
              />
            </View>
          </View>

          {/* Dropoff Input Block */}
          <View style={styles.inputGroupFieldWrapper}>
            <AppText
              size={12}
              weight="bold"
              color={colors.textMuted}
              style={styles.inputLabelHint}
            >
              TARGET TERMINAL DROPOFF REGION
            </AppText>
            <View
              style={[
                styles.inputFieldBoxContainer,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Navigation
                size={18}
                color="#22C55E"
                style={{ marginRight: 10 }}
              />
              <TextInput
                placeholder="e.g. Choba Campus Uniport Gate"
                placeholderTextColor={colors.textMuted}
                style={[styles.textInputCore, { color: colors.text }]}
                value={dropoffPoint}
                onChangeText={setDropoffPoint}
              />
            </View>
          </View>

          {/* Timing & Seat Parameters Secondary Grid Layout */}
          <View style={styles.twoColumnInputsGridLayout}>
            <View style={[styles.inputGroupFieldWrapper, { flex: 1 }]}>
              <AppText
                size={11}
                weight="bold"
                color={colors.textMuted}
                style={styles.inputLabelHint}
              >
                DEPARTURE TIME
              </AppText>
              <View
                style={[
                  styles.inputFieldBoxContainer,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Clock
                  size={16}
                  color={colors.textMuted}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  placeholder="e.g. 10:30 AM"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.textInputCore, { color: colors.text }]}
                  value={departureTime}
                  onChangeText={setDepartureTime}
                />
              </View>
            </View>

            <View style={[styles.inputGroupFieldWrapper, { flex: 1 }]}>
              <AppText
                size={11}
                weight="bold"
                color={colors.textMuted}
                style={styles.inputLabelHint}
              >
                SEATS AVAILABLE
              </AppText>
              <View
                style={[
                  styles.inputFieldBoxContainer,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <User
                  size={16}
                  color={colors.textMuted}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  placeholder="3"
                  keyboardType="numeric"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.textInputCore, { color: colors.text }]}
                  value={availableSeats}
                  onChangeText={setAvailableSeats}
                />
              </View>
            </View>
          </View>

          {/* Value Pricing Field Block */}
          <View style={styles.inputGroupFieldWrapper}>
            <AppText
              size={12}
              weight="bold"
              color={colors.textMuted}
              style={styles.inputLabelHint}
            >
              PROPOSED COMPENSATORY FARE PER PASSENGER (₦)
            </AppText>
            <View
              style={[
                styles.inputFieldBoxContainer,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <CreditCard
                size={18}
                color={colors.primary}
                style={{ marginRight: 10 }}
              />
              <TextInput
                placeholder="e.g. 1500"
                keyboardType="numeric"
                placeholderTextColor={colors.textMuted}
                style={[styles.textInputCore, { color: colors.text }]}
                value={estimatedFare}
                onChangeText={setEstimatedFare}
              />
            </View>
          </View>

          {/* Finalize Publishing Manifest Trigger */}
          <TouchableOpacity
            style={[
              styles.primaryActionFormSubmitBtn,
              { backgroundColor: colors.primary },
            ]}
            onPress={handlePublishOffer}
          >
            <PlusCircle size={20} color="#FFF" style={{ marginRight: 8 }} />
            <AppText size={16} weight="bold" color="#FFF">
              Publish Active Manifest Offer
            </AppText>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ========================================================
          LAYOUT REGION B: JOIN RIDE MARKETPLACE FEED (PASSENGER)
          ======================================================== */}
      {screenMode === "JOIN" && (
        <View style={{ flex: 1 }}>
          {/* Dynamic Filter Search Subdock Bar */}
          <View
            style={[
              styles.searchSubdockContainer,
              {
                backgroundColor: colors.surface,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.searchInnerInputRow,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <Search size={18} color={colors.textMuted} />
              <TextInput
                placeholder="Search pickup destination points..."
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.textInputCore,
                  { color: colors.text, marginLeft: 8 },
                ]}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity
              style={[
                styles.filterActionLayoutBtn,
                { borderColor: colors.border },
              ]}
            >
              <Filter size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Active Marketplace Listings Pool */}
          <FlatList
            data={filteredRides}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
            ListEmptyComponent={
              <View style={styles.emptyListStateFrame}>
                <AppText size={14} color={colors.textMuted}>
                  No active rides matching coordinates located in this
                  partition.
                </AppText>
              </View>
            }
            renderItem={({ item }) => (
              <View
                style={[
                  styles.driverMarketplaceCardBox,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                {/* Meta Header Information Rows */}
                <View style={styles.cardProfileRowHeaderLayout}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <Image
                      source={{ uri: item.driverImage }}
                      style={styles.driverAvatarProfileThumbnail}
                    />
                    <View>
                      <AppText size={15} weight="bold" color={colors.text}>
                        {item.driverName}
                      </AppText>
                      <AppText size={12} color={colors.textMuted}>
                        ⭐ {item.rating} • Driver Rating Index
                      </AppText>
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <AppText size={18} weight="bold" color={colors.primary}>
                      {item.fare}
                    </AppText>
                    <AppText size={11} color={colors.textMuted}>
                      per workspace seat
                    </AppText>
                  </View>
                </View>

                {/* Tracking Routing Node Paths Breakdown */}
                <View
                  style={[
                    styles.routePathsDataDisplayBlock,
                    { backgroundColor: colors.background },
                  ]}
                >
                  <View style={styles.routeWaypointTrackingRowItem}>
                    <View
                      style={[
                        styles.bulletDotNodeIndicator,
                        { backgroundColor: "#EF4444" },
                      ]}
                    />
                    <AppText
                      size={13}
                      weight="medium"
                      color={colors.text}
                      numberOfLines={1}
                      style={{ flex: 1, marginLeft: 8 }}
                    >
                      {item.pickup}
                    </AppText>
                  </View>
                  <View
                    style={[
                      styles.verticalConnectorLineDashed,
                      { borderColor: colors.border },
                    ]}
                  />
                  <View style={styles.routeWaypointTrackingRowItem}>
                    <View
                      style={[
                        styles.bulletDotNodeIndicator,
                        { backgroundColor: "#22C55E" },
                      ]}
                    />
                    <AppText
                      size={13}
                      weight="medium"
                      color={colors.text}
                      numberOfLines={1}
                      style={{ flex: 1, marginLeft: 8 }}
                    >
                      {item.dropoff}
                    </AppText>
                  </View>
                </View>

                {/* Subfooter Actions Metrics Bar */}
                <View style={styles.cardListSubfooterMetricsActionRow}>
                  <View style={{ flexDirection: "row", gap: 14 }}>
                    <View style={styles.inlineIconLabelUnitMetric}>
                      <Clock size={14} color={colors.textMuted} />
                      <AppText size={12} weight="semibold" color={colors.text}>
                        {item.time}
                      </AppText>
                    </View>
                    <View style={styles.inlineIconLabelUnitMetric}>
                      <User size={14} color={colors.textMuted} />
                      <AppText size={12} weight="semibold" color={colors.text}>
                        {item.seatsAvailable} seats left
                      </AppText>
                    </View>
                  </View>

                  {/* Connect Communication Trigger Core Button */}
                  <TouchableOpacity
                    style={[
                      styles.connectDirectMessagingActionBtn,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={() => handleConnectWithDriver(item)}
                  >
                    <MessageCircle
                      size={15}
                      color="#FFF"
                      style={{ marginRight: 6 }}
                    />
                    <AppText size={13} weight="bold" color="#FFF">
                      Initiate Chat
                    </AppText>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>
      )}

      {/* ========================================================
          MODAL COMPONENT CONFIGURATION: LIVE PERSISTENT PEER CHAT
          ======================================================== */}
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
            style={[
              styles.chatViewModalHeaderArea,
              {
                backgroundColor: colors.surface,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <View style={styles.chatHeaderRowInnerLayout}>
              <TouchableOpacity
                onPress={() => setChatModalVisible(false)}
                style={styles.chatModalCloseDismissBtn}
              >
                <AppText size={15} weight="bold" color={colors.primary}>
                  Exit Pool Chat
                </AppText>
              </TouchableOpacity>

              <View style={{ alignItems: "center", flex: 1, marginRight: 40 }}>
                <AppText size={16} weight="bold" color={colors.text}>
                  {selectedDriver?.driverName}
                </AppText>
                <AppText size={12} color={colors.textMuted}>
                  Operational Run Channel ID: {selectedDriver?.id}
                </AppText>
              </View>
            </View>
          </SafeAreaView>

          {/* Interactive Core Message Blocks Stream */}
          <FlatList
            ref={chatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            onContentSizeChange={() =>
              chatListRef.current?.scrollToEnd({ animated: true })
            }
            renderItem={({ item }) => {
              if (item.sender === "system") {
                return (
                  <View style={styles.systemLogMessageBadgeContainer}>
                    <AppText
                      size={12}
                      weight="semibold"
                      style={{ color: colors.primary, textAlign: "center" }}
                    >
                      {item.text}
                    </AppText>
                  </View>
                );
              }

              const matchesRightSide = item.sender === "user";

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
                    <AppText
                      size={9}
                      style={[
                        styles.bubbleTime,
                        {
                          color: matchesRightSide
                            ? "#FFFFFF90"
                            : colors.textMuted,
                        },
                      ]}
                    >
                      {item.timestamp}
                    </AppText>
                  </View>
                </View>
              );
            }}
          />

          {/* Bottom Dock Input Elements */}
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
                  placeholder="Inquire about manifest routes arrangements..."
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
    paddingVertical: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  switcherRowContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
    marginTop: 8,
  },
  switchButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  sectionHeadingTitle: { marginBottom: 4 },

  /* Form Field Sub-components */
  inputGroupFieldWrapper: { marginBottom: 18 },
  inputLabelHint: { marginBottom: 6, letterSpacing: 0.5 },
  inputFieldBoxContainer: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  textInputCore: { flex: 1, fontSize: 14, height: "100%", padding: 0 },
  twoColumnInputsGridLayout: { flexDirection: "row", gap: 12 },
  primaryActionFormSubmitBtn: {
    height: 54,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  /* Search Control Dock Panels */
  searchSubdockContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
  },
  searchInnerInputRow: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  filterActionLayoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyListStateFrame: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 40,
  },

  /* Marketplace Component Box Layout Elements */
  driverMarketplaceCardBox: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  cardProfileRowHeaderLayout: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  driverAvatarProfileThumbnail: { width: 44, height: 44, borderRadius: 22 },
  routePathsDataDisplayBlock: {
    padding: 12,
    borderRadius: 14,
    marginVertical: 14,
  },
  routeWaypointTrackingRowItem: { flexDirection: "row", alignItems: "center" },
  bulletDotNodeIndicator: { width: 8, height: 8, borderRadius: 4 },
  verticalConnectorLineDashed: {
    height: 12,
    width: 1,
    borderLeftWidth: 1.5,
    borderStyle: "dashed",
    marginLeft: 3,
    marginVertical: 2,
  },
  cardListSubfooterMetricsActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inlineIconLabelUnitMetric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  connectDirectMessagingActionBtn: {
    flexDirection: "row",
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  /* Interaction Modal Flow Sheet Panels */
  chatViewContainer: { flex: 1 },
  chatViewModalHeaderArea: {
    ...Platform.select({
      android: {
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 4 : 12,
      },
    }),
  },
  chatHeaderRowInnerLayout: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  chatModalCloseDismissBtn: {
    paddingHorizontal: 20,
    height: 40,
    justifyContent: "center",
  },
  bubbleWrapper: { flexDirection: "row", width: "100%", marginBottom: 12 },
  msgBubble: {
    maxWidth: "80%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleTime: { alignSelf: "flex-end", marginTop: 4 },
  systemLogMessageBadgeContainer: {
    alignSelf: "center",
    marginVertical: 14,
    paddingHorizontal: 24,
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
