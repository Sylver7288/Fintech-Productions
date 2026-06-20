import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Platform, Alert,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

export default function SplitBillScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const [totalAmount, setTotalAmount] = useState("");
  const [people, setPeople] = useState(2);
  const [description, setDescription] = useState("");
  const [names, setNames] = useState<string[]>(["", ""]);

  const total = parseFloat(totalAmount) || 0;
  const perPerson = people > 0 ? total / people : 0;

  function setPeopleCount(n: number) {
    const clamped = Math.max(2, Math.min(10, n));
    setPeople(clamped);
    setNames(prev => {
      const next = [...prev];
      while (next.length < clamped) next.push("");
      return next.slice(0, clamped);
    });
  }

  function updateName(i: number, val: string) {
    setNames(prev => { const n = [...prev]; n[i] = val; return n; });
  }

  function handleSend() {
    if (!totalAmount || total <= 0) {
      Alert.alert("Enter amount", "Please enter the total bill amount.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Requests Sent!",
      `Payment requests of ₦${perPerson.toLocaleString("en-NG", { minimumFractionDigits: 2 })} sent to ${people} people.`,
      [{ text: "Done", onPress: () => router.back() }]
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.navbar, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>Split Bill</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">
        {/* Total amount */}
        <View style={[styles.amountCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.amountLabel}>Total bill amount</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currency}>₦</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={totalAmount}
              onChangeText={setTotalAmount}
              keyboardType="decimal-pad"
            />
          </View>
          {total > 0 && (
            <Text style={styles.perPersonHint}>
              ₦{perPerson.toLocaleString("en-NG", { minimumFractionDigits: 2 })} per person
            </Text>
          )}
        </View>

        {/* People count */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Number of people</Text>
          <View style={styles.stepper}>
            <TouchableOpacity
              style={[styles.stepBtn, { backgroundColor: colors.secondary }]}
              onPress={() => { setPeopleCount(people - 1); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            >
              <Feather name="minus" size={20} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.stepValue, { color: colors.foreground }]}>{people}</Text>
            <TouchableOpacity
              style={[styles.stepBtn, { backgroundColor: colors.secondary }]}
              onPress={() => { setPeopleCount(people + 1); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            >
              <Feather name="plus" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Description */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>What's it for?</Text>
          <TextInput
            style={[styles.descInput, { color: colors.foreground, borderColor: colors.border }]}
            placeholder="e.g. Dinner at Terra Kulture"
            placeholderTextColor={colors.mutedForeground}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* People names */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Who are you splitting with?</Text>
          <View style={{ gap: 10 }}>
            {names.map((n, i) => (
              <View key={i} style={[styles.personRow, { borderColor: colors.border }]}>
                <View style={[styles.personNum, { backgroundColor: colors.secondary }]}>
                  <Text style={[{ color: colors.primary, fontFamily: "Inter_700Bold", fontSize: 13 }]}>{i + 1}</Text>
                </View>
                <TextInput
                  style={[styles.personInput, { color: colors.foreground }]}
                  placeholder={`Person ${i + 1} name (optional)`}
                  placeholderTextColor={colors.mutedForeground}
                  value={n}
                  onChangeText={val => updateName(i, val)}
                />
                {total > 0 && (
                  <Text style={[styles.personAmount, { color: colors.primary }]}>
                    ₦{perPerson.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Summary */}
        {total > 0 && (
          <View style={[styles.summaryCard, { backgroundColor: colors.secondary }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Total</Text>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                ₦{total.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Split between</Text>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>{people} people</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Each person pays</Text>
              <Text style={[styles.summaryValue, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                ₦{perPerson.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: colors.primary }]}
          onPress={handleSend}
          activeOpacity={0.85}
        >
          <Feather name="send" size={18} color="#fff" />
          <Text style={styles.sendText}>Send Payment Requests</Text>
        </TouchableOpacity>
      </ScrollView>
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
  content: { paddingHorizontal: 20, gap: 16 },
  amountCard: { borderRadius: 24, padding: 24 },
  amountLabel: { color: "rgba(255,255,255,0.75)", fontSize: 13, fontFamily: "Inter_400Regular" },
  amountRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  currency: { color: "#fff", fontSize: 28, fontFamily: "Inter_400Regular", marginRight: 4 },
  amountInput: { color: "#fff", fontSize: 40, fontFamily: "Inter_700Bold", flex: 1 },
  perPersonHint: { color: "rgba(255,255,255,0.75)", fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 10 },
  card: { borderRadius: 20, padding: 20, gap: 12 },
  cardLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  stepper: { flexDirection: "row", alignItems: "center", gap: 24 },
  stepBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  stepValue: { fontSize: 28, fontFamily: "Inter_700Bold", minWidth: 48, textAlign: "center" },
  descInput: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular",
  },
  personRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 48,
  },
  personNum: { width: 28, height: 28, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  personInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  personAmount: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  summaryCard: { borderRadius: 20, padding: 20, gap: 12 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  summaryValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  summaryDivider: { height: StyleSheet.hairlineWidth },
  sendBtn: {
    borderRadius: 16, height: 56, flexDirection: "row",
    justifyContent: "center", alignItems: "center", gap: 10,
  },
  sendText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
