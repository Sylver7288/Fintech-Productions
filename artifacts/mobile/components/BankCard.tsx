import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface CardData {
  id: string;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  cardHolder: string;
  type: string;
  status: string;
  color?: string | null;
}

interface BankCardProps {
  card: CardData;
  balance?: number;
  onFreeze?: () => void;
  compact?: boolean;
}

export function BankCard({ card, balance, onFreeze, compact = false }: BankCardProps) {
  const colors = useColors();
  const [showFull, setShowFull] = useState(false);
  const isFrozen = card.status === "frozen";
  const cardColor = card.color ?? colors.cardGradientStart;

  return (
    <View style={[styles.card, { backgroundColor: cardColor, opacity: isFrozen ? 0.7 : 1 }]}>
      {isFrozen && (
        <View style={styles.frozenBanner}>
          <Feather name="lock" size={12} color="#fff" />
          <Text style={styles.frozenText}>FROZEN</Text>
        </View>
      )}

      <View style={styles.topRow}>
        <View>
          <Text style={styles.bankName}>Novamoni</Text>
          <Text style={styles.cardType}>{card.type === "virtual" ? "Virtual Card" : "Physical Card"}</Text>
        </View>
        <View style={styles.chip}>
          <View style={styles.chipInner} />
        </View>
      </View>

      {balance !== undefined && !compact && (
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={[styles.balanceAmount, { color: colors.primary }]}>₦{balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</Text>
        </View>
      )}

      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.cardNumber}>
            •••• •••• •••• {card.last4}
          </Text>
          <Text style={styles.cardHolder}>{card.cardHolder}</Text>
        </View>
        <View>
          <Text style={styles.expiryLabel}>EXPIRES</Text>
          <Text style={styles.expiry}>{card.expiryMonth}/{card.expiryYear.slice(-2)}</Text>
        </View>
      </View>

      <View style={[styles.decorCircle1, { backgroundColor: "rgba(255,255,255,0.1)" }]} />
      <View style={[styles.decorCircle2, { backgroundColor: "rgba(255,255,255,0.07)" }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    minHeight: 180,
    overflow: "hidden",
    position: "relative",
  },
  frozenBanner: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  frozenText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  bankName: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  cardType: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  chip: {
    width: 36,
    height: 28,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  chipInner: {
    width: 20,
    height: 16,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.6)",
  },
  balanceSection: {
    marginBottom: 20,
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  balanceAmount: {
    color: "#fff",
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    marginTop: 4,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  cardNumber: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    letterSpacing: 2,
  },
  cardHolder: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginTop: 4,
    letterSpacing: 0.5,
  },
  expiryLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.5,
    textAlign: "right",
  },
  expiry: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textAlign: "right",
  },
  decorCircle1: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -60,
    top: -60,
  },
  decorCircle2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    right: -20,
    bottom: -30,
  },
});
