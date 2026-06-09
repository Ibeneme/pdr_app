import React from "react";
import { Text, TextProps } from "react-native";

export type FontWeight =
  | "regular"
  | "medium"
  | "bold"
  | "extraBold"
  | "semibold";

interface AppTextProps extends TextProps {
  children: React.ReactNode;
  size?: number;
  color?: string;
  weight?: FontWeight;
}

// Update these strings to match the names used in your Font.loadAsync or react-native.config.js
const fontMap = {
  regular: "RethinkSans-Regular",
  medium: "RethinkSans-Bold",
  semibold: "RethinkSans-Bold",
  bold: "RethinkSans-Bold",
  extraBold: "RethinkSans-ExtraBold",
};

export const AppText: React.FC<AppTextProps> = ({
  children,
  size = 14,
  color = "#000",
  weight = "regular",
  opacity = 1,
  style,
  ...rest
}) => (
  <Text
    style={[
      {
        fontFamily: fontMap[weight] || fontMap.regular,
        fontSize: size,
        color,
      },
      style,
    ]}
    {...rest}
  >
    {children}
  </Text>
);
