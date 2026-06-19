import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { register as registerApi } from "@workspace/api-client-react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form) {
    return (val: string) => setForm(f => ({ ...f, [key]: val }));
  }

  async function handleRegister() {
    const { firstName, lastName, email, phone, password } = form;
    if (!firstName || !lastName || !email || !phone || !password) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Weak password", "Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await registerApi({ firstName, lastName, email: email.trim().toLowerCase(), phone, password });
      await login(res.token, res.user as any);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Registration failed", err?.data?.error ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const s = makeStyles(colors, insets);

  return (
    <KeyboardAvoidingView
      style={[s.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={s.back} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <Text style={[s.title, { color: colors.foreground }]}>Create account</Text>
        <Text style={[s.sub, { color: colors.mutedForeground }]}>Join thousands managing money smarter</Text>

        <View style={s.row}>
          <View style={s.half}>
            <Text style={[s.label, { color: colors.mutedForeground }]}>First name</Text>
            <View style={[s.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[s.input, { color: colors.foreground }]}
                placeholder="Ada"
                placeholderTextColor={colors.mutedForeground}
                value={form.firstName}
                onChangeText={update("firstName")}
              />
            </View>
          </View>
          <View style={s.half}>
            <Text style={[s.label, { color: colors.mutedForeground }]}>Last name</Text>
            <View style={[s.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[s.input, { color: colors.foreground }]}
                placeholder="Okonkwo"
                placeholderTextColor={colors.mutedForeground}
                value={form.lastName}
                onChangeText={update("lastName")}
              />
            </View>
          </View>
        </View>

        {(["email", "phone", "password"] as const).map((field) => (
          <View key={field} style={s.fieldWrap}>
            <Text style={[s.label, { color: colors.mutedForeground }]}>
              {field === "email" ? "Email address" : field === "phone" ? "Phone number" : "Password"}
            </Text>
            <View style={[s.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather
                name={field === "email" ? "mail" : field === "phone" ? "phone" : "lock"}
                size={16}
                color={colors.mutedForeground}
              />
              <TextInput
                style={[s.input, { color: colors.foreground }]}
                placeholder={field === "email" ? "you@example.com" : field === "phone" ? "08012345678" : "Min 8 characters"}
                placeholderTextColor={colors.mutedForeground}
                value={form[field]}
                onChangeText={update(field)}
                autoCapitalize="none"
                keyboardType={field === "email" ? "email-address" : field === "phone" ? "phone-pad" : "default"}
                secureTextEntry={field === "password" && !showPw}
              />
              {field === "password" && (
                <TouchableOpacity onPress={() => setShowPw(p => !p)}>
                  <Feather name={showPw ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[s.btn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnText}>Create Account</Text>
          }
        </TouchableOpacity>

        <View style={s.footer}>
          <Text style={[s.footerText, { color: colors.mutedForeground }]}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[s.link, { color: colors.primary }]}> Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: any, insets: any) {
  return StyleSheet.create({
    root: { flex: 1 },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
      paddingBottom: insets.bottom + 24,
    },
    back: { marginBottom: 24, width: 40 },
    title: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 8 },
    sub: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 28 },
    row: { flexDirection: "row", gap: 12 },
    half: { flex: 1 },
    fieldWrap: { marginTop: 4 },
    label: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 6, marginTop: 16 },
    inputWrap: {
      flexDirection: "row", alignItems: "center",
      borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, height: 52, gap: 10,
    },
    input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
    btn: { borderRadius: 14, height: 54, justifyContent: "center", alignItems: "center", marginTop: 28 },
    btnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
    footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
    footerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
    link: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  });
}
