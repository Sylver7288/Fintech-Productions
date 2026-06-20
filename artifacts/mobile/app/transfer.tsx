import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView, Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import {
  useGetAccounts, useCreateTransfer,
  getGetAccountsQueryKey, getGetTransactionsQueryKey,
  useGetBeneficiaries,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const BANKS = [
  "Access Bank", "GTBank", "First Bank", "Zenith Bank", "UBA",
  "Stanbic IBTC", "Fidelity Bank", "FCMB", "Sterling Bank", "Kuda Bank", "NovaPay"
];

export default function TransferScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { data: accounts } = useGetAccounts();
  const { data: beneficiaries } = useGetBeneficiaries();
  const createTransfer = useCreateTransfer();

  const params = useLocalSearchParams<{
    prefillName?: string;
    prefillAccount?: string;
    prefillBank?: string;
    prefillAmount?: string;
  }>();

  const [amount, setAmount] = useState(params.prefillAmount ?? "");
  const [recipientName, setRecipientName] = useState(params.prefillName ?? "");
  const [recipientBank, setRecipientBank] = useState(params.prefillBank ?? "Kuda Bank");
  const [recipientAccount, setRecipientAccount] = useState(params.prefillAccount ?? "");
  const [description, setDescription] = useState("");
  const [showBankPicker, setShowBankPicker] = useState(false);

  const fromAccount = accounts?.[0];
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  useEffect(() => {
    if (params.prefillName) setRecipientName(params.prefillName);
    if (params.prefillAccount) setRecipientAccount(params.prefillAccount);
    if (params.prefillBank) setRecipientBank(params.prefillBank);
    if (params.prefillAmount) setAmount(params.prefillAmount);
  }, [params.prefillName, params.prefillAccount, params.prefillBank, params.prefillAmount]);

  function fillFromBeneficiary(b: { name: string; bank: string; accountNumber: string }) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRecipientName(b.name);
    setRecipientBank(b.bank);
    setRecipientAccount(b.accountNumber);
  }

  async function handleTransfer() {
    if (!amount || !recipientName || !recipientAccount || !description) {
      Alert.alert("Missing fields", "Please fill in all required fields");
      return;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert("Invalid amount", "Please enter a valid amount");
      return;
    }
    if (!fromAccount) {
      Alert.alert("No account", "No account found");
      return;
    }

    Alert.alert(
      "Confirm Transfer",
      `Send ₦${amt.toLocaleString("en-NG")} to ${recipientName}\n${recipientBank} • ${recipientAccount}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm", onPress: async () => {
            try {
              await createTransfer.mutateAsync({
                data: {
                  fromAccountId: fromAccount.id,
                  amount: amt,
                  recipientName,
                  recipientBank,
                  recipientAccount,
                  description,
                }
              });
              await Promise.all([
                qc.invalidateQueries({ queryKey: getGetAccountsQueryKey() }),
                qc.invalidateQueries({ queryKey: getGetTransactionsQueryKey() }),
              ]);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Success!", `₦${amt.toLocaleString("en-NG")} sent to ${recipientName}`, [
                { text: "Done", onPress: () => router.back() }
              ]);
            } catch (err: any) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert("Transfer failed", err?.data?.error ?? "Something went wrong");
            }
          }
        }
      ]
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.navbar, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>Send Money</Text>
        <TouchableOpacity
          onPress={() => router.push({ pathname: "/beneficiaries" as any, params: { fromTransfer: "true" } })}
        >
          <Feather name="users" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">
        {/* Saved contacts */}
        {beneficiaries && beneficiaries.length > 0 && (
          <View>
            <Text style={[styles.contactsLabel, { color: colors.mutedForeground }]}>Saved contacts</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.contactsScroll} contentContainerStyle={{ gap: 10 }}>
              {beneficiaries.map(b => (
                <TouchableOpacity
                  key={b.id}
                  style={[styles.contactChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => fillFromBeneficiary(b)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.contactAvatar, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.contactInitial, { color: colors.primary }]}>
                      {b.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.contactName, { color: colors.foreground }]} numberOfLines={1}>{b.name.split(" ")[0]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Amount */}
        <View style={[styles.amountCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.amountLabel}>Amount to send</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currency}>₦</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
          </View>
          {fromAccount && (
            <Text style={styles.balanceHint}>
              Available: ₦{fromAccount.balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </Text>
          )}
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.card }]}>
          <Field label="Recipient name" colors={colors}>
            <TextInput
              style={[styles.fieldInput, { color: colors.foreground }]}
              placeholder="Full name"
              placeholderTextColor={colors.mutedForeground}
              value={recipientName}
              onChangeText={setRecipientName}
            />
          </Field>

          <Field label="Bank" colors={colors}>
            <TouchableOpacity onPress={() => setShowBankPicker(true)} style={styles.bankSelector}>
              <Text style={[styles.fieldInput, { color: colors.foreground, flex: 1 }]}>{recipientBank}</Text>
              <Feather name="chevron-down" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </Field>

          <Field label="Account number" colors={colors}>
            <TextInput
              style={[styles.fieldInput, { color: colors.foreground }]}
              placeholder="0000000000"
              placeholderTextColor={colors.mutedForeground}
              value={recipientAccount}
              onChangeText={setRecipientAccount}
              keyboardType="numeric"
              maxLength={10}
            />
          </Field>

          <Field label="Description" colors={colors} last>
            <TextInput
              style={[styles.fieldInput, { color: colors.foreground }]}
              placeholder="What's this for?"
              placeholderTextColor={colors.mutedForeground}
              value={description}
              onChangeText={setDescription}
            />
          </Field>
        </View>

        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: colors.primary, opacity: createTransfer.isPending ? 0.7 : 1 }]}
          onPress={handleTransfer}
          disabled={createTransfer.isPending}
          activeOpacity={0.85}
        >
          {createTransfer.isPending
            ? <ActivityIndicator color="#fff" />
            : <>
              <Feather name="send" size={18} color="#fff" />
              <Text style={styles.sendBtnText}>Send Money</Text>
            </>
          }
        </TouchableOpacity>
      </ScrollView>

      {/* Bank picker */}
      {showBankPicker && (
        <View style={[styles.pickerOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.pickerSheet, { backgroundColor: colors.card }]}>
            <Text style={[styles.pickerTitle, { color: colors.foreground }]}>Select Bank</Text>
            <ScrollView>
              {BANKS.map(b => (
                <TouchableOpacity
                  key={b}
                  style={[styles.pickerItem, { borderBottomColor: colors.border }]}
                  onPress={() => { setRecipientBank(b); setShowBankPicker(false); }}
                >
                  <Text style={[styles.pickerItemText, { color: colors.foreground }]}>{b}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

function Field({ label, children, colors, last = false }: any) {
  return (
    <View style={[styles.fieldWrap, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  navbar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 16,
  },
  back: { width: 40 },
  navTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  content: { paddingHorizontal: 20, gap: 16 },
  contactsLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, marginBottom: 10, textTransform: "uppercase" },
  contactsScroll: { marginBottom: 4 },
  contactChip: {
    alignItems: "center", gap: 6, paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 16, borderWidth: 1, minWidth: 72,
  },
  contactAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  contactInitial: { fontSize: 16, fontFamily: "Inter_700Bold" },
  contactName: { fontSize: 11, fontFamily: "Inter_500Medium" },
  amountCard: { borderRadius: 24, padding: 24 },
  amountLabel: { color: "rgba(255,255,255,0.75)", fontSize: 13, fontFamily: "Inter_400Regular" },
  amountRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  currency: { color: "#fff", fontSize: 28, fontFamily: "Inter_400Regular", marginRight: 4 },
  amountInput: { color: "#fff", fontSize: 40, fontFamily: "Inter_700Bold", flex: 1 },
  balanceHint: { color: "rgba(255,255,255,0.65)", fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 12 },
  formCard: { borderRadius: 20, overflow: "hidden" },
  fieldWrap: { paddingHorizontal: 16, paddingVertical: 14 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 6 },
  fieldInput: { fontSize: 15, fontFamily: "Inter_400Regular" },
  bankSelector: { flexDirection: "row", alignItems: "center" },
  sendBtn: {
    borderRadius: 16, height: 56, flexDirection: "row",
    justifyContent: "center", alignItems: "center", gap: 10,
  },
  sendBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  pickerOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "flex-end" },
  pickerSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: 400 },
  pickerTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 16 },
  pickerItem: { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  pickerItemText: { fontSize: 15, fontFamily: "Inter_500Medium" },
});
