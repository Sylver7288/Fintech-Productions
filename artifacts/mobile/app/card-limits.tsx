import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Switch, TextInput, Alert, Platform,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

export default function CardLimitsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const [dailyLimitEnabled, setDailyLimitEnabled] = useState(true);
  const [dailyLimit, setDailyLimit] = useState("500000");
  const [onlinePayments, setOnlinePayments] = useState(true);
  const [contactless, setContactless] = useState(true);
  const [atmWithdrawals, setAtmWithdrawals] = useState(true);
  const [internationalPayments, setInternationalPayments] = useState(false);

  function handleSave() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Limits Updated",
      "Your card spending limits have been saved successfully.",
      [{ text: "Done", onPress: () => router.back() }]
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.navbar, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>Card Limits</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        <View style={[styles.info, { backgroundColor: colors.secondary }]}>
          <Feather name="info" size={16} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.primary }]}>
            Changes take effect immediately on your virtual card.
          </Text>
        </View>

        {/* Daily limit */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Spending limit</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={[styles.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
            <View style={[styles.rowIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Feather name="calendar" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>Daily spending limit</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                Maximum per day across all transactions
              </Text>
            </View>
            <Switch
              value={dailyLimitEnabled}
              onValueChange={v => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDailyLimitEnabled(v); }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          {dailyLimitEnabled && (
            <View style={styles.limitRow}>
              <Text style={[styles.limitCurrency, { color: colors.mutedForeground }]}>₦</Text>
              <TextInput
                style={[styles.limitInput, { color: colors.foreground, borderColor: colors.border }]}
                value={dailyLimit}
                onChangeText={setDailyLimit}
                keyboardType="numeric"
                placeholder="500000"
                placeholderTextColor={colors.mutedForeground}
              />
              <Text style={[styles.limitNote, { color: colors.mutedForeground }]}>per day</Text>
            </View>
          )}
        </View>

        {/* Transaction types */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Transaction types</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {[
            {
              icon: "globe" as const, label: "Online payments",
              sub: "E-commerce, subscription services",
              value: onlinePayments, setter: setOnlinePayments,
              last: false,
            },
            {
              icon: "wifi" as const, label: "Contactless (NFC)",
              sub: "Tap-to-pay at terminals",
              value: contactless, setter: setContactless,
              last: false,
            },
            {
              icon: "credit-card" as const, label: "ATM withdrawals",
              sub: "Cash from ATMs",
              value: atmWithdrawals, setter: setAtmWithdrawals,
              last: false,
            },
            {
              icon: "globe" as const, label: "International payments",
              sub: "USD, GBP, EUR transactions",
              value: internationalPayments, setter: setInternationalPayments,
              last: true,
            },
          ].map((item, i) => (
            <View
              key={i}
              style={[
                styles.row,
                !item.last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }
              ]}
            >
              <View style={[styles.rowIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Feather name={item.icon} size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: colors.foreground }]}>{item.label}</Text>
                <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{item.sub}</Text>
              </View>
              <Switch
                value={item.value}
                onValueChange={v => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); item.setter(v); }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>

        {/* Warning */}
        <View style={[styles.warning, { backgroundColor: "#FFF8E6" }]}>
          <Feather name="alert-triangle" size={16} color="#FDCB6E" />
          <Text style={[styles.warningText, { color: "#B7860B" }]}>
            Disabling transaction types may affect scheduled payments and subscriptions.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Feather name="check" size={18} color="#fff" />
          <Text style={styles.saveBtnText}>Save Changes</Text>
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
  content: { paddingHorizontal: 20, gap: 8 },
  info: {
    flexDirection: "row", gap: 10, alignItems: "center",
    padding: 14, borderRadius: 14,
  },
  infoText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  sectionLabel: {
    fontSize: 11, fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8, textTransform: "uppercase",
    marginTop: 8, marginBottom: 4,
  },
  card: { borderRadius: 20, overflow: "hidden", marginBottom: 4 },
  row: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  rowIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  rowTitle: { fontSize: 15, fontFamily: "Inter_500Medium" },
  rowSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  limitRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingBottom: 16,
  },
  limitCurrency: { fontSize: 20, fontFamily: "Inter_500Medium" },
  limitInput: {
    flex: 1, fontSize: 22, fontFamily: "Inter_700Bold",
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
  },
  limitNote: { fontSize: 13, fontFamily: "Inter_400Regular" },
  warning: {
    flexDirection: "row", gap: 10, alignItems: "flex-start",
    padding: 14, borderRadius: 14,
  },
  warningText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  saveBtn: {
    borderRadius: 16, height: 56, flexDirection: "row",
    justifyContent: "center", alignItems: "center", gap: 10,
    marginTop: 8,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
