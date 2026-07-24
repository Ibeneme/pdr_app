// app/(screens)/profile.tsx
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Camera,
  Check,
  User,
  Bell,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Building2,
  IdCard,
  ChevronRight,
  Car,
} from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { AppText } from "@/components/AppText";

// Redux
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/api/store";
import {
  getProfile,
  updateProfile,
  updateProfilePicture,
} from "@/api/slices/user.slice";

// Image Picker
import * as ImagePicker from "expo-image-picker";

// Import City Selector
import { NigeriaCitiesGrid, NigeriaCity } from "@/components/NigeriaCitiesGrid";

// Soft pastel chip palette, one tint per info row, matching the reference
// mood board's colored icon squares.
const PASTELS = {
  sky: { bg: "#DBEAFE", icon: "#2563EB" },
  lavender: { bg: "#EDE9FE", icon: "#7C3AED" },
  mint: { bg: "#D1FAE5", icon: "#059669" },
  peach: { bg: "#FFE4D6", icon: "#EA580C" },
  butter: { bg: "#FEF3C7", icon: "#D97706" },
  rose: { bg: "#FFE1E6", icon: "#E11D48" },
};

export default function ProfileScreen() {
  const { theme: colors, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const { profile, isLoading } = useSelector((state: RootState) => state.user);

  const [isEditing, setIsEditing] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Local state
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [occupation, setOccupation] = useState("");
  const [city, setCity] = useState("");
  const [driverLicenseNumber, setDriverLicenseNumber] = useState("");
  const [idMeans, setIdMeans] = useState("");

  const pageBg = isDark ? colors.background : "#f4f4f4";
  const cardBg = isDark ? colors.surface : "#FFFFFF";
  const tileBg = isDark ? "#1A1A1A" : "#F4F4F1";

  // Load profile
  useEffect(() => {
    dispatch(getProfile());
  }, [dispatch]);

  // Populate form
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "");
      setMobileNumber(profile.phone || "");
      setGender(profile.gender || "");
      setEmail(profile.email || "");
      setAddress(profile.address || "");
      setOccupation(profile.occupation || "");
      setCity(profile.city || "");
      setDriverLicenseNumber(profile.driverLicenseNumber || "");
      setIdMeans(profile.idMeans || "");
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    const updateData: any = {};
    if (fullName) updateData.fullName = fullName;
    if (mobileNumber) updateData.phone = mobileNumber;
    if (gender) updateData.gender = gender;
    if (email) updateData.email = email;
    if (address) updateData.address = address;
    if (occupation) updateData.occupation = occupation;
    if (city) updateData.city = city;
    if (driverLicenseNumber)
      updateData.driverLicenseNumber = driverLicenseNumber;
    if (idMeans) updateData.idMeans = idMeans;

    await dispatch(updateProfile(updateData));
    setIsEditing(false);
  };

  const handleCitySelect = (selectedCity: NigeriaCity) => {
    setCity(selectedCity.name);
    setShowCityModal(false);
  };

  // Gender Selection
  const genderOptions = ["Male", "Female"];

  const renderGenderSelector = () => (
    <View style={styles.genderGrid}>
      {genderOptions.map((g) => (
        <TouchableOpacity
          key={g}
          style={[
            styles.genderOption,
            {
              backgroundColor: gender === g ? colors.primary : tileBg,
            },
          ]}
          onPress={() => setGender(g)}
        >
          <AppText
            size={15}
            weight={gender === g ? "bold" : "medium"}
            color={gender === g ? "#FFFFFF" : colors.text}
          >
            {g}
          </AppText>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "U";
    const names = name.trim().split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0].slice(0, 2).toUpperCase();
  };

  // Pick and Upload Image
  const pickAndUploadImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "You need to grant gallery access to change profile picture."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];

      // Check file size (5MB max)
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        Alert.alert("File Too Large", "Image must be less than 5MB.");
        return;
      }

      setSelectedImage(asset.uri);
      setUploadingImage(true);

      try {
        const formData = new FormData();
        formData.append("profileImage", {
          uri: asset.uri,
          type: asset.mimeType || "image/jpeg",
          name: "profile.jpg",
        } as any);

        await dispatch(updateProfilePicture(formData));
        Alert.alert("Success", "Profile picture updated successfully!");
      } catch (error) {
        Alert.alert("Error", "Failed to upload image.");
      } finally {
        setUploadingImage(false);
      }
    }
  };

  // ====================== EDIT MODE ======================
  if (isEditing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: pageBg }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

        <View style={styles.topHeaderControlRow}>
          <TouchableOpacity
            style={[styles.backBoxCircle, { backgroundColor: cardBg }]}
            onPress={() => setIsEditing(false)}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>

          <AppText size={19} weight="bold" color={colors.text}>
            Edit Profile
          </AppText>

          <TouchableOpacity onPress={handleSaveProfile}>
            <AppText size={15} weight="bold" color={colors.primary}>
              Save
            </AppText>
          </TouchableOpacity>
        </View>

        {(isLoading || uploadingImage) && (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ margin: 20 }}
          />
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollBodyContainer}
        >
          <View style={styles.avatarCenteredBlockAnchor}>
            <TouchableOpacity onPress={pickAndUploadImage}>
              {selectedImage || profile?.profileImage ? (
                <Image
                  source={{ uri: selectedImage || profile?.profileImage }}
                  style={styles.userMainProfileAvatarFrame}
                />
              ) : (
                <View
                  style={[
                    styles.userMainProfileAvatarFrame,
                    {
                      backgroundColor: colors.primary,
                      justifyContent: "center",
                      alignItems: "center",
                    },
                  ]}
                >
                  <AppText size={32} weight="bold" color="#FFFFFF">
                    {getInitials(fullName || "U")}
                  </AppText>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.cameraOverlayIndicatorBadge,
                { backgroundColor: colors.primary, borderColor: pageBg },
              ]}
              onPress={pickAndUploadImage}
            >
              <Camera size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={[styles.formCard, { backgroundColor: cardBg }]}>
            <AppText
              size={12}
              color={colors.textMuted}
              style={styles.fieldLabelSpacing}
            >
              Full Name
            </AppText>
            <TextInput
              style={[
                styles.profileInputFrameField,
                { backgroundColor: tileBg, color: colors.text },
              ]}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter full name"
              placeholderTextColor={colors.textMuted}
            />

            <AppText
              size={12}
              color={colors.textMuted}
              style={styles.fieldLabelSpacing}
            >
              Phone Number
            </AppText>
            <TextInput
              style={[
                styles.profileInputFrameField,
                { backgroundColor: tileBg, color: colors.text },
              ]}
              value={mobileNumber}
              onChangeText={setMobileNumber}
              keyboardType="phone-pad"
              placeholder="Enter phone number"
              placeholderTextColor={colors.textMuted}
            />

            <AppText
              size={12}
              color={colors.textMuted}
              style={styles.fieldLabelSpacing}
            >
              Gender
            </AppText>
            {renderGenderSelector()}

            <AppText
              size={12}
              color={colors.textMuted}
              style={styles.fieldLabelSpacing}
            >
              Email
            </AppText>
            <TextInput
              style={[
                styles.profileInputFrameField,
                { backgroundColor: tileBg, color: colors.text },
              ]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholder="Enter email"
              placeholderTextColor={colors.textMuted}
            />

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
                { backgroundColor: tileBg, color: colors.text },
              ]}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter address"
              placeholderTextColor={colors.textMuted}
            />

            <AppText
              size={12}
              color={colors.textMuted}
              style={styles.fieldLabelSpacing}
            >
              Occupation
            </AppText>
            <TextInput
              style={[
                styles.profileInputFrameField,
                { backgroundColor: tileBg, color: colors.text },
              ]}
              value={occupation}
              onChangeText={setOccupation}
              placeholder="Enter occupation"
              placeholderTextColor={colors.textMuted}
            />

            <AppText
              size={12}
              color={colors.textMuted}
              style={styles.fieldLabelSpacing}
            >
              City
            </AppText>
            <TouchableOpacity onPress={() => setShowCityModal(true)}>
              <View
                style={[
                  styles.profileInputFrameField,
                  { backgroundColor: tileBg, justifyContent: "center" },
                ]}
              >
                <AppText color={city ? colors.text : colors.textMuted}>
                  {city || "Select City"}
                </AppText>
              </View>
            </TouchableOpacity>

            <AppText
              size={12}
              color={colors.textMuted}
              style={styles.fieldLabelSpacing}
            >
              Driver License Number
            </AppText>
            <TextInput
              style={[
                styles.profileInputFrameField,
                { backgroundColor: tileBg, color: colors.text },
              ]}
              value={driverLicenseNumber}
              onChangeText={setDriverLicenseNumber}
              placeholder="Enter license number (if driver)"
              placeholderTextColor={colors.textMuted}
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
                { backgroundColor: tileBg, color: colors.text },
              ]}
              value={idMeans}
              onChangeText={setIdMeans}
              placeholder="Enter ID type"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </ScrollView>

        {/* City Selection Modal */}
        <Modal
          visible={showCityModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <NigeriaCitiesGrid onCityPress={handleCitySelect} />
          <TouchableOpacity
            style={styles.closeModalBtn}
            onPress={() => setShowCityModal(false)}
          >
            <AppText color={colors.primary} weight="bold">
              Close
            </AppText>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    );
  }

  // ====================== VIEW MODE ======================
  const infoRows = [
    {
      key: "fullName",
      label: "Full Name",
      value: profile?.fullName,
      Icon: User,
      tint: PASTELS.lavender,
    },
    {
      key: "phone",
      label: "Mobile Number",
      value: profile?.phone,
      Icon: Phone,
      tint: PASTELS.sky,
    },
    {
      key: "email",
      label: "Email",
      value: profile?.email,
      Icon: Mail,
      tint: PASTELS.mint,
    },
    {
      key: "address",
      label: "Address",
      value: profile?.address,
      Icon: MapPin,
      tint: PASTELS.peach,
    },
    {
      key: "occupation",
      label: "Occupation",
      value: profile?.occupation,
      Icon: Briefcase,
      tint: PASTELS.butter,
    },
    {
      key: "city",
      label: "City",
      value: profile?.city,
      Icon: Building2,
      tint: PASTELS.lavender,
    },
    {
      key: "driverLicenseNumber",
      label: "Driver License No",
      value: profile?.driverLicenseNumber,
      Icon: IdCard,
      tint: PASTELS.sky,
    },
    {
      key: "idMeans",
      label: "Means of Identification",
      value: profile?.idMeans,
      Icon: IdCard,
      tint: PASTELS.rose,
    },
  ].filter(
    (row) =>
      !!row.value &&
      !(
        row.key === "gender" && row.value?.toLowerCase() === "prefer not to say"
      )
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: pageBg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={styles.topHeaderControlRow}>
        <TouchableOpacity
          style={[styles.backBoxCircle, { backgroundColor: cardBg }]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <AppText size={19} weight="bold" color={colors.text}>
          Profile
        </AppText>
        <TouchableOpacity
          style={[styles.backBoxCircle, { backgroundColor: cardBg }]}
          onPress={() => router.push("/(screens)/notifications")}
        >
          <Bell size={19} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollBodyContainer}
      >
        {/* Hero identity card */}
        <View style={[styles.identityHeroCard, { backgroundColor: cardBg }]}>
          <View style={styles.avatarCenteredBlockAnchor}>
            {profile?.profileImage ? (
              <Image
                source={{ uri: profile.profileImage }}
                style={styles.userMainProfileAvatarFrame}
              />
            ) : (
              <View
                style={[
                  styles.userMainProfileAvatarFrame,
                  {
                    backgroundColor: colors.primary,
                    justifyContent: "center",
                    alignItems: "center",
                  },
                ]}
              >
                <AppText size={32} weight="bold" color="#FFFFFF">
                  {getInitials(profile?.fullName || "U")}
                </AppText>
              </View>
            )}
            <View
              style={[
                styles.cameraOverlayIndicatorBadge,
                { backgroundColor: "#22C55E", borderColor: cardBg },
              ]}
            >
              <Check size={12} color="#FFFFFF" />
            </View>
          </View>

          {profile?.fullName && (
            <AppText
              size={18}
              weight="bold"
              color={colors.text}
              style={{ marginTop: 12 }}
            >
              {profile.fullName}
            </AppText>
          )}
          <AppText
            size={12.5}
            color={colors.textMuted}
            style={{ marginTop: 2 }}
          >
            {profile?.isDriver ? "Verified Driver" : "Padiman Member"}
          </AppText>
        </View>

        {/* Info rows */}
        {infoRows.length > 0 && (
          <View style={[styles.infoListCard, { backgroundColor: cardBg }]}>
            {infoRows.map((row, idx) => (
              <View
                key={row.key}
                style={[
                  styles.infoRow,
                  idx === infoRows.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View
                  style={[
                    styles.infoIconChip,
                    { backgroundColor: row.tint.bg },
                  ]}
                >
                  <row.Icon size={17} color={row.tint.icon} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <AppText size={11.5} color={colors.textMuted}>
                    {row.label}
                  </AppText>
                  <AppText
                    size={14}
                    weight="bold"
                    color={colors.text}
                    style={{ marginTop: 1 }}
                  >
                    {row.value}
                  </AppText>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Become a Driver Card */}
        <TouchableOpacity
          style={[
            styles.becomeDriverCard,
            { backgroundColor: PASTELS.lavender.bg },
          ]}
          onPress={() => router.push("/(features)/become_driver")}
          activeOpacity={0.85}
        >
          <View style={[styles.driverIconBox, { backgroundColor: "#FFFFFF" }]}>
            <Car size={20} color={PASTELS.lavender.icon} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <AppText size={15} weight="bold" color="#3B0764">
              Become a Driver
            </AppText>
            <AppText size={12.5} color="#6B21A8" style={{ marginTop: 2 }}>
              Start earning by offering rides and deliveries
            </AppText>
          </View>
          <ChevronRight size={18} color="#6B21A8" />
        </TouchableOpacity>

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
    paddingHorizontal: 16,
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  identityHeroCard: {
    borderRadius: 24,
    alignItems: "center",
    paddingVertical: 24,
    marginBottom: 16,
  },
  avatarCenteredBlockAnchor: {
    alignSelf: "center",
    position: "relative",
    marginBottom: 4,
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
  infoListCard: {
    borderRadius: 24,
    marginBottom: 16,
    paddingHorizontal: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  infoIconChip: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  becomeDriverCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
  },
  driverIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomEditActionActivationBtn: {
    height: 52,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  fieldLabelSpacing: { marginTop: 14, marginBottom: 6, paddingLeft: 4 },
  formCard: {
    borderRadius: 24,
    padding: 18,
    marginTop: 8,
  },
  profileInputFrameField: {
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  genderGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 4,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  closeModalBtn: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#111",
  },
});
