import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { CATEGORIZED_SERVICES, CategorizedService } from "@/constants/services";
import { useGetCards } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";

export default function AllServicesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const { isFeatureEnabled } = useFeatureFlags();

  const { data: cards } = useGetCards();
  const hasPhysicalCard = cards?.some(c => c.type === "physical");
  const hasVirtualCard = cards?.some(c => c.type === "virtual");

  // State to hold recently used services loaded dynamically
  const [recentlyUsed, setRecentlyUsed] = useState<CategorizedService[]>([]);

  // Load recently used list on mount
  useEffect(() => {
    async function loadRecentlyUsed() {
      try {
        const stored = await AsyncStorage.getItem("recently_used_services");
        if (stored) {
          setRecentlyUsed(JSON.parse(stored));
        }
      } catch (err) {
        console.warn("Failed to load recently used services", err);
      }
    }
    loadRecentlyUsed();
  }, []);

  const getFlagForKey = (route: string): string | undefined => {
    if (route.startsWith("/transfer") || route.startsWith("/international-transfer") || route.startsWith("/scheduled-transfers") || route.startsWith("/split-bill")) {
      return "transfers-enabled";
    }
    if (route.startsWith("/loans")) {
      return "loans-enabled";
    }
    if (route.startsWith("/airtime") || route.startsWith("/bills")) {
      return "airtime-bills-enabled";
    }
    return undefined;
  };

  const getServiceFlagKey = (label: string): string => {
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return `service-${slug}`;
  };

  const { user } = useAuth();

  async function open(service: CategorizedService) {
    // 0. Check KYC status for restricted services
    const restrictedRoutes = ["/transfer", "/airtime", "/bills", "/loans", "/cards", "/(tabs)/cards"];
    const isRestricted = restrictedRoutes.some(r => service.route && service.route.startsWith(r));

    if (isRestricted && user && user.kycStatus !== "verified" && user.kycStatus !== "approved") {
      Alert.alert(
        "KYC Verification Required",
        `Before you can use "${service.label}", you must complete your KYC verification.`,
        [
          { text: "Go to KYC", onPress: () => router.push("/kyc" as any) },
          { text: "Cancel", style: "cancel" }
        ]
      );
      return;
    }

    // 1. Check global feature flag first
    const globalFlag = getFlagForKey(service.route);
    if (globalFlag && !isFeatureEnabled(globalFlag)) {
      Alert.alert(
        "Service Offline",
        "This feature is temporarily unavailable due to system upgrades. Please check back later."
      );
      return;
    }

    // 2. Check individual service feature flag
    const individualFlag = getServiceFlagKey(service.label);
    if (!isFeatureEnabled(individualFlag)) {
      Alert.alert(
        "Coming Soon",
        "This service is currently being integrated and will be available soon!"
      );
      return;
    }

    // 3. Save to recently used list on success
    let newList = recentlyUsed.filter(item => item.label !== service.label);
    newList.unshift(service);
    if (newList.length > 4) {
      newList = newList.slice(0, 4);
    }
    setRecentlyUsed(newList);
    try {
      await AsyncStorage.setItem("recently_used_services", JSON.stringify(newList));
    } catch (err) {
      console.warn("Failed to save recently used services", err);
    }

    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(service.route as any);
  }

  const getVisibilityFlagKey = (label: string): string => {
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return `visibility-${slug}`;
  };

  // Construct dynamic categories array where "Recently Used" pulls from local state, and filter by visibility flag
  const dynamicCategories = CATEGORIZED_SERVICES.map(category => {
    const items = category.title === "Recently Used" ? recentlyUsed : category.items;
    
    // Filter out items that have visibility toggled OFF in the backend
    const visibleItems = items.filter(s => isFeatureEnabled(getVisibilityFlagKey(s.label)));

    return {
      ...category,
      items: visibleItems
    };
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Custom Header Bar */}
      <View style={[styles.navbar, { paddingTop: topPad + 12, backgroundColor: colors.background }]}>
        <View style={styles.navLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="chevron-left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: colors.foreground }]}>All Service</Text>
        </View>
        <TouchableOpacity
          onPress={() => Alert.alert("Search", "Search functionality coming soon!")}
          style={styles.searchBtn}
        >
          <Feather name="search" size={22} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {dynamicCategories.map((category) => {
          // If a category has no items visible (and is not recently used), hide the entire section container
          if (category.title !== "Recently Used" && category.items.length === 0) {
            return null;
          }

          return (
            <View key={category.title} style={styles.categorySection}>
              <Text style={[styles.categoryTitle, { color: colors.foreground }]}>
                {category.title}
              </Text>

              <View style={[styles.grid, { backgroundColor: colors.card }]}>
                {category.items.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                      No recently used services yet
                    </Text>
                  </View>
                ) : (
                  category.items.map((s) => {
                    const isDashed = s.isDashedIconBorder;
                    return (
                      <TouchableOpacity
                        key={s.label}
                        style={styles.item}
                        onPress={() => open(s)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.iconContainer,
                            isDashed
                              ? {
                                  borderStyle: "dashed" as any,
                                  borderWidth: 1.5,
                                  borderColor: s.color,
                                  backgroundColor: "transparent",
                                }
                              : { backgroundColor: s.color + "12" },
                          ]}
                        >
                          <Feather name={s.icon as any} size={20} color={s.color} />
                          {((s.label === "Physical Card" && hasPhysicalCard) ||
                            (s.label === "Virtual Card" && hasVirtualCard)) && (
                            <View style={[styles.checkmarkBadge, { borderColor: colors.card }]}>
                              <Feather name="check" size={8} color="#fff" />
                            </View>
                          )}
                        </View>

                        {/* Custom red badge (e.g. HOT on BNPL) */}
                        {s.badge && (
                          <View style={styles.hotBadge}>
                            <Text style={styles.hotBadgeText}>{s.badge}</Text>
                          </View>
                        )}

                        <Text style={[styles.label, { color: colors.foreground }]} numberOfLines={2}>
                          {s.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  navLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    padding: 4,
    marginRight: 12,
  },
  navTitle: {
    fontSize: 19,
    fontFamily: "Inter_700Bold",
  },
  searchBtn: {
    padding: 6,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    marginBottom: 10,
    paddingLeft: 4,
    opacity: 0.9,
  },
  grid: {
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  item: {
    width: "25%",
    alignItems: "center",
    paddingVertical: 10,
    gap: 6,
    position: "relative",
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  checkmarkBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#00B894",
    borderRadius: 6,
    width: 14,
    height: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
  },
  hotBadge: {
    position: "absolute",
    top: 2,
    right: 14,
    backgroundColor: "#FF4757",
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    zIndex: 10,
  },
  hotBadgeText: {
    color: "#fff",
    fontSize: 7,
    fontFamily: "Inter_700Bold",
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    paddingHorizontal: 2,
    lineHeight: 13,
  },
  emptyContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});

