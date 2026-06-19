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
  useGetSavings, useCreateSavings, useDeleteSavings,
  getGetSavingsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const EMOJIS = ["🎯", "🏠", "✈️", "💻", "🎓", "💍", "🚗", "🌴", "💪", "🎉"];
const COLORS = ["#6C5CE7", "#00B894", "#E17055", "#0984E3", "#FDCB6E", "#E84393", "#2D3436"];

export default function SavingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { data: goals, isLoading } = useGetSavings();
  const createSavings = useCreateSavings();
  const deleteSavings = useDeleteSavings();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", targetAmount: "", emoji: "🎯", color: "#6C5CE7" });

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

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
      setShowModal(false);
      setForm({ name: "", targetAmount: "", emoji: "🎯", color: "#6C5CE7" });
    } catch {
      Alert.alert("Error", "Could not create savings goal");
    }
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
            onPress={() => setShowModal(true)}
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
              onPress={() => setShowModal(true)}
            >
              <Text style={styles.emptyBtnText}>Create goal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          goals.map(goal => (
            <SavingsCard key={goal.id} goal={goal as any} />
          ))
        )}
      </ScrollView>

      {/* Create Modal */}
      <Modal visible={showModal} transparent animationType="slide">
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
                onPress={() => setShowModal(false)}
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
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#E0E0E0", alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 20 },
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
});
