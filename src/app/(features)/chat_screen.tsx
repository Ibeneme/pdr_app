import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Modal,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/components/AppText";
import * as ImagePicker from "expo-image-picker";

import { getProfile } from "@/api/slices/user.slice";
import { getNegotiationById } from "@/api/slices/negotiation.slice";
import { updateRequestProgress } from "@/api/slices/new.request.slice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/api/store";
import { MessageBubble } from "@/components/MessageBubble";
import { useSocket } from "@/contexts/socket";
import { SafeAreaView } from "react-native-safe-area-context";

interface Message {
  id: string;
  negotiation?: string;
  sender: {
    id?: string;
    _id?: string;
    name: string;
    fullName?: string;
    profileImage?: string;
    email?: string;
  };
  text: string;
  attachments?: string[];
  isRead?: boolean;
  isPriceSet?: boolean;
  price?: number;
  readBy?: string[];
  timestamp: string | Date;
  createdAt?: string;
  updatedAt?: string;
  // "status" messages come from the socket-driven status/location update
  // handler (see handleUpdateStatus / handleUpdateLocation /
  // handleConfirmHandover below) and render as a centered pill instead of
  // a chat bubble. Anything without a `type`, or with type "text", renders
  // as a normal bubble as before. "price" is a counter-offer message.
  type?: "text" | "status" | "system" | "price";
  meta?: {
    status?: string;
    currentLocation?: string;
    requestId?: string;
  };
}

// Local shape we keep in state for a picked/captured handover proof image.
// We keep the mimeType + extension around explicitly instead of hardcoding
// "image/jpeg" everywhere, because a gallery pick can just as easily be a
// PNG or HEIC file — sending the wrong mime/extension pair is what was
// causing the upload to silently fail server-side (multer/S3 mime checks
// reject a mismatched file), which is why the proof image never came back
// on `handOverProof`.
interface HandoverImageAsset {
  uri: string;
  mimeType: string;
  fileName: string;
}

const INK = "#111318";

function getImageMimeInfo(asset: { uri: string; mimeType?: string | null }): {
  mimeType: string;
  ext: string;
} {
  // Prefer whatever expo-image-picker tells us directly (available on
  // SDK 48+ as `asset.mimeType`).
  if (asset.mimeType) {
    const ext = asset.mimeType.split("/")[1] || "jpg";
    return { mimeType: asset.mimeType, ext };
  }

  // Fall back to sniffing the file extension off the uri.
  const uriParts = asset.uri.split(".");
  const rawExt =
    uriParts.length > 1 ? uriParts[uriParts.length - 1].toLowerCase() : "jpg";

  const extToMime: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    heic: "image/heic",
    heif: "image/heif",
    webp: "image/webp",
  };

  const mimeType = extToMime[rawExt] || "image/jpeg";
  const ext = extToMime[rawExt] ? rawExt : "jpg";

  return { mimeType, ext };
}

