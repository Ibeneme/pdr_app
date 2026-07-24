import React, { useEffect, useRef, useMemo, useState } from "react";
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
  Dimensions,
  Animated,
} from "react-native";
import { useTheme } from "@contexts/ThemeContext";
import { AppText } from "@/components/AppText";

interface CustomDatePickerProps {
  isVisible?: boolean;
  onClose?: () => void;
  onDateSelect: (date: Date) => void;
  currentDate?: Date;
  minimumDate?: Date; // Legacy prop (kept for backward compatibility)
  minSelectableDate?: Date; // ← New: Strict minimum selectable date (e.g. 01-12-2026)
  disablePastDates?: boolean; // ← New: If true and no minSelectableDate, disables past dates
  onInvalidDateSelect?: (message: string) => void; // ← New: Trigger error toast
  allowOldAge?: boolean;
  yearsBack?: number;
  yearsForward?: number;
  title?: string;
  hint?: string;
  mode?: "modal" | "inline";
}

const { width } = Dimensions.get("window");

const MONTHS = [
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

const MONTHS_SHORT = MONTHS.map((m) => m.substring(0, 3).toUpperCase());
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ITEM_HEIGHT = 46;

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  isVisible = false,
  onClose,
  onDateSelect,
  currentDate = new Date(),
  minimumDate,
  minSelectableDate,
  disablePastDates = false,
  onInvalidDateSelect,
  allowOldAge = false,
  yearsBack,
  yearsForward = 2,
  title = "Select date",
  hint = "Choose the recurring day for monthly autosave",
  mode = "modal",
}) => {
  const { colors: themeColors, isDark } = useTheme();
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  // Determine the effective minimum date
  const effectiveMinDate =
    minSelectableDate || minimumDate || (disablePastDates ? today : null);

  const minYear = effectiveMinDate ? effectiveMinDate.getFullYear() : 1900;
  const minMonth = effectiveMinDate ? effectiveMinDate.getMonth() : 0;
  const minDay = effectiveMinDate ? effectiveMinDate.getDate() : 1;

  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedDay, setSelectedDay] = useState(currentDate.getDate());

  const slideY = useRef(new Animated.Value(420)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const chipScale = useRef(new Animated.Value(1)).current;
  const [modalRendered, setModalRendered] = useState(isVisible);

  // Animation logic
  useEffect(() => {
    if (isVisible) {
      setModalRendered(true);
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(slideY, {
          toValue: 0,
          damping: 18,
          stiffness: 160,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (modalRendered) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slideY, {
          toValue: 420,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => setModalRendered(false));
    }
  }, [isVisible, modalRendered]);

  const pulseChip = () => {
    chipScale.setValue(0.94);
    Animated.spring(chipScale, {
      toValue: 1,
      damping: 10,
      stiffness: 220,
      useNativeDriver: true,
    }).start();
  };

  const years = useMemo(() => {
    const back = yearsBack ?? (allowOldAge ? 100 : 5);
    const forward = yearsForward ?? 2;
    const startYear = Math.max(currentYear - back, minYear);
    const endYear = currentYear + forward;
    const yearList: number[] = [];
    for (let i = endYear; i >= startYear; i--) yearList.push(i);
    return yearList;
  }, [yearsBack, yearsForward, allowOldAge, currentYear, minYear]);

  const availableMonths = useMemo(() => {
    const allMonths = MONTHS.map((name, index) => ({ name, index }));
    if (!effectiveMinDate || selectedYear > minYear) return allMonths;

    return allMonths.filter(({ index }) => {
      if (selectedYear === minYear) return index >= minMonth;
      return true;
    });
  }, [selectedYear, minYear, minMonth, effectiveMinDate]);

  const daysInMonth = useMemo(() => {
    const days = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    let dayList = Array.from({ length: days }, (_, i) => i + 1);

    if (
      effectiveMinDate &&
      selectedYear === minYear &&
      selectedMonth === minMonth
    ) {
      dayList = dayList.filter((d) => d >= minDay);
    }

    return dayList;
  }, [
    selectedYear,
    selectedMonth,
    minYear,
    minMonth,
    minDay,
    effectiveMinDate,
  ]);

  // Sync initial date
  useEffect(() => {
    let dateToUse = currentDate;
    if (effectiveMinDate && currentDate < effectiveMinDate) {
      dateToUse = effectiveMinDate;
    }
    setSelectedYear(dateToUse.getFullYear());
    setSelectedMonth(dateToUse.getMonth());
    setSelectedDay(dateToUse.getDate());
  }, [currentDate, effectiveMinDate]);

  useEffect(() => {
    if (selectedDay > daysInMonth.length) {
      setSelectedDay(daysInMonth[daysInMonth.length - 1] || 1);
    }
  }, [daysInMonth]);

  useEffect(() => {
    if (!availableMonths.some((m) => m.index === selectedMonth)) {
      setSelectedMonth(availableMonths[0]?.index ?? currentMonth);
    }
  }, [availableMonths, selectedMonth, currentMonth]);

  const validateAndSelect = (date: Date) => {
    if (effectiveMinDate && date < effectiveMinDate) {
      onInvalidDateSelect?.(
        "You cannot select a date before the allowed minimum date."
      );
      return false;
    }
    return true;
  };

  const handleDaySelect = (day: number) => {
    const newDate = new Date(selectedYear, selectedMonth, day);
    if (validateAndSelect(newDate)) {
      setSelectedDay(day);
      pulseChip();
    }
  };

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(selectedYear, monthIndex, selectedDay);
    if (validateAndSelect(newDate)) {
      setSelectedMonth(monthIndex);
      pulseChip();
    }
  };

  const handleYearSelect = (year: number) => {
    const newDate = new Date(year, selectedMonth, selectedDay);
    if (validateAndSelect(newDate)) {
      setSelectedYear(year);
      pulseChip();
    }
  };

  const handleConfirm = () => {
    const selectedDate = new Date(selectedYear, selectedMonth, selectedDay);
    if (validateAndSelect(selectedDate)) {
      onDateSelect(selectedDate);
      onClose?.();
    }
  };

  const previewWeekday = useMemo(() => {
    const validDay = Math.min(selectedDay, daysInMonth.length || 1);
    const d = new Date(selectedYear, selectedMonth, validDay);
    return WEEKDAYS[d.getDay()];
  }, [selectedYear, selectedMonth, selectedDay, daysInMonth]);

  const cardBg = mode === "inline" ? themeColors.card : themeColors.background;
  const railColor = isDark ? "#ffffff20" : "#14070018";
  const dividerColor = isDark ? "#ffffff0F" : "#14070009";

  const renderColumn = <T,>(col: any) => (
    <View style={[styles.columnGroup, col.flex ? { flex: col.flex } : null]}>
      <AppText
        size={11}
        weight="bold"
        color={themeColors.text}
        style={styles.columnLabel}
      >
        {col.label}
      </AppText>
      <View style={styles.columnFrame}>
        <ScrollView
          style={styles.columnScroll}
          contentContainerStyle={styles.columnScrollContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {col.data.map((item: any) => {
            const value = col.value(item);
            const isSelected = value === col.selected;
            return (
              <TouchableOpacity
                key={`${col.key}-${value}`}
                activeOpacity={0.6}
                style={styles.itemRow}
                onPress={() => col.onSelect(value)}
              >
                <AppText
                  size={isSelected ? 19 : 15.5}
                  weight={isSelected ? "bold" : "medium"}
                  color={isSelected ? themeColors.primary : themeColors.text}
                >
                  {col.text(item)}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );

  const PickerContent = (
    <View
      style={[
        styles.modalContainer,
        mode === "inline" && styles.inlineContainer,
        { backgroundColor: cardBg },
      ]}
    >
      {mode === "modal" && (
        <View style={[styles.dragHandle, { backgroundColor: railColor }]} />
      )}
      <View style={styles.scrollContent}>
        {/* HEADER */}
        <View
          style={[
            styles.header,
            mode === "modal" && {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: dividerColor,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <AppText size={19} weight="bold" color={themeColors.text}>
              {title}
            </AppText>
            {hint && (
              <AppText
                size={13}
                color={themeColors.text + "60"}
                style={styles.hint}
              >
                {hint}
              </AppText>
            )}
          </View>
          <View style={styles.headerActions}>
            {onClose && (
              <TouchableOpacity
                onPress={onClose}
                style={styles.headerActionBtn}
              >
                <AppText
                  size={15}
                  weight="semibold"
                  color={themeColors.text + "70"}
                >
                  Cancel
                </AppText>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleConfirm}
              style={[
                styles.confirmBtn,
                { backgroundColor: themeColors.primary },
              ]}
            >
              <AppText size={14.5} weight="bold" color="#FFF">
                Confirm
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Preview Chip */}
        <View style={styles.previewRow}>
          <Animated.View
            style={[
              styles.previewChip,
              {
                backgroundColor: isDark
                  ? "rgba(255,102,0,0.12)"
                  : "rgba(255,102,0,0.07)",
                transform: [{ scale: chipScale }],
              },
            ]}
          >
            <View
              style={[
                styles.previewDot,
                { backgroundColor: themeColors.primary },
              ]}
            />
            <AppText size={14.5} weight="bold" color={themeColors.primary}>
              {previewWeekday}, {selectedDay} {MONTHS_SHORT[selectedMonth]}{" "}
              {selectedYear}
            </AppText>
          </Animated.View>
        </View>

        {/* Pickers */}
        <View style={styles.pickersWrapper}>
          <View pointerEvents="none" style={[styles.selectionRail]} />
          {renderColumn({
            key: "d",
            label: "DAY",
            data: daysInMonth,
            value: (d: number) => d,
            text: (d: number) => `${d}`,
            selected: selectedDay,
            onSelect: handleDaySelect,
          })}
          <View
            style={[styles.colDivider, { backgroundColor: dividerColor }]}
          />
          {renderColumn({
            key: "m",
            label: "MONTH",
            flex: 1.35,
            data: availableMonths,
            value: (m: any) => m.index,
            text: (m: any) => m.name.substring(0, 3).toUpperCase(),
            selected: selectedMonth,
            onSelect: handleMonthSelect,
          })}

          {(mode === "modal" || yearsBack !== false) && (
            <>
              <View
                style={[styles.colDivider, { backgroundColor: dividerColor }]}
              />
              {renderColumn({
                key: "y",
                label: "YEAR",
                data: years,
                value: (y: number) => y,
                text: (y: number) => `${y}`,
                selected: selectedYear,
                onSelect: handleYearSelect,
              })}
            </>
          )}
        </View>
      </View>
    </View>
  );

  if (mode === "inline") return PickerContent;
  if (!modalRendered) return null;

  return (
    <Modal
      visible={modalRendered}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.animatedWrapper,
            { transform: [{ translateY: slideY }] },
          ]}
        >
          {PickerContent}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(8,4,2,0.65)",
    justifyContent: "flex-end",
  },
  animatedWrapper: { width: "100%" },
  modalContainer: { borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  inlineContainer: { borderRadius: 0, marginTop: 12 },
  scrollContent: { paddingBottom: 36 },
  dragHandle: {
    width: 36,
    height: 4.5,
    borderRadius: 3,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 16,
  },
  hint: { marginTop: 4, lineHeight: 18 },
  headerActions: { flexDirection: "row", alignItems: "center", marginLeft: 12 },
  headerActionBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  confirmBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 48 },
  previewRow: { alignItems: "center", paddingVertical: 12 },
  previewChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 48,
  },
  previewDot: { width: 7, height: 7, borderRadius: 4 },
  pickersWrapper: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 10,
    height: 270,
    position: "relative",
  },
  selectionRail: {
    position: "absolute",
    left: 8,
    right: 8,
    top: 92,
    height: ITEM_HEIGHT,
    borderRadius: 12,
  },
  columnGroup: { flex: 1 },
  columnFrame: { flex: 1 },
  columnScroll: { flex: 1 },
  columnScrollContent: { paddingBottom: 80 },
  colDivider: {
    width: StyleSheet.hairlineWidth,
    marginHorizontal: 2,
    marginTop: 52,
  },
  columnLabel: { textAlign: "center", marginBottom: 12, letterSpacing: 1.2 },
  itemRow: {
    height: ITEM_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    marginHorizontal: 4,
  },
});

export default CustomDatePicker;
