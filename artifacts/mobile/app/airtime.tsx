import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Platform
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useBuyAirtime, useGetAccounts, getGetAccountsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const NETWORKS = [
  { id: "MTN", color: "#FFC300", logo: "☀️" },
  { id: "Airtel", color: "#E03531", logo: "📡" },
  { id: "Glo", color: "#4CAF50", logo: "🌿" },
  { id: "9Mobile", color: "#006B3F", logo: "💚" },
];

const DATA_PLANS: Record<string, { label: string; amount: number }[]> = {
  MTN: [
    { label: "1GB – 7 days", amount: 350 },
    { label: "2GB – 30 days", amount: 600 },
    { label: "5GB – 30 days", amount: 1500 },
    { label: "10GB – 30 days", amount: 2500 },
    { label: "20GB – 30 days", amount: 4500 },
  ],
  Airtel: [
    { label: "1GB – 7 days", amount: 300 },
    { label: "2GB – 30 days", amount: 550 },
    { label: "5GB – 30 days", amount: 1400 },
    { label: "10GB – 30 days", amount: 2400 },
    { label: "20GB – 30 days", amount: 4000 },
  ],
  Glo: [
    { label: "1.8GB – 30 days", amount: 500 },
    { label: "3.6GB – 30 days", amount: 1000 },
    { label: "7.5GB – 30 days", amount: 2000 },
    { label: "15GB – 30 days", amount: 3500 },
  ],
  "9Mobile": [
    { label: "1GB – 30 days", amount: 200 },
    { label: "2.5GB – 30 days", amount: 500 },
    { label: "5GB – 30 days", amount: 1000 },
    { label: "11.5GB – 30 days", amount: 2000 },
  ],
};

const AIRTIME_PRESETS = [100, 200, 500, 1000, 2000, 5000];

import { useAuth } from "@/context/AuthContext";

