import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Platform, ActivityIndicator, Alert } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { TransactionItem } from "@/components/TransactionItem";
import { QuickAction } from "@/components/QuickAction";
import { SERVICES } from "@/constants/services";
import {
  useGetDashboardSummary, useGetAccounts, useGetBanners,
  getGetDashboardSummaryQueryKey, getGetAccountsQueryKey, getGetBannersQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const MAX_VISIBLE_SERVICES = 7;

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { isFeatureEnabled } = useFeatureFlags();

  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary();
  const { data: accounts, isLoading: accountsLoading } = useGetAccounts();
  const { data: banners } = useGetBanners();
  const [refreshing, setRefreshing] = React.useState(false);

  const getFlagForKey = (route: string): string | undefined => {
    if (route.startsWith("/transfer") || route.startsWith("/international-transfer") || route.startsWith("/scheduled-transfers") || route.startsWith("/split-bill")) {
      return "transfers-enabled";
    }
    if (route.startsWith("/loans")) {
      return "loans-enabled";
    }
    if (route.startsWith("/airtime") || route.startsWith("/bills")) {
      return "airtime-bills-enabled";
    }
    return undefined;
  };

  const handlePress = (route: string) => {
    // Check KYC status for restricted services
    const restrictedRoutes = ["/transfer", "/airtime", "/bills", "/loans", "/cards", "/(tabs)/cards"];
    const isRestricted = restrictedRoutes.some(r => route.startsWith(r));

    if (isRestricted && user && user.kycStatus !== "verified" && user.kycStatus !== "approved") {
      Alert.alert(
        "KYC Verification Required",
        "Before you can access this service, you must complete your KYC verification.",
        [
          { text: "Go to KYC", onPress: () => router.push("/kyc" as any) },
          { text: "Cancel", style: "cancel" }
        ]
      );
      return;
    }

    const flag = getFlagForKey(route);
    if (flag && !isFeatureEnabled(flag)) {
      Alert.alert(
        "Service Offline",
        "This feature is temporarily unavailable due to system upgrades. Please check back later."
      );
      return;
    }
    router.push(route as any);
  };

  const [balanceVisible, setBalanceVisible] = React.useState(true);

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([
      qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }),
      qc.invalidateQueries({ queryKey: getGetAccountsQueryKey() }),
      qc.invalidateQueries({ queryKey: getGetBannersQueryKey() }),
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
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Sticky Header */}
      <View style={[styles.header, { backgroundColor: colors.background, paddingTop: topPad + 16 }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Welcome back,</Text>
          <Text style={[styles.name, { color: colors.foreground }]}>{user?.firstName || (user as any)?.first_name || "User"} 👋</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.notifBtn, { backgroundColor: colors.card }]}
            onPress={() => router.push("/support")}
          >
            <Feather name="help-circle" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.notifBtn, { backgroundColor: colors.card }]}
            onPress={() => router.push("/notifications")}
          >
            <Feather name="bell" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
      {/* Balance Card */}
      <View style={[styles.balanceCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
        <View style={styles.balanceDecor1} />
        <View style={styles.balanceTop}>
          <View>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            {summaryLoading
              ? <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />
              : <Text style={[styles.balanceAmount, { color: colors.primary }]}>
                {balanceVisible
                  ? `₦${(summary?.totalBalance ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
                  : "₦ ••••••"
                }
              </Text>
            }
          </View>
          <TouchableOpacity onPress={() => setBalanceVisible(v => !v)} style={styles.eyeBtn}>
            <Feather name={balanceVisible ? "eye" : "eye-off"} size={16} color="#fff" />
            <Text style={styles.eyeLabel}>{balanceVisible ? "Hide" : "Show"}</Text>
          </TouchableOpacity>
        </View>

        {mainAccount && (
          <View style={styles.accountChip}>
            <Text style={styles.accountNum}>{mainAccount.accountNumber}</Text>
            <Text style={styles.accountBank}>{mainAccount.bankName ?? "Novamoni"}</Text>
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Feather name="arrow-down" size={14} color="rgba(255,255,255,0.8)" />
            <View style={{ marginLeft: 6 }}>
              <Text style={styles.statLabel}>Income</Text>
              <Text style={styles.statVal}>₦{(summary?.monthlyIncome ?? 0).toLocaleString("en-NG")}</Text>
            </View>
          </View>
          <View style={[styles.statDivider]} />
          <View style={styles.statItem}>
            <Feather name="arrow-up" size={14} color="rgba(255,255,255,0.8)" />
            <View style={{ marginLeft: 6 }}>
              <Text style={styles.statLabel}>Spending</Text>
              <Text style={styles.statVal}>₦{(summary?.monthlySpend ?? 0).toLocaleString("en-NG")}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Banners Carousel */}
      {banners && banners.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.bannerCarousel}
          contentContainerStyle={styles.bannerCarouselContent}
        >
          {banners.map((banner) => (
            <TouchableOpacity
              key={banner.id}
              style={[styles.bannerCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.9}
              onPress={() => {
                if (banner.linkUrl) {
                  if (banner.linkUrl.startsWith("novamoni://") || banner.linkUrl.startsWith("novapay://") || banner.linkUrl.startsWith("/")) {
                    const path = banner.linkUrl.replace("novamoni://", "/").replace("novapay://", "/");
                    handlePress(path);
                  } else {
                    Alert.alert(banner.title, banner.description || "Learn more about this offer!");
                  }
                } else {
                  Alert.alert(banner.title, banner.description || "Learn more about this offer!");
                }
              }}
            >
              <View style={styles.bannerTextContainer}>
                <Text style={[styles.bannerTitle, { color: colors.foreground }]} numberOfLines={1}>
                  {banner.title}
                </Text>
                {banner.description && (
                  <Text style={[styles.bannerDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                    {banner.description}
                  </Text>
                )}
              </View>
              <View style={styles.bannerImageContainer}>
                <View style={[styles.bannerIconBadge, { backgroundColor: colors.primary + "18" }]}>
                  <Feather name="gift" size={22} color={colors.primary} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Quick Actions */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.quickActions}>
          <QuickAction icon="send" label="Send" onPress={() => handlePress("/transfer")} />
          <QuickAction icon="download" label="Receive" onPress={() => handlePress("/receive")} />
          <QuickAction icon="credit-card" label="Cards" onPress={() => handlePress("/(tabs)/cards")} />
          <QuickAction icon="target" label="Save" onPress={() => handlePress("/(tabs)/savings")} />
        </View>
      </View>

      {/* More Services */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>More services</Text>
      </View>
      <View style={[styles.servicesGrid, { backgroundColor: colors.card }]}>
        {(SERVICES.length > 8 ? SERVICES.slice(0, MAX_VISIBLE_SERVICES) : SERVICES).map(s => (
          <TouchableOpacity
            key={s.label}
            style={styles.serviceItem}
            onPress={() => handlePress(s.route)}
          >
            <View style={[styles.serviceIcon, { backgroundColor: s.color + "18" }]}>
              <Feather name={s.icon as any} size={20} color={s.color} />
            </View>
            <Text style={[styles.serviceLabel, { color: colors.foreground }]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
        {SERVICES.length > 8 && (
          <TouchableOpacity
            style={styles.serviceItem}
            onPress={() => router.push("/all-services" as any)}
          >
            <View style={[styles.serviceIcon, { backgroundColor: colors.primary + "18" }]}>
              <Feather name="grid" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.serviceLabel, { color: colors.foreground }]}>More</Text>
          </TouchableOpacity>
        )}
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { gap: 0, paddingTop: 4 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular" },
  name: { fontSize: 22, fontFamily: "Inter_700Bold", marginTop: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
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
  eyeBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
  },
  eyeLabel: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },
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
    marginHorizontal: 20, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 16, marginBottom: 16,
    flexDirection: "row", flexWrap: "wrap",
  },
  serviceItem: {
    width: "25%", alignItems: "center", paddingVertical: 12, gap: 8,
  },
  serviceIcon: { width: 54, height: 54, borderRadius: 27, justifyContent: "center", alignItems: "center" },
  serviceLabel: { fontSize: 11, fontFamily: "Inter_500Medium", textAlign: "center" },
  transactionList: { marginHorizontal: 20, borderRadius: 20, overflow: "hidden", marginBottom: 16 },
  emptyState: { padding: 32, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  bannerCarousel: {
    marginBottom: 16,
  },
  bannerCarouselContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  bannerCard: {
    width: 290,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 84,
  },
  bannerTextContainer: {
    flex: 1,
    paddingRight: 8,
  },
  bannerTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  bannerDesc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 3,
    lineHeight: 14,
  },
  bannerImageContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  bannerIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
});
