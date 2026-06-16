import React from "react";
import { View, TouchableOpacity } from "react-native";
import { AppText } from "@/components/AppText";
import { useTheme } from "@/contexts/ThemeContext";

interface LocationSelectorProps {
  pickupAddress: string;
  deliveryAddress: string;
  onPickupPress: () => void;
  onDeliveryPress: () => void;
}

export default function LocationSelector({
  pickupAddress,
  deliveryAddress,
  onPickupPress,
  onDeliveryPress,
}: LocationSelectorProps) {
  const { theme } = useTheme();

  return (
    <View style={{ marginBottom: 24 }}>
      <AppText style={[styles.sectionTitle, { color: theme.textMuted }]}>
        DELIVERY ROUTE
      </AppText>

      {/* Pickup */}
      <TouchableOpacity
        activeOpacity={0.7}
        style={[
          styles.clickableInputContainer,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
        onPress={onPickupPress}
      >
        <AppText
          numberOfLines={1}
          style={[
            styles.selectTextLabel,
            { color: pickupAddress ? theme.text : theme.textMuted },
          ]}
        >
          {pickupAddress || "Where should we pick up from?"}
        </AppText>
        <AppText
          style={{ fontSize: 12, color: theme.primary, fontWeight: "bold" }}
        >
          Select
        </AppText>
      </TouchableOpacity>

      {/* Delivery */}
      <TouchableOpacity
        activeOpacity={0.7}
        style={[
          styles.clickableInputContainer,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
        onPress={onDeliveryPress}
      >
        <AppText
          numberOfLines={1}
          style={[
            styles.selectTextLabel,
            { color: deliveryAddress ? theme.text : theme.textMuted },
          ]}
        >
          {deliveryAddress || "Where should we deliver to?"}
        </AppText>
        <AppText
          style={{ fontSize: 12, color: theme.primary, fontWeight: "bold" }}
        >
          Select
        </AppText>
      </TouchableOpacity>
    </View>
  );
}

const styles = {
  sectionTitle: {
    fontSize: 14,
    letterSpacing: 1.5,
    marginBottom: 12,
    fontWeight: "bold",
  },
  clickableInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  selectTextLabel: {
    flex: 1,
    fontSize: 15,
  },
};
