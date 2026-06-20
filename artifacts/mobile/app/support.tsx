import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, Alert, TextInput, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const FAQS = [
  {
    q: "How do I send money?",
    a: "Tap the 'Send' button on your home screen, fill in the recipient details, amount and description, then confirm the transfer.",
  },
  {
    q: "How do I freeze my card?",
    a: "Go to the Cards tab, select your card and tap 'Freeze Card'. You can unfreeze it anytime from the same screen.",
  },
  {
    q: "Why is my account showing 'Verification pending'?",
    a: "You need to complete BVN verification. Go to Profile → Identity Verification and submit your 11-digit BVN.",
  },
  {
    q: "How long does a transfer take?",
    a: "NovaPay transfers are instant for NovaPay accounts. Inter-bank transfers typically complete within a few minutes.",
  },
  {
    q: "What is my transaction limit?",
    a: "Unverified accounts have a ₦100,000 daily limit. Verified accounts enjoy up to ₦5,000,000 daily.",
  },
  {
    q: "How do I create a savings goal?",
    a: "Go to the Save tab and tap 'New goal'. Set a name, target amount, and optionally a target date.",
  },
];

export default function SupportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSendMessage() {
    if (!message.trim()) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 1000));
    setSending(false);
    setMessage("");
    Alert.alert("Message sent", "Our support team will respond within 24 hours via email.");
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.navbar, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
          <Feather name="headphones" size={32} color="#fff" />
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSub}>Browse FAQs or send us a message</Text>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Frequently Asked Questions</Text>
        <View style={[styles.faqCard, { backgroundColor: colors.card }]}>
          {FAQS.map((faq, i) => (
            <View key={i}>
              {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              <TouchableOpacity
                style={styles.faqRow}
                onPress={() => setExpanded(expanded === i ? null : i)}
                activeOpacity={0.7}
              >
                <Text style={[styles.faqQ, { color: colors.foreground, flex: 1 }]}>{faq.q}</Text>
                <Feather
                  name={expanded === i ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>
              {expanded === i && (
                <Text style={[styles.faqA, { color: colors.mutedForeground, borderTopColor: colors.border }]}>
                  {faq.a}
                </Text>
              )}
            </View>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Contact Us</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.fieldWrap}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Your message</Text>
            <TextInput
              style={[styles.msgInput, { color: colors.foreground, borderColor: colors.border }]}
              placeholder="Describe your issue..."
              placeholderTextColor={colors.mutedForeground}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: colors.primary, opacity: (!message.trim() || sending) ? 0.6 : 1 }]}
            onPress={handleSendMessage}
            disabled={!message.trim() || sending}
            activeOpacity={0.85}
          >
            {sending
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                <Feather name="send" size={16} color="#fff" />
                <Text style={styles.sendBtnText}>Send message</Text>
              </>
            }
          </TouchableOpacity>
        </View>

        <View style={[styles.contactCard, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={[styles.contactRow, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
            onPress={() => Alert.alert("Email", "support@novapay.ng")}
          >
            <View style={[styles.contactIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Feather name="mail" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.contactTitle, { color: colors.foreground }]}>Email support</Text>
              <Text style={[styles.contactSub, { color: colors.mutedForeground }]}>support@novapay.ng</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => Alert.alert("Live Chat", "Live chat is available Mon–Fri, 8am–6pm.")}
          >
            <View style={[styles.contactIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Feather name="message-circle" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.contactTitle, { color: colors.foreground }]}>Live chat</Text>
              <Text style={[styles.contactSub, { color: colors.mutedForeground }]}>Mon–Fri, 8am–6pm</Text>
            </View>
          </TouchableOpacity>
        </View>
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
  content: { paddingHorizontal: 20, gap: 16 },
  heroCard: {
    borderRadius: 20, padding: 24, alignItems: "center", gap: 8,
  },
  heroTitle: { color: "#fff", fontSize: 20, fontFamily: "Inter_700Bold" },
  heroSub: { color: "rgba(255,255,255,0.8)", fontSize: 14, fontFamily: "Inter_400Regular" },
  sectionLabel: {
    fontSize: 12, fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8, textTransform: "uppercase",
  },
  faqCard: { borderRadius: 20, overflow: "hidden" },
  faqRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  faqQ: { fontSize: 14, fontFamily: "Inter_500Medium", lineHeight: 20 },
  faqA: {
    fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20,
    paddingHorizontal: 16, paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
  },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  card: { borderRadius: 20, overflow: "hidden" },
  fieldWrap: { paddingHorizontal: 16, paddingTop: 14 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 8 },
  msgInput: {
    fontSize: 15, fontFamily: "Inter_400Regular",
    borderWidth: 1, borderRadius: 12, padding: 12,
    minHeight: 100,
  },
  sendBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 12, margin: 16, paddingVertical: 12,
    justifyContent: "center",
  },
  sendBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  contactCard: { borderRadius: 20, overflow: "hidden" },
  contactRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  contactIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  contactTitle: { fontSize: 15, fontFamily: "Inter_500Medium" },
  contactSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
});
