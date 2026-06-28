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
import { register as registerApi, sendPhoneOtp, verifyPhoneOtp } from "@workspace/api-client-react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  // Multi-step state: "phone" | "otp" | "details"
  const [step, setStep] = useState<"phone" | "otp" | "details">("phone");

  // Registration states
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [showInvitation, setShowInvitation] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [countdown, setCountdown] = useState(60);
  const [devCode, setDevCode] = useState<string | null>(null);

  // Form details states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [loading, setLoading] = useState(false);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: any;
    if (step === "otp" && countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  // Step 1: Send OTP to Phone
  async function handleSendPhoneOtp() {
    if (!phone || phone.trim().length < 10) {
      Alert.alert("Invalid Phone", "Please enter a valid mobile number.");
      return;
    }
    if (!termsAccepted) {
      Alert.alert("Terms Required", "You must agree to the Terms & Conditions and Privacy Policy to proceed.");
      return;
    }

    setLoading(true);
    // Format number to local standard without leading 0 for API if needed, or send as entered
    let formattedPhone = phone.trim();
    if (formattedPhone.startsWith("0") && formattedPhone.length === 11) {
      formattedPhone = "+234" + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith("+")) {
      formattedPhone = "+234" + formattedPhone;
    }

    try {
      const res = await sendPhoneOtp({ phone: formattedPhone });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDevCode(res.devCode ?? null);
      setCountdown(60);
      setStep("otp");

      // Sandbox helper
      if (res.devCode) {
        Alert.alert(
          "Code Sent (Sandbox)", 
          `A verification code has been sent to your phone. (Sandbox code: ${res.devCode})`
        );
      } else {
        Alert.alert("Code Sent", "A verification code has been sent to your mobile number.");
      }
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", err?.data?.error ?? "Failed to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Verify Phone OTP
  async function handleVerifyPhoneOtp() {
    if (!otpCode || otpCode.length < 6) {
      Alert.alert("Invalid Code", "Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    let formattedPhone = phone.trim();
    if (formattedPhone.startsWith("0") && formattedPhone.length === 11) {
      formattedPhone = "+234" + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith("+")) {
      formattedPhone = "+234" + formattedPhone;
    }

    try {
      await verifyPhoneOtp({ phone: formattedPhone, code: otpCode });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep("details");
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Verification Failed", err?.data?.error ?? "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  }

  // Step 3: Register Account
  async function handleRegister() {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Weak password", "Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Passwords do not match.");
      return;
    }

    setLoading(true);
    let formattedPhone = phone.trim();
    if (formattedPhone.startsWith("0") && formattedPhone.length === 11) {
      formattedPhone = "+234" + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith("+")) {
      formattedPhone = "+234" + formattedPhone;
    }

    try {
      const res = await registerApi({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: formattedPhone,
        password,
      });

      await login(res.token, res.user as any);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Registration failed", err?.data?.error ?? "Something went wrong during account creation.");
    } finally {
      setLoading(false);
    }
  }

  // Helper to resend OTP
  async function handleResendOtp() {
    if (countdown > 0) return;
    setLoading(true);
    let formattedPhone = phone.trim();
    if (formattedPhone.startsWith("0") && formattedPhone.length === 11) {
      formattedPhone = "+234" + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith("+")) {
      formattedPhone = "+234" + formattedPhone;
    }

    try {
      const res = await sendPhoneOtp({ phone: formattedPhone });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDevCode(res.devCode ?? null);
      setCountdown(60);
      Alert.alert("Code Sent", "A new verification code has been sent to your mobile number.");
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", err?.data?.error ?? "Failed to resend code.");
    } finally {
      setLoading(false);
    }
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
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 30}
    >
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, backgroundColor: colors.background, width: "100%" }}
      >
        <View style={s.cardContainer}>
          
          {/* Back button */}
          <TouchableOpacity 
            style={s.back} 
            onPress={() => {
              if (step === "details") {
                setStep("otp");
              } else if (step === "otp") {
                setStep("phone");
              } else {
                router.back();
              }
            }}
          >
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>

          {/* Render Step 1: Phone input screen */}
          {step === "phone" && (
            <View>
              <Text style={[s.title, { color: colors.foreground }]}>Get a Novamoni Account</Text>
              <Text style={[s.sub, { color: colors.mutedForeground }]}>Join thousands managing money smarter</Text>

              {/* Mobile Number Input with Flag */}
              <View style={[s.inputWrap, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 24 }]}>
                <View style={s.countrySelect}>
                  <Text style={s.flag}>🇳🇬</Text>
                  <Text style={[s.countryCode, { color: colors.foreground }]}>+234</Text>
                  <View style={s.dividerLine} />
                </View>
                <TextInput
                  style={[s.input, { color: colors.foreground }]}
                  placeholder="Enter your Mobile No."
                  placeholderTextColor={colors.mutedForeground}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={11}
                  returnKeyType="done"
                  onSubmitEditing={handleSendPhoneOtp}
                />
              </View>

              {/* Invitation Code Section */}
              <TouchableOpacity 
                style={[s.invitationHeader, { backgroundColor: colors.muted + "40" }]} 
                onPress={() => setShowInvitation(!showInvitation)}
                activeOpacity={0.8}
              >
                <View style={s.invitationTitleRow}>
                  <Feather name="gift" size={16} color={colors.primary} />
                  <Text style={[s.invitationText, { color: colors.foreground }]}>Have an Invitation Code? (Optional)</Text>
                </View>
                <Feather name={showInvitation ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
              </TouchableOpacity>

              {showInvitation && (
                <View style={[s.inputWrap, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 10 }]}>
                  <Feather name="tag" size={16} color={colors.mutedForeground} />
                  <TextInput
                    style={[s.input, { color: colors.foreground }]}
                    placeholder="Enter referral code"
                    placeholderTextColor={colors.mutedForeground}
                    value={invitationCode}
                    onChangeText={setInvitationCode}
                    autoCapitalize="characters"
                  />
                </View>
              )}

              {/* Free Airtime Banner */}
              <View style={[s.promoBadge, { backgroundColor: colors.success + "1a" }]}>
                <Text style={s.promoCoin}>🪙</Text>
                <Text style={[s.promoText, { color: colors.success }]}>Get ₦300 airtime for free</Text>
              </View>

              {/* NEXT Button */}
              <TouchableOpacity
                style={[s.btn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
                onPress={handleSendPhoneOtp}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.btnText}>NEXT</Text>
                )}
              </TouchableOpacity>

              {/* Terms and Conditions Checkbox */}
              <TouchableOpacity 
                style={s.termsRow} 
                onPress={() => setTermsAccepted(!termsAccepted)}
                activeOpacity={0.8}
              >
                <Feather 
                  name={termsAccepted ? "check-square" : "square"} 
                  size={18} 
                  color={termsAccepted ? colors.primary : colors.mutedForeground} 
                />
                <Text style={[s.termsText, { color: colors.mutedForeground }]}>
                  I have read, understood and agreed to the{" "}
                  <Text style={{ color: colors.primary }}>Terms & Conditions</Text> and{" "}
                  <Text style={{ color: colors.primary }}>Privacy Policy</Text>.
                </Text>
              </TouchableOpacity>

              {/* Log In Link */}
              <View style={s.footer}>
                <Text style={[s.footerText, { color: colors.mutedForeground }]}>Already have a Novamoni Account?</Text>
                <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                  <Text style={[s.link, { color: colors.primary }]}> Log in</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Render Step 2: Verification Code screen */}
          {step === "otp" && (
            <View>
              <Text style={[s.title, { color: colors.foreground }]}>Verify phone</Text>
              <Text style={[s.sub, { color: colors.mutedForeground }]}>
                We sent a 6-digit verification code to{"\n"}
                <Text style={{ fontWeight: "600", color: colors.foreground }}>{phone}</Text>
              </Text>

              {/* OTP Input */}
              <View style={s.fieldWrap}>
                <Text style={[s.label, { color: colors.mutedForeground }]}>Verification Code</Text>
                <View style={[s.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name="key" size={16} color={colors.mutedForeground} />
                  <TextInput
                    style={[s.input, { color: colors.foreground, letterSpacing: 4, fontFamily: "Inter_600SemiBold" }]}
                    placeholder="Enter 6-digit code"
                    placeholderTextColor={colors.mutedForeground}
                    value={otpCode}
                    onChangeText={setOtpCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                    onSubmitEditing={handleVerifyPhoneOtp}
                  />
                </View>
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                style={[s.btn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
                onPress={handleVerifyPhoneOtp}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.btnText}>Verify Code</Text>
                )}
              </TouchableOpacity>

              {/* Resend OTP Timer */}
              <View style={s.footer}>
                {countdown > 0 ? (
                  <Text style={[s.footerText, { color: colors.mutedForeground }]}>
                    Resend code in <Text style={{ color: colors.primary, fontWeight: "600" }}>{countdown}s</Text>
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleResendOtp}>
                    <Text style={[s.link, { color: colors.primary }]}>Resend verification code</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Sandbox Code display */}
              {devCode && (
                <View style={[s.sandboxContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[s.sandboxLabel, { color: colors.mutedForeground }]}>[Sandbox Mode Helper]</Text>
                  <Text style={[s.sandboxValue, { color: colors.foreground }]}>Code: {devCode}</Text>
                </View>
              )}
            </View>
          )}

          {/* Render Step 3: Complete Details screen */}
          {step === "details" && (
            <View>
              <Text style={[s.title, { color: colors.foreground }]}>Complete Profile</Text>
              <Text style={[s.sub, { color: colors.mutedForeground }]}>Enter your personal details to finish setup</Text>

              {/* Names Row */}
              <View style={s.row}>
                <View style={s.half}>
                  <Text style={[s.label, { color: colors.mutedForeground }]}>First name</Text>
                  <View style={[s.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <TextInput
                      style={[s.input, { color: colors.foreground }]}
                      placeholder="Ada"
                      placeholderTextColor={colors.mutedForeground}
                      value={firstName}
                      onChangeText={setFirstName}
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
                      value={lastName}
                      onChangeText={setLastName}
                    />
                  </View>
                </View>
              </View>

              {/* Email Address */}
              <View style={s.fieldWrap}>
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
                  />
                </View>
              </View>

              {/* Password */}
              <View style={s.fieldWrap}>
                <Text style={[s.label, { color: colors.mutedForeground }]}>Password (Min 8 chars)</Text>
                <View style={[s.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name="lock" size={16} color={colors.mutedForeground} />
                  <TextInput
                    style={[s.input, { color: colors.foreground }]}
                    placeholder="Create a password"
                    placeholderTextColor={colors.mutedForeground}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPw}
                  />
                  <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                    <Feather name={showPw ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={s.fieldWrap}>
                <Text style={[s.label, { color: colors.mutedForeground }]}>Confirm Password</Text>
                <View style={[s.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name="lock" size={16} color={colors.mutedForeground} />
                  <TextInput
                    style={[s.input, { color: colors.foreground }]}
                    placeholder="Re-enter password"
                    placeholderTextColor={colors.mutedForeground}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPw}
                    returnKeyType="done"
                    onSubmitEditing={handleRegister}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPw(!showConfirmPw)}>
                    <Feather name={showConfirmPw ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* CREATE ACCOUNT Button */}
              <TouchableOpacity
                style={[s.btn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.btnText}>Create Account</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

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
      paddingTop: insets.top + (Platform.OS === "web" ? 60 : 16),
      paddingBottom: insets.bottom + 120,
      justifyContent: Platform.OS === "web" ? "center" : "flex-start",
      alignItems: "center",
      width: "100%",
    },
    cardContainer: {
      width: "100%",
      maxWidth: 420,
    },
    back: { marginBottom: 20, width: 40 },
    title: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 8, letterSpacing: -0.5 },
    sub: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 20 },
    row: { flexDirection: "row", gap: 12 },
    half: { flex: 1 },
    fieldWrap: { marginTop: 4 },
    label: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 6, marginTop: 12 },
    inputWrap: {
      flexDirection: "row", alignItems: "center",
      borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, height: 52, gap: 10,
    },
    input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
    btn: { borderRadius: 14, height: 54, justifyContent: "center", alignItems: "center", marginTop: 28 },
    btnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
    footer: { flexDirection: "row", justifyContent: "center", marginTop: 24, flexWrap: "wrap", gap: 4 },
    footerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
    link: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    
    // Country selector styles
    countrySelect: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    flag: {
      fontSize: 20,
    },
    countryCode: {
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
    },
    dividerLine: {
      width: 1,
      height: 20,
      backgroundColor: colors.border,
      marginHorizontal: 4,
    },

    // Invitation code styles
    invitationHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 14,
      marginTop: 20,
    },
    invitationTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    invitationText: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
    },

    // Promo badge styles
    promoBadge: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginTop: 28,
      alignSelf: "center",
    },
    promoCoin: {
      fontSize: 14,
    },
    promoText: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
    },

    // Terms styles
    termsRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      marginTop: 24,
      paddingHorizontal: 4,
    },
    termsText: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      lineHeight: 18,
      flex: 1,
    },

    // Sandbox helper styles
    sandboxContainer: {
      marginTop: 30,
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderStyle: "dashed",
      alignItems: "center",
    },
    sandboxLabel: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      marginBottom: 4,
    },
    sandboxValue: {
      fontSize: 16,
      fontFamily: "Inter_700Bold",
      letterSpacing: 1,
    },
  });
}
