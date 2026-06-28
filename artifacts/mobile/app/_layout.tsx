import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Feather } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { setBaseUrl } from "@workspace/api-client-react";
import { Platform } from "react-native";
import Constants from "expo-constants";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppProvider, useApp } from "@/context/AppContext";
import { FeatureFlagsProvider } from "@/context/FeatureFlagsContext";

// Set API base URL for all requests
let apiBaseUrl = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
if (!process.env.EXPO_PUBLIC_DOMAIN || process.env.EXPO_PUBLIC_DOMAIN.includes("localhost")) {
  if (Platform.OS === "web") {
    apiBaseUrl = "http://localhost:8080";
  } else {
    const debuggerHost = Constants.expoConfig?.hostUri;
    const host = debuggerHost ? debuggerHost.split(":")[0] : "localhost";
    apiBaseUrl = `http://${host}:8080`;
  }
}
setBaseUrl(apiBaseUrl);

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
    mutations: { retry: 0 },
  },
});

function NavigationController() {
  const { pinEnabled, pinVerified, hasSeenOnboarding, isLoaded: appLoaded } = useApp();
  const { user, isLoading: authLoading } = useAuth();
  const segments = useSegments() as string[];

  useEffect(() => {
    if (!appLoaded || authLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const isOtpVerify = segments[1] === "otp-verify";

    if (!user && !hasSeenOnboarding) {
      router.replace("/onboarding" as any);
    } else if (user && !user.isEmailVerified) {
      if (!inAuthGroup || !isOtpVerify) {
        router.replace("/(auth)/otp-verify" as any);
      }
    } else if (user && pinEnabled && !pinVerified) {
      router.replace("/pin-verify" as any);
    }
  }, [appLoaded, authLoading, user, pinEnabled, pinVerified, hasSeenOnboarding, segments]);

  return null;
}

function RootLayoutNav() {
  return (
    <>
      <NavigationController />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="pin-setup" options={{ headerShown: false }} />
        <Stack.Screen name="pin-verify" options={{ headerShown: false }} />
        <Stack.Screen name="transfer" options={{ headerShown: false }} />
        <Stack.Screen name="receive" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="transaction/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="personal-info" options={{ headerShown: false }} />
        <Stack.Screen name="security" options={{ headerShown: false }} />
        <Stack.Screen name="support" options={{ headerShown: false }} />
        <Stack.Screen name="terms" options={{ headerShown: false }} />
        <Stack.Screen name="kyc" options={{ headerShown: false }} />
        <Stack.Screen name="airtime" options={{ headerShown: false }} />
        <Stack.Screen name="bills" options={{ headerShown: false }} />
        <Stack.Screen name="scheduled-transfers" options={{ headerShown: false }} />
        <Stack.Screen name="analytics" options={{ headerShown: false }} />
        <Stack.Screen name="loans" options={{ headerShown: false }} />
        <Stack.Screen name="international-transfer" options={{ headerShown: false }} />
        <Stack.Screen name="referral" options={{ headerShown: false }} />
        <Stack.Screen name="qr-scanner" options={{ headerShown: false }} />
        <Stack.Screen name="beneficiaries" options={{ headerShown: false }} />
        <Stack.Screen name="split-bill" options={{ headerShown: false }} />
        <Stack.Screen name="atm-locator" options={{ headerShown: false }} />
        <Stack.Screen name="statement" options={{ headerShown: false }} />
        <Stack.Screen name="card-limits" options={{ headerShown: false }} />
        <Stack.Screen name="all-services" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    ...Feather.font,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AuthProvider>
                <AppProvider>
                  <FeatureFlagsProvider>
                    <RootLayoutNav />
                  </FeatureFlagsProvider>
                </AppProvider>
              </AuthProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
