import React, { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Platform, Alert, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useUpdateProfile } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";

export default function KycScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();
  const updateProfile = useUpdateProfile();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const [bvn, setBvn] = useState(user?.bvn ?? "");
  const isVerified = user?.kycStatus === "verified";

  async function handleSubmit() {
    if (bvn.length !== 11 || !/^\d{11}$/.test(bvn)) {
      Alert.alert("Invalid BVN", "Your BVN must be exactly 11 digits.");
      return;
    }
    try {
      const updated = await updateProfile.mutateAsync({ data: { bvn } });
      updateUser({ ...updated, avatarUrl: updated.avatarUrl ?? null, bvn: updated.bvn ?? null, kycStatus: updated.kycStatus ?? "pending" });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "BVN Submitted",
        "Your BVN has been received. Verification typically takes a few minutes.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Could not submit BVN. Please try again.");
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.navbar, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>Identity Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        {isVerified ? (
          <View style={[styles.verifiedCard, { backgroundColor: "#E6F8F3" }]}>
            <View style={[styles.verifiedIcon, { backgroundColor: "#00B89420" }]}>
              <Feather name="shield" size={32} color="#00B894" />
            </View>
            <Text style={[styles.verifiedTitle, { color: "#00B894" }]}>Identity Verified</Text>
            <Text style={[styles.verifiedSub, { color: "#00B894" }]}>
              Your BVN has been verified. You have full access to all NovaPay features.
            </Text>
          </View>
        ) : (
          <>
            <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
              <View style={[styles.infoIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Feather name="user-check" size={28} color={colors.primary} />
              </View>
              <Text style={[styles.infoTitle, { color: colors.foreground }]}>Verify your identity</Text>
              <Text style={[styles.infoSub, { color: colors.mutedForeground }]}>
                Enter your 11-digit Bank Verification Number (BVN) to unlock higher transaction limits and all NovaPay features.
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>BVN (Bank Verification Number)</Text>
                <TextInput
                  style={[styles.fieldInput, { color: colors.foreground }]}
                  placeholder="Enter your 11-digit BVN"
                  placeholderTextColor={colors.mutedForeground}
                  value={bvn}
                  onChangeText={val => setBvn(val.replace(/\D/g, "").slice(0, 11))}
                  keyboardType="numeric"
                  maxLength={11}
                  secureTextEntry
                />
                {bvn.length > 0 && (
                  <Text style={[styles.charCount, { color: bvn.length === 11 ? colors.success : colors.mutedForeground }]}>
                    {bvn.length}/11 digits
                  </Text>
                )}
              </View>
            </View>

            <View style={[styles.noteCard, { backgroundColor: `${colors.warning}15`, borderColor: `${colors.warning}30` }]}>
              <Feather name="info" size={16} color={colors.warning} />
              <Text style={[styles.noteText, { color: colors.warning }]}>
                Your BVN is used only for identity verification and is never shared with third parties.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: updateProfile.isPending ? 0.7 : 1 }]}
              onPress={handleSubmit}
              disabled={updateProfile.isPending || bvn.length !== 11}
              activeOpacity={0.85}
            >
              {updateProfile.isPending
                ? <ActivityIndicator color="#fff" />
                : <>
                  <Feather name="check-circle" size={18} color="#fff" />
                  <Text style={styles.submitBtnText}>Submit BVN</Text>
                </>
              }
            </TouchableOpacity>
          </>
        )}
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
  verifiedCard: {
    borderRadius: 24, padding: 32, alignItems: "center", gap: 12,
  },
  verifiedIcon: {
    width: 72, height: 72, borderRadius: 24,
    justifyContent: "center", alignItems: "center",
  },
  verifiedTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  verifiedSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  infoCard: {
    borderRadius: 20, padding: 24, alignItems: "center", gap: 12,
  },
  infoIcon: {
    width: 64, height: 64, borderRadius: 20,
    justifyContent: "center", alignItems: "center",
  },
  infoTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  infoSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  card: { borderRadius: 20, overflow: "hidden" },
  fieldWrap: { paddingHorizontal: 16, paddingVertical: 14 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 6 },
  fieldInput: { fontSize: 20, fontFamily: "Inter_600SemiBold", letterSpacing: 4 },
  charCount: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 6 },
  noteCard: {
    flexDirection: "row", gap: 10, alignItems: "flex-start",
    borderRadius: 12, padding: 14, borderWidth: 1,
  },
  noteText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 20 },
  submitBtn: {
    borderRadius: 16, height: 56, flexDirection: "row",
    justifyContent: "center", alignItems: "center", gap: 10,
  },
  submitBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
