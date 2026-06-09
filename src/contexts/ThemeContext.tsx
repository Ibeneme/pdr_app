import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";

// 1. Define our palette with deep purple shades
const palette = {
  purpleLight: "#F3E5F5", // Backgrounds / accents
  purpleMain: "#8E24AA", // Primary buttons, branding
  purpleDark: "#4A148C", // Headings, dark backgrounds
  white: "#FFFFFF",
  black: "#000",
  grayLight: "#f4f4f4",
  grayDark: "#121212",
  textLight: "#333333",
  textDark: "#FFFFFF",
};

// 2. Define the structural theme shape
export const theme = {
  light: {
    background: palette.white,
    surface: palette.grayLight,
    primary: palette.purpleMain,
    primaryDark: palette.purpleDark,
    text: palette.textLight,
    textMuted: "#666666",
    border: "#E0E0E0",
  },
  dark: {
    background: palette.black,
    surface: palette.grayDark,
    primary: palette.purpleMain,
    primaryDark: palette.purpleLight,
    text: palette.textDark,
    textMuted: "#A0A0A0",
    border: "#333333",
  },
};

type ThemeType = typeof theme.light;
type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  theme: ThemeType;
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme(); // Tracks iOS/Android system theme
  const [mode, setMode] = useState<ThemeMode>("system");

  // Determine if the current active state is dark
  const isDark =
    mode === "system" ? systemColorScheme === "dark" : mode === "dark";
  const activeTheme = isDark ? theme.dark : theme.light;

  return (
    <ThemeContext.Provider
      value={{ theme: activeTheme, mode, isDark, setMode }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for easy consumption anywhere in the app
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
