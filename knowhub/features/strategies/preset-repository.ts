import "server-only";

import {
  readStrategyPresetStore,
  writeStrategyPresetStore,
} from "@/knowhub/features/strategies/preset-storage";
import type {
  StrategyPresetRecord,
  StrategyPresetStore,
} from "@/knowhub/features/strategies/types";

async function getStore() {
  const store = await readStrategyPresetStore();

  if (store) {
    return store;
  }

  const nextStore: StrategyPresetStore = {
    items: [],
  };

  await writeStrategyPresetStore(nextStore);
  return nextStore;
}

export async function listStoredStrategyPresets() {
  const store = await getStore();
  return store.items;
}

export async function getStoredStrategyPreset(id: string) {
  const store = await getStore();
  return store.items.find((item) => item.id === id) ?? null;
}

export async function saveStoredStrategyPreset(preset: StrategyPresetRecord) {
  const store = await getStore();
  await writeStrategyPresetStore({
    items: [...store.items, preset],
  });

  return preset;
}

export async function updateStoredStrategyPreset(
  id: string,
  updater: (preset: StrategyPresetRecord) => StrategyPresetRecord,
) {
  const store = await getStore();
  const index = store.items.findIndex((item) => item.id === id);

  if (index < 0) {
    return null;
  }

  const nextPreset = updater(store.items[index]);
  const nextItems = [...store.items];
  nextItems[index] = nextPreset;

  await writeStrategyPresetStore({
    items: nextItems,
  });

  return nextPreset;
}
