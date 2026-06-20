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
import { useCreateTransfer, useGetAccounts, getGetAccountsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const CURRENCIES = [
  { code: "USD", flag: "🇺🇸", name: "US Dollar", rate: 1640 },
  { code: "GBP", flag: "🇬🇧", name: "British Pound", rate: 2080 },
  { code: "EUR", flag: "🇪🇺", name: "Euro", rate: 1780 },
  { code: "CAD", flag: "🇨🇦", name: "Canadian Dollar", rate: 1200 },
  { code: "AUD", flag: "🇦🇺", name: "Australian Dollar", rate: 1060 },
  { code: "GHS", flag: "🇬🇭", name: "Ghanaian Cedi", rate: 125 },
  { code: "KES", flag: "🇰🇪", name: "Kenyan Shilling", rate: 12 },
];

const BANKS: Record<string, string[]> = {
  USD: ["Chase Bank", "Bank of America", "Citibank", "Wells Fargo"],
  GBP: ["Barclays", "HSBC", "Lloyds Bank", "NatWest"],
  EUR: ["Deutsche Bank", "BNP Paribas", "Santander", "ING"],
  CAD: ["RBC", "TD Bank", "Scotiabank", "BMO"],
  AUD: ["Commonwealth Bank", "ANZ", "NAB", "Westpac"],
  GHS: ["GCB Bank", "Ecobank Ghana", "Stanbic Ghana"],
  KES: ["KCB Bank", "Equity Bank", "Co-operative Bank"],
};

export default function InternationalTransferScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { data: accounts } = useGetAccounts();
  const createTransfer = useCreateTransfer();

  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]!);
  const [amountFx, setAmountFx] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientBank, setRecipientBank] = useState(BANKS["USD"]![0]!);
  const [accountNumber, setAccountNumber] = useState("");
  const [swiftCode, setSwiftCode] = useState("");
  const [step, setStep] = useState(1);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const account = accounts?.[0];
  const fxAmount = parseFloat(amountFx) || 0;
  const ngnEquivalent = fxAmount * selectedCurrency.rate;
  const fee = Math.max(1500, ngnEquivalent * 0.015);

  function handleCurrencyChange(c: typeof CURRENCIES[0]) {
    setSelectedCurrency(c);
    setRecipientBank(BANKS[c.code]![0]!);
  }

  async function handleSend() {
    if (!recipientName || !accountNumber || !swiftCode) {
      Alert.alert("Missing info", "Please fill in all recipient details."); return;
    }
    if (!fxAmount || fxAmount <= 0) { Alert.alert("Invalid amount"); return; }
    if (!account) { Alert.alert("No account found"); return; }
    const totalDebit = ngnEquivalent + fee;
    if (totalDebit > account.balance) { Alert.alert("Insufficient funds", `You need ₦${totalDebit.toLocaleString("en-NG", { minimumFractionDigits: 0 })} (including ₦${fee.toLocaleString("en-NG", { minimumFractionDigits: 0 })} fee).`); return; }

    try {
      await createTransfer.mutateAsync({
        data: {
          fromAccountId: account.id,
          amount: Math.round(totalDebit),
          recipientName,
          recipientBank: `${recipientBank} (${selectedCurrency.code})`,
          recipientAccount: accountNumber,
          description: `FX Transfer – ${fxAmount} ${selectedCurrency.code} to ${recipientName} (SWIFT: ${swiftCode})`,
        }
      });
      qc.invalidateQueries({ queryKey: getGetAccountsQueryKey() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Transfer initiated! 🌍",
        `${fxAmount} ${selectedCurrency.code} to ${recipientName}.\nDeducted: ₦${totalDebit.toLocaleString("en-NG", { minimumFractionDigits: 0 })} (includes ₦${fee.toLocaleString("en-NG", { minimumFractionDigits: 0 })} fee)\nArrival: 1–3 business days`,
        [{ text: "Done", onPress: () => router.back() }]
      );
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Transfer failed", err?.data?.error ?? "Please try again.");
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>International Transfer</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        {/* Rate banner */}
        <View style={[styles.rateBanner, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" }]}>
          <Feather name="trending-up" size={16} color={colors.primary} />
          <Text style={[styles.rateText, { color: colors.primary }]}>
            1 {selectedCurrency.code} = ₦{selectedCurrency.rate.toLocaleString("en-NG")} • Updated just now
          </Text>
        </View>

        {/* Currency selector */}
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Send currency</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          {CURRENCIES.map(c => (
            <TouchableOpacity
              key={c.code}
              style={[
                styles.currencyBtn,
                { backgroundColor: colors.card, borderColor: selectedCurrency.code === c.code ? colors.primary : colors.border },
                selectedCurrency.code === c.code && { borderWidth: 2 }
              ]}
              onPress={() => handleCurrencyChange(c)}
            >
              <Text style={styles.currencyFlag}>{c.flag}</Text>
              <Text style={[styles.currencyCode, { color: colors.foreground }]}>{c.code}</Text>
              <Text style={[styles.currencyName, { color: colors.mutedForeground }]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Amount */}
        <Text style={[styles.label, { color: colors.mutedForeground }]}>You send ({selectedCurrency.code})</Text>
        <View style={[styles.amountBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.currencySymbol, { color: colors.foreground }]}>{selectedCurrency.code}</Text>
          <TextInput
            style={[styles.amountInput, { color: colors.foreground }]}
            placeholder="0.00"
            placeholderTextColor={colors.mutedForeground}
            value={amountFx}
            onChangeText={setAmountFx}
            keyboardType="decimal-pad"
          />
        </View>

        {fxAmount > 0 && (
          <View style={[styles.breakdown, { backgroundColor: colors.secondary }]}>
            <View style={styles.breakRow}>
              <Text style={[styles.breakLabel, { color: colors.mutedForeground }]}>Exchange rate</Text>
              <Text style={[styles.breakVal, { color: colors.foreground }]}>1 {selectedCurrency.code} = ₦{selectedCurrency.rate.toLocaleString("en-NG")}</Text>
            </View>
            <View style={styles.breakRow}>
              <Text style={[styles.breakLabel, { color: colors.mutedForeground }]}>Converted</Text>
              <Text style={[styles.breakVal, { color: colors.foreground }]}>₦{ngnEquivalent.toLocaleString("en-NG", { minimumFractionDigits: 0 })}</Text>
            </View>
            <View style={styles.breakRow}>
              <Text style={[styles.breakLabel, { color: colors.mutedForeground }]}>Transfer fee</Text>
              <Text style={[styles.breakVal, { color: colors.foreground }]}>₦{fee.toLocaleString("en-NG", { minimumFractionDigits: 0 })}</Text>
            </View>
            <View style={[styles.breakRow, styles.breakTotal]}>
              <Text style={[styles.breakLabel, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>You pay (₦)</Text>
              <Text style={[styles.breakVal, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>₦{(ngnEquivalent + fee).toLocaleString("en-NG", { minimumFractionDigits: 0 })}</Text>
            </View>
          </View>
        )}

        {/* Recipient */}
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Recipient name</Text>
        <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Feather name="user" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Full name"
            placeholderTextColor={colors.mutedForeground}
            value={recipientName}
            onChangeText={setRecipientName}
          />
        </View>

        <Text style={[styles.label, { color: colors.mutedForeground }]}>Recipient bank</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {(BANKS[selectedCurrency.code] ?? []).map(b => (
            <TouchableOpacity
              key={b}
              style={[styles.bankChip, { borderColor: recipientBank === b ? colors.primary : colors.border, backgroundColor: colors.card }]}
              onPress={() => setRecipientBank(b)}
            >
              <Text style={[styles.bankChipText, { color: recipientBank === b ? colors.primary : colors.foreground }]}>{b}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.label, { color: colors.mutedForeground }]}>Account / IBAN number</Text>
        <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Feather name="hash" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Account / IBAN"
            placeholderTextColor={colors.mutedForeground}
            value={accountNumber}
            onChangeText={setAccountNumber}
          />
        </View>

        <Text style={[styles.label, { color: colors.mutedForeground }]}>SWIFT / BIC code</Text>
        <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Feather name="globe" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="e.g. BARCGB22"
            placeholderTextColor={colors.mutedForeground}
            value={swiftCode}
            onChangeText={setSwiftCode}
            autoCapitalize="characters"
          />
        </View>

        <View style={[styles.infoBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="info" size={14} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            International transfers take 1–3 business days. Rate is locked at time of sending.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: colors.primary, opacity: createTransfer.isPending ? 0.7 : 1 }]}
          onPress={handleSend}
          disabled={createTransfer.isPending}
        >
          {createTransfer.isPending
            ? <ActivityIndicator color="#fff" />
            : <>
              <Feather name="globe" size={18} color="#fff" />
              <Text style={styles.sendBtnText}>Send {fxAmount > 0 ? `${fxAmount} ${selectedCurrency.code}` : "Money"}</Text>
            </>
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
  rateBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  rateText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 10 },
  currencyBtn: { alignItems: "center", padding: 12, borderRadius: 14, borderWidth: 1, marginRight: 10, minWidth: 80 },
  currencyFlag: { fontSize: 24 },
  currencyCode: { fontSize: 13, fontFamily: "Inter_700Bold", marginTop: 4 },
  currencyName: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 2, textAlign: "center" },
  amountBox: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, height: 60, marginBottom: 16, gap: 8 },
  currencySymbol: { fontSize: 18, fontFamily: "Inter_700Bold" },
  amountInput: { flex: 1, fontSize: 28, fontFamily: "Inter_700Bold" },
  breakdown: { borderRadius: 14, padding: 14, gap: 10, marginBottom: 20 },
  breakRow: { flexDirection: "row", justifyContent: "space-between" },
  breakTotal: { paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(0,0,0,0.1)" },
  breakLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  breakVal: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 52, marginBottom: 16 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  bankChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  bankChipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  infoBox: { flexDirection: "row", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  infoText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  sendBtn: { borderRadius: 14, height: 54, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  sendBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
