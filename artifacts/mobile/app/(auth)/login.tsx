import React, { useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { login as loginApi } from "@workspace/api-client-react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { twoFAEnabled } = useApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  // 2FA step state
  const [step, setStep] = useState<"login" | "otp">("login");
  const [otpInput, setOtpInput] = useState("");
  const otpCodeRef = useRef<string>("");
  const pendingAuthRef = useRef<{ token: string; user: any } | null>(null);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const res = await loginApi({ email: email.trim().toLowerCase(), password });

      if (twoFAEnabled) {
        // Generate a 6-digit demo code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        otpCodeRef.current = code;
        pendingAuthRef.current = { token: res.token, user: res.user as any };

        // Show the code in demo mode
        Alert.alert(
          "Verification Required",
          `(Demo mode) Your one-time code is: ${code}\n\nEnter it below to continue.`,
          [{ text: "OK" }]
        );
        setStep("otp");
        setOtpInput("");
      } else {
        await login(res.token, res.user as any);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Login failed", err?.data?.error ?? "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (otpInput.trim() !== otpCodeRef.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Wrong code", "The verification code is incorrect. Please try again.");
      return;
    }
    const pending = pendingAuthRef.current;
    if (!pending) return;
    await login(pending.token, pending.user);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/(tabs)");
  }

  const s = makeStyles(colors, insets);

  if (step === "otp") {
    return (
      <KeyboardAvoidingView
        style={[s.root, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 30}
      >
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.logoArea}>
            <View style={[s.logoCircle, { backgroundColor: colors.primary }]}>
              <Feather name="shield" size={32} color="#fff" />
            </View>
            <Text style={[s.appName, { color: colors.foreground }]}>Verify Identity</Text>
            <Text style={[s.tagline, { color: colors.mutedForeground }]}>
              Enter the 6-digit code sent to your phone
            </Text>
          </View>

          <View style={s.form}>
            <Text style={[s.label, { color: colors.mutedForeground }]}>One-time code</Text>
            <View style={[s.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="hash" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[s.input, { color: colors.foreground, fontSize: 24, letterSpacing: 6, fontFamily: "Inter_700Bold" }]}
                placeholder="000000"
                placeholderTextColor={colors.mutedForeground}
                value={otpInput}
                onChangeText={setOtpInput}
                keyboardType="numeric"
                maxLength={6}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[s.btn, { backgroundColor: colors.primary, opacity: otpInput.length < 6 ? 0.6 : 1 }]}
              onPress={handleVerifyOtp}
              disabled={otpInput.length < 6}
              activeOpacity={0.85}
            >
              <Text style={s.btnText}>Verify & Sign In</Text>
            </TouchableOpacity>
          </View>

          <View style={s.footer}>
            <TouchableOpacity onPress={() => { setStep("login"); setOtpInput(""); }}>
              <Text style={[s.link, { color: colors.primary }]}>← Back to login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[
        s.root,
        { backgroundColor: colors.background },
        Platform.OS === "web" && {
          backgroundImage: `radial-gradient(circle at 50% 50%, ${colors.secondary} 0%, ${colors.background} 100%)`
        } as any
      ]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 30}
    >
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={Platform.OS === "web" ? { width: "100%" } : undefined}
      >
        <View style={[
          s.cardContainer,
          Platform.OS === "web" && {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: 1,
            padding: 40,
            borderRadius: 24,
            shadowColor: "#000",
            shadowOpacity: 0.06,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 10 }
          }
        ]}>
          <View style={s.logoArea}>
            <View style={[s.logoCircle, { backgroundColor: colors.primary }]}>
              <Text style={s.logoText}>N</Text>
            </View>
            <Text style={[s.appName, { color: colors.foreground }]}>Novamoni</Text>
            <Text style={[s.tagline, { color: colors.mutedForeground }]}>Smart microfinance, simple banking</Text>
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: any, insets: any) {
  return StyleSheet.create({
    root: { 
      flex: 1,
    },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: insets.top + (Platform.OS === "web" ? 60 : 20),
      paddingBottom: insets.bottom + 100,
      justifyContent: Platform.OS === "web" ? "center" : "flex-start",
      alignItems: "center",
      width: "100%",
    },
    cardContainer: {
      width: "100%",
      maxWidth: 420,
    },
    logoArea: { alignItems: "center", marginBottom: 32, marginTop: 10 },
    logoCircle: {
      width: 80, height: 80, borderRadius: 28,
      justifyContent: "center", alignItems: "center", marginBottom: 16,
      shadowColor: colors.primary, shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }
    },
    logoText: { fontSize: 38, fontFamily: "Inter_700Bold", color: "#fff" },
    appName: { fontSize: 30, fontFamily: "Inter_800ExtraBold", letterSpacing: -0.5 },
    tagline: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 6, textAlign: "center", lineHeight: 18 },
    form: { gap: 2 },
    label: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 6, marginTop: 16 },
    inputWrap: {
      flexDirection: "row", alignItems: "center",
      borderRadius: 14, borderWidth: 1,
      paddingHorizontal: 14, height: 52, gap: 10,
    },
    input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
    btn: { borderRadius: 14, height: 54, justifyContent: "center", alignItems: "center", marginTop: 28, shadowColor: colors.primary, shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
    btnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
    footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
    footerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
    link: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  });
}
