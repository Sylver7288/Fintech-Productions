---
name: Mobile UI gotchas (Expo / React Native)
description: Non-obvious React Native + Expo pitfalls hit in the NovaPay mobile app (icon fonts on Android, flex grid wrapping).
---

## Vector icons render as empty boxes (tofu) on Android
`@expo/vector-icons` icon glyphs show as boxes on Android (web is usually fine) when the icon font isn't preloaded. Fix: preload it in the root layout's `useFonts(...)` call, e.g. `...Feather.font` alongside the app's text fonts, gated by the splash-screen wait. After this change the app must be **fully reloaded** in Expo Go (it caches the old bundle), so a user reporting "still broken" may just need a hard reload.

**Why:** the new-arch Expo Go bundle does not always auto-load every icon family's font; the render happens before the font is ready, so glyphs fall back to tofu.

**Expo Go vs build-time embed:** adding the font to the `expo-font` config plugin in `app.json` (`{"fonts": ["...Feather.ttf"]}`) does **NOT** fix Expo Go — Expo Go runs a fixed prebuilt binary and ignores project config plugins. That embed only helps custom dev clients / standalone (APK/EAS) builds. In Expo Go the ONLY lever is the runtime `useFonts(...Feather.font)` load. If tofu persists in Expo Go even after a fresh bundle + full app restart (and the project has a single `@expo/vector-icons` version — verify no pnpm dupes), the reliable resolution is a development/standalone build where the embedded font is guaranteed. Do not claim the `app.json` embed fixes Expo Go.

## Percentage-width grid items wrap one-per-row short when combined with `gap`
A flex-wrap row of items each `width: "25%"` will wrap to **3 per row instead of 4** if the container also sets `gap`. `4 * 25% = 100%` leaves zero room for any gap, so the 4th item overflows and wraps. Fix: drop `gap` on the row container and rely purely on the percentage width (use item `paddingVertical` for row spacing). Same trap applies to any `N` columns at `100/N %` with a non-zero gap.
