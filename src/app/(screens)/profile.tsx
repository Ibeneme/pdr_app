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
import { ArrowLeft, Camera, Check, User } from "lucide-react-native";
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
              backgroundColor: gender === g ? colors.primary : colors.surface,
              borderColor: colors.border,
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

          <TouchableOpacity onPress={handleSaveProfile}>
            <AppText size={16} weight="bold" color={colors.primary}>
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
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.background,
                },
              ]}
              onPress={pickAndUploadImage}
            >
              <Camera size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

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
              {
                backgroundColor: isDark ? "#1A1A1A" : "#F8FAFC",
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter full name"
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
              {
                backgroundColor: isDark ? "#1A1A1A" : "#F8FAFC",
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={mobileNumber}
            onChangeText={setMobileNumber}
            keyboardType="phone-pad"
            placeholder="Enter phone number"
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
              {
                backgroundColor: isDark ? "#1A1A1A" : "#F8FAFC",
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="Enter email"
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
              {
                backgroundColor: isDark ? "#1A1A1A" : "#F8FAFC",
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter address"
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
              {
                backgroundColor: isDark ? "#1A1A1A" : "#F8FAFC",
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={occupation}
            onChangeText={setOccupation}
            placeholder="Enter occupation"
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
                {
                  backgroundColor: isDark ? "#1A1A1A" : "#F8FAFC",
                  justifyContent: "center",
                  borderColor: colors.border,
                },
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
              {
                backgroundColor: isDark ? "#1A1A1A" : "#F8FAFC",
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={driverLicenseNumber}
            onChangeText={setDriverLicenseNumber}
            placeholder="Enter license number (if driver)"
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
              },
            ]}
            value={idMeans}
            onChangeText={setIdMeans}
            placeholder="Enter ID type"
          />
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
              {
                backgroundColor: colors.primary,
                borderColor: colors.background,
              },
            ]}
          >
            <Check size={12} color="#FFFFFF" />
          </View>
        </View>

        {/* Only show fields that have values */}
        {profile?.fullName && (
          <View
            style={[
              styles.readOnlyFieldBlockRow,
              { borderColor: colors.border },
            ]}
          >
            <AppText size={14} color={colors.textMuted}>
              Full Name:
            </AppText>
            <AppText size={14} weight="medium" color={colors.text}>
              {profile.fullName}
            </AppText>
          </View>
        )}

        {profile?.phone && (
          <View
            style={[
              styles.readOnlyFieldBlockRow,
              { borderColor: colors.border },
            ]}
          >
            <AppText size={14} color={colors.textMuted}>
              Mobile Number:
            </AppText>
            <AppText size={14} weight="medium" color={colors.text}>
              {profile.phone}
            </AppText>
          </View>
        )}

        {profile?.gender &&
          profile.gender.toLowerCase() !== "prefer not to say" && (
            <View
              style={[
                styles.readOnlyFieldBlockRow,
                { borderColor: colors.border },
              ]}
            >
              <AppText size={14} color={colors.textMuted}>
                Gender:
              </AppText>
              <AppText size={14} weight="medium" color={colors.text}>
                {profile.gender}
              </AppText>
            </View>
          )}

        {profile?.email && (
          <View
            style={[
              styles.readOnlyFieldBlockRow,
              { borderColor: colors.border },
            ]}
          >
            <AppText size={14} color={colors.textMuted}>
              Email:
            </AppText>
            <AppText size={14} weight="medium" color={colors.text}>
              {profile.email}
            </AppText>
          </View>
        )}

        {profile?.address && (
          <View
            style={[
              styles.readOnlyFieldBlockRow,
              { borderColor: colors.border },
            ]}
          >
            <AppText size={14} color={colors.textMuted}>
              Address:
            </AppText>
            <AppText size={14} weight="medium" color={colors.text}>
              {profile.address}
            </AppText>
          </View>
        )}

        {profile?.occupation && (
          <View
            style={[
              styles.readOnlyFieldBlockRow,
              { borderColor: colors.border },
            ]}
          >
            <AppText size={14} color={colors.textMuted}>
              Occupation:
            </AppText>
            <AppText size={14} weight="medium" color={colors.text}>
              {profile.occupation}
            </AppText>
          </View>
        )}

        {profile?.city && (
          <View
            style={[
              styles.readOnlyFieldBlockRow,
              { borderColor: colors.border },
            ]}
          >
            <AppText size={14} color={colors.textMuted}>
              City:
            </AppText>
            <AppText size={14} weight="medium" color={colors.text}>
              {profile.city}
            </AppText>
          </View>
        )}

        {profile?.driverLicenseNumber && (
          <View
            style={[
              styles.readOnlyFieldBlockRow,
              { borderColor: colors.border },
            ]}
          >
            <AppText size={14} color={colors.textMuted}>
              Driver License No:
            </AppText>
            <AppText size={14} weight="medium" color={colors.text}>
              {profile.driverLicenseNumber}
            </AppText>
          </View>
        )}

        {profile?.idMeans && (
          <View
            style={[
              styles.readOnlyFieldBlockRow,
              { borderColor: colors.border },
            ]}
          >
            <AppText size={14} color={colors.textMuted}>
              Means of Identification:
            </AppText>
            <AppText size={14} weight="medium" color={colors.text}>
              {profile.idMeans}
            </AppText>
          </View>
        )}

        {/* Become a Driver Card */}
        <TouchableOpacity
          style={[
            styles.becomeDriverCard,
            { backgroundColor: colors.surface, borderColor: colors.primary },
          ]}
          onPress={() => router.push("/(features)/become_driver")}
        >
          <AppText size={16} weight="bold" color={colors.primary}>
            Become a Driver
          </AppText>
          <AppText size={13} color={colors.textMuted} style={{ marginTop: 4 }}>
            Start earning by offering rides and deliveries
          </AppText>
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
  fieldLabelSpacing: { marginTop: 14, marginBottom: 6, paddingLeft: 4 },
  profileInputFrameField: {
    height: 46,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  genderGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  closeModalBtn: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#111",
  },
  becomeDriverCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    marginVertical: 20,
  },
});
