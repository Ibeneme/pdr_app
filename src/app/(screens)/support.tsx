import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
} from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import {
  ArrowLeft,
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  FileText,
} from "lucide-react-native";
import { router } from "expo-router";

export default function SupportScreen() {
  const { theme, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <SafeAreaView
        style={[
          styles.headerSafeArea,
          {
            backgroundColor: theme.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[
              styles.iconButton,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <ArrowLeft size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Support
          </Text>
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
          HOW CAN WE HELP?
        </Text>

        <TouchableOpacity
          style={[
            styles.supportCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <MessageCircle size={28} color={theme.primary} />
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            Chat with Support
          </Text>
          <Text style={[styles.cardDesc, { color: theme.textMuted }]}>
            Talk to our team instantly (Mon–Sat, 8AM–8PM)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.supportCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Phone size={28} color={theme.primary} />
          <Text style={[styles.cardTitle, { color: theme.text }]}>Call Us</Text>
          <Text style={[styles.cardDesc, { color: theme.textMuted }]}>
            +234 803 555 0192
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.supportCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Mail size={28} color={theme.primary} />
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            Email Support
          </Text>
          <Text style={[styles.cardDesc, { color: theme.textMuted }]}>
            support@padimanroute.com
          </Text>
        </TouchableOpacity>

        <Text
          style={[styles.sectionTitle, { color: theme.primary, marginTop: 32 }]}
        >
          FAQs
        </Text>

        {[
          "How do I withdraw my earnings?",
          "How does ride matching work?",
          "What if my parcel is delayed?",
          "Can I cancel a ride offer?",
        ].map((faq, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.faqRow,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <FileText size={20} color={theme.textMuted} />
            <Text style={[styles.faqText, { color: theme.text }]}>{faq}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSafeArea: {
    ...Platform.select({
      android: {
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 4 : 12,
      },
    }),
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    fontFamily: "RethinkSans-Bold",
    fontSize: 20,
    letterSpacing: -0.6,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },

  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },

  sectionTitle: {
    fontFamily: "RethinkSans-Bold",
    fontSize: 12,
    letterSpacing: 1.5,
    marginBottom: 12,
  },

  supportCard: {
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 14,
    alignItems: "center",
  },
  cardTitle: {
    fontFamily: "RethinkSans-Bold",
    fontSize: 18,
    marginTop: 12,
    marginBottom: 6,
  },
  cardDesc: { textAlign: "center", fontSize: 14 },

  faqRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
    gap: 14,
  },
  faqText: { fontFamily: "RethinkSans-Medium", fontSize: 15, flex: 1 },
});
