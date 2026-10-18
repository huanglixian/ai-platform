"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DEFAULT_SKIN, getSkin, isSkinId, SKIN_STORAGE_KEY, type SkinId } from "./skins";

const CHANGE_EVENT = "platform-skin-change";

function getSnapshot(): SkinId {
  const id = document.documentElement.dataset.skin;
  return isSkinId(id) ? id : DEFAULT_SKIN;
}

function applySkin(id: SkinId) {
  document.documentElement.dataset.skin = id;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key !== SKIN_STORAGE_KEY && event.key !== null) return;
    applySkin(isSkinId(event.newValue) ? event.newValue : DEFAULT_SKIN);
  }
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function setSkin(id: SkinId) {
  applySkin(id);
  localStorage.setItem(SKIN_STORAGE_KEY, id);
}

const SkinContext = createContext<{ skinId: SkinId; setSkin: typeof setSkin } | null>(null);

export function SkinProvider({ children }: { children: ReactNode }) {
  const skinId = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_SKIN);
  const pathname = usePathname();

  useEffect(() => {
    const skin = getSkin(skinId);
    document.title = skin.title;
    document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]').forEach((link) => {
      link.href = skin.logo;
      link.removeAttribute("type");
      link.removeAttribute("sizes");
    });
  }, [skinId, pathname]);

  return <SkinContext.Provider value={{ skinId, setSkin }}>{children}</SkinContext.Provider>;
}

export function useSkin() {
  const context = useContext(SkinContext);
  if (!context) throw new Error("外观组件必须位于 SkinProvider 内");
  return context;
}
