import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { sendOtp as sendOtpApi, verifyOtp as verifyOtpApi } from "@workspace/api-client-react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function OtpVerifyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, updateUser, logout } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const email = user?.email || "";

  async function handleVerify() {
    if (!code || code.length < 6) {
      Alert.alert("Invalid Code", "Please enter the 6-digit verification code.");
      return;
    }
    setLoading(true);
    try {
      await verifyOtpApi({ email, code });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (user) {
        updateUser({ ...user, isEmailVerified: true });
      }
      Alert.alert("Success", "Email verified successfully!", [
        { text: "OK", onPress: () => router.replace("/pin-setup" as any) }
      ]);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Verification failed", err?.data?.error || "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (countdown > 0) return;
    setResending(true);
    try {
      const res = await sendOtpApi({ email });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCountdown(60);
      
      // Sandbox helper warning
      if (res.devCode) {
        Alert.alert("Code Sent", `A verification code has been sent to your email. (Sandbox code: ${res.devCode})`);
      } else {
        Alert.alert("Code Sent", "A new verification code has been sent to your email address.");
      }
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", err?.data?.error || "Failed to resend code.");
    } finally {
      setResending(false);
    }
  }

  async function handleBack() {
    // If they go back, log them out since they are not verified
    await logout();
    router.replace("/(auth)/login");
  }

  const s = makeStyles(colors, insets);

  return (
    <KeyboardAvoidingView
      style={[
        s.root,
        { backgroundColor: colors.background },
        Platform.OS === "web" && {
          backgroundImage: `radial-gradient(circle at 50% 50%, ${colors.secondary} 0%, ${colors.background} 100%)`
        } as any
      ]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, backgroundColor: colors.background, width: "100%" }}
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
          <TouchableOpacity style={s.back} onPress={handleBack}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>

          <Text style={[s.title, { color: colors.foreground }]}>Verify email</Text>
          <Text style={[s.sub, { color: colors.mutedForeground }]}>
            We sent a 6-digit verification code to{"\n"}
            <Text style={{ fontWeight: "600", color: colors.foreground }}>{email}</Text>
          </Text>

          <View style={s.fieldWrap}>
            <Text style={[s.label, { color: colors.mutedForeground }]}>Verification Code</Text>
            <View style={[s.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="key" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[s.input, { color: colors.foreground }]}
                placeholder="Enter 6-digit code"
                placeholderTextColor={colors.mutedForeground}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
            </View>
          </View>

          <TouchableOpacity
            style={[s.btn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleVerify}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.btnText}>Verify Code</Text>
            )}
          </TouchableOpacity>

          <View style={s.footer}>
            {countdown > 0 ? (
              <Text style={[s.footerText, { color: colors.mutedForeground }]}>
                Resend code in <Text style={{ color: colors.primary, fontWeight: "600" }}>{countdown}s</Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={resending}>
                {resending ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={[s.link, { color: colors.primary }]}>Resend verification code</Text>
                )}
              </TouchableOpacity>
            )}
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
      paddingTop: insets.top + (Platform.OS === "web" ? 60 : 24),
      paddingBottom: insets.bottom + 24,
      justifyContent: Platform.OS === "web" ? "center" : "flex-start",
      alignItems: "center",
      width: "100%",
    },
    cardContainer: {
      width: "100%",
      maxWidth: 420,
    },
    back: { marginBottom: 24, width: 40 },
    title: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 8 },
    sub: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 28, lineHeight: 20 },
    fieldWrap: { marginTop: 4 },
    label: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 6 },
    inputWrap: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 14,
      borderWidth: 1,
      paddingHorizontal: 14,
      height: 52,
      gap: 10,
    },
    input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", letterSpacing: 2 },
    btn: { borderRadius: 14, height: 54, justifyContent: "center", alignItems: "center", marginTop: 28 },
    btnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
    footer: { flexDirection: "row", justifyContent: "center", marginTop: 28 },
    footerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
    link: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  });
}
