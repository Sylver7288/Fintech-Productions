import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Platform, Share
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useGetReferral } from "@workspace/api-client-react";

const STEPS = [
  { step: "1", title: "Share your code", desc: "Share your unique referral code with friends", icon: "share-2" },
  { step: "2", title: "They sign up", desc: "Your friend creates a Novamoni account", icon: "user-plus" },
  { step: "3", title: "Both earn ₦500", desc: "You both receive ₦500 after their first transaction", icon: "gift" },
];

export default function ReferralScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useGetReferral();
  const [copied, setCopied] = useState(false);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  async function handleCopy() {
    if (!data?.code) return;
    await Clipboard.setStringAsync(data.code);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    if (!data) return;
    try {
      await Share.share({
        message: `Join me on Novamoni — Nigeria's smartest banking app! Use my code ${data.code} when you sign up and we both get ₦500. Download here: ${data.shareUrl}`,
        url: data.shareUrl,
      });
    } catch {
      Alert.alert("Could not share");
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Refer & Earn</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <Text style={styles.heroEmoji}>🎁</Text>
          <Text style={styles.heroTitle}>Earn ₦500 per referral</Text>
          <Text style={styles.heroSub}>Invite friends to Novamoni. When they complete their first transaction, you both receive ₦500 bonus.</Text>
        </View>

        {/* Stats */}
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ padding: 20 }} />
        ) : (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statNum, { color: colors.primary }]}>{data?.referredCount ?? 0}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Friends referred</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statNum, { color: "#00B894" }]}>₦{(data?.totalEarned ?? 0).toLocaleString("en-NG")}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total earned</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statNum, { color: "#FDCB6E" }]}>₦{(data?.pendingBonus ?? 0).toLocaleString("en-NG")}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Pending</Text>
            </View>
          </View>
        )}

        {/* Code */}
        <View style={[styles.codeCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.codeLabel, { color: colors.mutedForeground }]}>Your referral code</Text>
          <Text style={[styles.code, { color: colors.foreground }]}>{data?.code ?? "Loading..."}</Text>
          <TouchableOpacity
            style={[styles.copyBtn, { backgroundColor: copied ? "#00B894" : colors.secondary }]}
            onPress={handleCopy}
          >
            <Feather name={copied ? "check" : "copy"} size={16} color={copied ? "#fff" : colors.primary} />
            <Text style={[styles.copyText, { color: copied ? "#fff" : colors.primary }]}>
              {copied ? "Copied!" : "Copy code"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Share button */}
        <TouchableOpacity
          style={[styles.shareBtn, { backgroundColor: colors.primary }]}
          onPress={handleShare}
        >
          <Feather name="share-2" size={18} color="#fff" />
          <Text style={styles.shareBtnText}>Share invitation</Text>
        </TouchableOpacity>

        {/* How it works */}
        <View style={[styles.howSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.howTitle, { color: colors.foreground }]}>How it works</Text>
          {STEPS.map((s, i) => (
            <View key={s.step} style={styles.stepRow}>
              <View style={[styles.stepIcon, { backgroundColor: colors.secondary }]}>
                <Feather name={s.icon as any} size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>{s.title}</Text>
                <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>{s.desc}</Text>
              </View>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
              )}
            </View>
          ))}
        </View>

        {/* T&C */}
        <Text style={[styles.terms, { color: colors.mutedForeground }]}>
          * Bonus credited after referred friend completes first bank transfer. Maximum 50 referrals per user. Novamoni reserves the right to modify the referral program at any time.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { width: 38, height: 38, justifyContent: "center" },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  content: { padding: 20, gap: 16 },
  hero: { borderRadius: 24, padding: 24, alignItems: "center", gap: 8 },
  heroEmoji: { fontSize: 48 },
  heroTitle: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  heroSub: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, borderRadius: 16, padding: 12, alignItems: "center", gap: 4 },
  statNum: { fontSize: 16, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
  codeCard: { borderRadius: 20, padding: 20, alignItems: "center", gap: 12 },
  codeLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  code: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: 4 },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  copyText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  shareBtn: { borderRadius: 14, height: 54, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10 },
  shareBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  howSection: { borderRadius: 20, padding: 20 },
  howTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 16 },
  stepRow: { flexDirection: "row", gap: 14, alignItems: "flex-start", position: "relative", paddingBottom: 20 },
  stepIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  stepTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  stepDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 18 },
  stepLine: { position: "absolute", left: 22, top: 48, width: 1, bottom: 0 },
  terms: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
});
