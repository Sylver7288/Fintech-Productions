import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useGetAccounts } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";

export default function ReceiveScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: accounts } = useGetAccounts();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const account = accounts?.[0];

  function copyToClipboard(text: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Copied!", `${text} copied to clipboard`);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.navbar, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>Receive Money</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={[styles.qrPlaceholder, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Feather name="grid" size={80} color={colors.primary} />
            <Text style={[styles.qrLabel, { color: colors.mutedForeground }]}>QR Code</Text>
          </View>

          <Text style={[styles.shareText, { color: colors.mutedForeground }]}>
            Share your account details to receive money
          </Text>

          {account && (
            <>
              <View style={[styles.detailRow, { backgroundColor: colors.background }]}>
                <View>
                  <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Account number</Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>{account.accountNumber}</Text>
                </View>
                <TouchableOpacity onPress={() => copyToClipboard(account.accountNumber)}>
                  <Feather name="copy" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={[styles.detailRow, { backgroundColor: colors.background }]}>
                <View>
                  <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Bank name</Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>{account.bankName ?? "NovaPay"}</Text>
                </View>
              </View>
            </>
          )}
        </View>
      </View>
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
  content: { flex: 1, paddingHorizontal: 20, justifyContent: "center" },
  card: { borderRadius: 24, padding: 24, alignItems: "center", gap: 16 },
  qrPlaceholder: {
    width: 180, height: 180, borderRadius: 20, borderWidth: 1,
    justifyContent: "center", alignItems: "center", gap: 8,
  },
  qrLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  shareText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  detailRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    width: "100%", borderRadius: 12, padding: 14,
  },
  detailLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 4 },
  detailValue: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
