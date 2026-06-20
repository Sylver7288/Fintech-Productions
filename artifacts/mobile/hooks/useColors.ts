import { useContext } from "react";
import { useColorScheme } from "react-native";
import colors from "@/constants/colors";
import { AppContext } from "@/context/AppContext";

export function useColors() {
  const scheme = useColorScheme();
  const appCtx = useContext(AppContext);
  const theme = appCtx?.theme ?? "system";
  const effectiveScheme: "light" | "dark" =
    theme === "system" ? (scheme === "dark" ? "dark" : "light") : theme;
  const palette = effectiveScheme === "dark" ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}
