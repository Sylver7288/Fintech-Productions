import React, { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, Platform, Modal, TextInput, ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import {
  useGetBeneficiaries, useCreateBeneficiary, useDeleteBeneficiary,
  getGetBeneficiariesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const BANKS = [
  "Access Bank","GTBank","First Bank","Zenith Bank","UBA",
  "Stanbic IBTC","Fidelity Bank","FCMB","Sterling Bank","Kuda Bank","Novamoni",
];

export default function BeneficiariesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const params = useLocalSearchParams<{ fromTransfer?: string }>();
  const fromTransfer = params.fromTransfer === "true";
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const { data: list, isLoading } = useGetBeneficiaries();
  const createB = useCreateBeneficiary();
  const deleteB = useDeleteBeneficiary();

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [bank, setBank] = useState("GTBank");
  const [account, setAccount] = useState("");
  const [showBankPicker, setShowBankPicker] = useState(false);

  async function handleAdd() {
    if (!name.trim() || !account.trim()) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }
    try {
      await createB.mutateAsync({ data: { name: name.trim(), bank, accountNumber: account.trim() } });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: getGetBeneficiariesQueryKey() });
      setShowAdd(false);
      setName(""); setAccount(""); setBank("GTBank");
    } catch {
      Alert.alert("Error", "Could not save beneficiary.");
    }
  }

  function handleDelete(id: string, bname: string) {
    Alert.alert(
      "Remove beneficiary",
      `Remove ${bname} from saved contacts?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove", style: "destructive",
          onPress: async () => {
            try {
              await deleteB.mutateAsync({ id });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              qc.invalidateQueries({ queryKey: getGetBeneficiariesQueryKey() });
            } catch {
              Alert.alert("Error", "Could not remove beneficiary.");
            }
          }
        }
      ]
    );
  }

  function handleSelect(b: { name: string; bank: string; accountNumber: string }) {
    if (!fromTransfer) return;
    router.push({
      pathname: "/transfer",
      params: {
        prefillName: b.name,
        prefillBank: b.bank,
        prefillAccount: b.accountNumber,
      },
    });
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.navbar, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>Saved Beneficiaries</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)}>
          <Feather name="user-plus" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={list ?? []}
          keyExtractor={b => b.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 40 }]}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="users" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No saved beneficiaries</Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                Save frequent recipients for faster transfers
              </Text>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: colors.primary }]}
                onPress={() => setShowAdd(true)}
              >
                <Feather name="user-plus" size={16} color="#fff" />
                <Text style={styles.addBtnText}>Add beneficiary</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleSelect(item)}
              onLongPress={() => handleDelete(item.id, item.name)}
              activeOpacity={fromTransfer ? 0.7 : 1}
            >
              <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[styles.itemSub, { color: colors.mutedForeground }]}>
                  {item.bank} • {item.accountNumber}
                </Text>
              </View>
              {fromTransfer && (
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              )}
              {!fromTransfer && (
                <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Feather name="trash-2" size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          )}
        />
      )}

      {/* Add modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            <View style={styles.handle} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Add Beneficiary</Text>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Full name</Text>
            <View style={[styles.fieldWrap, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <TextInput
                style={[styles.fieldInput, { color: colors.foreground }]}
                placeholder="Recipient full name"
                placeholderTextColor={colors.mutedForeground}
                value={name}
                onChangeText={setName}
              />
            </View>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Bank</Text>
            <TouchableOpacity
              style={[styles.fieldWrap, { borderColor: colors.border, backgroundColor: colors.background, flexDirection: "row", alignItems: "center" }]}
              onPress={() => setShowBankPicker(true)}
            >
              <Text style={[styles.fieldInput, { color: colors.foreground, flex: 1 }]}>{bank}</Text>
              <Feather name="chevron-down" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Account number</Text>
            <View style={[styles.fieldWrap, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <TextInput
                style={[styles.fieldInput, { color: colors.foreground }]}
                placeholder="10-digit account number"
                placeholderTextColor={colors.mutedForeground}
                value={account}
                onChangeText={setAccount}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => { setShowAdd(false); setName(""); setAccount(""); setBank("GTBank"); }}
              >
                <Text style={[styles.cancelText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: createB.isPending ? 0.7 : 1 }]}
                onPress={handleAdd}
                disabled={createB.isPending}
              >
                {createB.isPending
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.saveText}>Save</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bank picker */}
      {showBankPicker && (
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            <View style={styles.handle} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Select Bank</Text>
            <ScrollView>
              {BANKS.map(b => (
                <TouchableOpacity
                  key={b}
                  style={[styles.bankItem, { borderBottomColor: colors.border }]}
                  onPress={() => { setBank(b); setShowBankPicker(false); }}
                >
                  <Text style={[styles.bankText, { color: colors.foreground }]}>{b}</Text>
                  {bank === b && <Feather name="check" size={16} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  navbar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 16,
  },
  navTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  list: { padding: 20, gap: 10 },
  item: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 16, borderRadius: 16, borderWidth: 1,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: "center", alignItems: "center",
  },
  avatarText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  itemName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  itemSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 8,
  },
  addBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  overlay: { flex: 1, justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 8, paddingBottom: 32 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#E0E0E0", alignSelf: "center", marginBottom: 12 },
  sheetTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 8 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 4 },
  fieldWrap: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 48 },
  fieldInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", height: "100%" },
  actions: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: 12, height: 50, justifyContent: "center", alignItems: "center" },
  cancelText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  saveBtn: { flex: 1, borderRadius: 12, height: 50, justifyContent: "center", alignItems: "center" },
  saveText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  bankItem: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bankText: { fontSize: 15, fontFamily: "Inter_500Medium" },
});
