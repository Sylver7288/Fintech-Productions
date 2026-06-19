import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const NOTIFICATIONS = [
  { id: "1", icon: "check-circle", title: "Account verified", sub: "Your NovaPay account is ready to use", time: "2 min ago", color: "#00B894" },
  { id: "2", icon: "gift", title: "Welcome bonus!", sub: "₦50,000 has been added to your account", time: "5 min ago", color: "#6C5CE7" },
  { id: "3", icon: "shield", title: "Security tip", sub: "Never share your PIN or OTP with anyone", time: "1 hour ago", color: "#E17055" },
];

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.navbar, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        {NOTIFICATIONS.map((n, i) => (
          <View key={n.id} style={[styles.item, { backgroundColor: colors.card }, i > 0 && { marginTop: 8 }]}>
            <View style={[styles.icon, { backgroundColor: `${n.color}20` }]}>
              <Feather name={n.icon as any} size={20} color={n.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemTitle, { color: colors.foreground }]}>{n.title}</Text>
              <Text style={[styles.itemSub, { color: colors.mutedForeground }]}>{n.sub}</Text>
              <Text style={[styles.itemTime, { color: colors.mutedForeground }]}>{n.time}</Text>
            </View>
          </View>
        ))}
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
  content: { paddingHorizontal: 20 },
  item: { flexDirection: "row", alignItems: "flex-start", gap: 14, borderRadius: 16, padding: 16 },
  icon: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  itemTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  itemSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  itemTime: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4 },
});
