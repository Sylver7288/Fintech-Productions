import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Platform, Alert,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";

const DIGITS = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

export default function PinVerifyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { verifyPin, disablePin } = useApp();
  const { logout } = useAuth();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const [pin, setPin] = useState("");
  const [attempts, setAttempts] = useState(0);

  function handleDigit(d: string) {
    if (d === "⌫") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPin(p => p.slice(0, -1));
      return;
    }
    if (d === "") return;
    if (pin.length >= 4) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      setTimeout(() => {
        const correct = verifyPin(next);
        if (correct) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.replace("/(tabs)");
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);
          setPin("");
          if (newAttempts >= 3) {
            Alert.alert(
              "Too many attempts",
              "You've entered the wrong PIN 3 times. Would you like to reset your PIN? (This will log you out)",
              [
                { text: "Try again", style: "cancel", onPress: () => setAttempts(0) },
                {
                  text: "Reset PIN",
                  style: "destructive",
                  onPress: async () => {
                    await disablePin();
                    await logout();
                    router.replace("/(auth)/login");
                  }
                },
              ]
            );
          } else {
            Alert.alert("Wrong PIN", `${3 - newAttempts} ${3 - newAttempts === 1 ? "attempt" : "attempts"} remaining`);
          }
        }
      }, 120);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.top, { paddingTop: topPad + 40 }]}>
        <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
          <Feather name="lock" size={36} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>Enter your PIN</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          {attempts > 0 ? `Wrong PIN — ${3 - attempts} ${3 - attempts === 1 ? "attempt" : "attempts"} left` : "Enter your 4-digit app PIN to continue"}
        </Text>

        <View style={styles.dotsRow}>
          {[0,1,2,3].map(i => (
            <View
              key={i}
              style={[
                styles.pinDot,
                {
                  backgroundColor: i < pin.length ? colors.primary : "transparent",
                  borderColor: i < pin.length ? colors.primary : colors.border,
                }
              ]}
            />
          ))}
        </View>
      </View>

      <View style={[styles.keypad, { paddingBottom: insets.bottom + 24 }]}>
        {DIGITS.map((d, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.key,
              {
                backgroundColor: d === "" ? "transparent" : colors.card,
                borderColor: d === "" ? "transparent" : colors.border,
              }
            ]}
            onPress={() => handleDigit(d)}
            disabled={d === ""}
            activeOpacity={d === "" ? 1 : 0.7}
          >
            {d === "⌫"
              ? <Feather name="delete" size={22} color={colors.foreground} />
              : <Text style={[styles.keyText, { color: colors.foreground }]}>{d}</Text>
            }
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "space-between" },
  top: { alignItems: "center", gap: 16, flex: 1, justifyContent: "center" },
  iconWrap: {
    width: 80, height: 80, borderRadius: 24,
    justifyContent: "center", alignItems: "center", marginBottom: 8,
  },
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  dotsRow: { flexDirection: "row", gap: 20, marginTop: 24 },
  pinDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2 },
  keypad: {
    flexDirection: "row", flexWrap: "wrap",
    justifyContent: "center", gap: 12, paddingHorizontal: 24, width: "100%",
  },
  key: {
    width: 88, height: 72, borderRadius: 16, borderWidth: 1,
    justifyContent: "center", alignItems: "center",
  },
  keyText: { fontSize: 26, fontFamily: "Inter_500Medium" },
});
