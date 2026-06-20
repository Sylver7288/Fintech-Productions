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

const DIGITS = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

export default function PinSetupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { enablePin } = useApp();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [firstPin, setFirstPin] = useState("");
  const [pin, setPin] = useState("");

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
        if (step === "enter") {
          setFirstPin(next);
          setPin("");
          setStep("confirm");
        } else {
          if (next === firstPin) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            enablePin(next).then(() => router.back());
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("PIN mismatch", "The PINs don't match. Please try again.");
            setFirstPin("");
            setPin("");
            setStep("enter");
          }
        }
      }, 120);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.navbar, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>
          {step === "enter" ? "Set App PIN" : "Confirm PIN"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.body}>
        <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
          <Feather name="lock" size={36} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {step === "enter" ? "Create a 4-digit PIN" : "Confirm your PIN"}
        </Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          {step === "enter"
            ? "This PIN protects your app when you reopen it"
            : "Enter the same PIN again to confirm"}
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

        <View style={styles.keypad}>
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
  body: { flex: 1, alignItems: "center", paddingHorizontal: 24, paddingTop: 32, gap: 16 },
  iconWrap: {
    width: 80, height: 80, borderRadius: 24,
    justifyContent: "center", alignItems: "center", marginBottom: 8,
  },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  sub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  dotsRow: { flexDirection: "row", gap: 20, marginVertical: 24 },
  pinDot: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
  },
  keypad: {
    flexDirection: "row", flexWrap: "wrap",
    justifyContent: "center", gap: 12, width: "100%", maxWidth: 320,
  },
  key: {
    width: 88, height: 72, borderRadius: 16, borderWidth: 1,
    justifyContent: "center", alignItems: "center",
  },
  keyText: { fontSize: 26, fontFamily: "Inter_500Medium" },
});
