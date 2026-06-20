import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Platform, Modal
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import {
  useGetScheduledTransfers, useCreateScheduledTransfer, useCancelScheduledTransfer,
  useGetAccounts, getGetScheduledTransfersQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const FREQUENCIES = [
  { id: "once", label: "One-time", icon: "arrow-right" },
  { id: "weekly", label: "Weekly", icon: "calendar" },
  { id: "monthly", label: "Monthly", icon: "repeat" },
] as const;

const NIGERIAN_BANKS = [
  "Access Bank", "GTBank", "First Bank", "Zenith Bank", "UBA", "Stanbic IBTC",
  "Fidelity Bank", "FCMB", "Union Bank", "Sterling Bank", "Wema Bank", "Polaris Bank",
  "NovaPay",
];

export default function ScheduledTransfersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { data: schedules, isLoading } = useGetScheduledTransfers();
  const { data: accounts } = useGetAccounts();
  const createSchedule = useCreateScheduledTransfer();
  const cancelSchedule = useCancelScheduledTransfer();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    recipientName: "", recipientBank: "GTBank", recipientAccount: "",
    amount: "", description: "", frequency: "once" as "once" | "weekly" | "monthly",
    startDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
  });

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const account = accounts?.[0];
  const active = (schedules ?? []).filter(s => s.status === "active");
  const past = (schedules ?? []).filter(s => s.status !== "active");

  async function handleCreate() {
    if (!form.recipientName || !form.recipientAccount || !form.amount || !form.description) {
      Alert.alert("Missing fields", "Please fill in all required fields."); return;
    }
    if (!account) { Alert.alert("No account"); return; }
    try {
      await createSchedule.mutateAsync({
        data: {
          fromAccountId: account.id,
          amount: parseFloat(form.amount),
          recipientName: form.recipientName,
          recipientBank: form.recipientBank,
          recipientAccount: form.recipientAccount,
          description: form.description,
          frequency: form.frequency,
          startDate: new Date(form.startDate).toISOString(),
        }
      });
      qc.invalidateQueries({ queryKey: getGetScheduledTransfersQueryKey() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowModal(false);
    } catch (err: any) {
      Alert.alert("Error", err?.data?.error ?? "Could not create schedule.");
    }
  }

  async function handleCancel(id: string, name: string) {
    Alert.alert("Cancel schedule", `Stop scheduled transfer to ${name}?`, [
      { text: "Keep it", style: "cancel" },
      {
        text: "Cancel schedule", style: "destructive", onPress: async () => {
          await cancelSchedule.mutateAsync({ id });
          qc.invalidateQueries({ queryKey: getGetScheduledTransfersQueryKey() });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    ]);
  }

  const freqLabel: Record<string, string> = { once: "One-time", weekly: "Weekly", monthly: "Monthly" };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Scheduled Transfers</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowModal(true)}
        >
          <Feather name="plus" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ padding: 40 }} />
        ) : !active.length && !past.length ? (
          <View style={styles.empty}>
            <Feather name="clock" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No scheduled transfers</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Automate recurring payments like rent or salary</Text>
            <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: colors.primary }]} onPress={() => setShowModal(true)}>
              <Text style={styles.emptyBtnText}>Add schedule</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {active.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Active</Text>
                {active.map(s => (
                  <View key={s.id} style={[styles.card, { backgroundColor: colors.card }]}>
                    <View style={[styles.cardIcon, { backgroundColor: colors.secondary }]}>
                      <Feather name="repeat" size={18} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardName, { color: colors.foreground }]}>{s.recipientName}</Text>
                      <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>{s.recipientBank} • {freqLabel[s.frequency]}</Text>
                      <Text style={[styles.cardDate, { color: colors.mutedForeground }]}>
                        Next: {new Date(s.nextRunAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 8 }}>
                      <Text style={[styles.cardAmount, { color: colors.foreground }]}>₦{s.amount.toLocaleString("en-NG")}</Text>
                      <TouchableOpacity onPress={() => handleCancel(s.id, s.recipientName)}>
                        <Text style={[styles.cancelText, { color: colors.destructive }]}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}
            {past.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 16 }]}>Cancelled</Text>
                {past.map(s => (
                  <View key={s.id} style={[styles.card, { backgroundColor: colors.card, opacity: 0.5 }]}>
                    <View style={[styles.cardIcon, { backgroundColor: colors.border }]}>
                      <Feather name="x" size={18} color={colors.mutedForeground} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardName, { color: colors.foreground }]}>{s.recipientName}</Text>
                      <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>{s.recipientBank} • {freqLabel[s.frequency]}</Text>
                    </View>
                    <Text style={[styles.cardAmount, { color: colors.mutedForeground }]}>₦{s.amount.toLocaleString("en-NG")}</Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Scheduled Transfer</Text>

            {[
              { label: "Recipient name", key: "recipientName", placeholder: "John Doe", keyboard: "default" },
              { label: "Account number", key: "recipientAccount", placeholder: "0123456789", keyboard: "numeric" },
              { label: "Amount (₦)", key: "amount", placeholder: "10000", keyboard: "numeric" },
              { label: "Description", key: "description", placeholder: "Rent payment", keyboard: "default" },
            ].map(f => (
              <View key={f.key} style={{ marginBottom: 12 }}>
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{f.label}</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                  placeholder={f.placeholder}
                  placeholderTextColor={colors.mutedForeground}
                  value={form[f.key as keyof typeof form] as string}
                  onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))}
                  keyboardType={f.keyboard as any}
                />
              </View>
            ))}

            <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Bank</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {NIGERIAN_BANKS.map(b => (
                <TouchableOpacity
                  key={b}
                  style={[styles.bankChip, { borderColor: form.recipientBank === b ? colors.primary : colors.border, backgroundColor: colors.background }]}
                  onPress={() => setForm(p => ({ ...p, recipientBank: b }))}
                >
                  <Text style={[styles.bankChipText, { color: form.recipientBank === b ? colors.primary : colors.foreground }]}>{b}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Frequency</Text>
            <View style={styles.freqRow}>
              {FREQUENCIES.map(f => (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.freqBtn, { borderColor: form.frequency === f.id ? colors.primary : colors.border, backgroundColor: colors.background }]}
                  onPress={() => setForm(p => ({ ...p, frequency: f.id }))}
                >
                  <Feather name={f.icon as any} size={14} color={form.frequency === f.id ? colors.primary : colors.mutedForeground} />
                  <Text style={[styles.freqText, { color: form.frequency === f.id ? colors.primary : colors.foreground }]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={() => setShowModal(false)}>
                <Text style={[styles.cancelBtnText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createBtn, { backgroundColor: colors.primary }]}
                onPress={handleCreate}
                disabled={createSchedule.isPending}
              >
                {createSchedule.isPending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.createBtnText}>Schedule</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { width: 38, height: 38, justifyContent: "center" },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  addBtn: { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  content: { padding: 20 },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 10 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 16, marginBottom: 10 },
  cardIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  cardName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  cardSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  cardDate: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  cardAmount: { fontSize: 14, fontFamily: "Inter_700Bold" },
  cancelText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 32 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  emptyBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, maxHeight: "90%" },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#E0E0E0", alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 16 },
  formLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 6 },
  formInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, height: 44, fontSize: 14, fontFamily: "Inter_400Regular" },
  bankChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  bankChipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  freqRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  freqBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  freqText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  modalActions: { flexDirection: "row", gap: 12 },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: 12, height: 50, justifyContent: "center", alignItems: "center" },
  cancelBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  createBtn: { flex: 1, borderRadius: 12, height: 50, justifyContent: "center", alignItems: "center" },
  createBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
