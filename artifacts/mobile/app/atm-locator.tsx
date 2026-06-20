import React, { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Platform, Linking, TextInput,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const ATMS = [
  { id: "1", bank: "GTBank", name: "GTBank Victoria Island", address: "1 Ozumba Mbadiwe Ave, Victoria Island, Lagos", distance: "0.3 km", status: "available" },
  { id: "2", bank: "Access Bank", name: "Access Bank Marina", address: "3 Marina St, Lagos Island, Lagos", distance: "0.7 km", status: "available" },
  { id: "3", bank: "Zenith Bank", name: "Zenith Bank Lekki", address: "14 Admiralty Way, Lekki Phase 1, Lagos", distance: "1.2 km", status: "available" },
  { id: "4", bank: "First Bank", name: "First Bank V/I Branch", address: "35 Marina, Victoria Island, Lagos", distance: "1.5 km", status: "unavailable" },
  { id: "5", bank: "UBA", name: "UBA Head Office", address: "57 Marina, Lagos Island, Lagos", distance: "1.8 km", status: "available" },
  { id: "6", bank: "Kuda Bank", name: "Kuda ATM Yaba", address: "2 Herbert Macaulay Way, Yaba, Lagos", distance: "3.2 km", status: "available" },
  { id: "7", bank: "Stanbic IBTC", name: "Stanbic IBTC Ikoyi", address: "4 Bourdillon Rd, Ikoyi, Lagos", distance: "3.8 km", status: "available" },
  { id: "8", bank: "FCMB", name: "FCMB Surulere", address: "22 Adeniran Ogunsanya St, Surulere, Lagos", distance: "4.1 km", status: "unavailable" },
  { id: "9", bank: "Fidelity Bank", name: "Fidelity Ikeja", address: "48 Toyin Street, Ikeja, Lagos", distance: "6.4 km", status: "available" },
  { id: "10", bank: "Sterling Bank", name: "Sterling Bank Ajah", address: "Lekki-Epe Expressway, Ajah, Lagos", distance: "8.9 km", status: "available" },
];

const BANK_COLORS: Record<string, string> = {
  "GTBank": "#F80000",
  "Access Bank": "#F89C20",
  "Zenith Bank": "#E60026",
  "First Bank": "#003087",
  "UBA": "#D42B2E",
  "Kuda Bank": "#5F2DED",
  "Stanbic IBTC": "#0077CC",
  "FCMB": "#006633",
  "Fidelity Bank": "#4CAF50",
  "Sterling Bank": "#002B5B",
};

export default function AtmLocatorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const [search, setSearch] = useState("");

  const filtered = ATMS.filter(a =>
    a.bank.toLowerCase().includes(search.toLowerCase()) ||
    a.address.toLowerCase().includes(search.toLowerCase())
  );

  function openMaps(address: string) {
    const encoded = encodeURIComponent(address);
    Linking.openURL(`https://maps.google.com/maps?q=${encoded}`);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.navbar, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>ATM Locator</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchWrap}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search by bank or area…"
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.locationNote, { color: colors.mutedForeground }]}>
          📍 Showing ATMs near Victoria Island, Lagos
        </Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={a => a.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 40 }]}
        renderItem={({ item }) => (
          <View style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 14 }}>
              <View style={[styles.bankDot, { backgroundColor: (BANK_COLORS[item.bank] ?? colors.primary) + "20" }]}>
                <Text style={[styles.bankInitial, { color: BANK_COLORS[item.bank] ?? colors.primary }]}>
                  {item.bank.charAt(0)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.atmName, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[styles.atmAddress, { color: colors.mutedForeground }]}>{item.address}</Text>
                <View style={styles.itemBottom}>
                  <View style={[
                    styles.statusPill,
                    { backgroundColor: item.status === "available" ? "#E6F8F3" : "#FFF0F0" }
                  ]}>
                    <View style={[styles.statusDot, { backgroundColor: item.status === "available" ? "#00B894" : "#E74C3C" }]} />
                    <Text style={[
                      styles.statusText,
                      { color: item.status === "available" ? "#00B894" : "#E74C3C" }
                    ]}>
                      {item.status === "available" ? "Available" : "Out of service"}
                    </Text>
                  </View>
                  <Text style={[styles.distance, { color: colors.mutedForeground }]}>{item.distance}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.directionsBtn, { backgroundColor: colors.secondary }]}
              onPress={() => openMaps(item.address)}
            >
              <Feather name="navigation" size={14} color={colors.primary} />
              <Text style={[styles.directionsText, { color: colors.primary }]}>Directions</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="map-pin" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No ATMs found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  navbar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 12,
  },
  navTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  searchWrap: { paddingHorizontal: 20, paddingBottom: 8, gap: 8 },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, height: 46,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  locationNote: { fontSize: 12, fontFamily: "Inter_400Regular" },
  list: { paddingHorizontal: 20, gap: 12 },
  item: {
    borderRadius: 16, borderWidth: 1, padding: 16, gap: 12,
  },
  bankDot: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: "center", alignItems: "center",
  },
  bankInitial: { fontSize: 18, fontFamily: "Inter_700Bold" },
  atmName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  atmAddress: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 18 },
  itemBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  statusPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  distance: { fontSize: 12, fontFamily: "Inter_400Regular" },
  directionsBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, height: 36, borderRadius: 10,
  },
  directionsText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
