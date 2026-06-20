import React from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { SERVICES } from "@/constants/services";

export default function AllServicesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  function open(route: string) {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.navbar, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>All Services</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.grid, { backgroundColor: colors.card }]}>
          {SERVICES.map(s => (
            <TouchableOpacity
              key={s.label}
              style={styles.item}
              onPress={() => open(s.route)}
              activeOpacity={0.7}
            >
              <View style={[styles.icon, { backgroundColor: s.color + "18" }]}>
                <Feather name={s.icon as any} size={22} color={s.color} />
              </View>
              <Text style={[styles.label, { color: colors.foreground }]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  navbar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 12,
  },
  navTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  grid: {
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 16,
    flexDirection: "row", flexWrap: "wrap",
  },
  item: { width: "25%", alignItems: "center", paddingVertical: 12, gap: 8 },
  icon: { width: 54, height: 54, borderRadius: 27, justifyContent: "center", alignItems: "center" },
  label: { fontSize: 11, fontFamily: "Inter_500Medium", textAlign: "center" },
});
