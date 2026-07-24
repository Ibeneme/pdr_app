import React, { useEffect, useRef, useState } from "react";
import { NigeriaCitiesGrid, NigeriaCity } from "./NigeriaCitiesGrid";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Dimensions } from "react-native";
import { View } from "react-native";
import { StyleSheet } from "react-native";
import { AppText } from "./AppText";
import { AlertCircle, Check, CheckCircle2, X } from "lucide-react-native";
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export const FONT_FAMILY = "RethinkSans-Regular";

export const getDaysInMonth = (month: number, year: number) =>
  new Date(year, month + 1, 0).getDate();

export const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);

// ---------------------------------------------------------------------------
// Generic bottom sheet modal
// ---------------------------------------------------------------------------
export interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeightPct?: number;
  minHeightPct?: number;
}

export const BottomSheetModal: React.FC<BottomSheetModalProps> = ({
  visible,
  onClose,
  children,
  maxHeightPct = 0.85,
  minHeightPct = 0.2,
}) => {
  const { theme: colors } = useTheme();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start();
    } else if (mounted) {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }).start(() => setMounted(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!mounted) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <Animated.View
          style={[
            styles.modalSheet,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              maxHeight: SCREEN_HEIGHT * maxHeightPct,
              transform: [{ translateY }],
              minHeight: SCREEN_HEIGHT * minHeightPct,
            },
          ]}
        >
          <View
            style={[styles.modalHandle, { backgroundColor: colors.border }]}
          />
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Notification modal (replaces Alert.alert everywhere)
// ---------------------------------------------------------------------------
export interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  type: "error" | "success";
  title: string;
  messages: string[];
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  visible,
  onClose,
  type,
  title,
  messages,
}) => {
  const { theme: colors } = useTheme();
  const tint = type === "error" ? "#EF4444" : "#10B981";

  return (
    <BottomSheetModal visible={visible} onClose={onClose} maxHeightPct={0.6}>
      <View style={styles.notifyContent}>
        <View style={[styles.notifyIconBox, { backgroundColor: `${tint}1A` }]}>
          {type === "error" ? (
            <AlertCircle size={30} color={tint} />
          ) : (
            <CheckCircle2 size={30} color={tint} />
          )}
        </View>
        <AppText
          size={17}
          weight="bold"
          color={colors.text}
          style={{ marginTop: 14 }}
        >
          {title}
        </AppText>
        <View style={{ marginTop: 12, width: "100%" }}>
          {messages.map((msg, idx) => (
            <View key={idx} style={styles.notifyRow}>
              <View style={[styles.notifyDot, { backgroundColor: tint }]} />
              <AppText
                size={13.5}
                color={colors.textMuted}
                style={{ flex: 1, fontFamily: FONT_FAMILY }}
              >
                {msg}
              </AppText>
            </View>
          ))}
        </View>
        <TouchableOpacity
          style={[styles.notifyButton, { backgroundColor: colors.text }]}
          onPress={onClose}
          activeOpacity={0.85}
        >
          <AppText size={15} weight="bold" color={colors.background}>
            Okay, Got It
          </AppText>
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
};

// ---------------------------------------------------------------------------
// Date & Time picker modal (fully custom, no external dependency)
// ---------------------------------------------------------------------------
export interface DateTimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (dateStr: string, timeStr: string) => void;
  initialDate?: Date;
}

