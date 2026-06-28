import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator, RefreshControl } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { customFetch } from "@workspace/api-client-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type DBNotification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
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

function getNotifTheme(type: string, colors: any) {
  switch (type) {
    case "credit":
      return { icon: "arrow-down-left", color: "#00B894" }; // success green
    case "debit":
      return { icon: "arrow-up-right", color: colors.primary }; // primary gold
    case "kyc":
      return { icon: "shield", color: "#00B894" }; // success green
    case "card":
      return { icon: "credit-card", color: "#0984E3" }; // info blue
    case "system":
    default:
      return { icon: "bell", color: "#FDCB6E" }; // warning yellow
  }
}

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  // Fetch dynamic notifications from database API
  const { data: notifications = [], isLoading, refetch } = useQuery<DBNotification[]>({
    queryKey: ["notifications"],
    queryFn: () => customFetch<DBNotification[]>("/notifications"),
  });

  // Mutation to mark all notifications as read
  const markAllReadMutation = useMutation({
    mutationFn: () => customFetch("/notifications/read-all", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Automatically mark all as read when viewing the notifications center
  React.useEffect(() => {
    markAllReadMutation.mutate();
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.navbar, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>Notifications</Text>
        <TouchableOpacity 
          onPress={() => markAllReadMutation.mutate()}
          disabled={notifications.every(n => n.isRead)}
          style={{ opacity: notifications.every(n => n.isRead) ? 0.3 : 1 }}
        >
          <Feather name="check-square" size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {isLoading && notifications.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
          }
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="bell-off" size={48} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No notifications yet</Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>We will notify you here when transactions or system updates occur.</Text>
            </View>
          ) : (
            notifications.map((n, i) => {
              const theme = getNotifTheme(n.type, colors);
              return (
                <View key={n.id} style={[styles.item, { backgroundColor: colors.card }, i > 0 && { marginTop: 8 }]}>
                  <View style={[styles.icon, { backgroundColor: `${theme.color}20` }]}>
                    <Feather name={theme.icon as any} size={20} color={theme.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.itemHeader}>
                      <Text style={[styles.itemTitle, { color: colors.foreground }]}>{n.title}</Text>
                      {!n.isRead && (
                        <View style={[styles.unreadDot, { backgroundColor: theme.color }]} />
                      )}
                    </View>
                    <Text style={[styles.itemSub, { color: colors.mutedForeground }]}>{n.message}</Text>
                    <Text style={[styles.itemTime, { color: colors.mutedForeground }]}>{timeAgo(n.createdAt)}</Text>
                  </View>
                </View>
              );
            })
          )}
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
  content: { paddingHorizontal: 20, flexGrow: 1 },
  item: { flexDirection: "row", alignItems: "flex-start", gap: 14, borderRadius: 16, padding: 16 },
  icon: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  itemSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 18 },
  itemTime: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 6 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 120, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptySub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 6, lineHeight: 20 },
});
