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

  const [kycType, setKycType] = useState<"bvn" | "nin">("bvn");
  const [bvn, setBvn] = useState(user?.bvn ?? "");
  const [nin, setNin] = useState((user as any)?.nin ?? "");
  
  const isVerified = user?.kycStatus === "verified" || user?.kycStatus === "approved";

  async function handleSubmit() {
    const value = kycType === "bvn" ? bvn : nin;
    const label = kycType === "bvn" ? "BVN" : "NIN";
    
    if (value.length !== 11 || !/^\d{11}$/.test(value)) {
      Alert.alert(`Invalid ${label}`, `Your ${label} must be exactly 11 digits.`);
      return;
    }
    
    try {
      const payload = kycType === "bvn" ? { bvn: value } : { nin: value };
      const updated = await updateProfile.mutateAsync({ data: payload });
      
      updateUser({ 
        ...updated, 
        avatarUrl: updated.avatarUrl ?? null, 
        bvn: updated.bvn ?? null, 
        nin: (updated as any).nin ?? null,
        kycStatus: updated.kycStatus ?? "pending" 
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        `${label} Submitted`,
        `Your ${label} has been received. Verification typically takes a few minutes.`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", `Could not submit ${label}. Please try again.`);
    }
  }

  const activeValue = kycType === "bvn" ? bvn : nin;

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
              Your identity has been verified. You have full access to all Novamoni features.
            </Text>
            {user?.bvn && (
              <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: "#00B894", marginTop: 8 }}>
                BVN: •••••••••{user.bvn.slice(-2)}
              </Text>
            )}
            {(user as any)?.nin && (
              <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: "#00B894", marginTop: 4 }}>
                NIN: •••••••••{(user as any).nin.slice(-2)}
              </Text>
            )}
          </View>
        ) : (
          <>
            <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
              <View style={[styles.infoIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Feather name="user-check" size={28} color={colors.primary} />
              </View>
              <Text style={[styles.infoTitle, { color: colors.foreground }]}>Verify your identity</Text>
              <Text style={[styles.infoSub, { color: colors.mutedForeground }]}>
                Choose a document type and enter your 11-digit number to unlock higher transaction limits and all Novamoni features.
              </Text>
            </View>

            {/* Document Tabs */}
            <View style={[styles.tabContainer, { backgroundColor: colors.card }]}>
              <TouchableOpacity
                style={[styles.tab, kycType === "bvn" && { backgroundColor: colors.primary }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setKycType("bvn");
                }}
              >
                <Text style={[styles.tabText, { color: kycType === "bvn" ? "#fff" : colors.foreground }]}>
                  BVN
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, kycType === "nin" && { backgroundColor: colors.primary }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setKycType("nin");
                }}
              >
                <Text style={[styles.tabText, { color: kycType === "nin" ? "#fff" : colors.foreground }]}>
                  NIN
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                  {kycType === "bvn" ? "BVN (Bank Verification Number)" : "NIN (National Identification Number)"}
                </Text>
                <TextInput
                  style={[styles.fieldInput, { color: colors.foreground }]}
                  placeholder={kycType === "bvn" ? "Enter your 11-digit BVN" : "Enter your 11-digit NIN"}
                  placeholderTextColor={colors.mutedForeground}
                  value={activeValue}
                  onChangeText={val => {
                    const clean = val.replace(/\D/g, "").slice(0, 11);
                    if (kycType === "bvn") setBvn(clean);
                    else setNin(clean);
                  }}
                  keyboardType="numeric"
                  maxLength={11}
                  secureTextEntry
                />
                {activeValue.length > 0 && (
                  <Text style={[styles.charCount, { color: activeValue.length === 11 ? colors.success : colors.mutedForeground }]}>
                    {activeValue.length}/11 digits
                  </Text>
                )}
              </View>
            </View>

            <View style={[styles.noteCard, { backgroundColor: `${colors.warning}15`, borderColor: `${colors.warning}30` }]}>
              <Feather name="info" size={16} color={colors.warning} />
              <Text style={[styles.noteText, { color: colors.warning }]}>
                Your data is used only for identity verification and is never shared with third parties.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: (updateProfile.isPending || activeValue.length !== 11) ? 0.7 : 1 }]}
              onPress={handleSubmit}
              disabled={updateProfile.isPending || activeValue.length !== 11}
              activeOpacity={0.85}
            >
              {updateProfile.isPending
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Feather name="check-circle" size={18} color="#fff" />
                    <Text style={styles.submitBtnText}>Submit {kycType === "bvn" ? "BVN" : "NIN"}</Text>
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
  tabContainer: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
