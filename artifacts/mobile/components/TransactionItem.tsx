import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  category?: string | null;
  recipientName?: string | null;
  senderName?: string | null;
  status: string;
  createdAt: string;
}

interface Props {
  transaction: Transaction;
  onPress?: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  "Food & Drink": "coffee",
  Transport: "navigation",
  Shopping: "shopping-bag",
  Bills: "file-text",
  Transfer: "send",
  Entertainment: "music",
  Savings: "target",
};

export function TransactionItem({ transaction: t, onPress }: Props) {
  const colors = useColors();
  const isCredit = t.type === "credit";
  const icon = CATEGORY_ICONS[t.category ?? ""] ?? "arrow-right";
  const counterparty = isCredit
    ? (t.senderName ?? t.description)
    : (t.recipientName ?? t.description);

  const formattedDate = new Date(t.createdAt).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <TouchableOpacity
      style={[styles.container, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, { backgroundColor: isCredit ? colors.secondary : "#FFF0F0" }]}>
        <Feather
          name={isCredit ? "arrow-down-left" : (icon as any)}
          size={18}
          color={isCredit ? colors.creditGreen : colors.debitRed}
        />
      </View>
      <View style={styles.details}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {counterparty}
        </Text>
        <Text style={[styles.date, { color: colors.mutedForeground }]}>
          {formattedDate}
          {t.status !== "completed" && ` • ${t.status}`}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: isCredit ? colors.creditGreen : colors.debitRed }]}>
          {isCredit ? "+" : "-"}₦{t.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
        </Text>
        {t.category && (
          <Text style={[styles.category, { color: colors.mutedForeground }]}>{t.category}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  date: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  right: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  category: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
});
