"use client";

import { Palette } from "lucide-react";
import { notify } from "@/features/feedback/notify";
import { useSkin } from "./skin-provider";
import { isSkinId, SKINS } from "./skins";

export function SkinSwitcher() {
  const { skinId, setSkin } = useSkin();

  return (
    <div className="relative shrink-0">
      <label className="flex h-8 items-center gap-1.5 rounded-lg border border-[var(--skin-border)] bg-white px-2 text-[var(--skin-text-muted)]">
        <Palette size={14} aria-hidden="true" />
        <select
          aria-label="选择皮肤"
          value={skinId}
          onChange={(event) => {
            if (!isSkinId(event.target.value)) return;
            try {
              setSkin(event.target.value);
            } catch {
              notify.warning("当前外观已切换，但浏览器无法保存选择。");
            }
          }}
          className="w-[76px] cursor-pointer bg-transparent py-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-[var(--skin-ring)]"
        >
          {SKINS.map((skin) => <option key={skin.id} value={skin.id}>{skin.name}</option>)}
        </select>
      </label>
    </div>
  );
}
