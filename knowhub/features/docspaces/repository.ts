import "server-only";

import {
  readDocSpaceStore,
  writeDocSpaceStore,
} from "@/knowhub/features/docspaces/storage";
import type {
  DocSpaceStore,
  StoredDocSpace,
} from "@/knowhub/features/docspaces/types";

async function getStore() {
  const store = await readDocSpaceStore();

  if (store) {
    return store;
  }

  const nextStore: DocSpaceStore = {
    docspaces: [],
  };

  await writeDocSpaceStore(nextStore);

  return nextStore;
}

export async function listStoredDocSpaces() {
  const store = await getStore();
  return store.docspaces;
}

export async function getStoredDocSpace(id: string) {
  const store = await getStore();
  return store.docspaces.find((item) => item.id === id) ?? null;
}

export async function saveStoredDocSpace(docspace: StoredDocSpace) {
  const store = await getStore();
  const nextDocspaces = [...store.docspaces, docspace];

  await writeDocSpaceStore({
    docspaces: nextDocspaces,
  });

  return docspace;
}

export async function updateStoredDocSpace(
  id: string,
  updater: (docspace: StoredDocSpace) => StoredDocSpace,
) {
  const store = await getStore();
  const index = store.docspaces.findIndex((item) => item.id === id);

  if (index < 0) {
    return null;
  }

  const nextDocspace = updater(store.docspaces[index]);
  const nextDocspaces = [...store.docspaces];
  nextDocspaces[index] = nextDocspace;

  await writeDocSpaceStore({
    docspaces: nextDocspaces,
  });

  return nextDocspace;
}

export async function removeStoredDocSpace(id: string) {
  const store = await getStore();
  const target = store.docspaces.find((item) => item.id === id) ?? null;

  if (!target) {
    return null;
  }

  await writeDocSpaceStore({
    docspaces: store.docspaces.filter((item) => item.id !== id),
  });

  return target;
}
