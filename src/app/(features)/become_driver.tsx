import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  Image as RNImage,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/api/store";
import { useTheme } from "@/contexts/ThemeContext";
import { AppText } from "@/components/AppText";

// Icon Assets
import {
  ArrowLeft,
  UploadCloud,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Car,
  FileText,
  Trash2,
  Info,
} from "lucide-react-native";

// Redux Actions Slices Imports
import {
  applyAsDriver,
  getDriverStatus,
  resetDriverState,
} from "@/api/slices/driver.slice";
import { getProfile } from "@/api/slices/user.slice";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // Strict 5MB Limit Gateway

export default function BecomeDriverScreen() {
  const { theme: colors, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  // Redux Structural Selectors
  const { profile } = useSelector((state: RootState) => state.user);
  const {
    application,
    isLoading: isDriverLoading,
    error: driverError,
  } = useSelector((state: RootState) => state.driver);

  // Form Field Controlled States
  const [carModel, setCarModel] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [carYear, setCarYear] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");

  // Media Attachment States
  const [licenseImageUri, setLicenseImageUri] = useState<string | null>(null);
  const [carImageUris, setCarImageUris] = useState<string[]>([]);

  // Validation Error Feedback Tracker
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initial Sync Strategy
  useEffect(() => {
    dispatch(getProfile());
    dispatch(getDriverStatus());
  }, [dispatch]);

  // Pre-populate fields if a rejection payload allows correction updates
  useEffect(() => {
    if (application && application.status === "rejected") {
      setCarModel(application.carDetails?.model || "");
      setLicensePlate(application.carDetails?.licensePlate || "");
      setCarYear(application.carDetails?.year?.toString() || "");
      setLicenseNumber(application.driversLicense?.licenseNumber || "");
    }
  }, [application]);

  // File size validation helper routine
  const checkFileSizeIsApproved = async (uri: string): Promise<boolean> => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists && fileInfo.size) {
        return fileInfo.size <= MAX_FILE_SIZE_BYTES;
      }
      return true;
    } catch (e) {
      return true; // Fallback gracefully if checking operations are restricted
    }
  };

  // --- Image Pickers Utilities Handlers ---
  const pickDriversLicense = async () => {
    setValidationError(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const selectedUri = result.assets[0].uri;
      const isSizeValid = await checkFileSizeIsApproved(selectedUri);

      if (!isSizeValid) {
        setValidationError(
          "Driver's license photo size exceeds the maximum 5MB restriction threshold."
        );
        return;
      }

      setLicenseImageUri(selectedUri);
    }
  };

  const pickCarImages = async () => {
    setValidationError(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 4 - carImageUris.length,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const selectedUris: string[] = [];

      for (const asset of result.assets) {
        const isSizeValid = await checkFileSizeIsApproved(asset.uri);
        if (!isSizeValid) {
          setValidationError(
            "One or more selected vehicle images exceed the 5MB file size limit."
          );
          return;
        }
        selectedUris.push(asset.uri);
      }

      setCarImageUris((prev) => [...prev, ...selectedUris].slice(0, 4));
    }
  };

  const removeCarImageInstance = (index: number) => {
    setCarImageUris((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Form Dispatch Pipeline Processing ---
  const handleSubmitApplication = async () => {
    setValidationError(null);

    // Frontend Structural Validation Check
    if (
      !carModel.trim() ||
      !licensePlate.trim() ||
      !carYear.trim() ||
      !licenseNumber.trim()
    ) {
      setValidationError("Please fill out all technical text input fields.");
      return;
    }

    const parsedYear = parseInt(carYear.trim(), 10);
    if (isNaN(parsedYear) || parsedYear < 2010) {
      setValidationError(
        "Vehicles older than model year 2010 do not meet current onboarding prerequisites."
      );
      return;
    }

    if (!licenseImageUri) {
      setValidationError(
        "A valid picture of your driver's license is required."
      );
      return;
    }
    if (carImageUris.length === 0) {
      setValidationError(
        "Please attach at least one photograph of your vehicle."
      );
      return;
    }

    // FormData Packaging Pipeline
    const formData = new FormData();

    // Core parameters mapping schemas
    formData.append("carDetails[model]", carModel.trim());
    formData.append(
      "carDetails[licensePlate]",
      licensePlate.trim().toUpperCase()
    );
    formData.append("carDetails[year]", carYear.trim());
    formData.append(
      "driversLicense[licenseNumber]",
      licenseNumber.trim().toUpperCase()
    );

    // Formatting file instances matching React Native expectations
    const licenseFilename = licenseImageUri.split("/").pop();
    const licenseMatch = /\.(\w+)$/.exec(licenseFilename || "");
    const licenseType = licenseMatch ? `image/${licenseMatch[1]}` : `image`;

    formData.append("driversLicenseImage", {
      uri:
        Platform.OS === "ios"
          ? licenseImageUri.replace("file://", "")
          : licenseImageUri,
      name: licenseFilename || "drivers_license.jpg",
      type: licenseType,
    } as any);

    // Appending car multi-image array assets
    carImageUris.forEach((uri, index) => {
      const carFilename = uri.split("/").pop();
      const carMatch = /\.(\w+)$/.exec(carFilename || "");
      const carType = carMatch ? `image/${carMatch[1]}` : `image`;

      formData.append("carImages", {
        uri: Platform.OS === "ios" ? uri.replace("file://", "") : uri,
        name: carFilename || `car_image_${index}.jpg`,
        type: carType,
      } as any);
    });

    // Fire application submission action thunk
    const result = await dispatch(applyAsDriver(formData));
    if (applyAsDriver.fulfilled.match(result)) {
      dispatch(getProfile()); // Refresh profile to coordinate updated parameters
    }
  };

  // ─── LIFECYCLE MANAGEMENT STATES RENDERING GATES ─────────────────────────

  // Gate 1: Profile contains verified Driver status active flag
  if (profile?.isDriver) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: colors.background }]}
      >
        <CheckCircle size={64} color="#22c55e" />
        <AppText
          size={22}
          weight="bold"
          color={colors.text}
          style={styles.stateTitle}
        >
          Verified Driver Account
        </AppText>
        <AppText
          size={15}
          color={colors.textMuted}
          style={styles.stateSubtitle}
        >
          Your driver application has been fully approved. Welcome to the
          Padiman Route driver pool.
        </AppText>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <AppText size={16} weight="bold" color="#fff">
            Return to Profile
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Gate 2: Account is Locked due to Suspension
  if (profile?.isDriverSuspended || application?.status === "suspended") {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: colors.background }]}
      >
        <XCircle size={64} color="#ef4444" />
        <AppText
          size={22}
          weight="bold"
          color={colors.text}
          style={styles.stateTitle}
        >
          Driver Profile Suspended
        </AppText>
        <AppText
          size={15}
          color={colors.textMuted}
          style={styles.stateSubtitle}
        >
          Your driving access features have been suspended indefinitely due to
          compliance policy updates.
        </AppText>
        <View
          style={[
            styles.reasonBox,
            {
              backgroundColor: isDark ? "#2a1414" : "#fef2f2",
              borderColor: "#fca5a5",
            },
          ]}
        >
          <AppText size={13} color="#ef4444" weight="bold">
            Reason for Suspension:
          </AppText>
          <AppText size={14} color={colors.text} style={{ marginTop: 4 }}>
            {application?.rejectionReason ||
              "Please contact support infrastructure channels for manual account auditing."}
          </AppText>
        </View>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.border }]}
          onPress={() => router.back()}
        >
          <AppText size={16} weight="bold" color={colors.text}>
            Go Back
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Gate 3: Application is Pending Review (Block re-uploads)
  if (profile?.isDriverPending || application?.status === "submitted") {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginBottom: 16 }}
        />
        <AppText
          size={22}
          weight="bold"
          color={colors.text}
          style={styles.stateTitle}
        >
          Reviewing Application
        </AppText>
        <AppText
          size={15}
          color={colors.textMuted}
          style={styles.stateSubtitle}
        >
          We are evaluating your documents. Your data profile fields are locked
          during this administrative check.
        </AppText>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.border }]}
          onPress={() => router.back()}
        >
          <AppText size={16} weight="bold" color={colors.text}>
            Check Back Later
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── WORKFLOW ENTRY FORM VIEW (Fresh Setup or Post-Rejection Updates) ───────
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <SafeAreaView
        style={[
          styles.headerArea,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[styles.circleButton, { borderColor: colors.border }]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <AppText size={18} weight="bold" color={colors.text}>
            Become a Driver
          </AppText>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Permanent Verification Criteria Requirements Banner */}
          <View
            style={[
              styles.criteriaBanner,
              {
                backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
                borderColor: colors.border,
              },
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <Info size={18} color={colors.primary} style={{ marginTop: 2 }} />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <AppText size={14} weight="bold" color={colors.text}>
                  Vehicle Eligibility Rules
                </AppText>
                <AppText
                  size={13}
                  color={colors.textMuted}
                  style={{ marginTop: 3, lineHeight: 18 }}
                >
                  We only accept clean, good-looking cars from manufacturing
                  years{" "}
                  <AppText weight="bold" color={colors.text}>
                    2010 models upwards
                  </AppText>
                  . Upload files under{" "}
                  <AppText weight="bold" color={colors.text}>
                    5MB
                  </AppText>{" "}
                  per slot.
                </AppText>
              </View>
            </View>
          </View>

          {/* Render Rejection Banner Alert Callout if status returns rejected */}
          {application?.status === "rejected" && (
            <View
              style={[
                styles.rejectedBanner,
                {
                  backgroundColor: isDark ? "#2d1a1a" : "#fff5f5",
                  borderColor: "#f87171",
                },
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <AlertTriangle size={20} color="#ef4444" />
                <AppText
                  size={15}
                  weight="bold"
                  color="#ef4444"
                  style={{ marginLeft: 8 }}
                >
                  Application Rejected
                </AppText>
              </View>
              <AppText
                size={14}
                color={colors.text}
                style={{ marginTop: 6, lineHeight: 20 }}
              >
                {application.rejectionReason ||
                  "Your documents did not meet our compliance requirements. Please adjust and re-upload."}
              </AppText>
            </View>
          )}

          <AppText
            size={13}
            weight="bold"
            color={colors.primary}
            style={styles.sectionHeader}
          >
            VEHICLE SPECIFICATIONS
          </AppText>
          <View
            style={[
              styles.formBlock,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <AppText
              size={13}
              weight="medium"
              color={colors.text}
              style={styles.fieldLabel}
            >
              Car Model / Brand
            </AppText>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="e.g. Toyota Corolla"
              placeholderTextColor={colors.textMuted}
              value={carModel}
              onChangeText={setCarModel}
            />

            <AppText
              size={13}
              weight="medium"
              color={colors.text}
              style={[styles.fieldLabel, { marginTop: 14 }]}
            >
              License Plate Number
            </AppText>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="e.g. LAG-123AA"
              placeholderTextColor={colors.textMuted}
              value={licensePlate}
              onChangeText={setLicensePlate}
              autoCapitalize="characters"
            />

            <AppText
              size={13}
              weight="medium"
              color={colors.text}
              style={[styles.fieldLabel, { marginTop: 14 }]}
            >
              Production Year
            </AppText>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="e.g. 2015"
              placeholderTextColor={colors.textMuted}
              value={carYear}
              onChangeText={setCarYear}
              keyboardType="numeric"
              maxLength={4}
            />
          </View>

          <AppText
            size={13}
            weight="bold"
            color={colors.primary}
            style={styles.sectionHeader}
          >
            LEGAL DOCUMENTATION
          </AppText>
          <View
            style={[
              styles.formBlock,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <AppText
              size={13}
              weight="medium"
              color={colors.text}
              style={styles.fieldLabel}
            >
              Driver's License Number
            </AppText>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Enter license number"
              placeholderTextColor={colors.textMuted}
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              autoCapitalize="characters"
            />

            {/* License Picker Upload Anchor UI */}
            <AppText
              size={13}
              weight="medium"
              color={colors.text}
              style={[styles.fieldLabel, { marginTop: 16 }]}
            >
              Driver's License Card Image
            </AppText>
            <TouchableOpacity
              style={[
                styles.uploadBox,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
              onPress={pickDriversLicense}
            >
              {licenseImageUri ? (
                <View style={styles.previewContainer}>
                  <RNImage
                    source={{ uri: licenseImageUri }}
                    style={styles.fullImagePreview}
                  />
                  <View style={styles.changeOverlay}>
                    <UploadCloud size={16} color="#fff" />
                    <AppText size={12} color="#fff" style={{ marginLeft: 6 }}>
                      Replace Image
                    </AppText>
                  </View>
                </View>
              ) : (
                <View style={{ alignItems: "center", padding: 20 }}>
                  <FileText
                    size={32}
                    color={colors.textMuted}
                    style={{ marginBottom: 8 }}
                  />
                  <AppText size={14} color={colors.text} weight="medium">
                    Upload License Photo
                  </AppText>
                  <AppText
                    size={12}
                    color={colors.textMuted}
                    style={{ marginTop: 2 }}
                  >
                    Formats: JPG, PNG up to 5MB
                  </AppText>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <AppText
            size={13}
            weight="bold"
            color={colors.primary}
            style={styles.sectionHeader}
          >
            VEHICLE PHOTOS (MAX 4)
          </AppText>
          <View
            style={[
              styles.formBlock,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.uploadBox,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  borderStyle: "dashed",
                },
              ]}
              onPress={pickCarImages}
              disabled={carImageUris.length >= 4}
            >
              <View style={{ alignItems: "center", padding: 16 }}>
                <Car
                  size={32}
                  color={
                    carImageUris.length >= 4 ? colors.border : colors.textMuted
                  }
                  style={{ marginBottom: 6 }}
                />
                <AppText
                  size={14}
                  color={
                    carImageUris.length >= 4 ? colors.textMuted : colors.text
                  }
                  weight="medium"
                >
                  {carImageUris.length >= 4
                    ? "Photo Limit Reached"
                    : "Select Car Images"}
                </AppText>
                <AppText
                  size={12}
                  color={colors.textMuted}
                  style={{ marginTop: 2 }}
                >
                  {carImageUris.length}/4 images uploaded (Max 5MB each)
                </AppText>
              </View>
            </TouchableOpacity>

            {carImageUris.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 14 }}
              >
                {carImageUris.map((uri, index) => (
                  <View key={index} style={styles.thumbnailWrapper}>
                    <RNImage source={{ uri }} style={styles.thumbnailImage} />
                    <TouchableOpacity
                      style={styles.removeBadge}
                      onPress={() => removeCarImageInstance(index)}
                    >
                      <Trash2 size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Global Error Output Elements */}
          {(validationError || driverError) && (
            <View
              style={[
                styles.errorCard,
                { backgroundColor: isDark ? "#2a1414" : "#fef2f2" },
              ]}
            >
              <AppText
                size={13}
                color="#ef4444"
                style={{ textAlign: "center" }}
              >
                {validationError || driverError}
              </AppText>
            </View>
          )}

          {/* Submit Execution Component */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleSubmitApplication}
            disabled={isDriverLoading}
            activeOpacity={0.85}
          >
            {isDriverLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <AppText size={16} weight="bold" color="#fff">
                Submit Registration
              </AppText>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerArea: {
    borderBottomWidth: 1,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: { padding: 16, paddingBottom: 40 },
  criteriaBanner: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 22,
  },
  sectionHeader: { marginBottom: 10, letterSpacing: 0.5 },
  formBlock: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 22,
  },
  fieldLabel: { marginBottom: 6 },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  uploadBox: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
    justifyContent: "center",
  },
  previewContainer: { width: "100%", height: 160 },
  fullImagePreview: { width: "100%", height: "100%" },
  changeOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  thumbnailWrapper: { marginRight: 12, position: "relative" },
  thumbnailImage: { width: 72, height: 72, borderRadius: 10 },
  removeBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#ef4444",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  errorCard: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  submitButton: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  stateTitle: { marginTop: 16, textAlign: "center" },
  stateSubtitle: {
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  reasonBox: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 20,
  },
  actionButton: {
    width: "80%",
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
  },
  rejectedBanner: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
});
