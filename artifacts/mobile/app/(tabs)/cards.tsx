import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Platform
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { BankCard } from "@/components/BankCard";
import {
  useGetCards, useFreezeCard, useGetAccounts,
  getGetCardsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function CardsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { data: cards, isLoading } = useGetCards();
  const { data: accounts } = useGetAccounts();
  const freezeCard = useFreezeCard();
  const [selectedIdx, setSelectedIdx] = useState(0);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  async function handleFreeze(cardId: string, frozen: boolean) {
    try {
      await freezeCard.mutateAsync({ id: cardId, data: { frozen } });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: getGetCardsQueryKey() });
    } catch {
      Alert.alert("Error", "Could not update card status");
    }
  }

  const selectedCard = cards?.[selectedIdx];
  const cardAccount = accounts?.find(a => a.id === selectedCard?.accountId);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100) }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>My Cards</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ padding: 40 }} />
      ) : !cards?.length ? (
        <View style={styles.empty}>
          <Feather name="credit-card" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No cards yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Request a virtual card to get started</Text>
        </View>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            contentContainerStyle={styles.cardScroll}
            onMomentumScrollEnd={e => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / (340 + 16));
              setSelectedIdx(Math.max(0, Math.min(idx, (cards?.length ?? 1) - 1)));
            }}
          >
            {cards.map((card, i) => (
              <View key={card.id} style={styles.cardWrapper}>
                <BankCard
                  card={card as any}
                  balance={cardAccount?.balance ?? 0}
                />
              </View>
            ))}
          </ScrollView>

          {/* Dots */}
          <View style={styles.dots}>
            {cards.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: i === selectedIdx ? colors.primary : colors.border }
                ]}
              />
            ))}
          </View>

          {/* Card Actions */}
          {selectedCard && (
            <View style={[styles.actionsCard, { backgroundColor: colors.card }]}>
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => handleFreeze(selectedCard.id, selectedCard.status !== "frozen")}
              >
                <View style={[styles.actionIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name={selectedCard.status === "frozen" ? "unlock" : "lock"} size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionTitle, { color: colors.foreground }]}>
                    {selectedCard.status === "frozen" ? "Unfreeze Card" : "Freeze Card"}
                  </Text>
                  <Text style={[styles.actionSub, { color: colors.mutedForeground }]}>
                    {selectedCard.status === "frozen"
                      ? "Resume card transactions"
                      : "Temporarily block all transactions"}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.cardDetails}>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Card type</Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>
                    {selectedCard.type === "virtual" ? "Virtual" : "Physical"}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Status</Text>
                  <Text style={[
                    styles.detailValue,
                    { color: selectedCard.status === "active" ? colors.success : colors.destructive }
                  ]}>
                    {selectedCard.status.charAt(0).toUpperCase() + selectedCard.status.slice(1)}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Expires</Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>
                    {selectedCard.expiryMonth}/{selectedCard.expiryYear.slice(-2)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: { paddingBottom: 20 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  cardScroll: { gap: 16, paddingRight: 20, paddingBottom: 8 },
  cardWrapper: { width: 340 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 20, marginTop: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  actionsCard: { borderRadius: 20, padding: 16 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 8 },
  actionIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  actionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  actionSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 12 },
  cardDetails: { flexDirection: "row", justifyContent: "space-between" },
  detailItem: { alignItems: "center" },
  detailLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 4 },
  detailValue: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
