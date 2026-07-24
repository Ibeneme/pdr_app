import React, { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { ActivityIndicator, View, Platform, StatusBar } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

// Provider & Data Layer Imports
import { Provider } from "react-redux";
import { store } from "@/api/store";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import { getAuthToken } from "@/api/secureStore";
import { SocketProvider } from "@/contexts/socket";
import { NetworkMonitor } from "@/components/NetworkMonitor";
import { AppUpdateModal } from "@/components/AppUpdateModal";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    "RethinkSans-Regular": require("../../assets/fonts/RethinkSans-Regular.ttf"),
    "RethinkSans-Medium": require("../../assets/fonts/RethinkSans-Medium.ttf"),
    "RethinkSans-Bold": require("../../assets/fonts/RethinkSans-Bold.ttf"),
  });

  console.log("🔤 Font loading status → Loaded:", loaded, "Error:", !!error);

  useEffect(() => {
    if (loaded || error) {
      console.log("🎨 Fonts loaded or error occurred. Hiding splash screen...");
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    console.log("⏳ Fonts still loading, showing null (splash screen active)");
    return null;
  }

  return (
    <Provider store={store}>
      <ThemeProvider>
        <SocketProvider>
          <SafeAreaProvider>
            <AppUpdateModal />
            <NetworkMonitor />
            <RootLayoutInitializer />
          </SafeAreaProvider>
        </SocketProvider>
      </ThemeProvider>
    </Provider>
  );
}

function RootLayoutInitializer() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [isInitializing, setIsInitializing] = useState(true);

  console.log("🚀 RootLayoutInitializer mounted");

  useEffect(() => {
    async function checkAuthenticationLifecycle() {
      console.log("🔍 Starting authentication check...");

      try {
        const token = await getAuthToken();
        console.log(
          "🔑 Auth token check result:",
          token ? "✅ Token found" : "❌ No token"
        );

        if (token) {
          console.log("✅ User is authenticated → Redirecting to Home");
          router.replace("/(tabs)/home");
        } else {
          console.log("❌ No token found → Redirecting to Onboarding");
          router.replace("/(auth)/Onboarding");
        }
      } catch (err) {
        console.error("❌ Error during auth check:", err);
        console.log("🔄 Falling back to Onboarding screen");
        router.replace("/(auth)/Onboarding");
      } finally {
        console.log(
          "🏁 Authentication check completed. Setting isInitializing to false"
        );
        setIsInitializing(false);
      }
    }

    checkAuthenticationLifecycle();
  }, []);

  // StatusBar Configuration: Inverting text/icon brightness based on dark mode status
  const barStyle = isDark ? "light-content" : "dark-content";

  // Initialization State (Loading)
  if (isInitializing) {
    console.log("⏳ Showing loading screen (authentication check in progress)");
    return (
      <SafeAreaView
        edges={["top", "bottom"]}
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.background,
        }}
      >
        <StatusBar barStyle={barStyle} backgroundColor={theme.background} />
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  console.log("✅ Initialization complete. Rendering main navigation stack");

  if (Platform.OS === "android") {
    return (
      <SafeAreaView
        edges={["top", "bottom"]}
        style={{ flex: 1, backgroundColor: theme.background }}
      >
        <StatusBar
          barStyle={barStyle}
          backgroundColor={theme.background}
          translucent={false}
        />
        <NavigationStack />
      </SafeAreaView>
    );
  }

  // iOS
  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar barStyle={barStyle} backgroundColor={theme.background} />
      <NavigationStack />
    </View>
  );
}

function NavigationStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)/Onboarding" />
      <Stack.Screen name="(auth)/sign-in" />
      <Stack.Screen name="(auth)/otp" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(screens)/notifications" />
      <Stack.Screen name="(screens)/order" />
      <Stack.Screen name="(screens)/profile" />
      <Stack.Screen name="(screens)/settings" />
      <Stack.Screen name="(screens)/support" />
      <Stack.Screen name="(screens)/wallet" />
      <Stack.Screen name="(screens)/withdrawal" />
    </Stack>
  );
}
