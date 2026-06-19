import React from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Platform
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";

interface MenuItemProps {
  icon: string;
  label: string;
  sub?: string;
  onPress: () => void;
  danger?: boolean;
}

function MenuItem({ icon, label, sub, onPress, danger = false }: MenuItemProps) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIcon, { backgroundColor: danger ? "#FFF0F0" : colors.secondary }]}>
        <Feather name={icon as any} size={18} color={danger ? colors.destructive : colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuLabel, { color: danger ? colors.destructive : colors.foreground }]}>{label}</Text>
        {sub && <Text style={[styles.menuSub, { color: colors.mutedForeground }]}>{sub}</Text>}
      </View>
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  function handleLogout() {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => { logout(); router.replace("/(auth)/login"); } }
    ]);
  }

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100) }
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>
      </View>

      {/* Avatar */}
      <View style={[styles.avatarSection, { backgroundColor: colors.card }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.userName, { color: colors.foreground }]}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{user?.email}</Text>
          <View style={[styles.kycBadge, { backgroundColor: user?.kycStatus === "verified" ? "#E6F8F3" : "#FFF8E6" }]}>
            <View style={[styles.kycDot, { backgroundColor: user?.kycStatus === "verified" ? colors.success : colors.warning }]} />
            <Text style={[styles.kycText, { color: user?.kycStatus === "verified" ? colors.success : colors.warning }]}>
              {user?.kycStatus === "verified" ? "Verified" : "Verification pending"}
            </Text>
          </View>
        </View>
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Account</Text>
      <View style={[styles.menuGroup, { backgroundColor: colors.card }]}>
        <MenuItem icon="user" label="Personal Information" sub={user?.phone} onPress={() => {}} />
        <MenuItem icon="shield" label="Security" sub="PIN, biometrics" onPress={() => {}} />
        <MenuItem icon="bell" label="Notifications" onPress={() => {}} />
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Support</Text>
      <View style={[styles.menuGroup, { backgroundColor: colors.card }]}>
        <MenuItem icon="help-circle" label="Help & Support" onPress={() => {}} />
        <MenuItem icon="file-text" label="Terms & Privacy" onPress={() => {}} />
        <MenuItem icon="info" label="App version" sub="1.0.0" onPress={() => {}} />
      </View>

      <View style={[styles.menuGroup, { backgroundColor: colors.card, marginTop: 8 }]}>
        <MenuItem icon="log-out" label="Sign out" onPress={handleLogout} danger />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: { paddingBottom: 16 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  avatarSection: {
    flexDirection: "row", alignItems: "center", gap: 16,
    borderRadius: 20, padding: 16, marginBottom: 24,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 20,
    justifyContent: "center", alignItems: "center",
  },
  initials: { color: "#fff", fontSize: 26, fontFamily: "Inter_700Bold" },
  userName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  userEmail: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  kycBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12, marginTop: 8,
  },
  kycDot: { width: 6, height: 6, borderRadius: 3 },
  kycText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  sectionLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 },
  menuGroup: { borderRadius: 20, marginBottom: 16, overflow: "hidden" },
  menuItem: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  menuLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  menuSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
});
