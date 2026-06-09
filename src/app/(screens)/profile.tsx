// app/(screens)/profile.tsx
import React, { useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Camera, Check } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { AppText } from "@/components/AppText";

export default function ProfileScreen() {
  const { theme: colors, isDark } = useTheme();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);

  // Personal Info
  const [fullName, setFullName] = useState("Deniro Erhuvwu Ohanomah");
  const [username, setUsername] = useState("Denny2345");
  const [mobileNumber, setMobileNumber] = useState("+234 810 634 5046");
  const [gender, setGender] = useState("Male");
  const [email, setEmail] = useState("realdohans@gmail.com");
  const [address, setAddress] = useState("No 14 Silverlane rd, Port Harcourt");
  const [skillset, setSkillset] = useState("Upholstery worker");
  const [city, setCity] = useState("Port Harcourt");
  const [idMeans, setIdMeans] = useState("National ID");

  // Statistics
  const [deliveriesDone, setDeliveriesDone] = useState("124");
  const [ridesOffered, setRidesOffered] = useState("87");
  const [parcelsRequested, setParcelsRequested] = useState("56");

  // ====================== EDIT MODE ======================
  if (isEditing) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

        <View style={styles.topHeaderControlRow}>
          <TouchableOpacity
            style={[
              styles.backBoxCircle,
              { backgroundColor: isDark ? "#1E1E1E" : "#F1F5F9" },
            ]}
            onPress={() => setIsEditing(false)}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>

          <AppText size={20} weight="bold" color={colors.text}>
            Edit Profile
          </AppText>

          <TouchableOpacity onPress={() => setIsEditing(false)}>
            <AppText size={16} weight="bold" color={colors.primary}>
              Save
            </AppText>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollBodyContainer}
        >
          <View style={styles.avatarCenteredBlockAnchor}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200",
              }}
              style={styles.userMainProfileAvatarFrame}
            />
            <TouchableOpacity
              style={[
                styles.cameraOverlayIndicatorBadge,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.background,
                },
              ]}
            >
              <Camera size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Statistics Fields in Edit Mode */}
          <AppText
            size={12}
            color={colors.textMuted}
            style={styles.fieldLabelSpacing}
          >
            Deliveries Done
          </AppText>
          <TextInput
            style={[
              styles.profileInputFrameField,
              {
                backgroundColor: isDark ? "#1A1A1A" : "#F8FAFC",
                color: colors.text,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
            value={deliveriesDone}
            onChangeText={setDeliveriesDone}
            keyboardType="numeric"
          />

          <AppText
            size={12}
            color={colors.textMuted}
            style={styles.fieldLabelSpacing}
          >
            Rides Offered
          </AppText>
          <TextInput
            style={[
              styles.profileInputFrameField,
              {
                backgroundColor: isDark ? "#1A1A1A" : "#F8FAFC",
                color: colors.text,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
            value={ridesOffered}
            onChangeText={setRidesOffered}
            keyboardType="numeric"
          />

          <AppText
            size={12}
            color={colors.textMuted}
            style={styles.fieldLabelSpacing}
          >
            Parcels Requested to be Sent
          </AppText>
          <TextInput
            style={[
              styles.profileInputFrameField,
              {
                backgroundColor: isDark ? "#1A1A1A" : "#F8FAFC",
                color: colors.text,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
            value={parcelsRequested}
            onChangeText={setParcelsRequested}
            keyboardType="numeric"
          />

          {/* Personal Fields */}
          <AppText
            size={12}
            color={colors.textMuted}
            style={styles.fieldLabelSpacing}
          >
            Full name
          </AppText>
          <TextInput
            style={[
              styles.profileInputFrameField,
              {
                backgroundColor: isDark ? "#1A1A1A" : "#F8FAFC",
                color: colors.text,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
            value={fullName}
            onChangeText={setFullName}
          />

          <AppText
            size={12}
            color={colors.textMuted}
            style={styles.fieldLabelSpacing}
          >
            Username
          </AppText>
          <TextInput
            style={[
              styles.profileInputFrameField,
              {
                backgroundColor: isDark ? "#1A1A1A" : "#F8FAFC",
                color: colors.text,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
            value={username}
            onChangeText={setUsername}
          />

          <AppText
            size={12}
            color={colors.textMuted}
            style={styles.fieldLabelSpacing}
          >
            Phone number
          </AppText>
          <View
            style={[
              styles.phoneInputRowFrameBox,
              {
                backgroundColor: isDark ? "#1A1A1A" : "#F8FAFC",
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
          >
            <AppText
              size={14}
              color={colors.text}
              style={{ marginRight: 8, fontWeight: "500" }}
            >
              +234
            </AppText>
            <TextInput
              style={{ flex: 1, fontSize: 14, color: colors.text }}
              value={mobileNumber}
              onChangeText={setMobileNumber}
              keyboardType="phone-pad"
            />
          </View>

          <AppText
            size={12}
            color={colors.textMuted}
            style={styles.fieldLabelSpacing}
          >
            Gender
          </AppText>
          <TextInput
            style={[
              styles.profileInputFrameField,
              {
                backgroundColor: isDark ? "#1A1A1A" : "#F8FAFC",
                color: colors.text,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
            value={gender}
            onChangeText={setGender}
          />

          <AppText
            size={12}
            color={colors.textMuted}
            style={styles.fieldLabelSpacing}
          >
            Email
          </AppText>
          <View
            style={[
              styles.inlineActionInputFieldRow,
              {
                backgroundColor: isDark ? "#1A1A1A" : "#F8FAFC",
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
          >
            <TextInput
              style={{ flex: 1, fontSize: 14, color: colors.text }}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <TouchableOpacity>
              <AppText size={13} weight="bold" color={colors.primary}>
                Verify
              </AppText>
            </TouchableOpacity>
          </View>

          <AppText
            size={12}
            color={colors.textMuted}
            style={styles.fieldLabelSpacing}
          >
            Address
          </AppText>
          <TextInput
            style={[
              styles.profileInputFrameField,
              {
                backgroundColor: isDark ? "#1A1A1A" : "#F8FAFC",
                color: colors.text,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
            value={address}
            onChangeText={setAddress}
          />

          <AppText
            size={12}
            color={colors.textMuted}
            style={styles.fieldLabelSpacing}
          >
            Skillset
          </AppText>
          <TextInput
            style={[
              styles.profileInputFrameField,
              {
                backgroundColor: isDark ? "#1A1A1A" : "#F8FAFC",
                color: colors.text,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
            value={skillset}
            onChangeText={setSkillset}
          />

          <AppText
            size={12}
            color={colors.textMuted}
            style={styles.fieldLabelSpacing}
          >
            City of residence
          </AppText>
          <TextInput
            style={[
              styles.profileInputFrameField,
              {
                backgroundColor: isDark ? "#1A1A1A" : "#F8FAFC",
                color: colors.text,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
            value={city}
            onChangeText={setCity}
          />

          <AppText
            size={12}
            color={colors.textMuted}
            style={styles.fieldLabelSpacing}
          >
            Means of Identification
          </AppText>
          <TextInput
            style={[
              styles.profileInputFrameField,
              {
                backgroundColor: isDark ? "#1A1A1A" : "#F8FAFC",
                color: colors.text,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
            value={idMeans}
            onChangeText={setIdMeans}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ====================== VIEW MODE ======================
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={styles.topHeaderControlRow}>
        <TouchableOpacity
          style={[
            styles.backBoxCircle,
            { backgroundColor: isDark ? "#1E1E1E" : "#F1F5F9" },
          ]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>

        <AppText size={20} weight="bold" color={colors.text}>
          Profile
        </AppText>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollBodyContainer}
      >
        <View style={styles.avatarCenteredBlockAnchor}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200",
            }}
            style={styles.userMainProfileAvatarFrame}
          />
          <View
            style={[
              styles.cameraOverlayIndicatorBadge,
              {
                backgroundColor: colors.primary,
                borderColor: colors.background,
              },
            ]}
          >
            <Check size={12} color="#FFFFFF" />
          </View>
        </View>

        {/* ====================== STATISTICS SECTION ====================== */}
        <View style={styles.statsContainer}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: isDark ? "#1E1E1E" : "#F8FAFC" },
            ]}
          >
            <AppText size={18} weight="bold" color={colors.primary}>
              {deliveriesDone}
            </AppText>
            <AppText
              size={12}
              color={colors.textMuted}
              style={{ textAlign: "center" }}
            >
              Deliveries Done
            </AppText>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: isDark ? "#1E1E1E" : "#F8FAFC" },
            ]}
          >
            <AppText size={18} weight="bold" color={colors.primary}>
              {ridesOffered}
            </AppText>
            <AppText
              size={12}
              color={colors.textMuted}
              style={{ textAlign: "center" }}
            >
              Rides Offered
            </AppText>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: isDark ? "#1E1E1E" : "#F8FAFC" },
            ]}
          >
            <AppText size={18} weight="bold" color={colors.primary}>
              {parcelsRequested}
            </AppText>
            <AppText
              size={12}
              color={colors.textMuted}
              style={{ textAlign: "center" }}
            >
              Parcels Sent
            </AppText>
          </View>
        </View>

        {/* Personal Information */}
        <View
          style={[styles.readOnlyFieldBlockRow, { borderColor: colors.border }]}
        >
          <AppText size={14} color={colors.textMuted}>
            Full Name:
          </AppText>
          <AppText size={14} weight="medium" color={colors.text}>
            {fullName}
          </AppText>
        </View>

        <View
          style={[styles.readOnlyFieldBlockRow, { borderColor: colors.border }]}
        >
          <AppText size={14} color={colors.textMuted}>
            Username:
          </AppText>
          <AppText size={14} weight="medium" color={colors.text}>
            {username}
          </AppText>
        </View>

        <View
          style={[styles.readOnlyFieldBlockRow, { borderColor: colors.border }]}
        >
          <AppText size={14} color={colors.textMuted}>
            Mobile Number:
          </AppText>
          <AppText size={14} weight="medium" color={colors.text}>
            {mobileNumber}
          </AppText>
        </View>

        <View
          style={[styles.readOnlyFieldBlockRow, { borderColor: colors.border }]}
        >
          <AppText size={14} color={colors.textMuted}>
            Gender:
          </AppText>
          <AppText size={14} weight="medium" color={colors.text}>
            {gender}
          </AppText>
        </View>

        <View
          style={[styles.readOnlyFieldBlockRow, { borderColor: colors.border }]}
        >
          <AppText size={14} color={colors.textMuted}>
            Email:
          </AppText>
          <AppText size={14} weight="medium" color={colors.text}>
            {email}
          </AppText>
        </View>

        <View
          style={[styles.readOnlyFieldBlockRow, { borderColor: colors.border }]}
        >
          <AppText size={14} color={colors.textMuted}>
            Address:
          </AppText>
          <AppText
            size={14}
            weight="medium"
            color={colors.text}
            style={{ flex: 1, textAlign: "right" }}
          >
            {address}
          </AppText>
        </View>

        <View
          style={[styles.readOnlyFieldBlockRow, { borderColor: colors.border }]}
        >
          <AppText size={14} color={colors.textMuted}>
            Skillset:
          </AppText>
          <AppText size={14} weight="medium" color={colors.text}>
            {skillset}
          </AppText>
        </View>

        <View
          style={[styles.readOnlyFieldBlockRow, { borderColor: colors.border }]}
        >
          <AppText size={14} color={colors.textMuted}>
            City of residence:
          </AppText>
          <AppText size={14} weight="medium" color={colors.text}>
            {city}
          </AppText>
        </View>

        <View
          style={[styles.readOnlyFieldBlockRow, { borderColor: colors.border }]}
        >
          <AppText size={14} color={colors.textMuted}>
            Means of Identification:
          </AppText>
          <AppText size={14} weight="medium" color={colors.text}>
            {idMeans}
          </AppText>
        </View>

        <TouchableOpacity
          style={[
            styles.bottomEditActionActivationBtn,
            { backgroundColor: colors.primary },
          ]}
          onPress={() => setIsEditing(true)}
        >
          <AppText size={15} weight="bold" color="#FFFFFF">
            Edit Profile
          </AppText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topHeaderControlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backBoxCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollBodyContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  avatarCenteredBlockAnchor: {
    alignSelf: "center",
    position: "relative",
    marginBottom: 32,
  },
  userMainProfileAvatarFrame: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  cameraOverlayIndicatorBadge: {
    position: "absolute",
    bottom: 0,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },

  /* Stats Styles */
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 12,
  },

  readOnlyFieldBlockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  bottomEditActionActivationBtn: {
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
  },

  /* Edit Mode Styles */
  fieldLabelSpacing: { marginTop: 14, marginBottom: 6, paddingLeft: 4 },
  profileInputFrameField: {
    height: 46,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  phoneInputRowFrameBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    borderRadius: 8,
    paddingHorizontal: 14,
  },
  inlineActionInputFieldRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    borderRadius: 8,
    paddingHorizontal: 14,
  },
});
