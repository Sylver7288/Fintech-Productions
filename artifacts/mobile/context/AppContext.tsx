import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Theme = "system" | "light" | "dark";

interface AppContextType {
  theme: Theme;
  setTheme: (t: Theme) => Promise<void>;
  pinEnabled: boolean;
  pinVerified: boolean;
  hasSeenOnboarding: boolean;
  twoFAEnabled: boolean;
  isLoaded: boolean;
  enablePin: (pin: string) => Promise<void>;
  disablePin: () => Promise<void>;
  verifyPin: (pin: string) => boolean;
  markPinVerified: () => void;
  markOnboardingSeen: () => Promise<void>;
  toggleTwoFA: (val: boolean) => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pin, setPin] = useState<string | null>(null);
  const [pinVerified, setPinVerified] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(true);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [t, pe, p, hso, tfa] = await Promise.all([
          AsyncStorage.getItem("app_theme"),
          AsyncStorage.getItem("pin_enabled"),
          AsyncStorage.getItem("app_pin"),
          AsyncStorage.getItem("has_seen_onboarding"),
          AsyncStorage.getItem("two_fa_enabled"),
        ]);
        if (t) setThemeState(t as Theme);
        setPinEnabled(pe === "true");
        setPin(p);
        setHasSeenOnboarding(hso !== "false");
        setTwoFAEnabled(tfa === "true");
      } catch {}
      finally {
        setIsLoaded(true);
      }
    }
    load();
  }, []);

  async function setTheme(t: Theme) {
    setThemeState(t);
    await AsyncStorage.setItem("app_theme", t);
  }

  async function enablePin(newPin: string) {
    setPin(newPin);
    setPinEnabled(true);
    setPinVerified(true);
    await AsyncStorage.setItem("app_pin", newPin);
    await AsyncStorage.setItem("pin_enabled", "true");
  }

  async function disablePin() {
    setPin(null);
    setPinEnabled(false);
    setPinVerified(false);
    await AsyncStorage.removeItem("app_pin");
    await AsyncStorage.removeItem("pin_enabled");
  }

  function verifyPin(input: string): boolean {
    const correct = input === pin;
    if (correct) setPinVerified(true);
    return correct;
  }

  function markPinVerified() {
    setPinVerified(true);
  }

  async function markOnboardingSeen() {
    setHasSeenOnboarding(true);
    await AsyncStorage.setItem("has_seen_onboarding", "true");
  }

  async function toggleTwoFA(val: boolean) {
    setTwoFAEnabled(val);
    await AsyncStorage.setItem("two_fa_enabled", val ? "true" : "false");
  }

  return (
    <AppContext.Provider value={{
      theme, setTheme,
      pinEnabled, pinVerified,
      hasSeenOnboarding,
      twoFAEnabled,
      isLoaded,
      enablePin, disablePin, verifyPin, markPinVerified,
      markOnboardingSeen,
      toggleTwoFA,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
