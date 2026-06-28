import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, Alert, Platform
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { SavingsCard } from "@/components/SavingsCard";
import {
  useGetSavings, useCreateSavings, useDeleteSavings, useTopUpSavings,
  useGetAccounts, getGetSavingsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const EMOJIS = ["🎯", "🏠", "✈️", "💻", "🎓", "💍", "🚗", "🌴", "💪", "🎉"];
const COLORS = ["#E5A93C", "#00B894", "#E17055", "#0984E3", "#FDCB6E", "#E84393", "#2D3436"];

type ActiveGoal = { id: string; name: string; emoji: string | null | undefined; color: string | null | undefined; targetAmount: number; currentAmount: number };

export default function SavingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { data: goals, isLoading } = useGetSavings();
  const { data: accounts } = useGetAccounts();
  const createSavings = useCreateSavings();
  const deleteSavings = useDeleteSavings();
  const topUpSavings = useTopUpSavings();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [activeGoal, setActiveGoal] = useState<ActiveGoal | null>(null);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [form, setForm] = useState({ name: "", targetAmount: "", emoji: "🎯", color: "#E5A93C" });

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const account = accounts?.[0];

  async function handleCreate() {
    if (!form.name || !form.targetAmount) {
      Alert.alert("Missing fields", "Please fill in goal name and target amount");
      return;
    }
    try {
      await createSavings.mutateAsync({
        data: {
          name: form.name,
          targetAmount: parseFloat(form.targetAmount),
          emoji: form.emoji,
          color: form.color,
        }
      });
      qc.invalidateQueries({ queryKey: getGetSavingsQueryKey() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowCreateModal(false);
      setForm({ name: "", targetAmount: "", emoji: "🎯", color: "#E5A93C" });
    } catch {
      Alert.alert("Error", "Could not create savings goal");
    }
  }

  async function handleTopUp() {
    if (!activeGoal || !account) return;
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid amount", "Please enter a valid amount.");
      return;
    }
    if (amount > (account.balance ?? 0)) {
      Alert.alert("Insufficient funds", "You don't have enough balance for this top-up.");
      return;
    }
    try {
      await topUpSavings.mutateAsync({ id: activeGoal.id, data: { amount, fromAccountId: account.id } });
      qc.invalidateQueries({ queryKey: getGetSavingsQueryKey() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTopUpAmount("");
      setShowGoalModal(false);
      Alert.alert("Top-up successful!", `₦${amount.toLocaleString("en-NG")} added to "${activeGoal.name}".`);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Failed", err?.data?.error ?? "Could not top up. Please try again.");
    }
  }

  function handleDelete() {
    if (!activeGoal) return;
    Alert.alert(
      "Delete goal",
      `Are you sure you want to delete "${activeGoal.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete", style: "destructive", onPress: async () => {
            try {
              await deleteSavings.mutateAsync({ id: activeGoal.id });
              qc.invalidateQueries({ queryKey: getGetSavingsQueryKey() });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setShowGoalModal(false);
            } catch {
              Alert.alert("Error", "Could not delete goal.");
            }
          }
        }
      ]
    );
  }

  const totalSaved = (goals ?? []).reduce((s, g) => s + g.currentAmount, 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100) }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: topPad + 16 }]}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>Savings</Text>
            <Text style={[styles.totalSaved, { color: colors.mutedForeground }]}>
              Total saved: ₦{totalSaved.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowCreateModal(true)}
          >
            <Feather name="plus" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ padding: 40 }} />
        ) : !goals?.length ? (
          <View style={styles.empty}>
            <Feather name="target" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No savings goals</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Set a goal to start saving towards something meaningful</Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.emptyBtnText}>Create goal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          goals.map(goal => (
            <SavingsCard
              key={goal.id}
              goal={goal as any}
              onPress={() => {
                setActiveGoal({ id: goal.id, name: goal.name, emoji: goal.emoji, color: goal.color, targetAmount: goal.targetAmount, currentAmount: goal.currentAmount });
                setTopUpAmount("");
                setShowGoalModal(true);
              }}
            />
          ))
        )}
      </ScrollView>

      {/* Goal Actions Modal (top-up + delete) */}
      <Modal visible={showGoalModal} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={styles.modalHandle} />
            <View style={styles.goalHeader}>
              <View style={[styles.goalEmoji, { backgroundColor: `${activeGoal?.color ?? colors.primary}20` }]}>
                <Text style={{ fontSize: 22 }}>{activeGoal?.emoji ?? "🎯"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>{activeGoal?.name}</Text>
                <Text style={[styles.goalProgress, { color: colors.mutedForeground }]}>
                  ₦{activeGoal?.currentAmount.toLocaleString("en-NG") ?? 0} of ₦{activeGoal?.targetAmount.toLocaleString("en-NG") ?? 0}
                </Text>
              </View>
            </View>

            <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>Top-up amount (₦)</Text>
            <View style={[styles.amountRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Text style={[styles.nairaSign, { color: colors.foreground }]}>₦</Text>
              <TextInput
                style={[styles.amountInput, { color: colors.foreground }]}
                placeholder="0.00"
                placeholderTextColor={colors.mutedForeground}
                value={topUpAmount}
                onChangeText={setTopUpAmount}
                keyboardType="decimal-pad"
              />
            </View>
            {account && (
              <Text style={[styles.balanceNote, { color: colors.mutedForeground }]}>
                Available balance: ₦{account.balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </Text>
            )}

            <View style={styles.quickAmounts}>
              {[1000, 5000, 10000, 20000].map(a => (
                <TouchableOpacity
                  key={a}
                  style={[styles.quickAmt, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                  onPress={() => setTopUpAmount(String(a))}
                >
                  <Text style={[styles.quickAmtText, { color: colors.foreground }]}>
                    ₦{a.toLocaleString("en-NG")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.topUpBtn, { backgroundColor: colors.primary, opacity: topUpSavings.isPending ? 0.7 : 1 }]}
              onPress={handleTopUp}
              disabled={topUpSavings.isPending || !topUpAmount}
            >
              {topUpSavings.isPending
                ? <ActivityIndicator color="#fff" size="small" />
                : <>
                  <Feather name="arrow-up" size={16} color="#fff" />
                  <Text style={styles.topUpBtnText}>Add to savings</Text>
                </>
              }
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => setShowGoalModal(false)}
              >
                <Text style={[styles.cancelText, { color: colors.foreground }]}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteBtn, { borderColor: "#FECACA" }]}
                onPress={handleDelete}
              >
                <Feather name="trash-2" size={14} color={colors.destructive} />
                <Text style={[styles.deleteText, { color: colors.destructive }]}>Delete goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Savings Goal</Text>

            <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>Goal name</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder="e.g. Emergency fund"
              placeholderTextColor={colors.mutedForeground}
              value={form.name}
              onChangeText={v => setForm(f => ({ ...f, name: v }))}
            />

            <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>Target amount (₦)</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder="e.g. 500000"
              placeholderTextColor={colors.mutedForeground}
              value={form.targetAmount}
              onChangeText={v => setForm(f => ({ ...f, targetAmount: v }))}
              keyboardType="numeric"
            />

            <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>Pick an emoji</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {EMOJIS.map(e => (
                <TouchableOpacity
                  key={e}
                  onPress={() => setForm(f => ({ ...f, emoji: e }))}
                  style={[
                    styles.emojiBtn,
                    form.emoji === e && { backgroundColor: colors.secondary, borderColor: colors.primary }
                  ]}
                >
                  <Text style={styles.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>Color</Text>
            <View style={styles.colorRow}>
              {COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setForm(f => ({ ...f, color: c }))}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    form.color === c && styles.colorSelected
                  ]}
                />
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={[styles.cancelText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createBtn, { backgroundColor: colors.primary }]}
                onPress={handleCreate}
              >
                <Text style={styles.createText}>Create</Text>
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
  content: { paddingHorizontal: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 20 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  totalSaved: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4 },
  addBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 32 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  emptyBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  goalHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  goalEmoji: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  goalProgress: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  amountRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 52, marginBottom: 8,
  },
  nairaSign: { fontSize: 20, fontFamily: "Inter_600SemiBold", marginRight: 4 },
  amountInput: { fontSize: 24, fontFamily: "Inter_700Bold", flex: 1 },
  balanceNote: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 16 },
  quickAmounts: { flexDirection: "row", gap: 8, marginBottom: 20, flexWrap: "wrap" },
  quickAmt: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  quickAmtText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  topUpBtn: {
    borderRadius: 14, height: 52, flexDirection: "row",
    justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 12,
  },
  topUpBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#E0E0E0", alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 4 },
  modalLabel: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 8 },
  modalInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 48, fontSize: 15, fontFamily: "Inter_400Regular", marginBottom: 16 },
  emojiBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: "transparent", justifyContent: "center", alignItems: "center", marginRight: 8 },
  emojiText: { fontSize: 22 },
  colorRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorSelected: { borderWidth: 3, borderColor: "#fff", shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  modalActions: { flexDirection: "row", gap: 12 },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: 12, height: 50, justifyContent: "center", alignItems: "center" },
  cancelText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  createBtn: { flex: 1, borderRadius: 12, height: 50, justifyContent: "center", alignItems: "center" },
  createText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  deleteBtn: { flex: 1, borderWidth: 1, borderRadius: 12, height: 50, justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 6 },
  deleteText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
