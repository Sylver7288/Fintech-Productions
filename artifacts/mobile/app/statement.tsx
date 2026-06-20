import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Platform, Alert,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Share } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useGetAccounts, useGetAccountStatement } from "@workspace/api-client-react";

type Period = "this_month" | "last_month" | "3_months" | "6_months";

function getPeriodDates(period: Period): { from: Date; to: Date; label: string } {
  const now = new Date();
  const to = new Date(now);
  let from: Date;
  let label: string;

  switch (period) {
    case "this_month":
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      label = "This Month";
      break;
    case "last_month":
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to.setDate(0);
      label = "Last Month";
      break;
    case "3_months":
      from = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      label = "Last 3 Months";
      break;
    case "6_months":
      from = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      label = "Last 6 Months";
      break;
  }
  return { from, to, label };
}

const PERIODS: { key: Period; label: string }[] = [
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "3_months", label: "3 Months" },
  { key: "6_months", label: "6 Months" },
];

export default function StatementScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const [period, setPeriod] = useState<Period>("this_month");
  const [exporting, setExporting] = useState(false);

  const { data: accounts } = useGetAccounts();
  const account = accounts?.[0];
  const { from, to } = getPeriodDates(period);

  const { data: txns, isLoading } = useGetAccountStatement(
    account?.id ?? "",
    { query: { enabled: !!account?.id } as any }
  );

  const filteredTxns = (txns ?? []).filter(t => {
    const d = new Date(t.createdAt);
    return d >= from && d <= to;
  });

  const totalCredit = filteredTxns.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  const totalDebit = filteredTxns.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0);

  async function handleExport() {
    if (!filteredTxns.length) {
      Alert.alert("No transactions", "No transactions found for this period.");
      return;
    }
    setExporting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const header = "Date,Type,Amount,Description,Reference,Status,Recipient,Bank\n";
      const rows = filteredTxns.map(t => [
        new Date(t.createdAt).toLocaleDateString("en-NG"),
        t.type,
        t.amount.toFixed(2),
        `"${t.description}"`,
        t.reference,
        t.status,
        t.recipientName ?? "",
        t.recipientBank ?? "",
      ].join(",")).join("\n");
      const csv = header + rows;
      const { label } = getPeriodDates(period);
      await Share.share({
        message: csv,
        title: `NovaPay Statement — ${label}`,
      });
    } catch {
      Alert.alert("Export failed", "Could not generate the statement. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.navbar, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>Account Statement</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        {/* Period selector */}
        <View style={[styles.periodCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Select period</Text>
          <View style={styles.periodRow}>
            {PERIODS.map(p => (
              <TouchableOpacity
                key={p.key}
                style={[
                  styles.periodBtn,
                  {
                    backgroundColor: period === p.key ? colors.primary : colors.background,
                    borderColor: period === p.key ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => { setPeriod(p.key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              >
                <Text style={[styles.periodText, { color: period === p.key ? "#fff" : colors.mutedForeground }]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.dateRange, { color: colors.mutedForeground }]}>
            {from.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })} –{" "}
            {to.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
          </Text>
        </View>

        {/* Summary */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryBox, { backgroundColor: "#E6F8F3" }]}>
            <Feather name="arrow-down-left" size={20} color="#00B894" />
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Money In</Text>
            <Text style={[styles.summaryAmount, { color: "#00B894" }]}>
              ₦{totalCredit.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={[styles.summaryBox, { backgroundColor: "#FFF0F0" }]}>
            <Feather name="arrow-up-right" size={20} color="#E74C3C" />
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Money Out</Text>
            <Text style={[styles.summaryAmount, { color: "#E74C3C" }]}>
              ₦{totalDebit.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Export button */}
        <TouchableOpacity
          style={[styles.exportBtn, { backgroundColor: colors.primary, opacity: exporting ? 0.7 : 1 }]}
          onPress={handleExport}
          disabled={exporting || isLoading}
          activeOpacity={0.85}
        >
          {exporting
            ? <ActivityIndicator color="#fff" />
            : <>
              <Feather name="download" size={18} color="#fff" />
              <Text style={styles.exportBtnText}>Export as CSV</Text>
            </>
          }
        </TouchableOpacity>

        {/* Transactions preview */}
        <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>
          TRANSACTIONS ({filteredTxns.length})
        </Text>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ padding: 40 }} />
        ) : filteredTxns.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.card }]}>
            <Feather name="inbox" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No transactions in this period</Text>
          </View>
        ) : (
          <View style={[styles.txnList, { backgroundColor: colors.card }]}>
            {filteredTxns.slice(0, 20).map((t, i) => (
              <View
                key={t.id}
                style={[
                  styles.txnRow,
                  i < filteredTxns.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }
                ]}
              >
                <View style={[
                  styles.txnIcon,
                  { backgroundColor: t.type === "credit" ? "#E6F8F3" : "#FFF0F0" }
                ]}>
                  <Feather
                    name={t.type === "credit" ? "arrow-down-left" : "arrow-up-right"}
                    size={16}
                    color={t.type === "credit" ? "#00B894" : "#E74C3C"}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.txnDesc, { color: colors.foreground }]} numberOfLines={1}>{t.description}</Text>
                  <Text style={[styles.txnDate, { color: colors.mutedForeground }]}>
                    {new Date(t.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                  </Text>
                </View>
                <Text style={[styles.txnAmount, { color: t.type === "credit" ? "#00B894" : "#E74C3C" }]}>
                  {t.type === "credit" ? "+" : "-"}₦{t.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </Text>
              </View>
            ))}
            {filteredTxns.length > 20 && (
              <Text style={[styles.moreText, { color: colors.mutedForeground }]}>
                +{filteredTxns.length - 20} more — export CSV to view all
              </Text>
            )}
          </View>
        )}
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
  periodCard: { borderRadius: 20, padding: 20, gap: 12 },
  sectionLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  periodRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  periodBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  periodText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  dateRange: { fontSize: 12, fontFamily: "Inter_400Regular" },
  summaryRow: { flexDirection: "row", gap: 12 },
  summaryBox: { flex: 1, borderRadius: 16, padding: 16, gap: 6 },
  summaryLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  summaryAmount: { fontSize: 16, fontFamily: "Inter_700Bold" },
  exportBtn: {
    borderRadius: 16, height: 56, flexDirection: "row",
    justifyContent: "center", alignItems: "center", gap: 10,
  },
  exportBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  previewLabel: {
    fontSize: 11, fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8, textTransform: "uppercase",
  },
  txnList: { borderRadius: 20, overflow: "hidden" },
  txnRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  txnIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  txnDesc: { fontSize: 14, fontFamily: "Inter_500Medium" },
  txnDate: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  txnAmount: { fontSize: 14, fontFamily: "Inter_700Bold" },
  moreText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", padding: 14 },
  empty: { borderRadius: 20, padding: 40, alignItems: "center", gap: 12 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
