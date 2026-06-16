import React from "react";
import { View, Switch } from "react-native";
import { AppText } from "@/components/AppText";
import { useTheme } from "@/contexts/ThemeContext";

interface SpecialHandlingSectionProps {
  isFragile: boolean;
  isPerishable: boolean;
  isInsured: boolean;
  onFragileChange: (val: boolean) => void;
  onPerishableChange: (val: boolean) => void;
  onInsuredChange?: (val: boolean) => void;
}

export default function SpecialHandlingSection({
  isFragile,
  isPerishable,
  isInsured,
  onFragileChange,
  onPerishableChange,
  onInsuredChange,
}: SpecialHandlingSectionProps) {
  const { theme } = useTheme();

  return (
    <>
      <AppText
        style={[styles.sectionTitle, { color: theme.textMuted, marginTop: 14 }]}
      >
        SPECIAL HANDLING
      </AppText>

      <View
        style={[
          styles.toggleBlockCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View style={styles.toggleRow}>
          <View style={styles.toggleTextContent}>
            <AppText style={[styles.toggleTitle, { color: theme.text }]}>
              Fragile Item
            </AppText>
            <AppText style={[styles.toggleDesc, { color: theme.textMuted }]}>
              Needs gentle handling and extra care
            </AppText>
          </View>
          <Switch
            value={isFragile}
            onValueChange={onFragileChange}
            trackColor={{ false: theme.border, true: theme.primary }}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.toggleRow}>
          <View style={styles.toggleTextContent}>
            <AppText style={[styles.toggleTitle, { color: theme.text }]}>
              Perishable Item
            </AppText>
            <AppText style={[styles.toggleDesc, { color: theme.textMuted }]}>
              Spoils easily or time-sensitive
            </AppText>
          </View>
          <Switch
            value={isPerishable}
            onValueChange={onPerishableChange}
            trackColor={{ false: theme.border, true: theme.primary }}
          />
        </View>
      </View>
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
  toggleBlockCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  toggleTextContent: { flex: 1, paddingRight: 8 },
  toggleTitle: { fontSize: 16, marginBottom: 2, fontWeight: "bold" },
  toggleDesc: { fontSize: 14, lineHeight: 14 },
  divider: { height: 1, width: "100%" },
};
