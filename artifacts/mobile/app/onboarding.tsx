import React, { useRef, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Dimensions, Platform,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";

const { width: W } = Dimensions.get("window");

const SLIDES = [
  {
    icon: "shield" as const,
    color: "#E5A93C",
    bg: "#FFF9E6",
    title: "Welcome to Novamoni",
    sub: "Your all-in-one Nigerian banking experience. Send, save, and grow your money with confidence.",
  },
  {
    icon: "send" as const,
    color: "#00B894",
    bg: "#E6F8F3",
    title: "Send Money in Seconds",
    sub: "Transfer funds to any Nigerian bank instantly. Airtime, bills, and FX transfers — all in one place.",
  },
  {
    icon: "trending-up" as const,
    color: "#0984E3",
    bg: "#E6F4FF",
    title: "Grow Your Savings",
    sub: "Set savings goals, track spending with analytics, and apply for quick loans when you need them.",
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { markOnboardingSeen } = useApp();
  const scrollRef = useRef<ScrollView>(null);
  const [current, setCurrent] = useState(0);

  function goNext() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (current < SLIDES.length - 1) {
      const next = current + 1;
      scrollRef.current?.scrollTo({ x: next * W, animated: true });
      setCurrent(next);
    } else {
      handleFinish();
    }
  }

  async function handleFinish() {
    await markOnboardingSeen();
    router.replace("/(auth)/register");
  }

  return (
    <View style={[styles.root, { backgroundColor: "#fff" }]}>
      <TouchableOpacity
        style={[styles.skip, { top: insets.top + (Platform.OS === "web" ? 67 : 16) }]}
        onPress={handleFinish}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={[styles.slide, { width: W }]}>
            <View style={[styles.iconWrap, { backgroundColor: slide.bg }]}>
              <Feather name={slide.icon} size={56} color={slide.color} />
            </View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.sub}>{slide.sub}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === current ? "#E5A93C" : "#E8ECF0",
                  width: i === current ? 24 : 8,
                }
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.nextBtn} onPress={goNext} activeOpacity={0.85}>
          <Text style={styles.nextText}>
            {current === SLIDES.length - 1 ? "Get Started" : "Next"}
          </Text>
          <Feather name="arrow-right" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  skip: {
    position: "absolute", right: 24, zIndex: 10,
    paddingVertical: 6, paddingHorizontal: 12,
  },
  skipText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#8A94A6" },
  slide: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 40, gap: 24,
  },
  iconWrap: {
    width: 140, height: 140, borderRadius: 40,
    justifyContent: "center", alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28, fontFamily: "Inter_700Bold",
    color: "#0D0D0D", textAlign: "center", lineHeight: 36,
  },
  sub: {
    fontSize: 16, fontFamily: "Inter_400Regular",
    color: "#8A94A6", textAlign: "center", lineHeight: 26,
  },
  bottom: {
    paddingHorizontal: 24, gap: 24, alignItems: "center",
  },
  dots: { flexDirection: "row", gap: 8, alignItems: "center" },
  dot: { height: 8, borderRadius: 4 },
  nextBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, backgroundColor: "#E5A93C",
    height: 56, borderRadius: 16, width: "100%",
  },
  nextText: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },
});
