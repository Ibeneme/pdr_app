// app/(screens)/new-offer.tsx
import React, { useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Platform,
  StatusBar,
  Modal,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import {
  ArrowLeft,
  Car,
  Send,
  Clock,
  MapPin,
  DollarSign,
  UserCheck,
  CheckCircle,
  X,
} from "lucide-react-native";
import { AppText } from "@/components/AppText";

export default function NewOfferScreen() {
  const { theme: colors, isDark } = useTheme();
  const router = useRouter();

  const [serviceType, setServiceType] = useState<"ride" | "parcel">("ride");
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [time, setTime] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

  const [step, setStep] = useState<"form" | "review" | "pairing" | "paired">(
    "form"
  );
  const [showVerification, setShowVerification] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [matchedPartner, setMatchedPartner] = useState<any>(null);

  const handleSubmit = () => {
    if (!fromLocation || !toLocation || !price) {
      Alert.alert("Missing Fields", "Please fill all required fields.");
      return;
    }
    setStep("review");
  };

  const confirmPost = () => {
    setShowVerification(true);
  };

  const verifyIdentity = () => {
    setShowVerification(false);
    setStep("pairing");

    // Simulate pairing
    setTimeout(() => {
      const partner = {
        name: serviceType === "ride" ? "Sarah Nwosu" : "David Bike",
        image:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
        rating: 4.9,
        phone: "+234 803 456 7890",
        vehicle:
          serviceType === "ride"
            ? "Toyota Camry • ABC-123"
            : "Bike • Delivery Bag",
      };
      setMatchedPartner(partner);
      setStep("paired");
    }, 2200);
  };

  const startOrder = () => {
    Alert.alert("Order Started", "You have successfully started this order.");
  };

  const endOrder = () => {
    setShowSuccess(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <SafeAreaView
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.iconBtn,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <AppText size={20} weight="bold" color={colors.text}>
            {serviceType === "ride" ? "Offer a Ride" : "Send Parcel"}
          </AppText>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Service Type Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              serviceType === "ride" && { backgroundColor: colors.primary },
            ]}
            onPress={() => setServiceType("ride")}
          >
            <AppText
              size={15}
              weight="bold"
              color={serviceType === "ride" ? "#FFF" : colors.text}
            >
              Offer Ride
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              serviceType === "parcel" && { backgroundColor: colors.primary },
            ]}
            onPress={() => setServiceType("parcel")}
          >
            <AppText
              size={15}
              weight="bold"
              color={serviceType === "parcel" ? "#FFF" : colors.text}
            >
              Send Parcel
            </AppText>
          </TouchableOpacity>
        </View>

        {step === "form" && (
          <>
            <AppText size={14} color={colors.textMuted} style={styles.label}>
              From
            </AppText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Current Location"
              value={fromLocation}
              onChangeText={setFromLocation}
            />

            <AppText size={14} color={colors.textMuted} style={styles.label}>
              To
            </AppText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Destination"
              value={toLocation}
              onChangeText={setToLocation}
            />

            <AppText size={14} color={colors.textMuted} style={styles.label}>
              Departure Time
            </AppText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="e.g. 10:30 AM"
              value={time}
              onChangeText={setTime}
            />

            <AppText size={14} color={colors.textMuted} style={styles.label}>
              Price (₦)
            </AppText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="3000"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />

            <AppText size={14} color={colors.textMuted} style={styles.label}>
              Description (Optional)
            </AppText>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Any special note..."
              multiline
              value={description}
              onChangeText={setDescription}
            />

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
            >
              <AppText size={16} weight="bold" color="#000">
                Post Offer
              </AppText>
            </TouchableOpacity>
          </>
        )}

        {step === "review" && (
          <View style={styles.reviewCard}>
            <AppText size={20} weight="bold" color={colors.text}>
              Review Offer
            </AppText>
            <AppText
              size={15}
              color={colors.textMuted}
              style={{ marginTop: 12 }}
            >
              From: {fromLocation}
            </AppText>
            <AppText size={15} color={colors.textMuted}>
              To: {toLocation}
            </AppText>
            <AppText size={15} color={colors.textMuted}>
              Time: {time}
            </AppText>
            <AppText
              size={18}
              weight="bold"
              color={colors.primary}
              style={{ marginTop: 20 }}
            >
              ₦{price}
            </AppText>

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { backgroundColor: colors.primary, marginTop: 30 },
              ]}
              onPress={confirmPost}
            >
              <AppText size={16} weight="bold" color="#000">
                Confirm & Post
              </AppText>
            </TouchableOpacity>
          </View>
        )}

        {step === "pairing" && (
          <View style={styles.pairingContainer}>
            <AppText size={18} weight="bold" color={colors.text}>
              Finding the best match...
            </AppText>
            <AppText
              size={14}
              color={colors.textMuted}
              style={{ marginTop: 8 }}
            >
              Please wait
            </AppText>
          </View>
        )}

        {step === "paired" && matchedPartner && (
          <View style={styles.pairedContainer}>
            <AppText size={20} weight="bold" color={colors.text}>
              Matched Successfully!
            </AppText>

            <View style={styles.partnerCard}>
              <Image
                source={{ uri: matchedPartner.image }}
                style={styles.partnerAvatar}
              />
              <AppText size={18} weight="bold" color={colors.text}>
                {matchedPartner.name}
              </AppText>
              <AppText size={14} color={colors.textMuted}>
                {matchedPartner.vehicle}
              </AppText>
            </View>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              onPress={() => alert("Chat opened with " + matchedPartner.name)}
            >
              <AppText size={16} weight="bold" color="#000">
                Send Message
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#22C55E" }]}
              onPress={startOrder}
            >
              <AppText size={16} weight="bold" color="#000">
                Start Order
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#EF4444" }]}
              onPress={endOrder}
            >
              <AppText size={16} weight="bold" color="#FFF">
                End Order
              </AppText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Identity Verification Modal */}
      <Modal visible={showVerification} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[styles.bottomSheet, { backgroundColor: colors.background }]}
          >
            <AppText size={20} weight="bold" color={colors.text}>
              Verify Identity
            </AppText>
            <AppText
              size={14}
              color={colors.textMuted}
              style={{ marginTop: 8 }}
            >
              Upload Driver's License or Rider Card
            </AppText>

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { backgroundColor: colors.primary, marginTop: 30 },
              ]}
              onPress={verifyIdentity}
            >
              <AppText size={16} weight="bold" color="#000">
                Verify Now
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowVerification(false)}
              style={{ marginTop: 16 }}
            >
              <AppText size={15} color={colors.textMuted}>
                Cancel
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.successModal,
              { backgroundColor: colors.background },
            ]}
          >
            <CheckCircle size={70} color="#22C55E" />
            <AppText
              size={22}
              weight="bold"
              color={colors.text}
              style={{ marginTop: 20 }}
            >
              Order Completed!
            </AppText>
            <AppText
              size={15}
              color={colors.textMuted}
              style={{ textAlign: "center", marginTop: 8 }}
            >
              Thank you for using Padiman Route
            </AppText>

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { backgroundColor: colors.primary, marginTop: 30 },
              ]}
              onPress={() => {
                setShowSuccess(false);
                router.back();
              }}
            >
              <AppText size={16} weight="bold" color="#000">
                Done
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { borderBottomWidth: 1 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },

  scroll: { flex: 1 },
  scrollContent: { padding: 20 },

  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
  },

  label: { marginTop: 16, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: "top" },

  primaryBtn: {
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },

  reviewCard: {
    backgroundColor: "#1A1A1A",
    padding: 24,
    borderRadius: 24,
    marginTop: 20,
  },
  pairingContainer: { alignItems: "center", marginTop: 100 },
  pairedContainer: { alignItems: "center", marginTop: 20 },
  partnerCard: { alignItems: "center", marginVertical: 30 },
  partnerAvatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 12 },

  actionBtn: {
    width: "100%",
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  successModal: {
    margin: 30,
    borderRadius: 28,
    padding: 40,
    alignItems: "center",
  },
});
