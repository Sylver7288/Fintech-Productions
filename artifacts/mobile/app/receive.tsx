import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useGetAccounts } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import QRCode from "react-native-qrcode-svg";

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

  const qrValue = account
    ? JSON.stringify({ accountNumber: account.accountNumber, bankName: account.bankName ?? "NovaPay" })
    : "NovaPay";

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
          <View style={[styles.qrWrapper, { backgroundColor: "#fff", borderColor: colors.border }]}>
            <QRCode
              value={qrValue}
              size={160}
              color="#1a1a2e"
              backgroundColor="#ffffff"
            />
          </View>

          <Text style={[styles.scanHint, { color: colors.mutedForeground }]}>
            Scan to send money directly to this account
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

              <View style={[styles.detailRow, { backgroundColor: colors.background }]}>
                <View>
                  <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Account type</Text>
                  <Text style={[styles.detailValue, { color: colors.foreground, textTransform: "capitalize" }]}>
                    {account.type} account
                  </Text>
                </View>
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: colors.primary }]}
            onPress={() => Alert.alert("Share", "Share account details feature coming soon")}
            activeOpacity={0.85}
          >
            <Feather name="share-2" size={16} color="#fff" />
            <Text style={styles.shareBtnText}>Share account details</Text>
          </TouchableOpacity>
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
  qrWrapper: {
    padding: 16, borderRadius: 16, borderWidth: 1,
  },
  scanHint: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  detailRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    width: "100%", borderRadius: 12, padding: 14,
  },
  detailLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 4 },
  detailValue: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  shareBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, width: "100%",
    justifyContent: "center",
  },
  shareBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
