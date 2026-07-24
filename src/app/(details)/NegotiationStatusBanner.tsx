import React from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { AppText } from "@/components/AppText";

interface ThemeProps {
  surface: string;
  background: string;
  border: string;
  primary: string;
  text: string;
  textMuted: string;
}

interface NegotiationStatusBannerProps {
  status: string;
  isPaid: boolean;
  isServiceProvider: boolean;
  theme: ThemeProps;
  onUpdatePress?: () => void;
  showDropdown?: boolean;
  onDropdownOptionSelect?: (nextStatus: string) => void;
  isUpdatingStatus?: boolean;
}

export const NegotiationStatusBanner: React.FC<
  NegotiationStatusBannerProps
> = ({
  status = "ride pending",
  isPaid = false,
  isServiceProvider = false,
  theme,
  onUpdatePress,
  showDropdown = false,
  onDropdownOptionSelect,
  isUpdatingStatus = false,
}) => {
  const rideStatuses = [
    "ride pending",
    "ride agreed",
    "ride started",
    "ride ongoing",
    "ride completed",
    "ride cancelled",
  ];

  const getStatusColor = (currentStatus: string) => {
    switch (currentStatus.toLowerCase()) {
      case "ride completed":
        return "#10B981"; // Green
      case "ride cancelled":
        return "#EF4444"; // Red
      case "ride ongoing":
      case "ride started":
        return theme.primary;
      default:
        return "#F59E0B"; // Amber Warning
    }
  };

  return (
    <View
      style={[
        styles.rideStatusBanner,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      {/* Banner Header Row */}
      <View style={styles.statusBannerHeader}>
        <View style={styles.statusInfoGroup}>
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: `${getStatusColor(status)}15` },
            ]}
          >
            <MaterialCommunityIcons
              name={status.includes("complete") ? "car-check" : "car-connected"}
              size={16}
              color={getStatusColor(status)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppText
              size={11}
              color={theme.textMuted}
              weight="bold"
              style={styles.labelText}
            >
              {isPaid ? "TRACKING STATUS" : "NEGOTIATION STATUS"}
            </AppText>
            <AppText
              size={14}
              weight="bold"
              color={theme.text}
              style={styles.statusText}
            >
              {status}
            </AppText>
          </View>
        </View>

        {/* Action button visible only to operators handling paid items */}
        {isPaid && isServiceProvider && onUpdatePress && (
          <TouchableOpacity
            style={[
              styles.updateTriggerBtn,
              { backgroundColor: theme.primary },
            ]}
            onPress={onUpdatePress}
            activeOpacity={0.8}
          >
            <AppText size={12} weight="bold" color="#FFF">
              Update
            </AppText>
            <Ionicons
              name={showDropdown ? "chevron-up" : "chevron-down"}
              size={14}
              color="#FFF"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Conditional Dropdown Selection Body */}
      {showDropdown &&
        isPaid &&
        isServiceProvider &&
        onDropdownOptionSelect && (
          <View
            style={[styles.statusDropdown, { borderTopColor: theme.border }]}
          >
            {isUpdatingStatus ? (
              <ActivityIndicator
                size="small"
                color={theme.primary}
                style={{ marginVertical: 14 }}
              />
            ) : (
              rideStatuses.map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[
                    styles.statusOptionRow,
                    status.toLowerCase() === st.toLowerCase() && {
                      backgroundColor: `${theme.primary}10`,
                    },
                  ]}
                  onPress={() => onDropdownOptionSelect(st)}
                >
                  <AppText
                    size={13}
                    color={
                      status.toLowerCase() === st.toLowerCase()
                        ? theme.primary
                        : theme.text
                    }
                    weight={
                      status.toLowerCase() === st.toLowerCase()
                        ? "bold"
                        : "medium"
                    }
                    style={{ textTransform: "capitalize" }}
                  >
                    {st}
                  </AppText>
                  {status.toLowerCase() === st.toLowerCase() && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={theme.primary}
                    />
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
    </View>
  );
};

const styles = StyleSheet.create({
  rideStatusBanner: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    width: "100%",
  },
  statusBannerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusInfoGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  labelText: {
    letterSpacing: 0.5,
  },
  statusText: {
    textTransform: "capitalize",
    marginTop: 2,
  },
  updateTriggerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  statusDropdown: {
    marginTop: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    gap: 2,
  },
  statusOptionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
});
