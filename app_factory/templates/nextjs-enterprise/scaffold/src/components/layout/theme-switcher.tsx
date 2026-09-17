"use client";

import { useEffect, useSyncExternalStore } from "react";

import { themePresets, type ThemePreset } from "@/config/theme";

const storageKey = "app-theme";
const themeChangeEvent = "app-theme-change";

function storedTheme(): ThemePreset {
  if (typeof window === "undefined") return "ocean";
  const saved = window.localStorage.getItem(storageKey);
  return themePresets.some((preset) => preset.id === saved) ? saved as ThemePreset : "ocean";
}

function subscribeToTheme(onStoreChange: () => void) {
  window.addEventListener(themeChangeEvent, onStoreChange);
  return () => window.removeEventListener(themeChangeEvent, onStoreChange);
}

export function ThemeSwitcher() {
  const theme = useSyncExternalStore(subscribeToTheme, storedTheme, () => "ocean");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <label className="hidden items-center gap-2 text-xs text-slate-300 sm:flex">
      <span className="sr-only">主题</span>
      <select
        aria-label="主题"
        className="h-8 rounded-md border border-white/15 bg-white/10 px-2 text-xs text-white outline-none focus:ring-2 focus:ring-white/60"
        value={theme}
        onChange={(event) => {
          const nextTheme = event.target.value as ThemePreset;
          window.localStorage.setItem(storageKey, nextTheme);
          window.dispatchEvent(new Event(themeChangeEvent));
        }}
      >
        {themePresets.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
      </select>
    </label>
  );
}
