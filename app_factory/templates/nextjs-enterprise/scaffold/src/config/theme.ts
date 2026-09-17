export const themePresets = [
  { id: "ocean", label: "海蓝" },
  { id: "teal", label: "青绿" },
] as const;

export type ThemePreset = (typeof themePresets)[number]["id"];
