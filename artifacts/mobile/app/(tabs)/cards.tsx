import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Platform, Modal, TextInput,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { BankCard } from "@/components/BankCard";
import {
  useGetCards, useFreezeCard, useGetAccounts, useCreateCard,
  getGetCardsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const CARD_COLORS = ["#6C5CE7", "#E17055", "#0984E3", "#00B894", "#FDCB6E", "#2D3436"];

export default function CardsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { data: cards, isLoading } = useGetCards();
  const { data: accounts } = useGetAccounts();
  const freezeCard = useFreezeCard();
  const createCard = useCreateCard();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState(CARD_COLORS[2]);

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

  async function handleRequestCard() {
    const account = accounts?.[0];
    if (!account) {
      Alert.alert("No account", "No account found to link card to.");
      return;
    }
    try {
      await createCard.mutateAsync({ data: { accountId: account.id, type: "virtual", color: selectedColor } });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: getGetCardsQueryKey() });
      setShowRequestModal(false);
      Alert.alert("Card created!", "Your new virtual card is ready to use.");
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Could not create card. Please try again.");
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
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowRequestModal(true)}
        >
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ padding: 40 }} />
      ) : !cards?.length ? (
        <View style={styles.empty}>
          <Feather name="credit-card" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No cards yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Request a virtual card to get started</Text>
          <TouchableOpacity
            style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowRequestModal(true)}
          >
            <Feather name="credit-card" size={16} color="#fff" />
            <Text style={styles.emptyBtnText}>Request virtual card</Text>
          </TouchableOpacity>
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
            {cards.map((card) => (
              <View key={card.id} style={styles.cardWrapper}>
                <BankCard card={card as any} balance={cardAccount?.balance ?? 0} />
              </View>
            ))}
          </ScrollView>

          {/* Dots */}
          <View style={styles.dots}>
            {cards.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, { backgroundColor: i === selectedIdx ? colors.primary : colors.border }]}
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

      {/* Request Card Modal */}
      <Modal visible={showRequestModal} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Request Virtual Card</Text>
            <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
              A new Mastercard virtual card will be created and linked to your current account.
            </Text>

            <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>Choose card color</Text>
            <View style={styles.colorRow}>
              {CARD_COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setSelectedColor(c)}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    selectedColor === c && styles.colorSelected,
                  ]}
                />
              ))}
            </View>

            {/* Preview */}
            <View style={[styles.previewCard, { backgroundColor: selectedColor }]}>
              <Text style={styles.previewChip}>VIRTUAL</Text>
              <Text style={styles.previewNumber}>•••• •••• •••• ••••</Text>
              <Text style={styles.previewLabel}>NovaPay Mastercard</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => setShowRequestModal(false)}
              >
                <Text style={[styles.cancelText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createBtn, { backgroundColor: colors.primary, opacity: createCard.isPending ? 0.7 : 1 }]}
                onPress={handleRequestCard}
                disabled={createCard.isPending}
              >
                {createCard.isPending
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.createText}>Request card</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 20 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  addBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  emptyBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 8,
  },
  emptyBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
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
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#E0E0E0", alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 8 },
  modalSub: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 20, lineHeight: 22 },
  modalLabel: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 10 },
  colorRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorSelected: { borderWidth: 3, borderColor: "#fff", shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  previewCard: { borderRadius: 16, padding: 20, marginBottom: 24, gap: 8 },
  previewChip: { color: "rgba(255,255,255,0.8)", fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  previewNumber: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold", letterSpacing: 3 },
  previewLabel: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontFamily: "Inter_400Regular" },
  modalActions: { flexDirection: "row", gap: 12 },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: 12, height: 50, justifyContent: "center", alignItems: "center" },
  cancelText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  createBtn: { flex: 1, borderRadius: 12, height: 50, justifyContent: "center", alignItems: "center" },
  createText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