export const DateTimePickerModal: React.FC<DateTimePickerModalProps> = ({
  visible,
  onClose,
  onConfirm,
  initialDate,
}) => {
  const { theme: colors } = useTheme();
  const base = initialDate || new Date();

  const [year, setYear] = useState(base.getFullYear());
  const [month, setMonth] = useState(base.getMonth());
  const [day, setDay] = useState(base.getDate());

  const hour24 = base.getHours();
  const initialHour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const [hour, setHour] = useState(initialHour12);
  const [minute, setMinute] = useState(
    Math.round(base.getMinutes() / 5) * 5 === 60
      ? 0
      : Math.round(base.getMinutes() / 5) * 5
  );
  const [period, setPeriod] = useState<"AM" | "PM">(hour24 >= 12 ? "PM" : "AM");

  const years = Array.from({ length: 3 }, (_, i) => base.getFullYear() + i);
  const days = Array.from(
    { length: getDaysInMonth(month, year) },
    (_, i) => i + 1
  );
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  const handleConfirm = () => {
    const dateStr = `${year}-${pad2(month + 1)}-${pad2(day)}`;
    let hour24Result = hour % 12;
    if (period === "PM") hour24Result += 12;
    const timeStr = `${pad2(hour24Result)}:${pad2(minute)}`;
    onConfirm(dateStr, timeStr);
    onClose();
  };

  const renderPillRow = <T extends number | string>(
    items: T[],
    selected: T,
    onSelect: (val: T) => void,
    formatter?: (val: T) => string
  ) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.pickerPillRow}
    >
      {items.map((item) => {
        const isSelected = item === selected;
        return (
          <TouchableOpacity
            key={String(item)}
            activeOpacity={0.8}
            onPress={() => onSelect(item)}
            style={[
              styles.pickerPill,
              {
                backgroundColor: isSelected ? colors.text : colors.surface,
                borderColor: isSelected ? colors.text : colors.border,
              },
            ]}
          >
            <AppText
              size={13.5}
              weight="bold"
              color={isSelected ? colors.background : colors.text}
            >
              {formatter ? formatter(item) : String(item)}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  return (
    <BottomSheetModal visible={visible} onClose={onClose} maxHeightPct={0.85}>
      <ScrollView
        contentContainerStyle={styles.dtpContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.dtpHeaderRow}>
          <AppText size={17} weight="bold" color={colors.text}>
            Select Date & Time
          </AppText>
          <TouchableOpacity onPress={onClose} style={styles.dtpCloseBtn}>
            <X size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <AppText
          size={11}
          weight="bold"
          color={colors.textMuted}
          style={styles.dtpLabel}
        >
          MONTH
        </AppText>
        {renderPillRow(
          MONTHS.map((_, idx) => idx),
          month,
          (val) => {
            setMonth(val);
            const maxDay = getDaysInMonth(val, year);
            if (day > maxDay) setDay(maxDay);
          },
          (val) => MONTHS[val].slice(0, 3)
        )}

        <AppText
          size={11}
          weight="bold"
          color={colors.textMuted}
          style={styles.dtpLabel}
        >
          DAY
        </AppText>
        {renderPillRow(days, day, setDay)}

        <AppText
          size={11}
          weight="bold"
          color={colors.textMuted}
          style={styles.dtpLabel}
        >
          YEAR
        </AppText>
        {renderPillRow(years, year, setYear)}

        <View style={[styles.dtpDivider, { backgroundColor: colors.border }]} />

        <AppText
          size={11}
          weight="bold"
          color={colors.textMuted}
          style={styles.dtpLabel}
        >
          HOUR
        </AppText>
        {renderPillRow(hours, hour, setHour)}

        <AppText
          size={11}
          weight="bold"
          color={colors.textMuted}
          style={styles.dtpLabel}
        >
          MINUTE
        </AppText>
        {renderPillRow(minutes, minute, setMinute, (val) => pad2(val))}

        <AppText
          size={11}
          weight="bold"
          color={colors.textMuted}
          style={styles.dtpLabel}
        >
          PERIOD
        </AppText>
        {renderPillRow(["AM", "PM"], period, (val) =>
          setPeriod(val as "AM" | "PM")
        )}

        <TouchableOpacity
          style={[styles.dtpConfirmBtn, { backgroundColor: colors.text }]}
          onPress={handleConfirm}
          activeOpacity={0.85}
        >
          <AppText size={15} weight="bold" color={colors.background}>
            Confirm Date & Time
          </AppText>
        </TouchableOpacity>
      </ScrollView>
    </BottomSheetModal>
  );
};

// ---------------------------------------------------------------------------
// Location picker modal (wraps NigeriaCitiesGrid)
// ---------------------------------------------------------------------------
export interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  onSelectCity: (city: NigeriaCity) => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  visible,
  onClose,
  title,
  onSelectCity,
}) => {
  const { theme: colors } = useTheme();

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      maxHeightPct={0.92}
      minHeightPct={0.8}
    >
      <View style={styles.locHeaderRow}>
        <AppText size={17} weight="bold" color={colors.text}>
          {title}
        </AppText>
        <TouchableOpacity onPress={onClose} style={styles.dtpCloseBtn}>
          <X size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1, marginHorizontal: -24 }}>
        <NigeriaCitiesGrid
          onCityPress={(city) => {
            onSelectCity(city);
            onClose();
          }}
        />
      </View>
    </BottomSheetModal>
  );
};

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------
export interface StepDef {
  key: string;
  label: string;
}

