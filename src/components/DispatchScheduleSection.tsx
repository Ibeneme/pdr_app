import React from "react";
import { View, TouchableOpacity } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { AppText } from "@/components/AppText";
import { useTheme } from "@/contexts/ThemeContext";

interface DispatchScheduleSectionProps {
  isImpromptu: boolean;
  dispatchDate: Date;
  showDatePicker: boolean;
  onImpromptuChange: (value: boolean) => void;
  onSchedulePress: () => void;
  onDateChange: any;
  onClosePicker: () => void;
}

export default function DispatchScheduleSection({
  isImpromptu,
  dispatchDate,
  showDatePicker,
  onImpromptuChange,
  onSchedulePress,
  onDateChange,
  onClosePicker,
}: DispatchScheduleSectionProps) {
  const { theme } = useTheme();

  return (
    <>
      <AppText
        style={[styles.sectionTitle, { color: theme.textMuted, marginTop: 14 }]}
      >
        WHEN SHOULD WE SEND IT?
      </AppText>

      <View style={styles.gridContainer}>
        <TouchableOpacity
          style={[
            styles.selectableTab,
            {
              backgroundColor: isImpromptu ? theme.primary : theme.surface,
              borderColor: isImpromptu ? theme.primary : theme.border,
            },
          ]}
          onPress={() => onImpromptuChange(true)}
        >
          <AppText
            style={[
              styles.tabText,
              { color: isImpromptu ? "#FFFFFF" : theme.text },
            ]}
          >
            Send Now
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.selectableTab,
            {
              backgroundColor: !isImpromptu ? theme.primary : theme.surface,
              borderColor: !isImpromptu ? theme.primary : theme.border,
            },
          ]}
          onPress={onSchedulePress}
        >
          <AppText
            style={[
              styles.tabText,
              { color: !isImpromptu ? "#FFFFFF" : theme.text },
            ]}
          >
            {isImpromptu ? "Schedule Later" : dispatchDate.toLocaleDateString()}
          </AppText>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <View
          style={[
            styles.pickerInlineContainer,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <DateTimePicker
            value={dispatchDate}
            mode="date"
            display="spinner"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
          {Platform.OS === "ios" && (
            <TouchableOpacity
              style={styles.closePickerBtn}
              onPress={onClosePicker}
            >
              <AppText style={{ color: theme.primary, fontWeight: "bold" }}>
                Select Date
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      )}
    </>
  );
}

const styles = {
  sectionTitle: {
    fontSize: 14,
    letterSpacing: 1.5,
    marginBottom: 12,
    fontWeight: "bold",
  },
  gridContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 12,
  },
  selectableTab: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: { fontSize: 16, fontWeight: "bold" },
  pickerInlineContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 8,
    marginBottom: 20,
    justifyContent: "center",
  },
  closePickerBtn: { alignSelf: "flex-end", padding: 8, marginRight: 8 },
};
