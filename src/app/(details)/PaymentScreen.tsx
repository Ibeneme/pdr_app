import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Alert,
} from "react-native";
import { WebView, WebViewNavigation } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/api/store";
import { useTheme } from "@/contexts/ThemeContext";
import { AppText } from "@/components/AppText";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  initializePayment,
  verifyPayment,
  clearPaymentState,
} from "@/api/slices/payment.slice";

export default function PaymentScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const isProcessingVerification = useRef(false); // Double-trigger guard

  const { negotiationId, serviceType, amount, email } = useLocalSearchParams<{
    negotiationId: string;
    serviceType?: string;
    amount: string;
    email: string;
  }>();

  const { checkoutUrl, activeReference, isLoading, error, isPaymentSuccess } =
    useSelector((state: RootState) => state.payment);

  const [webLoading, setWebLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  // 1. Initialize Payment Payload
  useEffect(() => {
    if (negotiationId && email && amount) {
      dispatch(
        initializePayment({
          negotiationId,
          serviceType,
          email,
          amount: Number(amount),
        })
      );
    } else {
      Alert.alert("Error", "Missing required transaction information.");
      router.back();
    }

    return () => {
      dispatch(clearPaymentState());
    };
  }, [negotiationId, serviceType, email, amount]);

  // 2. Clear out immediately on Redux slice verification success
  useEffect(() => {
    if (isPaymentSuccess) {
      console.log("✅ [PAYMENT_SUCCESS] Redux state updated. Closing screen.");
      setIsVerifying(false);
      isProcessingVerification.current = false;
    }
  }, [isPaymentSuccess]);

  // 3. Handle validation error state drops
  useEffect(() => {
    if (error && isVerifying) {
      setIsVerifying(false);
      isProcessingVerification.current = false;
      Alert.alert("Payment Failed", error || "Verification failed.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }
  }, [error, isVerifying]);

  // --- JAVASCRIPT INJECTION BRIDGE ---
  const injectedJavaScript = `
    (function() {
      // 1. Listen to inner window postMessages from Paystack frames
      window.addEventListener("message", function(event) {
        try {
          const messageData = typeof event.data === 'string' ? event.data : JSON.stringify(event.data);
          if (messageData.includes("success") || messageData.includes("payment_successful") || messageData.includes("charge.success")) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: "PAYMENT_SUCCESS" }));
          }
        } catch(e) {}
      });

      // 2. Fallback: Periodically poll the DOM for Paystack's native success checkmarks/buttons
      const checkInterval = setInterval(function() {
        const successSelectors = [
          '.success-text', 
          '.main-checkmark', 
          '#success-heading',
          '.payment-success'
        ];
        
        const textContent = document.body ? document.body.innerText.toLowerCase() : '';
        const hasSuccessText = textContent.includes("payment successful") || textContent.includes("payment complete");

        const matchesSelector = successSelectors.some(selector => document.querySelector(selector) !== null);

        if (hasSuccessText || matchesSelector) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: "PAYMENT_SUCCESS" }));
          clearInterval(checkInterval);
        }
      }, 1000);
    })();
    true;
  `;

  // 4. Verification Execution Handler
  const executePaymentVerification = (referenceToVerify: string) => {
    if (isProcessingVerification.current || isPaymentSuccess) return;

    console.log(
      `🎉 [VERIFICATION_TRIGGERED] Dispatching backend verification for: ${referenceToVerify}`
    );
    isProcessingVerification.current = true;
    setIsVerifying(true);

    dispatch(verifyPayment(referenceToVerify))
      .unwrap()
      .then((res) => {
        console.log("📥 [VERIFY_RESOLVED] Backend updated successfully:", res);
        router.back();
      })
      .catch((err) => {
        console.error("❌ [VERIFY_REJECTED] Backend verification failed:", err);
        setIsVerifying(false);
        isProcessingVerification.current = false;
      });
  };

  // MESSAGE INTERCEPTOR
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log("📥 [WEBVIEW_NATIVE_MESSAGE]:", data);

      if (data.type === "PAYMENT_SUCCESS") {
        console.log(
          "🚀 [BRIDGE_MATCH] Success event caught via injected script!"
        );
        if (activeReference) {
          executePaymentVerification(activeReference);
        } else {
          console.warn(
            "⚠️ Success caught via message, but activeReference is missing."
          );
          router.back();
        }
      }
    } catch (e) {
      if (event.nativeEvent.data === "PAYMENT_SUCCESSFUL" && activeReference) {
        executePaymentVerification(activeReference);
      }
    }
  };

  // 5. Standard URL Navigation Fallback Switchboard
  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const { url, title } = navState;
    console.log(`📡 [WEBVIEW_URL_CHANGED] URL: ${url} | Title: ${title}`);

    if (
      url.includes("cancel") ||
      url.includes("close") ||
      url.startsWith("https://standard.paystack.co/close")
    ) {
      console.log("🛑 [INTERCEPT] Transaction canceled by user.");
      router.back();
      return;
    }

    const isSuccessUrl =
      url.includes("callback") ||
      url.includes("success") ||
      url.includes("trxref=");
    const isPaystackReceiptPage =
      url.includes("paystack.com/dashboard") ||
      title?.toLowerCase().includes("payment successful");

    if (isSuccessUrl || isPaystackReceiptPage) {
      if (activeReference) {
        executePaymentVerification(activeReference);
      }
    }
  };

  if ((isLoading && !checkoutUrl) || isVerifying) {
    return (
      <View
        style={[
          styles.centeredContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
        <AppText style={{ marginTop: 14 }} color={theme.textMuted}>
          {isVerifying
            ? "Confirming transaction clearance..."
            : "Securing payment terminal..."}
        </AppText>
      </View>
    );
  }

  if (error && !isVerifying) {
    return (
      <View
        style={[
          styles.centeredContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <Ionicons name="close-circle-outline" size={64} color="#EF4444" />
        <AppText
          size={16}
          weight="bold"
          color={theme.text}
          style={{ marginTop: 12 }}
        >
          Initialization failed
        </AppText>
        <AppText size={13} color={theme.textMuted} style={styles.errorText}>
          {error}
        </AppText>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.primary }]}
          onPress={() => router.back()}
        >
          <AppText color="#FFF" weight="bold">
            Return to Details
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <SafeAreaView
        style={[
          styles.headerArea,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={{ alignItems: "center" }}>
            <AppText size={16} weight="bold" color={theme.text}>
              Secure Checkout
            </AppText>
            <AppText size={12} color={theme.textMuted}>
              ₦{Number(amount).toLocaleString()} • Paystack
            </AppText>
          </View>
          <MaterialCommunityIcons
            name="shield-check"
            size={24}
            color="#10B981"
          />
        </View>
      </SafeAreaView>

      <View style={{ flex: 1 }}>
        {checkoutUrl ? (
          <WebView
            source={{ uri: checkoutUrl }}
            onNavigationStateChange={handleNavigationStateChange}
            onMessage={handleMessage}
            injectedJavaScript={injectedJavaScript}
            onLoadStart={() => setWebLoading(true)}
            onLoadEnd={() => setWebLoading(false)}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            style={{ backgroundColor: theme.background }}
          />
        ) : (
          <View style={styles.centeredContainer}>
            <AppText color={theme.textMuted}>
              Awaiting configurations...
            </AppText>
          </View>
        )}

        {webLoading && checkoutUrl && (
          <View
            style={[
              styles.webviewLoadingCover,
              { backgroundColor: theme.background },
            ]}
          >
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: { textAlign: "center", marginTop: 6, marginBottom: 20 },
  actionBtn: {
    paddingHorizontal: 24,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  headerArea: { width: "100%", borderBottomWidth: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  webviewLoadingCover: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    opacity: 0.9,
  },
});
