import React from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Platform, Alert, Share,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import { useColors } from "@/hooks/useColors";
import { useGetTransaction } from "@workspace/api-client-react";

export default function TransactionDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: txn, isLoading } = useGetTransaction(id);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const isCredit = txn?.type === "credit";

  async function handleShare() {
    if (!txn) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const lines = [
      "Novamoni Transaction Receipt",
      "─────────────────────────────",
      `Type:      ${txn.type === "credit" ? "Money received" : "Money sent"}`,
      `Amount:    ${txn.type === "credit" ? "+" : "-"}₦${txn.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
      `Desc:      ${txn.description}`,
      `Reference: ${txn.reference}`,
      `Status:    ${txn.status}`,
      `Date:      ${new Date(txn.createdAt).toLocaleString("en-NG")}`,
      txn.recipientName ? `To:        ${txn.recipientName}` : "",
      txn.recipientBank ? `Bank:      ${txn.recipientBank}` : "",
      txn.recipientAccount ? `Account:   ${txn.recipientAccount}` : "",
      txn.senderName ? `From:      ${txn.senderName}` : "",
      "─────────────────────────────",
      "Powered by Novamoni",
    ].filter(Boolean).join("\n");

    try {
      if (await Sharing.isAvailableAsync()) {
        await Share.share({ message: lines, title: "Novamoni Receipt" });
      } else {
        await Share.share({ message: lines, title: "Novamoni Receipt" });
      }
    } catch {}
  }

  if (isLoading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!txn) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.mutedForeground }}>Transaction not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.navbar, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>Transaction</Text>
        <TouchableOpacity onPress={handleShare}>
          <Feather name="share-2" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: isCredit ? "#E6F8F3" : "#FFF0F0" }]}>
            <Feather name={isCredit ? "arrow-down-left" : "arrow-up-right"} size={32} color={isCredit ? colors.success : colors.destructive} />
          </View>
          <Text style={[styles.heroAmount, { color: isCredit ? colors.success : colors.destructive }]}>
            {isCredit ? "+" : "-"}₦{txn.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </Text>
          <Text style={[styles.heroDesc, { color: colors.foreground }]}>{txn.description}</Text>
          <View style={[styles.statusPill, {
            backgroundColor: txn.status === "completed" ? "#E6F8F3" : txn.status === "pending" ? "#FFF8E6" : "#FFF0F0"
          }]}>
            <Text style={{
              fontSize: 12, fontFamily: "Inter_600SemiBold",
              color: txn.status === "completed" ? colors.success : txn.status === "pending" ? colors.warning : colors.destructive
            }}>
              {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={[styles.detailCard, { backgroundColor: colors.card }]}>
          {[
            { label: "Date & Time", value: new Date(txn.createdAt).toLocaleString("en-NG") },
            { label: "Reference", value: txn.reference },
            txn.category ? { label: "Category", value: txn.category } : null,
            txn.recipientName ? { label: "Recipient", value: txn.recipientName } : null,
            txn.recipientBank ? { label: "Bank", value: txn.recipientBank } : null,
            txn.recipientAccount ? { label: "Account", value: txn.recipientAccount } : null,
            txn.senderName ? { label: "Sender", value: txn.senderName } : null,
          ].filter(Boolean).map((row: any, i, arr) => (
            <View key={row.label} style={[styles.detailRow, i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
              <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
              <Text style={[styles.detailValue, { color: colors.foreground }]} numberOfLines={2}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Share button */}
        <TouchableOpacity
          style={[styles.shareBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <Feather name="share-2" size={18} color={colors.primary} />
          <Text style={[styles.shareBtnText, { color: colors.primary }]}>Share Receipt</Text>
        </TouchableOpacity>
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
  content: { paddingHorizontal: 20, gap: 20 },
  hero: { alignItems: "center", paddingVertical: 24, gap: 10 },
  heroIcon: { width: 80, height: 80, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  heroAmount: { fontSize: 36, fontFamily: "Inter_700Bold" },
  heroDesc: { fontSize: 15, fontFamily: "Inter_500Medium", textAlign: "center" },
  statusPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  detailCard: { borderRadius: 20, overflow: "hidden" },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, gap: 20 },
  detailLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  detailValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "right", flex: 1 },
  shareBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, height: 52, borderRadius: 16, borderWidth: 1,
  },
  shareBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
