import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, Alert, Switch,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import * as Haptics from "expo-haptics";
import { useApp, type Theme } from "@/context/AppContext";

export default function SecurityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const { theme, setTheme, pinEnabled, disablePin, twoFAEnabled, toggleTwoFA } = useApp();

  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [txnAlerts, setTxnAlerts] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);

  function toggleBiometrics(val: boolean) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (val) {
      Alert.alert(
        "Enable Biometrics",
        "Use Face ID or fingerprint to log in and approve transactions?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Enable", onPress: () => setBiometricsEnabled(true) },
        ]
      );
    } else {
      setBiometricsEnabled(false);
    }
  }

  function handlePinToggle(val: boolean) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (val) {
      router.push("/pin-setup" as any);
    } else {
      Alert.alert(
        "Disable App PIN",
        "Your app will no longer require a PIN when opened. Continue?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Disable", style: "destructive", onPress: () => disablePin() },
        ]
      );
    }
  }

  function handleTwoFAToggle(val: boolean) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (val) {
      Alert.alert(
        "Enable Two-Factor Auth",
        "You'll be asked to verify a one-time code each time you log in.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Enable", onPress: () => toggleTwoFA(true) },
        ]
      );
    } else {
      toggleTwoFA(false);
    }
  }

  function handleTheme(t: Theme) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTheme(t);
  }

  function handleChangePassword() {
    Alert.alert("Change Password", "A password reset link has been sent to your email address.");
  }

  function handleDeactivate() {
    Alert.alert(
      "Deactivate Account",
      "This will temporarily disable your account. Contact support to reactivate. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Deactivate", style: "destructive", onPress: () => Alert.alert("Done", "Account deactivated. Contact support to reactivate.") },
      ]
    );
  }

  const THEME_OPTIONS: { key: Theme; label: string; icon: "sun" | "moon" | "monitor" }[] = [
    { key: "light", label: "Light", icon: "sun" },
    { key: "system", label: "Auto", icon: "monitor" },
    { key: "dark", label: "Dark", icon: "moon" },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.navbar, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>Security & Appearance</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        {/* Appearance */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Appearance</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map(o => (
              <TouchableOpacity
                key={o.key}
                style={[
                  styles.themeBtn,
                  {
                    backgroundColor: theme === o.key ? colors.primary : colors.background,
                    borderColor: theme === o.key ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => handleTheme(o.key)}
                activeOpacity={0.8}
              >
                <Feather name={o.icon} size={18} color={theme === o.key ? "#fff" : colors.mutedForeground} />
                <Text style={[styles.themeLabel, { color: theme === o.key ? "#fff" : colors.mutedForeground }]}>
                  {o.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Authentication */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Authentication</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={[styles.row, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
            <View style={[styles.rowIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Feather name="lock" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>App PIN</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                {pinEnabled ? "PIN is enabled — tap to change" : "Require PIN when opening the app"}
              </Text>
            </View>
            <Switch
              value={pinEnabled}
              onValueChange={handlePinToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          {pinEnabled && (
            <TouchableOpacity
              style={[styles.row, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
              onPress={() => router.push("/pin-setup" as any)}
            >
              <View style={[styles.rowIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Feather name="refresh-cw" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: colors.foreground }]}>Change App PIN</Text>
                <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>Set a new 4-digit PIN</Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}

          <View style={[styles.row, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
            <View style={[styles.rowIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Feather name="shield" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>Two-Factor Authentication</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>Verify identity at each login</Text>
            </View>
            <Switch
              value={twoFAEnabled}
              onValueChange={handleTwoFAToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <TouchableOpacity
            style={[styles.row, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
            onPress={handleChangePassword}
          >
            <View style={[styles.rowIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Feather name="key" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>Change password</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>Update your login password</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>

          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Feather name="eye" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>Face ID / Fingerprint</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>Log in and confirm payments biometrically</Text>
            </View>
            <Switch
              value={biometricsEnabled}
              onValueChange={toggleBiometrics}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Alerts</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={[styles.row, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
            <View style={[styles.rowIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Feather name="bell" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>Transaction alerts</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>Get notified on every debit/credit</Text>
            </View>
            <Switch
              value={txnAlerts}
              onValueChange={v => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTxnAlerts(v); }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Feather name="shield" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>Login alerts</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>Notify on new device logins</Text>
            </View>
            <Switch
              value={loginAlerts}
              onValueChange={v => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setLoginAlerts(v); }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Danger zone</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <TouchableOpacity style={styles.row} onPress={handleDeactivate}>
            <View style={[styles.rowIcon, { backgroundColor: "#FFF0F0" }]}>
              <Feather name="user-x" size={18} color={colors.destructive} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.destructive }]}>Deactivate account</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>Temporarily disable your account</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
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
  content: { paddingHorizontal: 20, gap: 8 },
  sectionLabel: {
    fontSize: 12, fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8, textTransform: "uppercase",
    marginTop: 8, marginBottom: 4,
  },
  card: { borderRadius: 20, overflow: "hidden", marginBottom: 8 },
  row: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  rowIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  rowTitle: { fontSize: 15, fontFamily: "Inter_500Medium" },
  rowSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  themeRow: { flexDirection: "row", padding: 12, gap: 8 },
  themeBtn: {
    flex: 1, flexDirection: "column", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 14, borderRadius: 14, borderWidth: 1,
  },
  themeLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
});
