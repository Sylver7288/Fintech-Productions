import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useGetDashboardSummary, useGetAccounts } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";

type NotifItem = {
  id: string;
  icon: string;
  title: string;
  sub: string;
  time: string;
  color: string;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: summary, isLoading } = useGetDashboardSummary();
  const { data: accounts } = useGetAccounts();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const notifications: NotifItem[] = React.useMemo(() => {
    const items: NotifItem[] = [];

    items.push({
      id: "welcome",
      icon: "check-circle",
      title: "Welcome to NovaPay!",
      sub: `Hi ${user?.firstName ?? "there"}, your account is ready to use.`,
      time: user?.createdAt ? timeAgo(user.createdAt) : "Just now",
      color: "#6C5CE7",
    });

    if (user?.kycStatus === "pending") {
      items.push({
        id: "kyc",
        icon: "alert-circle",
        title: "Complete your verification",
        sub: "Submit your BVN to unlock all features and higher limits.",
        time: user?.createdAt ? timeAgo(user.createdAt) : "Just now",
        color: "#E17055",
      });
    }

    if (user?.kycStatus === "verified") {
      items.push({
        id: "kyc-done",
        icon: "shield",
        title: "Identity verified",
        sub: "Your BVN verification was successful. Full access unlocked.",
        time: user?.createdAt ? timeAgo(user.createdAt) : "Just now",
        color: "#00B894",
      });
    }

    const txns = summary?.recentTransactions ?? [];
    for (const txn of txns.slice(0, 6)) {
      if (txn.type === "credit") {
        items.push({
          id: `txn-${txn.id}`,
          icon: "arrow-down-left",
          title: `Money received`,
          sub: `You received ₦${txn.amount.toLocaleString("en-NG")}${txn.senderName ? ` from ${txn.senderName}` : ""}.`,
          time: timeAgo(txn.createdAt),
          color: "#00B894",
        });
      } else {
        items.push({
          id: `txn-${txn.id}`,
          icon: "arrow-up-right",
          title: "Payment sent",
          sub: `₦${txn.amount.toLocaleString("en-NG")} sent${txn.recipientName ? ` to ${txn.recipientName}` : ""}. ${txn.description}.`,
          time: timeAgo(txn.createdAt),
          color: "#6C5CE7",
        });
      }
    }

    items.push({
      id: "security-tip",
      icon: "lock",
      title: "Security tip",
      sub: "Never share your PIN, OTP, or password with anyone — including NovaPay staff.",
      time: "Always",
      color: "#FDCB6E",
    });

    return items;
  }, [summary, user, accounts]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.navbar, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
          {notifications.map((n, i) => (
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
      )}
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
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { paddingHorizontal: 20 },
  item: { flexDirection: "row", alignItems: "flex-start", gap: 14, borderRadius: 16, padding: 16 },
  icon: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  itemTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  itemSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  itemTime: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4 },
});