export interface StepIndicatorProps {
  steps: StepDef[];
  currentIndex: number;
  accent: string;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentIndex,
  accent,
}) => {
  const { theme: colors } = useTheme();

  return (
    <View style={styles.stepIndicatorRow}>
      {steps.map((step, idx) => {
        const isCompleted = idx < currentIndex;
        const isActive = idx === currentIndex;
        return (
          <React.Fragment key={step.key}>
            <View style={styles.stepIndicatorItem}>
              <View
                style={[
                  styles.stepCircle,
                  {
                    backgroundColor:
                      isCompleted || isActive ? accent : colors.surface,
                    borderColor:
                      isCompleted || isActive ? accent : colors.border,
                  },
                ]}
              >
                {isCompleted ? (
                  <Check size={14} color="#FFFFFF" />
                ) : (
                  <AppText
                    size={12}
                    weight="bold"
                    color={isActive ? "#FFFFFF" : colors.textMuted}
                  >
                    {idx + 1}
                  </AppText>
                )}
              </View>
              <AppText
                size={10}
                weight="bold"
                color={isActive ? colors.text : colors.textMuted}
                style={styles.stepLabel}
                numberOfLines={1}
              >
                {step.label}
              </AppText>
            </View>
            {idx < steps.length - 1 && (
              <View
                style={[
                  styles.stepConnector,
                  { backgroundColor: isCompleted ? accent : colors.border },
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    paddingTop: Platform.OS === "ios" ? 54 : 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 60, gap: 4 },
  introCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 20,
  },
  introIconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  sectionCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  senderCard: {
    padding: 24,
    borderWidth: 1.5,
  },
  noteCard: {
    padding: 16,
  },
  inputGroup: { marginBottom: 16 },
  label: { marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
  },
  iconInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconInputText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    padding: 0,
  },
  iconInputRowHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationInputTouchable: {
    flexDirection: "row",
    alignItems: "center",
  },
  row: { flexDirection: "row" },
  useNowButton: {
    marginTop: 4,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  navRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  prevButton: {
    flex: 1,
    height: 56,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 56,
    borderRadius: 999,
  },
  submitChevron: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  // Step indicator
  stepIndicatorRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
  },
  stepIndicatorItem: {
    alignItems: "center",
    width: 64,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  stepLabel: {
    marginTop: 6,
    textAlign: "center",
  },
  stepConnector: {
    flex: 1,
    height: 2,
    marginTop: 13,
    marginHorizontal: -6,
  },
  // Review rows
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
  },
  // Modal shared
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 14,
  },
  // Notification modal
  notifyContent: {
    alignItems: "center",
    paddingVertical: 10,
  },
  notifyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  notifyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  notifyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
  },
  notifyButton: {
    marginTop: 16,
    width: "100%",
    height: 54,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  // Date time picker modal
  dtpContent: {
    paddingBottom: 20,
  },
  dtpHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  dtpCloseBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  dtpLabel: {
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 12,
  },
  pickerPillRow: {
    gap: 8,
    paddingBottom: 4,
  },
  pickerPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  dtpDivider: {
    height: 1,
    marginTop: 16,
  },
  dtpConfirmBtn: {
    marginTop: 22,
    height: 56,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  // Location picker modal
  locHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
});
