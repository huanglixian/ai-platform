import type { StrategyCategory } from "@/knowhub/features/strategies/types";

export const strategyAccentMap: Record<
  StrategyCategory,
  {
    solid: string;
    dot: string;
    textMuted: string;
    countMuted: string;
    border: string;
    text: string;
    count: string;
  }
> = {
  preprocess: {
    solid: "#4a83c5",
    dot: "#5a89bf",
    textMuted: "#4f6f95",
    countMuted: "#6e88a9",
    border: "#0368b3",
    text: "#1a4d87",
    count: "#2c6097",
  },
  chunking: {
    solid: "#1f8a57",
    dot: "#5c90a8",
    textMuted: "#4e7083",
    countMuted: "#6b8ca0",
    border: "#2e7da4",
    text: "#205b79",
    count: "#2f6f92",
  },
  extract: {
    solid: "#d08a33",
    dot: "#c9934c",
    textMuted: "#8a6a44",
    countMuted: "#a08461",
    border: "#b8742a",
    text: "#7f4d1d",
    count: "#9b6630",
  },
};
