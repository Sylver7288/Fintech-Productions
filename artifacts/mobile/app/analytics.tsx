import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Platform
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useGetAnalytics } from "@workspace/api-client-react";

const PERIODS = [
  { label: "30 days", value: 30 },
  { label: "3 months", value: 90 },
  { label: "6 months", value: 180 },
];

const CATEGORY_COLORS = [
  "#E5A93C", "#00B894", "#E17055", "#0984E3",
  "#FDCB6E", "#E84393", "#636E72", "#00CEC9",
];

export default function AnalyticsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [days, setDays] = useState(30);
  const { data, isLoading } = useGetAnalytics({ days });
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const maxBar = Math.max(...(data?.monthlyTrend?.map(m => Math.max(m.spend, m.income)) ?? [1]));
  const maxCat = Math.max(...(data?.categories?.map(c => c.amount) ?? [1]));

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Spending Analytics</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        {/* Period selector */}
        <View style={[styles.periodBar, { backgroundColor: colors.secondary }]}>
          {PERIODS.map(p => (
            <TouchableOpacity
              key={p.value}
              style={[styles.periodBtn, days === p.value && { backgroundColor: colors.card }]}
              onPress={() => setDays(p.value)}
            >
              <Text style={[styles.periodText, { color: days === p.value ? colors.foreground : colors.mutedForeground }]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ padding: 40 }} />
        ) : (
          <>
            {/* Summary cards */}
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
                <View style={[styles.summaryIcon, { backgroundColor: "#E17055" + "20" }]}>
                  <Feather name="arrow-up" size={16} color="#E17055" />
                </View>
                <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Spent</Text>
                <Text style={[styles.summaryAmount, { color: colors.foreground }]}>
                  ₦{(data?.totalSpend ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 0 })}
                </Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
                <View style={[styles.summaryIcon, { backgroundColor: "#00B894" + "20" }]}>
                  <Feather name="arrow-down" size={16} color="#00B894" />
                </View>
                <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Received</Text>
                <Text style={[styles.summaryAmount, { color: colors.foreground }]}>
                  ₦{(data?.totalIncome ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 0 })}
                </Text>
              </View>
            </View>

            {/* Monthly trend bars */}
            {(data?.monthlyTrend?.length ?? 0) > 0 && (
              <View style={[styles.section, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Monthly trend</Text>
                <View style={styles.barChart}>
                  {data!.monthlyTrend.map((m, i) => (
                    <View key={i} style={styles.barGroup}>
                      <View style={styles.bars}>
                        <View style={styles.barPair}>
                          <View
                            style={[styles.bar, {
                              height: Math.max(4, (m.spend / maxBar) * 100),
                              backgroundColor: "#E17055",
                            }]}
                          />
                          <View
                            style={[styles.bar, {
                              height: Math.max(4, (m.income / maxBar) * 100),
                              backgroundColor: "#00B894",
                            }]}
                          />
                        </View>
                      </View>
                      <Text style={[styles.barLabel, { color: colors.mutedForeground }]}>
                        {m.month.slice(5)}
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={styles.legend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: "#E17055" }]} />
                    <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Spending</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: "#00B894" }]} />
                    <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Income</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Spending by category */}
            {(data?.categories?.length ?? 0) > 0 && (
              <View style={[styles.section, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>By category</Text>
                {data!.categories.map((cat, i) => (
                  <View key={cat.category} style={styles.categoryRow}>
                    <View style={[styles.catDot, { backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }]} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.catHeader}>
                        <Text style={[styles.catName, { color: colors.foreground }]}>{cat.category}</Text>
                        <Text style={[styles.catAmount, { color: colors.foreground }]}>
                          ₦{cat.amount.toLocaleString("en-NG", { minimumFractionDigits: 0 })}
                        </Text>
                      </View>
                      <View style={[styles.catBarBg, { backgroundColor: colors.border }]}>
                        <View
                          style={[styles.catBarFill, {
                            width: `${(cat.amount / maxCat) * 100}%` as any,
                            backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                          }]}
                        />
                      </View>
                      <Text style={[styles.catPct, { color: colors.mutedForeground }]}>{cat.percentage}% of spending</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {!data?.categories?.length && !data?.monthlyTrend?.length && (
              <View style={styles.empty}>
                <Feather name="bar-chart-2" size={48} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No data yet</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Make some transactions to see your spending breakdown</Text>
              </View>
            )}
          </>
        )}
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
  periodBar: { flexDirection: "row", borderRadius: 12, padding: 4 },
  periodBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  periodText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  summaryRow: { flexDirection: "row", gap: 12 },
  summaryCard: { flex: 1, borderRadius: 16, padding: 16, gap: 8 },
  summaryIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  summaryLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  summaryAmount: { fontSize: 18, fontFamily: "Inter_700Bold" },
  section: { borderRadius: 20, padding: 16 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 16 },
  barChart: { flexDirection: "row", alignItems: "flex-end", gap: 8, height: 120, marginBottom: 8 },
  barGroup: { flex: 1, alignItems: "center", gap: 4 },
  bars: { flex: 1, justifyContent: "flex-end", width: "100%" },
  barPair: { flexDirection: "row", gap: 2, justifyContent: "center", alignItems: "flex-end" },
  bar: { width: 10, borderRadius: 4 },
  barLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  legend: { flexDirection: "row", gap: 16, marginTop: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  categoryRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 16 },
  catDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  catHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  catName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  catAmount: { fontSize: 13, fontFamily: "Inter_700Bold" },
  catBarBg: { height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 4 },
  catBarFill: { height: 6, borderRadius: 3 },
  catPct: { fontSize: 11, fontFamily: "Inter_400Regular" },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 32 },
});