// Formats a message's timestamp/createdAt into a short display time
// like "3:45 PM". Used for every message row (text, price offer, and
// status pill) so the person can always see when something happened.
function formatMessageTime(value?: string | Date): string {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// NEW — Masks sensitive personal info (full name, phone, email) until the
// negotiation has actually been paid for. Locations, dates, and times are
// NEVER masked by this helper — those stay visible to both parties
// regardless of payment status, since they're logistics, not identity.
function maskUnlessPaid(value?: string | null, isPaid?: boolean): string {
  if (!value) return "N/A";
  return isPaid ? value : "•••••";
}

// NEW — Formats a raw pickupDate (ISO string, e.g. from
// linkedRequest.pickupDate) into a short display date like
// "Jul 24, 2026". Falls back to "N/A" for anything unparseable/missing.
function formatPickupDate(value?: string | null): string {
  if (!value) return "N/A";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// NEW — Every known ride/request status gets a short, ALL CAPS,
// human-readable automated announcement. This is what actually renders
// in the chat feed's status pill AND in the small badge next to the
// chat title — regardless of what raw text string the server generated
// for that message. Falls back to a generic all-caps version of
// whatever status string comes through, so nothing new added on the
// backend ever silently fails to render.
function getStatusAnnouncement(status?: string): string | null {
  if (!status) return null;
  const STATUS_ANNOUNCEMENTS: Record<string, string> = {
    talking: "NEGOTIATION IN PROGRESS",
    assigned: "RIDE ASSIGNED",
    in_progress: "THIS RIDE IS NOW IN PROGRESS",
    completed: "RIDE MARKED AS COMPLETED",
    confirmed: "RIDE CONFIRMED",
  };
  return (
    STATUS_ANNOUNCEMENTS[status] ||
    `STATUS UPDATED: ${status.replace(/_/g, " ").toUpperCase()}`
  );
}

// NEW — Builds the exact text shown inside a chat "status" pill for a
// given message. If the message carries a status, the ALL CAPS
// announcement wins (and any location on the same message is appended).
// If it's a location-only update, show that plainly.
function getStatusPillText(msg: Message): string {
  const statusAnnouncement = getStatusAnnouncement(msg.meta?.status);
  if (statusAnnouncement) {
    return statusAnnouncement?.toUpperCase();
  }
  if (msg.meta?.currentLocation) {
    return `LOCATION UPDATED: ${msg.meta.currentLocation.toUpperCase()}`;
  }
  // Fallback — whatever raw text the server sent (shouldn't normally hit this)
  return msg.text;
}

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

function ShimmerMessageRow({
  isMine,
  width,
  baseColor,
}: {
  isMine: boolean;
  width: number;
  baseColor: string;
}) {
  return (
    <View
      style={[
        styles.shimmerRow,
        { justifyContent: isMine ? "flex-end" : "flex-start" },
      ]}
    >
      <ShimmerBlock
        width={width}
        height={38}
        borderRadius={18}
        baseColor={baseColor}
      />
    </View>
  );
}

export default function ChatScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const { id: negotiationId, currentId } = useLocalSearchParams<{
    id: string;
    currentId?: string;
  }>();

  const {
    isConnected,
    joinChat,
    sendMessage,
    agreeToPrice,
    agreedPrices,
    sendTyping,
    leaveChat,
    messages,
    users,
    typingUsers,
    updateRequestStatus, // emits "pr-update-request-progress" via socket context
  } = useSocket();

  const [messageText, setMessageText] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [showPriceInput, setShowPriceInput] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [negotiation, setNegotiation] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Status Modal States (service provider side)
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [currentLocationInput, setCurrentLocationInput] = useState("");
  const [handoverImage, setHandoverImage] = useState<HandoverImageAsset | null>(
    null
  );
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Handover Confirmation Modal States (negotiator/customer side)
  const [showHandoverConfirmModal, setShowHandoverConfirmModal] =
    useState(false);
  const [isConfirmingHandover, setIsConfirmingHandover] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [dismissedHandoverPrompt, setDismissedHandoverPrompt] = useState(false);

  // Request Details Modal State (tap header -> bottom modal with sender/receiver info)
  const [showRequestDetailsModal, setShowRequestDetailsModal] = useState(false);

  // Ride Ended / Confirmed State — once the negotiator confirms the
  // handover (status -> "confirmed"), we show a one-time bottom modal
  // telling both parties the ride is over, then gray out + lock the
  // whole chat screen so nothing further can be sent/edited.
  const [showRideEndedModal, setShowRideEndedModal] = useState(false);
  const [dismissedRideEndedModal, setDismissedRideEndedModal] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const scrollViewRef = useRef<ScrollView>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { profile } = useSelector((state: RootState) => state.user);
  const shimmerBase = isDark ? "#2A2A2E" : "#E7E7EA";
  const shimmerBaseOnInk = "rgba(255,255,255,0.14)";

  // Drives the floating "Counter Price" button's up/down bounce loop
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -8,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bounceAnim]);

  useFocusEffect(
    useCallback(() => {
      // Only fetch if we have a valid negotiationId
      if (negotiationId) {
        // Calling it without 'silent' or 'no silent' flags.
        // It defaults to false based on your parameter `(isSilent = false)`.
        fetchNegotiationData();
      }
  
      // Optional: Return a cleanup function if you need to abort the fetch or reset state when leaving the screen
      return () => {
        // Cleanup logic here (if necessary)
      };
    }, [])
  );

  

  // Reusable fetch function with silent refresh capability
  const fetchNegotiationData = useCallback(
    async (isSilent = false) => {
      if (!negotiationId) {
        setIsLoading(false);
        return;
      }

      if (isSilent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const res = await dispatch(getNegotiationById(negotiationId)).unwrap();
        const data = res?.data ? res.data : res;
        console.warn(data, "datadata");
        setNegotiation(data);
        setError(null);
      } catch (err: any) {
        if (!isSilent) {
          setError(err?.message || "Failed to load negotiation");
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [negotiationId, dispatch]
  );

  // Fetch user profile
  useEffect(() => {
    if (!profile) {
      dispatch(getProfile());
    }
  }, [dispatch, profile]);

  // Replaced useIsFocused with Expo Router's useFocusEffect
  useFocusEffect(
    useCallback(() => {
      if (negotiationId) {
        const isSilent = Boolean(negotiation);
        fetchNegotiationData(true);
      }
    }, [])
  );

  // Join Chat
  useEffect(() => {
    if (!negotiationId || !profile) return;

    const userId = profile._id || profile.id;
    joinChat(negotiationId, {
      id: userId,
      name: profile.fullName || profile.name || "You",
      email: profile.email,
      profileImage: profile.profileImage,
    });

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      leaveChat();
    };
  }, [negotiationId, profile, joinChat, leaveChat]);

  // Auto Scroll
  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
    return () => clearTimeout(timeout);
  }, [messages, typingUsers]);

  // NEW — Find the most recent "status" message that carries a `status`
  // field, and the most recent one that carries a `currentLocation`
  // field. These drive (a) the small badge next to the chat title, and
  // (b) the live location banner. Kept as separate lookups because a
  // single update can change one, both, or (rarely) neither in a given
  // message.
  const lastStatusUpdateMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i] as Message;
      if (m.type === "status" && m.meta?.status) return m;
    }
    return null;
  }, [messages]);

  const lastLocationUpdateMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i] as Message;
      if (m.type === "status" && m.meta?.currentLocation) return m;
    }
    return null;
  }, [messages]);

  // Log whenever either of these actually changes, so it's obvious in
  // Metro when a live status/location message has been picked up and
  // is about to reflect in the header badge / banner.
  useEffect(() => {
    if (lastStatusUpdateMessage) {
      console.log(
        "📥 [ChatScreen] Latest status message updated:",
        lastStatusUpdateMessage.meta
      );
    }
  }, [lastStatusUpdateMessage]);

  useEffect(() => {
    if (lastLocationUpdateMessage) {
      console.log(
        "📥 [ChatScreen] Latest location message updated:",
        lastLocationUpdateMessage.meta
      );
    }
  }, [lastLocationUpdateMessage]);

  // ALL CAPS announcement text for the header badge (top right, next to
  // the chat title). Null when nothing has come in yet.
  const headerStatusBadgeText = lastStatusUpdateMessage
    ? getStatusAnnouncement(lastStatusUpdateMessage.meta?.status)
    : null;

  // Live location text — prefers the latest socket message, falls back
  // to whatever the REST-fetched linkedRequest.currentLocation says
  // (handled further down once linkedRequest is defined).
  const liveLocationTextFromMessage =
    lastLocationUpdateMessage?.meta?.currentLocation || null;

  const handleSendMessage = async () => {
    if (!profile || (!messageText.trim() && !showPriceInput)) return;
  console.warn(negotiation, 'negotiationnegotiation')
    setIsSending(true);
    try {
      const priceNum =
        showPriceInput && proposedPrice ? parseFloat(proposedPrice) : 0;
      const isPrice = showPriceInput && !isNaN(priceNum) && priceNum > 0;

      let finalMessageText = messageText.trim();
      if (!finalMessageText && isPrice) {
        finalMessageText = `A counter offer of ₦${priceNum.toLocaleString()} was made.`;
      }

      sendMessage(
        finalMessageText,
        profile,
        negotiationId,
        [],
        priceNum,
        isPrice
      );

      setMessageText("");
      setProposedPrice("");
      setShowPriceInput(false);
    } catch (err) {
      console.error("❌ Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleAgreePrice = (msgId: string, price: number) => {
    if (!negotiationId) return;
    agreeToPrice(msgId, negotiationId, price);
  };

  const handleTyping = useCallback(
    (isTyping: boolean) => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      sendTyping(isTyping);
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => sendTyping(false), 1500);
      }
    },
    [sendTyping]
  );

  const currentUserIdStr = currentId || profile?._id || profile?.id;
  const otherUsers = users.filter(
    (u: any) => u.id !== currentUserIdStr && u._id !== currentUserIdStr
  );

  const chatTitle =
    otherUsers.length > 0
      ? otherUsers.map((u: any) => u.name || u.fullName).join(", ")
      : "Negotiation Chat";

  const getInitials = (nameStr: string) => {
    if (!nameStr) return "•";
    return nameStr.trim().charAt(0).toUpperCase();
  };



  const currentAgreedPrice =
    agreedPrices[negotiationId as string] ||
    (negotiation?.isPriceSet ? negotiation?.price : null);

  const negotiatorIdStr =
    typeof negotiation?.negotiator === "object"
      ? negotiation?.negotiator?._id || negotiation?.negotiator?.id
      : negotiation?.negotiator;

  const isNegotiator =
    Boolean(currentUserIdStr) &&
    Boolean(negotiatorIdStr) &&
    String(currentUserIdStr) === String(negotiatorIdStr);

  const isPaid =
    negotiation?.paymentStatus === "paid" ||
    negotiation?.status === "paid" ||
    Boolean(negotiation?.isPaid);

  // The request that ride/status updates are written to is negotiation.service
  // (the SERVICE PROVIDER's request document — its userId matches
  // negotiation.serviceProvider._id, e.g. type "deliver-package" above) —
  // populated as a full Request document by getNegotiationById on the
  // backend. This is the single source of truth for status
  // ("talking" | "assigned" | "in_progress" | "completed" | "confirmed" | ...),
  // NOT the Negotiation document itself, which has no `status` field at all.
  const linkedRequest =
    typeof negotiation?.service === "object" ? negotiation?.service : null;

  const targetRequestId = linkedRequest?._id || negotiation?.service;

  const requestStatus = linkedRequest?.status || "assigned";

  // Ride is fully over once the customer has confirmed the handover.
  // Everything in the chat gets locked/grayed out at that point.
  const isRideEnded = requestStatus === "confirmed";

  // NEW — final live location text: prefer whatever came in live over
  // the socket (updates immediately, no refetch needed), fall back to
  // the REST-fetched value from the last silent refresh.
  const liveLocationText =
    liveLocationTextFromMessage || linkedRequest?.currentLocation || null;

  // --- Sender (negotiator/customer) & Receiver (provider) details for the
  // Request Details modal. Prefers populated objects from the negotiation
  // payload; falls back to the socket "users" list, then to "profile" for
  // whichever side the current viewer is on.
  const negotiatorUser =
    typeof negotiation?.negotiator === "object"
      ? negotiation?.negotiator
      : null;

  // FIXED — the backend field is `serviceProvider`, not `provider`.
  // Reading `negotiation?.provider` here meant providerUser was always
  // `null`, which silently fell through to the generic `otherUsers[0]`
  // fallback below and never showed the real provider's info.
  const providerUser =
    typeof negotiation?.serviceProvider === "object"
      ? negotiation?.serviceProvider
      : typeof linkedRequest?.serviceProvider === "object"
      ? linkedRequest?.serviceProvider
      : null;

  // NEW — package sender/receiver phone numbers live on the negotiator's
  // own request (negotiation.negotiatorService.meta), not on the user
  // account objects themselves.
  const negotiatorServiceMeta = negotiation?.negotiatorService?.meta || {};

  const senderDetails = isNegotiator
    ? {
        name: profile?.fullName || profile?.name || "You",
        email: profile?.email,
        phone: negotiatorServiceMeta?.senderPhone,
        profileImage: profile?.profileImage,
      }
    : negotiatorUser
    ? {
        name: negotiatorUser.fullName || negotiatorUser.name || "Customer",
        email: negotiatorUser.email,
        phone: negotiatorServiceMeta?.senderPhone,
        profileImage: negotiatorUser.profileImage,
      }
    : {
        name: otherUsers[0]?.name || otherUsers[0]?.fullName || "Customer",
        email: otherUsers[0]?.email,
        phone: negotiatorServiceMeta?.senderPhone,
        profileImage: otherUsers[0]?.profileImage,
      };

  const receiverDetails = !isNegotiator
    ? {
        name: profile?.fullName || profile?.name || "You",
        email: profile?.email,
        phone: negotiatorServiceMeta?.receiverPhone,
        profileImage: profile?.profileImage,
      }
    : providerUser
    ? {
        name: providerUser.fullName || providerUser.name || chatTitle,
        email: providerUser.email,
        phone: negotiatorServiceMeta?.receiverPhone,
        profileImage: providerUser.profileImage,
      }
    : {
        name: otherUsers[0]?.name || otherUsers[0]?.fullName || chatTitle,
        email: otherUsers[0]?.email,
        phone: negotiatorServiceMeta?.receiverPhone,
        profileImage: otherUsers[0]?.profileImage,
      };

  const requestServiceType =
    negotiation?.serviceType || negotiation?.negotiatorServiceType || "N/A";

  // FIXED — pickup/delivery locations and pickup date/time live on the
  // linked Request document (negotiation.service / .meta), not directly
  // on the negotiation object. `negotiation.pickupAddress` and
  // `negotiation.destinationCity` never existed on the real payload, so
  // these always silently fell through to "N/A" before.
  const requestPickupAddress =
    negotiation?.service?.pickupLocation?.address ||
    negotiation?.meta?.pickupLocation?.address ||
    negotiation?.pickupAddress ||
    "N/A";

  const requestDestination =
    negotiation?.service?.deliveryLocation?.address ||
    negotiation?.meta?.deliveryLocation?.address ||
    negotiation?.destinationCity ||
    negotiation?.destinationLocation?.address ||
    "N/A";

  // NEW — pickup date + time. ALWAYS shown in full in the Request Details
  // modal regardless of payment status — these are logistics both parties
  // need to coordinate the handover, not personally-identifying contact
  // info, so they're never masked.
  const requestPickupDate =
    linkedRequest?.pickupDate || linkedRequest?.meta?.pickupDate || null;

  const requestPickupTime =
    linkedRequest?.pickupTime || linkedRequest?.meta?.pickupTime || null;

  // Auto-prompt the negotiator (customer) to confirm the handover once the
  // provider marks the request "completed" and has attached a handover
  // proof. Resets the dismissed flag whenever the underlying status/proof
  // changes so a fresh completion always re-prompts.
  useEffect(() => {
    if (
      isNegotiator &&
      requestStatus === "completed" &&
      linkedRequest?.handOverProof &&
      !dismissedHandoverPrompt
    ) {
      setShowHandoverConfirmModal(true);
    }
  }, [
    isNegotiator,
    requestStatus,
    linkedRequest?.handOverProof,
    dismissedHandoverPrompt,
  ]);

  // Once the request flips to "confirmed", surface the ride-ended modal
  // once (for either party — customer or provider).
  useEffect(() => {
    if (isRideEnded && !dismissedRideEndedModal) {
      setShowRideEndedModal(true);
    }
  }, [isRideEnded, dismissedRideEndedModal]);

  const handlePay = () => {
    if (!currentAgreedPrice || !negotiationId) return;

    const userEmail = profile?.email || "";
    const resolvedServiceType =
      negotiation?.serviceType || negotiation?.negotiatorServiceType || "";

    router.push({
      pathname: "/(details)/PaymentScreen",
      params: {
        negotiationId: String(negotiationId),
        amount: String(currentAgreedPrice),
        email: userEmail,
        serviceType: resolvedServiceType,
      },
    });
  };

  const handleViewReceipt = () => {
    if (!negotiationId) return;

    const userEmail = profile?.email || "";
    const resolvedServiceType =
      negotiation?.serviceType || negotiation?.negotiatorServiceType || "";

    router.push({
      pathname: "/(details)/ReceiptScreen",
      params: {
        id: negotiation?.paymentId || String(negotiationId),
        negotiationId: String(negotiationId),
        amount: String(currentAgreedPrice || negotiation?.price || 0),
        status: negotiation?.paymentStatus || "paid",
        pickupAddress: requestPickupAddress,
        destinationCity: requestDestination,
        serviceType: resolvedServiceType,
        payerName: profile?.fullName || profile?.name || "Customer",
        payerEmail: userEmail,
        providerName: chatTitle,
      },
    });
  };

  // Status Action Handlers — write to negotiation.service (the linked Request)
  const handleUpdateStatus = async (newStatus: string) => {
    if (!targetRequestId) {
      setStatusError("No linked request found for this negotiation.");
      return;
    }

    setIsUpdatingProgress(true);
    setStatusError(null);
    try {
      const formData = new FormData();
      formData.append("status", newStatus);

      // Attach handover proof only if a real captured/selected asset exists.
      // IMPORTANT: use the actual mimeType/extension we detected when the
      // image was picked — hardcoding "image/jpeg" here was the bug that
      // caused PNG/HEIC gallery picks to fail upload server-side.
      if (handoverImage && handoverImage.uri !== "mock_proof_uri") {
        formData.append("handOverProof", {
          uri: handoverImage.uri,
          name: handoverImage.fileName,
          type: handoverImage.mimeType,
        } as any);
      }

      await dispatch(
        updateRequestProgress({ id: String(targetRequestId), data: formData })
      ).unwrap();

      // Broadcast the status change over the socket so it appears inline
      // in the chat (as a "status" message — rendered ALL CAPS via
      // getStatusPillText / getStatusAnnouncement above) for both parties
      // in real time, not just on the next silent refresh. This is the
      // ONE call that turns "start ride" / "complete ride" into a real,
      // automated chat message plus the header badge update.
      console.log(
        `📤 [ChatScreen] Sending automated status message for status "${newStatus}"`
      );
      updateRequestStatus?.(
        String(targetRequestId),
        String(negotiationId),
        newStatus,
        undefined,
        String(currentUserIdStr)
      );

      // Silently refresh so negotiation.service.status/handOverProof reflect
      // the change immediately.
      await fetchNegotiationData(true);
      setShowStatusModal(false);
      setHandoverImage(null);
    } catch (err: any) {
      setStatusError(err?.message || "Failed to update status");
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  const handleUpdateLocation = async () => {
    if (!currentLocationInput.trim() || !targetRequestId) return;

    setIsUpdatingProgress(true);
    setStatusError(null);
    try {
      const formData = new FormData();
      formData.append("currentLocation", currentLocationInput.trim());

      await dispatch(
        updateRequestProgress({ id: String(targetRequestId), data: formData })
      ).unwrap();

      // Broadcast the location change over the socket so it shows up as a
      // status/location message in the chat AND updates the live location
      // banner at the top immediately.
      console.log(
        `📤 [ChatScreen] Sending automated location message: "${currentLocationInput.trim()}"`
      );
      updateRequestStatus?.(
        String(targetRequestId),
        String(negotiationId),
        undefined,
        currentLocationInput.trim(),
        String(currentUserIdStr)
      );

      await fetchNegotiationData(true);
      setCurrentLocationInput("");
    } catch (err: any) {
      setStatusError(err?.message || "Failed to update location");
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  // Take a fresh photo with the camera for handover proof
  const handleTakeHandoverProof = async () => {
    setStatusError(null);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      setStatusError("Camera permission is required to take a photo.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    const asset = result.assets?.[0];
    if (!result.canceled && asset?.uri) {
      const { mimeType, ext } = getImageMimeInfo(asset);
      setHandoverImage({
        uri: asset.uri,
        mimeType,
        fileName: `handover_proof_${Date.now()}.${ext}`,
      });
    }
  };

  // Pick an existing photo from the gallery for handover proof
  const handlePickHandoverProofFromGallery = async () => {
    setStatusError(null);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setStatusError(
        "Photo library permission is required to select an image."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    const asset = result.assets?.[0];
    if (!result.canceled && asset?.uri) {
      const { mimeType, ext } = getImageMimeInfo(asset);
      setHandoverImage({
        uri: asset.uri,
        mimeType,
        fileName: `handover_proof_${Date.now()}.${ext}`,
      });
    }
  };

  // Negotiator confirms they received the handover -> request moves to
  // "confirmed". Kept separate from handleUpdateStatus/isUpdatingProgress so
  // the provider's status modal and the customer's confirm modal never
  // fight over the same loading/error state.
  const handleConfirmHandover = async () => {
    if (!targetRequestId) {
      setConfirmError("No linked request found for this negotiation.");
      return;
    }

    setIsConfirmingHandover(true);
    setConfirmError(null);
    try {
      const formData = new FormData();
      formData.append("status", "confirmed");

      await dispatch(
        updateRequestProgress({ id: String(targetRequestId), data: formData })
      ).unwrap();

      // Broadcast the "confirmed" status so it shows up as an ALL CAPS
      // automated status message and both parties see the ride close out
      // live in the chat, plus the header badge updates immediately.
      console.log(
        `📤 [ChatScreen] Sending automated status message for status "confirmed"`
      );
      updateRequestStatus?.(
        String(targetRequestId),
        String(negotiationId),
        "confirmed",
        undefined,
        String(currentUserIdStr)
      );

      await fetchNegotiationData(true);
      setShowHandoverConfirmModal(false);
      setDismissedHandoverPrompt(true);
    } catch (err: any) {
      setConfirmError(err?.message || "Failed to confirm handover");
    } finally {
      setIsConfirmingHandover(false);
    }
  };

  const closeHandoverConfirmModal = () => {
    // Just hides it for this session — it will not be considered "confirmed"
    // on the backend, so it can safely be shown again after a refresh.
    setShowHandoverConfirmModal(false);
    setDismissedHandoverPrompt(true);
  };

  const closeRideEndedModal = () => {
    setShowRideEndedModal(false);
    setDismissedRideEndedModal(true);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: INK }]}>
        <SafeAreaView style={styles.topSafeAreaStyle} />
        <View style={styles.header}>
          <View style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </View>
          <ShimmerBlock
            width={38}
            height={38}
            borderRadius={19}
            baseColor={shimmerBaseOnInk}
            style={{ marginRight: 12 }}
          />
          <View style={styles.headerInfo}>
            <ShimmerBlock
              width={140}
              height={15}
              borderRadius={7}
              baseColor={shimmerBaseOnInk}
              style={{ marginBottom: 6 }}
            />
            <ShimmerBlock
              width={70}
              height={11}
              borderRadius={6}
              baseColor={shimmerBaseOnInk}
            />
          </View>
        </View>

        <View
          style={[
            styles.chatCanvasContainer,
            { backgroundColor: isDark ? theme.background : "#F4F6F8" },
          ]}
        >
          <View style={styles.messagesContent}>
            <ShimmerMessageRow
              isMine={false}
              width={190}
              baseColor={shimmerBase}
            />
            <ShimmerMessageRow
              isMine={true}
              width={160}
              baseColor={shimmerBase}
            />
          </View>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.background },
          styles.centered,
        ]}
      >
        <AppText style={{ color: theme.textMuted }} weight="medium">
          {error}
        </AppText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: INK }]}>
      <SafeAreaView style={styles.topSafeAreaStyle} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Tapping the avatar/title opens the Request Details bottom modal.
            Now a row: avatar + title/subtitle on the left, and — NEW — a
            live status badge flexed to the right of the title block,
            showing the latest ALL CAPS automated status announcement
            (e.g. "THIS RIDE IS NOW IN PROGRESS") the instant it comes in
            over the socket. */}
        <TouchableOpacity
          style={styles.headerTapArea}
          onPress={() => setShowRequestDetailsModal(true)}
          activeOpacity={0.7}
        >
          <View style={styles.avatarContainer}>
            <AppText size={13} weight="bold" color={INK}>
              {getInitials(chatTitle)}
            </AppText>
          </View>

          <View style={styles.headerInfo}>
            <AppText weight="bold" size={16} color="#FFFFFF" numberOfLines={1}>
              {chatTitle}
            </AppText>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusIndicatorDot,
                  {
                    backgroundColor: isRideEnded
                      ? "#9CA3AF"
                      : isConnected
                      ? "#10B981"
                      : "#A0AEC0",
                  },
                ]}
              />
              <AppText
                size={11}
                color="rgba(255, 255, 255, 0.6)"
                weight="medium"
              >
                {isRideEnded
                  ? "Ride Completed"
                  : isConnected
                  ? "Online"
                  : "Offline"}
              </AppText>
            </View>
          </View>

          {/* NEW — top-right badge, flexed next to the chat title, showing
              the latest automated status announcement the moment it
              arrives. Hidden entirely until the first status message
              comes in. */}
          {headerStatusBadgeText ? (
            <View style={styles.headerStatusBadge}>
              <AppText
                size={9}
                weight="bold"
                color="#FFFFFF"
                numberOfLines={2}
                style={styles.headerStatusBadgeText}
              >
                {headerStatusBadgeText}
              </AppText>
            </View>
          ) : null}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerUtilityOption}
          onPress={() => fetchNegotiationData(true)}
          activeOpacity={0.7}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* Chat Canvas */}
      <View
        style={[
          styles.chatCanvasContainer,
          { backgroundColor: isDark ? theme.background : "#F4F6F8" },
        ]}
      >
        {/* Sticky Banner - Pay Now or View Receipt */}
        {currentAgreedPrice && currentAgreedPrice > 0 ? (
          isPaid ? (
            <View
              style={[
                styles.agreedPaymentBanner,
                { backgroundColor: isDark ? theme.surface : "#FFFFFF" },
              ]}
            >
              <View style={styles.bannerInfoGroup}>
                <View
                  style={[
                    styles.agreedCheckBadge,
                    { backgroundColor: "#10B981" },
                  ]}
                >
                  <Ionicons name="checkmark-sharp" size={14} color="#FFFFFF" />
                </View>
                <View>
                  <AppText size={11} color="#10B981" weight="bold">
                    PAYMENT COMPLETED
                  </AppText>
                  <AppText size={16} weight="bold" color={theme.text}>
                    ₦{Number(currentAgreedPrice).toLocaleString()}
                  </AppText>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.payNowButton, { backgroundColor: INK }]}
                onPress={handleViewReceipt}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="receipt-outline"
                  size={16}
                  color="#FFFFFF"
                  style={{ marginRight: 6 }}
                />
                <AppText size={13} weight="bold" color="#FFFFFF">
                  View Receipt
                </AppText>
              </TouchableOpacity>
            </View>
          ) : isNegotiator ? (
            <View
              style={[
                styles.agreedPaymentBanner,
                { backgroundColor: isDark ? theme.surface : "#FFFFFF" },
              ]}
            >
              <View style={styles.bannerInfoGroup}>
                <View style={styles.agreedCheckBadge}>
                  <Ionicons name="checkmark-sharp" size={14} color="#FFFFFF" />
                </View>
                <View>
                  <AppText size={11} color={theme.textMuted} weight="bold">
                    AGREED PRICE
                  </AppText>
                  <AppText size={16} weight="bold" color={theme.text}>
                    ₦{Number(currentAgreedPrice).toLocaleString()}
                  </AppText>
                </View>
              </View>

              <TouchableOpacity
                style={styles.payNowButton}
                onPress={handlePay}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="card-outline"
                  size={16}
                  color="#FFFFFF"
                  style={{ marginRight: 6 }}
                />
                <AppText size={13} weight="bold" color="#FFFFFF">
                  Pay Now
                </AppText>
              </TouchableOpacity>
            </View>
          ) : null
        ) : null}

        {/* NEW — Live current-location banner. Now driven primarily by
            liveLocationText, which prefers the latest socket message over
            the REST-fetched value — so it updates the instant a location
            update comes in, without waiting on a refetch. Shown any time
            we have a location and the ride hasn't ended (previously this
            was gated to requestStatus === "in_progress" only, which meant
            a location that arrived just before "completed" would vanish
            from the banner). */}
        {liveLocationText && !isRideEnded ? (
          <View
            style={[
              styles.locationBanner,
              { backgroundColor: isDark ? theme.surface : "#FFFFFF" },
            ]}
          >
            <View style={styles.locationPulseDot} />
            <Ionicons
              name="location-outline"
              size={16}
              color="#3B82F6"
              style={{ marginLeft: 8, marginRight: 6 }}
            />
            <AppText
              size={13}
              weight="medium"
              color={theme.text}
              style={{ flex: 1 }}
              numberOfLines={1}
            >
              Provider location: {liveLocationText.toUpperCase()}
            </AppText>
          </View>
        ) : null}

        {/* Ride completed, awaiting the customer's confirmation */}
        {requestStatus === "completed" && isNegotiator ? (
          <TouchableOpacity
            style={[
              styles.locationBanner,
              { backgroundColor: isDark ? theme.surface : "#FFFFFF" },
            ]}
            onPress={() => setShowHandoverConfirmModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="hourglass-outline"
              size={16}
              color="#F59E0B"
              style={{ marginLeft: 8, marginRight: 6 }}
            />
            <AppText
              size={13}
              weight="medium"
              color={theme.text}
              style={{ flex: 1 }}
            >
              Marked as completed — tap to confirm handover
            </AppText>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={theme.textMuted}
            />
          </TouchableOpacity>
        ) : null}

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        >
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.messagesContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.timeDividerContainer}>
              <View
                style={[
                  styles.timePillBadge,
                  { backgroundColor: isDark ? theme.surface : "#E9EDF0" },
                ]}
              >
                <AppText
                  size={11}
                  color={theme.textMuted}
                  weight="bold"
                  style={styles.timeBadgeText}
                >
                  TODAY
                </AppText>
              </View>
            </View>

            {messages.map((msg: Message, index: number) => {
              // "status" messages (both ride-status changes AND
              // location-only updates) render as a centered pill instead
              // of a chat bubble. Text is now always computed via
              // getStatusPillText — meaning a status change like
              // "in_progress" always shows as "THIS RIDE IS NOW IN
              // PROGRESS" (ALL CAPS, automated), regardless of whatever
              // raw string the server originally generated.
              if (msg.type === "status") {
                const pillText = getStatusPillText(msg);
                return (
                  <View
                    key={msg.id || index}
                    style={styles.statusPillContainer}
                  >
                    <View
                      style={[
                        styles.statusPillBadge,
                        { backgroundColor: isDark ? theme.surface : "#E9EDF0" },
                      ]}
                    >
                      <Ionicons
                        name="information-circle-outline"
                        size={13}
                        color={theme.textMuted}
                        style={{ marginRight: 5 }}
                      />
                      <AppText
                        size={11}
                        color={theme.textMuted}
                        weight="bold"
                        style={{ letterSpacing: 0.3 }}
                      >
                        {pillText}
                      </AppText>
                      <AppText
                        size={10}
                        color={theme.textMuted}
                        style={{ marginLeft: 6, opacity: 0.7 }}
                      >
                        {formatMessageTime(msg.timestamp || msg.createdAt)}
                      </AppText>
                    </View>
                  </View>
                );
              }

              const isMyMessage =
                (msg.sender?.id || msg.sender?._id) === currentUserIdStr;

              const isThisMessageAgreed =
                currentAgreedPrice !== null &&
                Number(currentAgreedPrice) === Number(msg.price);

              const msgTime = formatMessageTime(msg.timestamp || msg.createdAt);

              return (
                <View key={msg.id || index} style={{ marginVertical: 4 }}>
                  {msg.isPriceSet && (msg.price ?? 0) > 0 && (
                    <View
                      style={[
                        styles.priceBadgeBanner,
                        {
                          backgroundColor: isDark ? theme.surface : "#FFF",
                          borderColor: theme.border,
                          alignSelf: isMyMessage ? "flex-end" : "flex-start",
                        },
                      ]}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          flex: 1,
                        }}
                      >
                        <Ionicons
                          name={
                            isThisMessageAgreed
                              ? "checkmark-circle"
                              : "pricetag"
                          }
                          size={16}
                          color={isThisMessageAgreed ? "#10B981" : theme.text}
                        />
                        <AppText
                          size={13}
                          weight="bold"
                          color={isThisMessageAgreed ? "#10B981" : theme.text}
                          style={{ marginLeft: 6, flexShrink: 1 }}
                        >
                          {isThisMessageAgreed ? "Agreed: " : "Counter Offer: "}
                          ₦{(msg.price ?? 0).toLocaleString()}
                        </AppText>
                        {!!msgTime && (
                          <AppText
                            size={10}
                            color={theme.textMuted}
                            style={{ marginLeft: 8 }}
                          >
                            {msgTime}
                          </AppText>
                        )}
                      </View>

                      {!isMyMessage &&
                        !isThisMessageAgreed &&
                        !isPaid &&
                        !isRideEnded && (
                          <TouchableOpacity
                            style={styles.agreeButton}
                            onPress={() =>
                              handleAgreePrice(msg.id, msg.price || 0)
                            }
                          >
                            <AppText size={12} weight="bold" color="#FFF">
                              Agree
                            </AppText>
                          </TouchableOpacity>
                        )}
                    </View>
                  )}
                  <MessageBubble
                    text={msg.text}
                    time={msgTime}
                    senderName={
                      !isMyMessage
                        ? msg.sender?.name || msg.sender?.fullName
                        : undefined
                    }
                    isMyMessage={isMyMessage}
                    theme={theme}
                  />
                </View>
              );
            })}

            {typingUsers.length > 0 && !isRideEnded && (
              <View style={styles.typingIndicatorRow}>
                <AppText
                  size={11}
                  color={theme.textMuted}
                  style={{ fontStyle: "italic" }}
                >
                  Partner is typing...
                </AppText>
              </View>
            )}
          </ScrollView>

          {/* Price Counter Proposal Input */}
          {showPriceInput && !isPaid && !isRideEnded && (
            <View
              style={[
                styles.priceInputRow,
                {
                  backgroundColor: theme.surface,
                  borderTopColor: theme.border,
                },
              ]}
            >
              <Ionicons
                name="cash-outline"
                size={18}
                color={theme.text}
                style={{ marginRight: 6 }}
              />
              <TextInput
                style={[
                  styles.priceField,
                  { color: theme.text, borderColor: theme.border },
                ]}
                placeholder="Enter counter price (₦)"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                value={proposedPrice}
                onChangeText={setProposedPrice}
              />
              <TouchableOpacity
                onPress={() => setShowPriceInput(false)}
                style={styles.closePriceBtn}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={theme.textMuted}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Floating, bouncing "Counter Price" button. Hidden once the
              price input row is open (that row has its own close button),
              once paid, or once the ride has ended. */}
          {!isPaid && !isRideEnded && !showPriceInput && (
            <Animated.View
              pointerEvents="box-none"
              style={[
                styles.floatingCounterButtonWrapper,
                { transform: [{ translateY: bounceAnim }] },
              ]}
            >
              <TouchableOpacity
                style={[styles.floatingCounterButton, { backgroundColor: INK }]}
                activeOpacity={0.85}
                onPress={() => setShowPriceInput(true)}
              >
                <Ionicons
                  name="pricetag-outline"
                  size={16}
                  color="#FFFFFF"
                  style={{ marginRight: 6 }}
                />
                <AppText size={13} weight="bold" color="#FFFFFF">
                  Counter Price
                </AppText>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Chat Input */}
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: theme.surface,
                borderTopColor: isDark ? theme.border : "#EAEAEA",
                marginBottom: Platform.OS === "ios" ? 24 : 12,
                opacity: isRideEnded ? 0.5 : 1,
              },
            ]}
            pointerEvents={isRideEnded ? "none" : "auto"}
          >
            <View
              style={[
                styles.inputFieldInnerWrapper,
                { backgroundColor: isDark ? theme.background : "#F0F2F5" },
              ]}
            >
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={messageText}
                editable={!isRideEnded}
                onChangeText={(text) => {
                  setMessageText(text);
                  handleTyping(text.length > 0);
                }}
                placeholder={
                  isRideEnded
                    ? "This ride has ended"
                    : showPriceInput
                    ? "Add a note with your price..."
                    : "Type message..."
                }
                placeholderTextColor={theme.textMuted}
                multiline
                maxLength={500}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: INK,
                  opacity:
                    !isRideEnded &&
                    (messageText.trim() || (showPriceInput && proposedPrice))
                      ? 1
                      : 0.4,
                },
              ]}
              onPress={handleSendMessage}
              disabled={
                isSending ||
                isRideEnded ||
                (!messageText.trim() && !proposedPrice)
              }
              activeOpacity={0.8}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="arrow-up-sharp" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* FAB for Service Provider — hidden once the ride is confirmed/ended */}
        {!isNegotiator && !isRideEnded && (
          <TouchableOpacity
            style={styles.fab}
            onPress={() => setShowStatusModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="car-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* Gray-out overlay once the ride has been confirmed/ended. Sits
            above the chat content but Modals (rendered in their own native
            portal) still show on top of this. */}
        {isRideEnded && (
          <View style={styles.rideEndedOverlay} pointerEvents="auto">
            <TouchableOpacity
              style={styles.rideEndedOverlayBanner}
              activeOpacity={0.8}
              onPress={() => setShowRideEndedModal(true)}
            >
              <Ionicons
                name="checkmark-done-circle"
                size={16}
                color="#FFFFFF"
              />
              <AppText
                size={12}
                weight="bold"
                color="#FFFFFF"
                style={{ marginLeft: 6 }}
              >
                Ride Completed
              </AppText>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Ride/Service Status Update Modal (provider side) */}
      <Modal visible={showStatusModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
          >
            <View style={styles.modalHeader}>
              <AppText weight="bold" size={18} color={theme.text}>
                Update Ride Status
              </AppText>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {statusError && (
              <AppText
                size={12}
                color="#EF4444"
                weight="medium"
                style={{ marginBottom: 12 }}
              >
                {statusError}
              </AppText>
            )}
            {requestStatus === "assigned" && (
              <View style={styles.modalSection}>
                <AppText color={theme.textMuted} style={{ marginBottom: 16 }}>
                  The order is currently assigned. Tap below to begin the ride.
                </AppText>
                <TouchableOpacity
                  style={[
                    styles.primaryActionBtn,
                    {
                      backgroundColor: "#10B981",
                      opacity: isUpdatingProgress ? 0.6 : 1,
                    },
                  ]}
                  onPress={() => handleUpdateStatus("in_progress")}
                  disabled={isUpdatingProgress}
                >
                  {isUpdatingProgress ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <AppText weight="bold" color="#FFF">
                      Start Ride (In Progress)
                    </AppText>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {requestStatus === "in_progress" && (
              <View style={styles.modalSection}>
                <View style={styles.modalInputGroup}>
                  <AppText
                    weight="bold"
                    size={13}
                    color={theme.text}
                    style={{ marginBottom: 6 }}
                  >
                    Current Location
                  </AppText>
                  {liveLocationText ? (
                    <AppText
                      size={12}
                      color={theme.textMuted}
                      style={{ marginBottom: 8 }}
                    >
                      Last updated: {liveLocationText}
                    </AppText>
                  ) : null}
                  <View style={styles.locationInputWrapper}>
                    <TextInput
                      style={[
                        styles.locationInput,
                        { color: theme.text, borderColor: theme.border },
                      ]}
                      placeholder="e.g. 200m away from pickup"
                      placeholderTextColor={theme.textMuted}
                      value={currentLocationInput}
                      onChangeText={setCurrentLocationInput}
                    />
                    <TouchableOpacity
                      style={[
                        styles.smallUpdateBtn,
                        {
                          backgroundColor: INK,
                          opacity: isUpdatingProgress ? 0.6 : 1,
                        },
                      ]}
                      onPress={handleUpdateLocation}
                      disabled={isUpdatingProgress}
                    >
                      {isUpdatingProgress ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <AppText size={12} weight="bold" color="#FFF">
                          Update
                        </AppText>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.modalInputGroup}>
                  <AppText
                    weight="bold"
                    size={13}
                    color={theme.text}
                    style={{ marginBottom: 8 }}
                  >
                    Handover Proof
                  </AppText>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <TouchableOpacity
                      style={[
                        styles.cameraBtn,
                        { borderColor: theme.border, flex: 1 },
                      ]}
                      onPress={handleTakeHandoverProof}
                    >
                      <Ionicons
                        name="camera-outline"
                        size={20}
                        color={theme.text}
                        style={{ marginRight: 8 }}
                      />
                      <AppText color={theme.text} weight="medium">
                        Camera
                      </AppText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.cameraBtn,
                        { borderColor: theme.border, flex: 1 },
                      ]}
                      onPress={handlePickHandoverProofFromGallery}
                    >
                      <Ionicons
                        name="image-outline"
                        size={20}
                        color={theme.text}
                        style={{ marginRight: 8 }}
                      />
                      <AppText color={theme.text} weight="medium">
                        Gallery
                      </AppText>
                    </TouchableOpacity>
                  </View>

                  {handoverImage && (
                    <View style={{ marginTop: 10 }}>
                      <Image
                        source={{ uri: handoverImage.uri }}
                        style={[styles.handoverProofImage, { height: 120 }]}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        onPress={() => setHandoverImage(null)}
                        style={styles.removeHandoverImageBtn}
                      >
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color="#EF4444"
                        />
                        <AppText
                          size={12}
                          weight="medium"
                          color="#EF4444"
                          style={{ marginLeft: 4 }}
                        >
                          Remove photo
                        </AppText>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.primaryActionBtn,
                    {
                      backgroundColor: INK,
                      opacity: isUpdatingProgress ? 0.6 : 1,
                    },
                  ]}
                  onPress={() => handleUpdateStatus("completed")}
                  disabled={isUpdatingProgress}
                >
                  {isUpdatingProgress ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <AppText weight="bold" color="#FFF">
                      Complete Ride
                    </AppText>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {requestStatus === "completed" && (
              <View style={styles.modalSection}>
                <AppText color={theme.textMuted}>
                  Marked as completed. Waiting for the customer to confirm the
                  handover.
                </AppText>
              </View>
            )}

            {requestStatus === "confirmed" && (
              <View style={styles.modalSection}>
                <AppText color={theme.textMuted}>
                  The customer has confirmed this ride. All done!
                </AppText>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Handover Confirmation Modal (customer/negotiator side) */}
      <Modal
        visible={showHandoverConfirmModal}
        transparent
        animationType="fade"
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
          >
            <View style={styles.modalHeader}>
              <AppText weight="bold" size={18} color={theme.text}>
                Confirm Handover
              </AppText>
              <TouchableOpacity onPress={closeHandoverConfirmModal}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {confirmError && (
              <AppText
                size={12}
                color="#EF4444"
                weight="medium"
                style={{ marginBottom: 12 }}
              >
                {confirmError}
              </AppText>
            )}

            <View style={styles.modalSection}>
              <AppText color={theme.textMuted} style={{ marginBottom: 16 }}>
                The provider has marked this request as completed. Please review
                the handover proof below and confirm to close it out.
              </AppText>

              {linkedRequest?.handOverProof ? (
                <Image
                  source={{ uri: linkedRequest.handOverProof }}
                  style={styles.handoverProofImage}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    styles.cameraBtn,
                    { borderColor: theme.border, marginBottom: 4 },
                  ]}
                >
                  <Ionicons
                    name="image-outline"
                    size={20}
                    color={theme.textMuted}
                    style={{ marginRight: 8 }}
                  />
                  <AppText color={theme.textMuted}>
                    No proof image attached
                  </AppText>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.primaryActionBtn,
                  {
                    backgroundColor: "#10B981",
                    opacity: isConfirmingHandover ? 0.6 : 1,
                    marginTop: 16,
                  },
                ]}
                onPress={handleConfirmHandover}
                disabled={isConfirmingHandover}
              >
                {isConfirmingHandover ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <AppText weight="bold" color="#FFF">
                    Confirm Completion
                  </AppText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Ride Ended Modal — shown once to both parties once the customer
          confirms the handover and the request status becomes "confirmed". */}
      <Modal visible={showRideEndedModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.surface, alignItems: "center" },
            ]}
          >
            <View style={styles.rideEndedIconCircle}>
              <Ionicons name="checkmark-done" size={30} color="#FFFFFF" />
            </View>
            <AppText
              weight="bold"
              size={18}
              color={theme.text}
              style={{ marginTop: 16, textAlign: "center" }}
            >
              Ride Ended
            </AppText>
            <AppText
              color={theme.textMuted}
              style={{ marginTop: 8, textAlign: "center" }}
            >
              This ride has been completed and confirmed. The chat is now closed
              and locked.
            </AppText>
            <TouchableOpacity
              style={[
                styles.primaryActionBtn,
                { backgroundColor: INK, width: "100%", marginTop: 20 },
              ]}
              onPress={closeRideEndedModal}
              activeOpacity={0.8}
            >
              <AppText weight="bold" color="#FFF">
                Got it
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Request Details Modal — tap header avatar/title to open. Shows
          request info plus sender (negotiator/customer) and receiver
          (provider) details. Sender/receiver full name, phone, and email
          are masked with "•••••" until the negotiation is paid — pickup
          location, destination, and pickup date/time are always shown in
          full since they're logistics, not identity. */}
      <Modal
        visible={showRequestDetailsModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
          >
            <View style={styles.modalHeader}>
              <AppText weight="bold" size={18} color={theme.text}>
                Request Details
              </AppText>
              <TouchableOpacity
                onPress={() => setShowRequestDetailsModal(false)}
              >
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Request Info */}
              <View style={styles.detailsSection}>
                <AppText
                  size={12}
                  weight="bold"
                  color={theme.textMuted}
                  style={styles.detailsSectionTitle}
                >
                  REQUEST INFO
                </AppText>

                <View style={styles.detailRow}>
                  <AppText size={13} color={theme.textMuted}>
                    Service Type
                  </AppText>
                  <AppText size={13} weight="medium" color={theme.text}>
                    {requestServiceType}
                  </AppText>
                </View>

                <View style={styles.detailRow}>
                  <AppText size={13} color={theme.textMuted}>
                    Status
                  </AppText>
                  <AppText size={13} weight="medium" color={theme.text}>
                    {requestStatus}
                  </AppText>
                </View>

                <View style={styles.detailRow}>
                  <AppText size={13} color={theme.textMuted}>
                    Pickup
                  </AppText>
                  <AppText
                    size={13}
                    weight="medium"
                    color={theme.text}
                    style={{ flexShrink: 1, textAlign: "right" }}
                  >
                    {requestPickupAddress}
                  </AppText>
                </View>

                <View style={styles.detailRow}>
                  <AppText size={13} color={theme.textMuted}>
                    Destination
                  </AppText>
                  <AppText
                    size={13}
                    weight="medium"
                    color={theme.text}
                    style={{ flexShrink: 1, textAlign: "right" }}
                  >
                    {requestDestination}
                  </AppText>
                </View>

                {/* NEW — always shown regardless of payment status */}
                <View style={styles.detailRow}>
                  <AppText size={13} color={theme.textMuted}>
                    Pickup Date
                  </AppText>
                  <AppText size={13} weight="medium" color={theme.text}>
                    {formatPickupDate(requestPickupDate)}
                  </AppText>
                </View>

                <View style={styles.detailRow}>
                  <AppText size={13} color={theme.textMuted}>
                    Pickup Time
                  </AppText>
                  <AppText size={13} weight="medium" color={theme.text}>
                    {requestPickupTime || "N/A"}
                  </AppText>
                </View>

                <View style={styles.detailRow}>
                  <AppText size={13} color={theme.textMuted}>
                    {currentAgreedPrice ? "Agreed Price" : "Price"}
                  </AppText>
                  <AppText size={13} weight="bold" color={theme.text}>
                    ₦
                    {Number(
                      currentAgreedPrice || negotiation?.price || 0
                    ).toLocaleString()}
                  </AppText>
                </View>

                <View style={styles.detailRow}>
                  <AppText size={13} color={theme.textMuted}>
                    Payment Status
                  </AppText>
                  <AppText size={13} weight="medium" color={theme.text}>
                    {isPaid ? "Paid" : "Unpaid"}
                  </AppText>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Sender (negotiator/customer) — name/email/phone masked
                  until paid */}
              <View style={styles.detailsSection}>
                <AppText
                  size={12}
                  weight="bold"
                  color={theme.textMuted}
                  style={styles.detailsSectionTitle}
                >
                  SENDER (CUSTOMER)
                </AppText>
                <View style={styles.userCard}>
                  {senderDetails.profileImage ? (
                    <Image
                      source={{ uri: senderDetails.profileImage }}
                      style={styles.userAvatarCircle}
                    />
                  ) : (
                    <View
                      style={[
                        styles.userAvatarCircle,
                        styles.userAvatarFallback,
                      ]}
                    >
                      <AppText size={15} weight="bold" color={INK}>
                        {getInitials(
                          maskUnlessPaid(senderDetails.name, isPaid)
                        )}
                      </AppText>
                    </View>
                  )}
                  <View style={styles.userInfoCol}>
                    <AppText weight="bold" size={14} color={theme.text}>
                      {maskUnlessPaid(senderDetails.name, isPaid)}
                    </AppText>
                    {senderDetails.email ? (
                      <AppText size={12} color={theme.textMuted}>
                        {maskUnlessPaid(senderDetails.email, isPaid)}
                      </AppText>
                    ) : null}
                    {senderDetails.phone ? (
                      <AppText size={12} color={theme.textMuted}>
                        {maskUnlessPaid(senderDetails.phone, isPaid)}
                      </AppText>
                    ) : null}
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Receiver (provider) — name/email/phone masked until paid */}
              <View style={styles.detailsSection}>
                <AppText
                  size={12}
                  weight="bold"
                  color={theme.textMuted}
                  style={styles.detailsSectionTitle}
                >
                  RECEIVER (PROVIDER)
                </AppText>
                <View style={styles.userCard}>
                  {receiverDetails.profileImage ? (
                    <Image
                      source={{ uri: receiverDetails.profileImage }}
                      style={styles.userAvatarCircle}
                    />
                  ) : (
                    <View
                      style={[
                        styles.userAvatarCircle,
                        styles.userAvatarFallback,
                      ]}
                    >
                      <AppText size={15} weight="bold" color={INK}>
                        {getInitials(
                          maskUnlessPaid(receiverDetails.name, isPaid)
                        )}
                      </AppText>
                    </View>
                  )}
                  <View style={styles.userInfoCol}>
                    <AppText weight="bold" size={14} color={theme.text}>
                      {maskUnlessPaid(receiverDetails.name, isPaid)}
                    </AppText>
                    {receiverDetails.email ? (
                      <AppText size={12} color={theme.textMuted}>
                        {maskUnlessPaid(receiverDetails.email, isPaid)}
                      </AppText>
                    ) : null}
                    {receiverDetails.phone ? (
                      <AppText size={12} color={theme.textMuted}>
                        {maskUnlessPaid(receiverDetails.phone, isPaid)}
                      </AppText>
                    ) : null}
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: "center", alignItems: "center" },
  topSafeAreaStyle: {
    backgroundColor: INK,
    marginTop: Platform.OS === "ios" ? -48 : 0,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 40 : 16,
    paddingBottom: 24,
    backgroundColor: INK,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTapArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F0F2F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerInfo: { flex: 1, justifyContent: "center" },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 5,
  },
  statusIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  // NEW — top-right badge, flexed to the end of headerTapArea, next to
  // the chat title/subtitle block. Small, ALL CAPS, wraps to 2 lines max.
  headerStatusBadge: {
    maxWidth: 96,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginLeft: 8,
  },
  headerStatusBadgeText: {
    letterSpacing: 0.3,
    textAlign: "right",
    lineHeight: 12,
  },
  headerUtilityOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  chatCanvasContainer: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
  },

  agreedPaymentBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  bannerInfoGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  agreedCheckBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  payNowButton: {
    backgroundColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },

  // Current-location / completed-awaiting-confirmation banner
  locationBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  locationPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3B82F6",
  },

  messagesContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },

  timeDividerContainer: {
    alignItems: "center",
    marginVertical: 14,
    width: "100%",
  },
  timePillBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
  },
  timeBadgeText: {
    letterSpacing: 0.5,
  },

  shimmerRow: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 10,
  },

  // Centered pill for status/location update messages
  statusPillContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
  statusPillBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },

  priceBadgeBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 4,
    maxWidth: "85%",
  },
  agreeButton: {
    backgroundColor: "#10B981",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 12,
  },
  typingIndicatorRow: {
    paddingHorizontal: 10,
    marginVertical: 4,
  },

  priceInputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  priceField: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 14,
  },
  closePriceBtn: {
    padding: 4,
    marginLeft: 6,
  },

  // Floating, bouncing "Counter Price" button, anchored above the input bar
  floatingCounterButtonWrapper: {
    position: "absolute",
    bottom: 96,
    alignSelf: "center",
    zIndex: 20,
  },
  floatingCounterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },

  inputContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderTopWidth: 1,
  },
  inputFieldInnerWrapper: {
    flex: 1,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    marginRight: 10,
  },
  inputActionMediaButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 4,
    paddingTop: Platform.OS === "ios" ? 10 : 8,
    paddingBottom: Platform.OS === "ios" ? 10 : 8,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // FAB and Modal Styles
  fab: {
    position: "absolute",
    right: 20,
    bottom: Platform.OS === "ios" ? 150 : 150,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 250,
    maxHeight: "80%",
    paddingBottom: 64
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalSection: {
    marginTop: 10,
  },
  modalInputGroup: {
    marginBottom: 20,
  },
  locationInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationInput: {
    flex: 1,
    height: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  smallUpdateBtn: {
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraBtn: {
    flexDirection: "row",
    height: 50,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryActionBtn: {
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  handoverProofImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
  },
  removeHandoverImageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  // Ride Ended overlay + modal styles
  rideEndedOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(60,60,60,0.55)",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 16,
  },
  rideEndedOverlayBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(17,19,24,0.9)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rideEndedIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
  },

  // Request Details modal styles
  detailsSection: {
    marginBottom: 4,
  },
  detailsSectionTitle: {
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.08)",
    marginVertical: 18,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
  },
  userAvatarFallback: {
    backgroundColor: "#F0F2F5",
    justifyContent: "center",
    alignItems: "center",
  },
  userInfoCol: {
    flex: 1,
  },
});
