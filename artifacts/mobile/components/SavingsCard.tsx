import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useColors } from "@/hooks/useColors";

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  emoji?: string | null;
  color?: string | null;
  status: string;
  targetDate?: string | null;
}

interface Props {
  goal: SavingsGoal;
  onPress?: () => void;
}

export function SavingsCard({ goal, onPress }: Props) {
  const colors = useColors();
  const progress = Math.min(goal.currentAmount / goal.targetAmount, 1);
  const percentage = Math.round(progress * 100);
  const cardColor = goal.color ?? colors.primary;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={[styles.emojiWrap, { backgroundColor: `${cardColor}20` }]}>
          <Text style={styles.emoji}>{goal.emoji ?? "🎯"}</Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{goal.name}</Text>
          <Text style={[styles.target, { color: colors.mutedForeground }]}>
            Target: ₦{goal.targetAmount.toLocaleString("en-NG")}
          </Text>
        </View>
        <Text style={[styles.percent, { color: cardColor }]}>{percentage}%</Text>
      </View>

      <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
        <View style={[styles.progressFill, { width: `${percentage}%` as any, backgroundColor: cardColor }]} />
      </View>

      <View style={styles.footer}>
        <Text style={[styles.saved, { color: colors.foreground }]}>
          ₦{goal.currentAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
        </Text>
        {goal.targetDate && (
          <Text style={[styles.date, { color: colors.mutedForeground }]}>
            by {new Date(goal.targetDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  emojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  emoji: {
    fontSize: 22,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  target: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  percent: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  saved: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  date: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
