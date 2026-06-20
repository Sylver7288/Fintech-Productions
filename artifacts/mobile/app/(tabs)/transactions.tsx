import React, { useState, useMemo } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Platform, TextInput,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { TransactionItem } from "@/components/TransactionItem";
import { useGetTransactions } from "@workspace/api-client-react";

type FilterType = "all" | "credit" | "debit";

export default function TransactionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch } = useGetTransactions({ type: filter });
  const all = data?.transactions ?? [];

  const transactions = useMemo(() => {
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter(t =>
      t.description.toLowerCase().includes(q) ||
      (t.recipientName ?? "").toLowerCase().includes(q) ||
      (t.recipientBank ?? "").toLowerCase().includes(q) ||
      (t.senderName ?? "").toLowerCase().includes(q) ||
      t.reference.toLowerCase().includes(q)
    );
  }, [all, search]);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Transactions</Text>

        {/* Search bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search transactions…"
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {/* Type filter */}
        <View style={styles.filterRow}>
          {(["all", "credit", "debit"] as FilterType[]).map(f => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterBtn,
                { backgroundColor: filter === f ? colors.primary : colors.card, borderColor: colors.border }
              ]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, { color: filter === f ? "#fff" : colors.mutedForeground }]}>
                {f === "all" ? "All" : f === "credit" ? "Money In" : "Money Out"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {search.trim() && (
          <Text style={[styles.resultCount, { color: colors.mutedForeground }]}>
            {transactions.length} result{transactions.length !== 1 ? "s" : ""} for "{search}"
          </Text>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={t => t.id}
          renderItem={({ item }) => (
            <TransactionItem
              transaction={item as any}
              onPress={() => router.push({ pathname: "/transaction/[id]", params: { id: item.id } })}
            />
          )}
          contentContainerStyle={[
            styles.list,
            { paddingHorizontal: 20, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100) }
          ]}
          scrollEnabled
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="inbox" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {search.trim() ? "No matching transactions" : "No transactions found"}
              </Text>
              {search.trim() && (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Text style={[styles.clearText, { color: colors.primary }]}>Clear search</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          ItemSeparatorComponent={() => null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 12 },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, height: 46,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  filterRow: { flexDirection: "row", gap: 8 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  resultCount: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 8 },
  list: { paddingTop: 8 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  clearText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
