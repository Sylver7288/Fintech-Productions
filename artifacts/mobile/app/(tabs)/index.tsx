import React from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Platform, ActivityIndicator
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { TransactionItem } from "@/components/TransactionItem";
import { QuickAction } from "@/components/QuickAction";
import {
  useGetDashboardSummary, useGetAccounts,
  getGetDashboardSummaryQueryKey, getGetAccountsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const SERVICES = [
  { icon: "phone", label: "Airtime & Data", route: "/airtime", color: "#00B894" },
  { icon: "zap", label: "Pay Bills", route: "/bills", color: "#FDCB6E" },
  { icon: "repeat", label: "Scheduled", route: "/scheduled-transfers", color: "#6C5CE7" },
  { icon: "bar-chart-2", label: "Analytics", route: "/analytics", color: "#0984E3" },
  { icon: "credit-card", label: "Credit", route: "/loans", color: "#E17055" },
  { icon: "globe", label: "FX Transfer", route: "/international-transfer", color: "#2D3436" },
  { icon: "gift", label: "Refer & Earn", route: "/referral", color: "#E84393" },
] as const;

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary();
  const { data: accounts, isLoading: accountsLoading } = useGetAccounts();
  const [refreshing, setRefreshing] = React.useState(false);

  const [balanceVisible, setBalanceVisible] = React.useState(true);

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([
      qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }),
      qc.invalidateQueries({ queryKey: getGetAccountsQueryKey() }),
    ]);
    setRefreshing(false);
  }

  const mainAccount = accounts?.[0];
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{greeting()},</Text>
          <Text style={[styles.name, { color: colors.foreground }]}>{user?.firstName ?? "User"} 👋</Text>
        </View>
        <TouchableOpacity
          style={[styles.notifBtn, { backgroundColor: colors.card }]}
          onPress={() => router.push("/notifications")}
        >
          <Feather name="bell" size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Balance Card */}
      <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
        <View style={styles.balanceDecor1} />
        <View style={styles.balanceDecor2} />
        <View style={styles.balanceTop}>
          <View>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            {summaryLoading
              ? <ActivityIndicator color="#fff" style={{ marginTop: 8 }} />
              : <Text style={styles.balanceAmount}>
                {balanceVisible
                  ? `₦${(summary?.totalBalance ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
                  : "₦ ••••••"
                }
              </Text>
            }
          </View>
          <TouchableOpacity onPress={() => setBalanceVisible(v => !v)} style={styles.eyeBtn}>
            <Feather name={balanceVisible ? "eye" : "eye-off"} size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>

        {mainAccount && (
          <View style={styles.accountChip}>
            <Text style={styles.accountNum}>{mainAccount.accountNumber}</Text>
            <Text style={styles.accountBank}>{mainAccount.bankName ?? "NovaPay"}</Text>
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Feather name="arrow-down-circle" size={14} color="rgba(255,255,255,0.8)" />
            <View style={{ marginLeft: 6 }}>
              <Text style={styles.statLabel}>Income</Text>
              <Text style={styles.statVal}>₦{(summary?.monthlyIncome ?? 0).toLocaleString("en-NG")}</Text>
            </View>
          </View>
          <View style={[styles.statDivider]} />
          <View style={styles.statItem}>
            <Feather name="arrow-up-circle" size={14} color="rgba(255,255,255,0.8)" />
            <View style={{ marginLeft: 6 }}>
              <Text style={styles.statLabel}>Spending</Text>
              <Text style={styles.statVal}>₦{(summary?.monthlySpend ?? 0).toLocaleString("en-NG")}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.quickActions}>
          <QuickAction icon="send" label="Send" onPress={() => router.push("/transfer")} />
          <QuickAction icon="download" label="Receive" onPress={() => router.push("/receive")} />
          <QuickAction icon="credit-card" label="Cards" onPress={() => router.push("/(tabs)/cards")} />
          <QuickAction icon="target" label="Save" onPress={() => router.push("/(tabs)/savings")} />
        </View>
      </View>

      {/* More Services */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>More services</Text>
      </View>
      <View style={[styles.servicesGrid, { backgroundColor: colors.card }]}>
        {SERVICES.map(s => (
          <TouchableOpacity
            key={s.label}
            style={styles.serviceItem}
            onPress={() => router.push(s.route as any)}
          >
            <View style={[styles.serviceIcon, { backgroundColor: s.color + "18" }]}>
              <Feather name={s.icon as any} size={20} color={s.color} />
            </View>
            <Text style={[styles.serviceLabel, { color: colors.foreground }]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Transactions */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent activity</Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/transactions")}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.transactionList, { backgroundColor: colors.card }]}>
        {summaryLoading ? (
          <ActivityIndicator color={colors.primary} style={{ padding: 24 }} />
        ) : !summary?.recentTransactions?.length ? (
          <View style={styles.emptyState}>
            <Feather name="activity" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No transactions yet</Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16 }}>
            {summary.recentTransactions.map(t => (
              <TransactionItem
                key={t.id}
                transaction={t as any}
                onPress={() => router.push({ pathname: "/transaction/[id]", params: { id: t.id } })}
              />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { gap: 0 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular" },
  name: { fontSize: 22, fontFamily: "Inter_700Bold", marginTop: 2 },
  notifBtn: {
    width: 42, height: 42, borderRadius: 12,
    justifyContent: "center", alignItems: "center",
  },
  balanceCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    overflow: "hidden",
    position: "relative",
  },
  balanceDecor1: {
    position: "absolute", width: 200, height: 200, borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.08)", top: -80, right: -60,
  },
  balanceDecor2: {
    position: "absolute", width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.05)", bottom: -30, left: 20,
  },
  balanceTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  balanceLabel: { color: "rgba(255,255,255,0.75)", fontSize: 13, fontFamily: "Inter_400Regular" },
  balanceAmount: { color: "#fff", fontSize: 34, fontFamily: "Inter_700Bold", marginTop: 6 },
  eyeBtn: { padding: 8 },
  accountChip: {
    marginTop: 16,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  accountNum: { color: "rgba(255,255,255,0.9)", fontSize: 13, fontFamily: "Inter_500Medium", letterSpacing: 1 },
  accountBank: { color: "rgba(255,255,255,0.6)", fontSize: 11, fontFamily: "Inter_400Regular" },
  statsRow: { flexDirection: "row", alignItems: "center" },
  statItem: { flexDirection: "row", alignItems: "center", flex: 1 },
  statLabel: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontFamily: "Inter_400Regular" },
  statVal: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  statDivider: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.2)", marginHorizontal: 16 },
  section: { marginHorizontal: 20, borderRadius: 20, padding: 16, marginBottom: 16 },
  quickActions: { flexDirection: "row", justifyContent: "space-between" },
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, marginBottom: 8,
  },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  seeAll: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  servicesGrid: {
    marginHorizontal: 20, borderRadius: 20, padding: 16, marginBottom: 16,
    flexDirection: "row", flexWrap: "wrap", gap: 4,
  },
  serviceItem: {
    width: "25%", alignItems: "center", paddingVertical: 12, gap: 8,
  },
  serviceIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  serviceLabel: { fontSize: 11, fontFamily: "Inter_500Medium", textAlign: "center" },
  transactionList: { marginHorizontal: 20, borderRadius: 20, overflow: "hidden", marginBottom: 16 },
  emptyState: { padding: 32, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
