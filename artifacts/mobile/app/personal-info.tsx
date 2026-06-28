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

export default function PersonalInfoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();
  const updateProfile = useUpdateProfile();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const [form, setForm] = useState({
    firstName: user?.firstName || (user as any)?.first_name || "",
    lastName: user?.lastName || (user as any)?.last_name || "",
    phone: user?.phone ?? "",
  });

  const update = (field: keyof typeof form) => (val: string) =>
    setForm(prev => ({ ...prev, [field]: val }));

  async function handleSave() {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      Alert.alert("Required", "First name and last name are required.");
      return;
    }
    try {
      const updated = await updateProfile.mutateAsync({ data: form });
      updateUser({ 
        ...updated, 
        avatarUrl: updated.avatarUrl ?? null, 
        bvn: updated.bvn ?? null, 
        nin: (updated as any).nin ?? null,
        kycStatus: updated.kycStatus ?? "pending" 
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Saved", "Your profile has been updated.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Could not save changes. Please try again.");
    }
  }

  const fields: { label: string; key: keyof typeof form; placeholder: string; keyboard?: any }[] = [
    { label: "First name", key: "firstName", placeholder: "John" },
    { label: "Last name", key: "lastName", placeholder: "Doe" },
    { label: "Phone number", key: "phone", placeholder: "08012345678", keyboard: "phone-pad" },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.navbar, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>Personal Information</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        <View style={[styles.avatarSection, { backgroundColor: colors.card }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.initials}>
              {`${form.firstName[0] ?? ""}${form.lastName[0] ?? ""}`.toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={[styles.avatarName, { color: colors.foreground }]}>
              {form.firstName} {form.lastName}
            </Text>
            <Text style={[styles.avatarEmail, { color: colors.mutedForeground }]}>{user?.email}</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {fields.map((f, i) => (
            <View
              key={f.key}
              style={[
                styles.fieldWrap,
                i < fields.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
              ]}
            >
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{f.label}</Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.foreground }]}
                placeholder={f.placeholder}
                placeholderTextColor={colors.mutedForeground}
                value={form[f.key]}
                onChangeText={update(f.key)}
                keyboardType={f.keyboard ?? "default"}
              />
            </View>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.fieldWrap}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Email address</Text>
            <Text style={[styles.fieldInput, { color: colors.mutedForeground }]}>{user?.email}</Text>
          </View>
          <Text style={[styles.emailNote, { color: colors.mutedForeground, borderTopColor: colors.border }]}>
            Email address cannot be changed. Contact support if needed.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: updateProfile.isPending ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={updateProfile.isPending}
          activeOpacity={0.85}
        >
          {updateProfile.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Save changes</Text>
          }
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
  avatarSection: {
    flexDirection: "row", alignItems: "center", gap: 16,
    borderRadius: 20, padding: 16,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 16,
    justifyContent: "center", alignItems: "center",
  },
  initials: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold" },
  avatarName: { fontSize: 16, fontFamily: "Inter_700Bold" },
  avatarEmail: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  card: { borderRadius: 20, overflow: "hidden" },
  fieldWrap: { paddingHorizontal: 16, paddingVertical: 14 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 6 },
  fieldInput: { fontSize: 15, fontFamily: "Inter_400Regular" },
  emailNote: {
    fontSize: 12, fontFamily: "Inter_400Regular",
    paddingHorizontal: 16, paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
  },
  saveBtn: {
    borderRadius: 16, height: 56,
    justifyContent: "center", alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
