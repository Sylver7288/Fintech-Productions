import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { 
  useGetAccounts, 
  customFetch, 
  getGetDashboardSummaryQueryKey, 
  getGetAccountsQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import QRCode from "react-native-qrcode-svg";

export default function ReceiveScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: accounts } = useGetAccounts();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const account = accounts?.[0];
  const qc = useQueryClient();
  const [funding, setFunding] = React.useState(false);
  const [selectedAmount, setSelectedAmount] = React.useState<number>(2000);

  function copyToClipboard(text: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Copied!", `${text} copied to clipboard`);
  }

  function handlePaystackFund() {
    if (!account) return;
    triggerDeposit(selectedAmount);
  }

  async function triggerDeposit(amount: number) {
    if (!account) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFunding(true);
    try {
      await customFetch(
        `/api/accounts/${account.id}/deposit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount })
        }
      );
      
      await Promise.all([
        qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }),
        qc.invalidateQueries({ queryKey: getGetAccountsQueryKey() })
      ]);

      Alert.alert(
        "Payment Successful",
        `Successfully deposited ₦${amount.toLocaleString()} into your account via Paystack Card.`
      );
    } catch (err: any) {
      const msg = err?.message || err?.error || "Paystack service is currently unreachable.";
      Alert.alert("Payment Failed", msg);
    } finally {
      setFunding(false);
    }
  }

  const qrValue = account
    ? JSON.stringify({ accountNumber: account.accountNumber, bankName: account.bankName ?? "Novamoni" })
    : "Novamoni";

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
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>{account.bankName ?? "Novamoni"}</Text>
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

          <Text style={[styles.scanHint, { color: colors.mutedForeground, marginTop: 4 }]}>
            Select funding amount:
          </Text>

          <View style={styles.amountChipsRow}>
            {[2000, 5000, 10000].map((amt) => {
              const isSelected = selectedAmount === amt;
              return (
                <TouchableOpacity
                  key={amt}
                  style={[
                    styles.amountChip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.background,
                      borderColor: isSelected ? colors.primary : colors.border,
                    }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedAmount(amt);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.amountChipText,
                      { color: isSelected ? "#fff" : colors.foreground }
                    ]}
                  >
                    ₦{amt.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: colors.primary }]}
            onPress={() => Alert.alert("Share", "Share account details feature coming soon")}
            activeOpacity={0.85}
          >
            <Feather name="share-2" size={16} color="#fff" />
            <Text style={styles.shareBtnText}>Share account details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.fundBtn, { borderColor: colors.primary, borderWidth: 1 }]}
            onPress={handlePaystackFund}
            disabled={funding}
            activeOpacity={0.8}
          >
            {funding ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <>
                <Feather name="credit-card" size={16} color={colors.primary} />
                <Text style={[styles.fundBtnText, { color: colors.primary }]}>Fund Account via Paystack</Text>
              </>
            )}
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
  fundBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, width: "100%",
    justifyContent: "center", marginTop: 8
  },
  fundBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  amountChipsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 8,
    marginTop: 2,
    marginBottom: 4,
  },
  amountChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  amountChipText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
