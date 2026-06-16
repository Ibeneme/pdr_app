import React from "react";
import { View, TextInput } from "react-native";
import { AppText } from "@/components/AppText";
import { useTheme } from "@/contexts/ThemeContext";

interface PartyDetailsSectionProps {
  type: "sender" | "recipient";
  name: string;
  contact: string;
  onNameChange: (text: string) => void;
  onContactChange: (text: string) => void;
}

export default function PartyDetailsSection({
  type,
  name,
  contact,
  onNameChange,
  onContactChange,
}: PartyDetailsSectionProps) {
  const { theme } = useTheme();
  const title =
    type === "sender" ? "SENDER INFORMATION" : "RECIPIENT INFORMATION";
  const namePlaceholder = type === "sender" ? "Your Name" : "Receiver's Name";

  return (
    <View style={{ marginTop: type === "sender" ? 14 : 6 }}>
      <AppText style={[styles.sectionTitle, { color: theme.textMuted }]}>
        {title}
      </AppText>

      <View style={styles.gridContainer}>
        <View
          style={[
            styles.flexInputWrapper,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <TextInput
            placeholder={namePlaceholder}
            placeholderTextColor={theme.textMuted}
            style={[styles.flexTextInput, { color: theme.text }]}
            value={name}
            onChangeText={onNameChange}
          />
        </View>

        <View
          style={[
            styles.flexInputWrapper,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <TextInput
            placeholder="Phone Number"
            placeholderTextColor={theme.textMuted}
            keyboardType="phone-pad"
            style={[styles.flexTextInput, { color: theme.text }]}
            value={contact}
            onChangeText={onContactChange}
          />
        </View>
      </View>
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
  gridContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 12,
  },
  flexInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  flexTextInput: { flex: 1, fontSize: 15, letterSpacing: 0 },
};
