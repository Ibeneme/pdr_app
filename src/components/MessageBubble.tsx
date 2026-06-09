import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "@/components/AppText";

interface MessageBubbleProps {
  text: string;
  senderName?: string;
  isMyMessage: boolean;
  theme: any; // Using the theme object from context
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  text,
  senderName,
  isMyMessage,
  theme,
}) => {
  return (
    <View
      style={[
        styles.bubble,
        isMyMessage
          ? {
              alignSelf: "flex-end",
              backgroundColor: theme.primary,
              borderBottomRightRadius: 4,
            }
          : {
              alignSelf: "flex-start",
              backgroundColor: theme.surface,
              borderBottomLeftRadius: 4,
            },
      ]}
    >
      {!isMyMessage && senderName && (
        <AppText size={12} color={theme.textMuted} style={{ marginBottom: 4 }}>
          {senderName}
        </AppText>
      )}
      <AppText color={isMyMessage ? "#FFF" : theme.text} style={styles.text}>
        {text}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    maxWidth: "78%",
    padding: 14,
    borderRadius: 20,
    marginVertical: 4,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
});
