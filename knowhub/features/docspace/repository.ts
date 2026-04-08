import "server-only";

import {
  readDocSpaceStore,
  writeDocSpaceStore,
} from "@/knowhub/features/docspace/storage";
import type {
  DocSpaceStore,
  StoredDocSpace,
} from "@/knowhub/features/docspace/types";

async function getStore() {
  const store = await readDocSpaceStore();

  if (store) {
    return store;
  }

  const nextStore: DocSpaceStore = {
    items: [],
  };

  await writeDocSpaceStore(nextStore);

  return nextStore;
}

export async function listStoredDocspaceItems() {
  const store = await getStore();
  return store.items;
}

export async function getStoredDocSpace(id: string) {
  const store = await getStore();
  return store.items.find((item) => item.id === id) ?? null;
}

export async function saveStoredDocSpace(docspace: StoredDocSpace) {
  const store = await getStore();
  const nextItems = [...store.items, docspace];

  await writeDocSpaceStore({
    items: nextItems,
  });

  return docspace;
}

export async function updateStoredDocSpace(
  id: string,
  updater: (docspace: StoredDocSpace) => StoredDocSpace,
) {
  const store = await getStore();
  const index = store.items.findIndex((item) => item.id === id);

  if (index < 0) {
    return null;
  }

  const nextDocspace = updater(store.items[index]);
  const nextItems = [...store.items];
  nextItems[index] = nextDocspace;

  await writeDocSpaceStore({
    items: nextItems,
  });

  return nextDocspace;
}

export async function removeStoredDocSpace(id: string) {
  const store = await getStore();
  const target = store.items.find((item) => item.id === id) ?? null;

  if (!target) {
    return null;
  }

  await writeDocSpaceStore({
    items: store.items.filter((item) => item.id !== id),
  });

  return target;
}
