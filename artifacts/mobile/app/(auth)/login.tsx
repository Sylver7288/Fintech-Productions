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
import { login as loginApi } from "@workspace/api-client-react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const res = await loginApi({ email: email.trim().toLowerCase(), password });
      await login(res.token, res.user as any);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Login failed", err?.data?.error ?? "Invalid credentials");
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
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.logoArea}>
          <View style={[s.logoCircle, { backgroundColor: colors.primary }]}>
            <Text style={s.logoText}>N</Text>
          </View>
          <Text style={[s.appName, { color: colors.foreground }]}>NovaPay</Text>
          <Text style={[s.tagline, { color: colors.mutedForeground }]}>Your money, your rules</Text>
        </View>

        <View style={s.form}>
          <Text style={[s.label, { color: colors.mutedForeground }]}>Email address</Text>
          <View style={[s.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="mail" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[s.input, { color: colors.foreground }]}
              placeholder="you@example.com"
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
            />
          </View>

          <Text style={[s.label, { color: colors.mutedForeground }]}>Password</Text>
          <View style={[s.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="lock" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[s.input, { color: colors.foreground }]}
              placeholder="••••••••"
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity onPress={() => setShowPw(!showPw)}>
              <Feather name={showPw ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[s.btn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Sign In</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={s.footer}>
          <Text style={[s.footerText, { color: colors.mutedForeground }]}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <Text style={[s.link, { color: colors.primary }]}> Create account</Text>
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
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20),
      paddingBottom: insets.bottom + 24,
    },
    logoArea: {
      alignItems: "center",
      marginBottom: 48,
      marginTop: 20,
    },
    logoCircle: {
      width: 72,
      height: 72,
      borderRadius: 24,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
    },
    logoText: {
      fontSize: 36,
      fontFamily: "Inter_700Bold",
      color: "#fff",
    },
    appName: {
      fontSize: 28,
      fontFamily: "Inter_700Bold",
    },
    tagline: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      marginTop: 4,
    },
    form: { gap: 4 },
    label: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      marginBottom: 6,
      marginTop: 16,
    },
    inputWrap: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 14,
      borderWidth: 1,
      paddingHorizontal: 14,
      height: 52,
      gap: 10,
    },
    input: {
      flex: 1,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
    },
    btn: {
      borderRadius: 14,
      height: 54,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 28,
    },
    btnText: {
      color: "#fff",
      fontSize: 16,
      fontFamily: "Inter_700Bold",
    },
    footer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 24,
    },
    footerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
    link: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  });
}
