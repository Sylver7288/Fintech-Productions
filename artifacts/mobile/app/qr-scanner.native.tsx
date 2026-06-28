import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Platform, Alert,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCameraPermissions, CameraView } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

export default function QrScannerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  function handleBarcodeScan({ data }: { data: string }) {
    if (scanned) return;
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const payload = JSON.parse(data) as {
        name?: string;
        accountNumber?: string;
        bank?: string;
        amount?: string;
      };
      Alert.alert(
        "QR Code Scanned",
        `Send to: ${payload.name ?? "Unknown"}\nBank: ${payload.bank ?? "Unknown"}\nAccount: ${payload.accountNumber ?? ""}`,
        [
          { text: "Cancel", style: "cancel", onPress: () => setScanned(false) },
          {
            text: "Continue",
            onPress: () => router.push({
              pathname: "/transfer",
              params: {
                prefillName: payload.name ?? "",
                prefillAccount: payload.accountNumber ?? "",
                prefillBank: payload.bank ?? "",
                prefillAmount: payload.amount ?? "",
              },
            }),
          },
        ]
      );
    } catch {
      Alert.alert(
        "Invalid QR Code",
        "This QR code is not a Novamoni payment code.",
        [{ text: "OK", onPress: () => setScanned(false) }]
      );
    }
  }

  if (!permission) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.mutedForeground }}>Requesting camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.navbar, { paddingTop: topPad + 12 }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: colors.foreground }]}>Scan QR Code</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 20 }}>
          <View style={[styles.permIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="camera" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.permTitle, { color: colors.foreground }]}>Camera Access Needed</Text>
          <Text style={[styles.permSub, { color: colors.mutedForeground }]}>
            Novamoni needs camera access to scan QR codes for payments.
          </Text>
          <TouchableOpacity
            style={[styles.permBtn, { backgroundColor: colors.primary }]}
            onPress={requestPermission}
          >
            <Text style={styles.permBtnText}>Grant Camera Access</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: "#000" }]}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScan}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />

      <View style={[styles.overlay]}>
        <View style={[styles.navbar, { paddingTop: topPad + 12 }]}>
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: "rgba(0,0,0,0.5)" }]}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.navTitleDark}>Scan to Pay</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <Text style={styles.scanHint}>Point camera at a Novamoni QR code</Text>
        </View>

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 24 }]}>
          {scanned && (
            <TouchableOpacity
              style={[styles.rescanBtn, { backgroundColor: colors.primary }]}
              onPress={() => setScanned(false)}
            >
              <Text style={styles.rescanText}>Tap to scan again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
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
  navTitleDark: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#fff" },
  navBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  overlay: { ...StyleSheet.absoluteFillObject, flexDirection: "column" },
  scanFrame: {
    width: 260, height: 260,
    position: "relative",
  },
  corner: {
    position: "absolute", width: 36, height: 36, borderColor: "#fff",
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 8 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 8 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 8 },
  scanHint: {
    color: "rgba(255,255,255,0.8)", fontSize: 14, fontFamily: "Inter_400Regular",
    marginTop: 24, textAlign: "center",
  },
  bottomBar: { alignItems: "center", paddingHorizontal: 24 },
  rescanBtn: {
    paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 14,
  },
  rescanText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  permIcon: { width: 90, height: 90, borderRadius: 28, justifyContent: "center", alignItems: "center" },
  permTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  permSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  permBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  permBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
