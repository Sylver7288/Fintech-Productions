import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Platform, Modal, TextInput
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useGetLoans, useApplyLoan, useGetAccounts, getGetLoansQueryKey, getGetAccountsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const LOAN_OFFERS = [
  { amount: 10000, label: "₦10,000", desc: "Starter loan" },
  { amount: 25000, label: "₦25,000", desc: "Quick cash" },
  { amount: 50000, label: "₦50,000", desc: "Mid-range" },
  { amount: 100000, label: "₦100,000", desc: "Larger loan" },
  { amount: 250000, label: "₦250,000", desc: "Business boost" },
  { amount: 500000, label: "₦500,000", desc: "Max credit" },
];

const DURATIONS = [
  { months: 1, label: "1 month" },
  { months: 3, label: "3 months" },
  { months: 6, label: "6 months" },
  { months: 12, label: "12 months" },
];

const PURPOSES = ["Personal", "Business", "Education", "Medical", "Travel", "Home improvement", "Other"];

const STATUS_COLORS: Record<string, string> = {
  approved: "#00B894",
  pending: "#FDCB6E",
  rejected: "#E17055",
  repaid: "#636E72",
};

export default function LoansScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { data: loans, isLoading } = useGetLoans();
  const { data: accounts } = useGetAccounts();
  const applyLoan = useApplyLoan();

  const [showModal, setShowModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(LOAN_OFFERS[1]!.amount);
  const [selectedDuration, setSelectedDuration] = useState(3);
  const [selectedPurpose, setSelectedPurpose] = useState("Personal");
  const [customAmount, setCustomAmount] = useState("");

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const account = accounts?.[0];

  const finalAmount = customAmount ? parseFloat(customAmount) : selectedAmount;
  const monthlyRate = 2.5;
  const monthlyRepayment = finalAmount > 0 && selectedDuration > 0
    ? ((finalAmount * (monthlyRate / 100) * Math.pow(1 + monthlyRate / 100, selectedDuration)) /
      (Math.pow(1 + monthlyRate / 100, selectedDuration) - 1))
    : 0;
  const totalRepayment = monthlyRepayment * selectedDuration;

  async function handleApply() {
    if (!account) { Alert.alert("No account found"); return; }
    if (!finalAmount || finalAmount < 5000) { Alert.alert("Minimum loan is ₦5,000"); return; }
    if (finalAmount > 500000) { Alert.alert("Maximum loan is ₦500,000"); return; }
    try {
      const loan = await applyLoan.mutateAsync({
        data: { accountId: account.id, amount: finalAmount, purpose: selectedPurpose, durationMonths: selectedDuration as 1 | 3 | 6 | 12 }
      });
      qc.invalidateQueries({ queryKey: getGetLoansQueryKey() });
      if (finalAmount <= 50000) {
        qc.invalidateQueries({ queryKey: getGetAccountsQueryKey() });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowModal(false);
      const msg = loan.status === "approved"
        ? `₦${finalAmount.toLocaleString("en-NG")} has been credited to your account!`
        : "Your application is under review. We'll notify you within 24 hours.";
      Alert.alert(loan.status === "approved" ? "Loan approved! 🎉" : "Application submitted", msg);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", err?.data?.error ?? "Could not process application.");
    }
  }

  const activeLoans = (loans ?? []).filter(l => l.status === "approved" || l.status === "pending");
  const pastLoans = (loans ?? []).filter(l => l.status === "repaid" || l.status === "rejected");

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>NovaPay Credit</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <Text style={styles.heroTitle}>Get instant credit</Text>
          <Text style={styles.heroSub}>Up to ₦500,000 at 2.5% monthly. Repay over 1–12 months.</Text>
          <TouchableOpacity style={styles.heroBtn} onPress={() => setShowModal(true)}>
            <Text style={styles.heroBtnText}>Apply now</Text>
          </TouchableOpacity>
        </View>

        {/* Features */}
        <View style={[styles.features, { backgroundColor: colors.card }]}>
          {[
            { icon: "zap", label: "Instant approval", sub: "Up to ₦50,000 auto-approved" },
            { icon: "shield", label: "No collateral", sub: "Fully unsecured loan" },
            { icon: "percent", label: "2.5% monthly", sub: "Simple interest, no hidden fees" },
          ].map(f => (
            <View key={f.icon} style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.secondary }]}>
                <Feather name={f.icon as any} size={18} color={colors.primary} />
              </View>
              <Text style={[styles.featureLabel, { color: colors.foreground }]}>{f.label}</Text>
              <Text style={[styles.featureSub, { color: colors.mutedForeground }]}>{f.sub}</Text>
            </View>
          ))}
        </View>

        {isLoading ? <ActivityIndicator color={colors.primary} style={{ padding: 20 }} /> : null}

        {activeLoans.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Active loans</Text>
            {activeLoans.map(loan => (
              <View key={loan.id} style={[styles.loanCard, { backgroundColor: colors.card }]}>
                <View style={styles.loanTop}>
                  <View>
                    <Text style={[styles.loanAmount, { color: colors.foreground }]}>₦{loan.amount.toLocaleString("en-NG")}</Text>
                    <Text style={[styles.loanPurpose, { color: colors.mutedForeground }]}>{loan.purpose}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[loan.status] + "20" }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLORS[loan.status] }]}>
                      {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                    </Text>
                  </View>
                </View>
                <View style={[styles.loanProgress, { backgroundColor: colors.border }]}>
                  <View style={[styles.loanProgressFill, {
                    width: `${Math.min(100, (loan.repaidAmount / loan.amount) * 100)}%` as any,
                    backgroundColor: colors.primary
                  }]} />
                </View>
                <View style={styles.loanBottom}>
                  <Text style={[styles.loanInfo, { color: colors.mutedForeground }]}>
                    Repaid: ₦{loan.repaidAmount.toLocaleString("en-NG")}
                  </Text>
                  <Text style={[styles.loanInfo, { color: colors.mutedForeground }]}>
                    {loan.durationMonths} months • {loan.monthlyRate}%/mo
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {pastLoans.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 8 }]}>History</Text>
            {pastLoans.map(loan => (
              <View key={loan.id} style={[styles.loanCard, { backgroundColor: colors.card, opacity: 0.6 }]}>
                <View style={styles.loanTop}>
                  <View>
                    <Text style={[styles.loanAmount, { color: colors.foreground }]}>₦{loan.amount.toLocaleString("en-NG")}</Text>
                    <Text style={[styles.loanPurpose, { color: colors.mutedForeground }]}>{loan.purpose}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[loan.status] + "20" }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLORS[loan.status] }]}>
                      {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Loan Application</Text>

            <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Loan amount</Text>
            <View style={styles.amountGrid}>
              {LOAN_OFFERS.map(o => (
                <TouchableOpacity
                  key={o.amount}
                  style={[
                    styles.amountOption,
                    { borderColor: selectedAmount === o.amount && !customAmount ? colors.primary : colors.border, backgroundColor: colors.background }
                  ]}
                  onPress={() => { setSelectedAmount(o.amount); setCustomAmount(""); }}
                >
                  <Text style={[styles.amountLabel, { color: selectedAmount === o.amount && !customAmount ? colors.primary : colors.foreground }]}>{o.label}</Text>
                  <Text style={[styles.amountDesc, { color: colors.mutedForeground }]}>{o.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Or enter custom amount</Text>
            <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Text style={[styles.naira, { color: colors.foreground }]}>₦</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="5,000 – 500,000"
                placeholderTextColor={colors.mutedForeground}
                value={customAmount}
                onChangeText={setCustomAmount}
                keyboardType="numeric"
              />
            </View>

            <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Repayment period</Text>
            <View style={styles.durationRow}>
              {DURATIONS.map(d => (
                <TouchableOpacity
                  key={d.months}
                  style={[styles.durationBtn, { borderColor: selectedDuration === d.months ? colors.primary : colors.border, backgroundColor: colors.background }]}
                  onPress={() => setSelectedDuration(d.months)}
                >
                  <Text style={[styles.durationText, { color: selectedDuration === d.months ? colors.primary : colors.foreground }]}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Purpose</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {PURPOSES.map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.purposeChip, { borderColor: selectedPurpose === p ? colors.primary : colors.border, backgroundColor: colors.background }]}
                  onPress={() => setSelectedPurpose(p)}
                >
                  <Text style={[styles.purposeText, { color: selectedPurpose === p ? colors.primary : colors.foreground }]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {finalAmount > 0 && (
              <View style={[styles.repayBox, { backgroundColor: colors.secondary }]}>
                <View style={styles.repayRow}>
                  <Text style={[styles.repayLabel, { color: colors.mutedForeground }]}>Monthly payment</Text>
                  <Text style={[styles.repayVal, { color: colors.foreground }]}>₦{monthlyRepayment.toLocaleString("en-NG", { minimumFractionDigits: 0 })}</Text>
                </View>
                <View style={styles.repayRow}>
                  <Text style={[styles.repayLabel, { color: colors.mutedForeground }]}>Total repayment</Text>
                  <Text style={[styles.repayVal, { color: colors.foreground }]}>₦{totalRepayment.toLocaleString("en-NG", { minimumFractionDigits: 0 })}</Text>
                </View>
                <View style={styles.repayRow}>
                  <Text style={[styles.repayLabel, { color: colors.mutedForeground }]}>Interest</Text>
                  <Text style={[styles.repayVal, { color: colors.foreground }]}>₦{(totalRepayment - finalAmount).toLocaleString("en-NG", { minimumFractionDigits: 0 })}</Text>
                </View>
                {finalAmount <= 50000 && (
                  <Text style={[styles.instantNote, { color: "#00B894" }]}>⚡ Instant approval — credited immediately</Text>
                )}
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={() => setShowModal(false)}>
                <Text style={[styles.cancelBtnText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.applyBtn, { backgroundColor: colors.primary, opacity: applyLoan.isPending ? 0.7 : 1 }]}
                onPress={handleApply}
                disabled={applyLoan.isPending}
              >
                {applyLoan.isPending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.applyBtnText}>Apply</Text>}
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
  content: { padding: 20, gap: 16 },
  hero: { borderRadius: 24, padding: 24, gap: 8 },
  heroTitle: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold" },
  heroSub: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  heroBtn: { backgroundColor: "#fff", borderRadius: 12, paddingVertical: 12, alignItems: "center", marginTop: 8 },
  heroBtnText: { color: "#6C5CE7", fontSize: 15, fontFamily: "Inter_700Bold" },
  features: { borderRadius: 20, padding: 16, flexDirection: "row", gap: 8 },
  featureItem: { flex: 1, alignItems: "center", gap: 6 },
  featureIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  featureLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  featureSub: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  loanCard: { borderRadius: 16, padding: 16, gap: 12 },
  loanTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  loanAmount: { fontSize: 18, fontFamily: "Inter_700Bold" },
  loanPurpose: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  loanProgress: { height: 6, borderRadius: 3, overflow: "hidden" },
  loanProgressFill: { height: 6, borderRadius: 3 },
  loanBottom: { flexDirection: "row", justifyContent: "space-between" },
  loanInfo: { fontSize: 12, fontFamily: "Inter_400Regular" },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, maxHeight: "92%" },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#E0E0E0", alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 16 },
  formLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 8 },
  amountGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  amountOption: { width: "30%", padding: 10, borderRadius: 12, borderWidth: 1.5, alignItems: "center" },
  amountLabel: { fontSize: 13, fontFamily: "Inter_700Bold" },
  amountDesc: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 2 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 46, marginBottom: 16 },
  naira: { fontSize: 16, fontFamily: "Inter_700Bold" },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  durationRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  durationBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  durationText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  purposeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  purposeText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  repayBox: { borderRadius: 14, padding: 14, gap: 8, marginBottom: 16 },
  repayRow: { flexDirection: "row", justifyContent: "space-between" },
  repayLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  repayVal: { fontSize: 13, fontFamily: "Inter_700Bold" },
  instantNote: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginTop: 4 },
  modalActions: { flexDirection: "row", gap: 12 },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: 12, height: 50, justifyContent: "center", alignItems: "center" },
  cancelBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  applyBtn: { flex: 1, borderRadius: 12, height: 50, justifyContent: "center", alignItems: "center" },
  applyBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
});
