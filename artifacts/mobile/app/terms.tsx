import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: "By accessing or using NovaPay, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please discontinue use immediately.",
  },
  {
    title: "2. Eligibility",
    body: "You must be at least 18 years old and a resident of Nigeria to use NovaPay. By registering, you confirm that all information you provide is accurate and complete.",
  },
  {
    title: "3. Account Security",
    body: "You are responsible for maintaining the confidentiality of your PIN, password, and OTP. NovaPay will never ask for these details. Report any suspicious activity to support immediately.",
  },
  {
    title: "4. Transactions",
    body: "All transfers are subject to your account limits. NovaPay is not liable for delays caused by third-party banks. Disputes must be raised within 30 days of the transaction date.",
  },
  {
    title: "5. Data Privacy",
    body: "We collect personal and financial data to provide our services, comply with Nigerian financial regulations (CBN), and improve your experience. We do not sell your data to third parties.",
  },
  {
    title: "6. BVN & KYC",
    body: "Your Bank Verification Number (BVN) is collected solely for identity verification in compliance with CBN directives. It is encrypted, stored securely, and never shared without your consent.",
  },
  {
    title: "7. Prohibited Activities",
    body: "You may not use NovaPay for money laundering, fraud, financing terrorism, or any activity prohibited under Nigerian law. Violation results in immediate account suspension and reporting to authorities.",
  },
  {
    title: "8. Limitation of Liability",
    body: "NovaPay's liability is limited to the amount of the transaction in dispute. We are not liable for indirect, incidental, or consequential damages arising from your use of the service.",
  },
  {
    title: "9. Changes to Terms",
    body: "We may update these terms periodically. Continued use of NovaPay after changes are posted constitutes your acceptance of the revised terms. We will notify you of material changes via the app.",
  },
  {
    title: "10. Contact",
    body: "For questions about these terms, contact us at legal@novapay.ng or visit our Help & Support section in the app.",
  },
];

export default function TermsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.navbar, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>Terms & Privacy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        <View style={[styles.headerCard, { backgroundColor: colors.card }]}>
          <View style={[styles.headerIcon, { backgroundColor: `${colors.primary}15` }]}>
            <Feather name="file-text" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Terms of Service & Privacy Policy</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Last updated: June 2026</Text>
        </View>

        {SECTIONS.map((s, i) => (
          <View key={i} style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{s.title}</Text>
            <Text style={[styles.sectionBody, { color: colors.mutedForeground }]}>{s.body}</Text>
          </View>
        ))}

        <Text style={[styles.footer, { color: colors.mutedForeground }]}>
          NovaPay is a financial technology product. Banking services are subject to CBN regulation.{"\n"}© 2026 NovaPay Technologies Ltd.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  navbar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 16,
  },
  navTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  content: { paddingHorizontal: 20, gap: 12 },
  headerCard: {
    borderRadius: 20, padding: 24, alignItems: "center", gap: 10,
  },
  headerIcon: {
    width: 64, height: 64, borderRadius: 20,
    justifyContent: "center", alignItems: "center",
  },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold", textAlign: "center" },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  section: { borderRadius: 16, padding: 16, gap: 8 },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  sectionBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 22 },
  footer: {
    fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center",
    lineHeight: 20, paddingBottom: 8,
  },
});
