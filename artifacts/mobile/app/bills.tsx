import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Platform
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { usePayBill, useGetAccounts, getGetAccountsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

type BillCategory = "electricity" | "cable" | "internet" | "water";

const CATEGORIES: { id: BillCategory; label: string; icon: string; color: string }[] = [
  { id: "electricity", label: "Electricity", icon: "zap", color: "#FDCB6E" },
  { id: "cable", label: "Cable TV", icon: "tv", color: "#6C5CE7" },
  { id: "internet", label: "Internet", icon: "wifi", color: "#0984E3" },
  { id: "water", label: "Water", icon: "droplet", color: "#00B894" },
];

const PROVIDERS: Record<BillCategory, { name: string; placeholder: string }[]> = {
  electricity: [
    { name: "EKEDC (Eko)", placeholder: "Meter / Smart Card Number" },
    { name: "IKEDC (Ikeja)", placeholder: "Meter / Smart Card Number" },
    { name: "AEDC (Abuja)", placeholder: "Meter / Smart Card Number" },
    { name: "PHED (Port Harcourt)", placeholder: "Meter / Smart Card Number" },
    { name: "KEDCO (Kano)", placeholder: "Meter / Smart Card Number" },
  ],
  cable: [
    { name: "DStv", placeholder: "Smartcard Number" },
    { name: "GOtv", placeholder: "Smartcard Number" },
    { name: "Startimes", placeholder: "Smartcard Number" },
  ],
  internet: [
    { name: "Spectranet", placeholder: "User ID / Account Number" },
    { name: "Smile", placeholder: "Account Number" },
    { name: "ipNX", placeholder: "Account Number" },
  ],
  water: [
    { name: "Lagos Water Corp", placeholder: "Account Number" },
    { name: "Abuja Water Board", placeholder: "Account Number" },
  ],
};

const AMOUNTS: Record<BillCategory, number[]> = {
  electricity: [1000, 2000, 5000, 10000, 20000],
  cable: [2000, 3800, 5700, 10800, 21000],
  internet: [3000, 7000, 15000, 30000],
  water: [500, 1000, 2000, 5000],
};

export default function BillsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { data: accounts } = useGetAccounts();
  const payBill = usePayBill();

  const [category, setCategory] = useState<BillCategory>("electricity");
  const [provider, setProvider] = useState(PROVIDERS.electricity[0]!.name);
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState("");

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const account = accounts?.[0];
  const currentProviders = PROVIDERS[category];
  const currentPlaceholder = currentProviders.find(p => p.name === provider)?.placeholder ?? "Reference Number";

  function switchCategory(c: BillCategory) {
    setCategory(c);
    setProvider(PROVIDERS[c][0]!.name);
    setReference("");
    setAmount("");
  }

  async function handlePay() {
    if (!reference.trim()) { Alert.alert("Missing info", "Please enter your reference number."); return; }
    if (!amount || parseFloat(amount) <= 0) { Alert.alert("Invalid amount", "Enter a valid amount."); return; }
    if (!account) { Alert.alert("No account", "No account found."); return; }
    const finalAmount = parseFloat(amount);
    if (finalAmount > account.balance) { Alert.alert("Insufficient funds", "Not enough balance."); return; }

    try {
      await payBill.mutateAsync({
        data: { fromAccountId: account.id, category, provider, reference, amount: finalAmount }
      });
      qc.invalidateQueries({ queryKey: getGetAccountsQueryKey() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Payment successful! ✅", `₦${finalAmount.toLocaleString("en-NG")} paid to ${provider}`, [
        { text: "Done", onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Failed", err?.data?.error ?? "Payment could not be processed.");
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Pay Bills</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        {/* Category grid */}
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Bill type</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c.id}
              style={[
                styles.categoryBtn,
                { backgroundColor: colors.card, borderColor: category === c.id ? c.color : colors.border },
                category === c.id && { borderWidth: 2 }
              ]}
              onPress={() => switchCategory(c.id)}
            >
              <View style={[styles.categoryIcon, { backgroundColor: c.color + "20" }]}>
                <Feather name={c.icon as any} size={20} color={c.color} />
              </View>
              <Text style={[styles.categoryLabel, { color: colors.foreground }]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Provider */}
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Provider</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {currentProviders.map(p => (
            <TouchableOpacity
              key={p.name}
              style={[
                styles.providerChip,
                { backgroundColor: colors.card, borderColor: provider === p.name ? colors.primary : colors.border },
                provider === p.name && { borderWidth: 2 }
              ]}
              onPress={() => setProvider(p.name)}
            >
              <Text style={[styles.providerText, { color: provider === p.name ? colors.primary : colors.foreground }]}>{p.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Reference */}
        <Text style={[styles.label, { color: colors.mutedForeground }]}>{currentPlaceholder}</Text>
        <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Feather name="hash" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder={currentPlaceholder}
            placeholderTextColor={colors.mutedForeground}
            value={reference}
            onChangeText={setReference}
            keyboardType="default"
          />
        </View>

        {/* Amount */}
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Amount (₦)</Text>
        <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={[styles.naira, { color: colors.foreground }]}>₦</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="0.00"
            placeholderTextColor={colors.mutedForeground}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.presets}>
          {AMOUNTS[category].map(a => (
            <TouchableOpacity
              key={a}
              style={[styles.presetBtn, { backgroundColor: colors.card, borderColor: amount === String(a) ? colors.primary : colors.border }]}
              onPress={() => setAmount(String(a))}
            >
              <Text style={[styles.presetText, { color: colors.foreground }]}>₦{a.toLocaleString("en-NG")}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {account && (
          <Text style={[styles.balanceNote, { color: colors.mutedForeground }]}>
            Balance: ₦{account.balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </Text>
        )}

        <TouchableOpacity
          style={[styles.payBtn, { backgroundColor: colors.primary, opacity: payBill.isPending ? 0.7 : 1 }]}
          onPress={handlePay}
          disabled={payBill.isPending}
        >
          {payBill.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.payBtnText}>Pay Bill</Text>
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
  label: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 10 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  categoryBtn: { width: "47%", borderRadius: 14, borderWidth: 1, padding: 14, alignItems: "center", gap: 8 },
  categoryIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  categoryLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  providerChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  providerText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 52, marginBottom: 16 },
  input: { flex: 1, fontSize: 16, fontFamily: "Inter_400Regular" },
  naira: { fontSize: 18, fontFamily: "Inter_700Bold" },
  presets: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  presetBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  presetText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  balanceNote: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 20 },
  payBtn: { borderRadius: 14, height: 54, justifyContent: "center", alignItems: "center" },
  payBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
