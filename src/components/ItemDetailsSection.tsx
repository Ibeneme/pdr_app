import React, { useState } from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { AppText } from "@/components/AppText";
import { useTheme } from "@/contexts/ThemeContext";

const COMMON_ITEMS = [
  "Food",
  "Clothes",
  "Documents",
  "Electronics",
  "Bag",
  "Shoes",
  "Books",
  "Jewelry",
  "Medicine",
  "Other",
];

interface ItemDetailsSectionProps {
  itemName: string;
  onItemNameChange: (text: string) => void;
  isFragile: boolean;
  isPerishable: boolean;
  isInsured: boolean;
  onFragileChange: (val: boolean) => void;
  onPerishableChange: (val: boolean) => void;
  onInsuredChange: (val: boolean) => void;
}

export default function ItemDetailsSection({
  itemName,
  onItemNameChange,
  isFragile,
  isPerishable,
  isInsured,
  onFragileChange,
  onPerishableChange,
  onInsuredChange,
}: ItemDetailsSectionProps) {
  const { theme } = useTheme();
  const [selectedType, setSelectedType] = useState<string>("");

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    if (type !== "Other") {
      onItemNameChange(type);
    } else {
      onItemNameChange(""); // Clear for custom input
    }
  };

  return (
    <View style={{ marginTop: 14 }}>
      <AppText style={[styles.sectionTitle, { color: theme.textMuted }]}>
        ITEM DETAILS
      </AppText>

      {/* Item Type Chips */}
      <View style={styles.chipsContainer}>
        {COMMON_ITEMS.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.chip,
              {
                backgroundColor:
                  selectedType === type ? theme.primary : theme.surface,
                borderColor:
                  selectedType === type ? theme.primary : theme.border,
              },
            ]}
            onPress={() => handleTypeSelect(type)}
          >
            <AppText
              style={{
                color: selectedType === type ? "#fff" : theme.text,
                fontSize: 14,
                fontWeight: "500",
              }}
            >
              {type}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Custom Input - Shown only when "Other" is selected */}
      {selectedType === "Other" && (
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <TextInput
            placeholder="Describe the item (e.g. Laptop, Handbag, etc.)"
            placeholderTextColor={theme.textMuted}
            style={[styles.textInput, { color: theme.text }]}
            value={itemName}
            onChangeText={onItemNameChange}
          />
        </View>
      )}

      {/* If a common item is selected, show it as read-only or allow edit */}
      {selectedType && selectedType !== "Other" && itemName && (
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <TextInput
            style={[styles.textInput, { color: theme.text }]}
            value={itemName}
            onChangeText={onItemNameChange}
          />
        </View>
      )}
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
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  inputContainer: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
  },
};