export default function AirtimeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { data: accounts } = useGetAccounts();
  const buyAirtime = useBuyAirtime();
  const { isFeatureEnabled } = useFeatureFlags();
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.kycStatus !== "verified" && user.kycStatus !== "approved") {
      Alert.alert(
        "KYC Verification Required",
        "Before you can buy airtime or data, you must complete your KYC verification.",
        [
          { text: "Go to KYC", onPress: () => router.replace("/kyc") },
          { text: "Cancel", onPress: () => router.back(), style: "cancel" }
        ]
      );
    }
  }, [user]);

  const airtimeBillsEnabled = isFeatureEnabled("airtime-bills-enabled");

  if (!airtimeBillsEnabled) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center", padding: 20 }]}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.destructive + "12", justifyContent: "center", alignItems: "center", marginBottom: 16 }}>
          <Feather name="lock" size={32} color={colors.destructive} />
        </View>
        <Text style={{ fontSize: 20, fontFamily: "Inter_700Bold", color: colors.foreground, marginBottom: 8, textAlign: "center" }}>
          Airtime & Data Offline
        </Text>
        <Text style={{ fontSize: 14, fontFamily: "Inter_400Regular", color: colors.mutedForeground, textAlign: "center", marginBottom: 24, lineHeight: 20 }}>
          Airtime purchases and mobile data top-ups are undergoing a brief maintenance update. Please check back shortly.
        </Text>
        <TouchableOpacity
          style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.primary }}
          onPress={() => router.back()}
        >
          <Text style={{ color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const [tab, setTab] = useState<"airtime" | "data">("airtime");
  const [network, setNetwork] = useState("MTN");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<{ label: string; amount: number } | null>(null);

  const account = accounts?.[0];
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  async function handleBuy() {
    if (!phone || phone.length < 10) { Alert.alert("Invalid number", "Enter a valid Nigerian phone number."); return; }
    if (!account) { Alert.alert("No account", "No account found."); return; }
    const finalAmount = tab === "data" ? (selectedPlan?.amount ?? 0) : parseFloat(amount);
    if (!finalAmount || finalAmount <= 0) { Alert.alert("Invalid amount", "Select or enter a valid amount."); return; }
    if (finalAmount > account.balance) { Alert.alert("Insufficient funds", "Not enough balance."); return; }

    try {
      await buyAirtime.mutateAsync({
        data: {
          fromAccountId: account.id,
          phone,
          network: network as any,
          purchaseType: tab,
          amount: finalAmount,
          plan: tab === "data" ? selectedPlan?.label : undefined,
        }
      });
      qc.invalidateQueries({ queryKey: getGetAccountsQueryKey() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const label = tab === "data" ? selectedPlan?.label : `₦${finalAmount} airtime`;
      Alert.alert("Success! 🎉", `${network} ${label} sent to ${phone}`, [
        { text: "Done", onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Failed", err?.data?.error ?? "Could not complete purchase.");
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Airtime & Data</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        {/* Tabs */}
        <View style={[styles.tabBar, { backgroundColor: colors.secondary }]}>
          {(["airtime", "data"] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && { backgroundColor: colors.card, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }]}
              onPress={() => { setTab(t); setSelectedPlan(null); setAmount(""); }}
            >
              <Text style={[styles.tabText, { color: tab === t ? colors.foreground : colors.mutedForeground }]}>
                {t === "airtime" ? "Airtime" : "Data"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Network */}
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Select network</Text>
        <View style={styles.networkRow}>
          {NETWORKS.map(n => (
            <TouchableOpacity
              key={n.id}
              style={[
                styles.networkBtn,
                { borderColor: network === n.id ? n.color : colors.border, backgroundColor: colors.card },
                network === n.id && { borderWidth: 2 }
              ]}
              onPress={() => { setNetwork(n.id); setSelectedPlan(null); }}
            >
              <Text style={styles.networkLogo}>{n.logo}</Text>
              <Text style={[styles.networkLabel, { color: colors.foreground }]}>{n.id}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Phone */}
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Phone number</Text>
        <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Feather name="phone" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="080 0000 0000"
            placeholderTextColor={colors.mutedForeground}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={11}
          />
        </View>

        {tab === "airtime" ? (
          <>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Amount (₦)</Text>
            <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={[styles.naira, { color: colors.foreground }]}>₦</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.presets}>
              {AIRTIME_PRESETS.map(a => (
                <TouchableOpacity
                  key={a}
                  style={[styles.presetBtn, { backgroundColor: colors.card, borderColor: colors.border }, amount === String(a) && { borderColor: colors.primary }]}
                  onPress={() => setAmount(String(a))}
                >
                  <Text style={[styles.presetText, { color: colors.foreground }]}>₦{a.toLocaleString("en-NG")}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Select data plan</Text>
            {(DATA_PLANS[network] ?? []).map(plan => (
              <TouchableOpacity
                key={plan.label}
                style={[
                  styles.planRow,
                  { backgroundColor: colors.card, borderColor: selectedPlan?.label === plan.label ? colors.primary : colors.border }
                ]}
                onPress={() => setSelectedPlan(plan)}
              >
                <View>
                  <Text style={[styles.planLabel, { color: colors.foreground }]}>{plan.label}</Text>
                  <Text style={[styles.planNetwork, { color: colors.mutedForeground }]}>{network}</Text>
                </View>
                <View style={styles.planRight}>
                  <Text style={[styles.planPrice, { color: colors.primary }]}>₦{plan.amount.toLocaleString("en-NG")}</Text>
                  {selectedPlan?.label === plan.label && <Feather name="check-circle" size={18} color={colors.primary} />}
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {account && (
          <Text style={[styles.balanceNote, { color: colors.mutedForeground }]}>
            Balance: ₦{account.balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </Text>
        )}

        <TouchableOpacity
          style={[styles.buyBtn, { backgroundColor: colors.primary, opacity: buyAirtime.isPending ? 0.7 : 1 }]}
          onPress={handleBuy}
          disabled={buyAirtime.isPending}
        >
          {buyAirtime.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buyBtnText}>{tab === "data" ? "Buy Data" : "Buy Airtime"}</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { width: 38, height: 38, justifyContent: "center" },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  content: { padding: 20 },
  tabBar: { flexDirection: "row", borderRadius: 12, padding: 4, marginBottom: 24 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  tabText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 10 },
  networkRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  networkBtn: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12, borderWidth: 1, gap: 4 },
  networkLogo: { fontSize: 22 },
  networkLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 52, marginBottom: 16 },
  input: { flex: 1, fontSize: 16, fontFamily: "Inter_400Regular" },
  naira: { fontSize: 18, fontFamily: "Inter_700Bold" },
  presets: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  presetBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  presetText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  planRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderRadius: 14, borderWidth: 1.5, marginBottom: 10 },
  planLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  planNetwork: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  planRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  planPrice: { fontSize: 16, fontFamily: "Inter_700Bold" },
  balanceNote: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 20 },
  buyBtn: { borderRadius: 14, height: 54, justifyContent: "center", alignItems: "center" },
  buyBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
